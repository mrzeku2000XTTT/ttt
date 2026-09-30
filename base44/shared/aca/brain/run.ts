import { fail, iso } from '../contracts.ts';
import { scoped, find } from '../authorization.ts';
import { dispatch } from '../runtime.ts';
import { buildObservation } from './observation.ts';
import { decide } from './model.ts';
import { validateDecision } from './decision.ts';
import { enforceBudget } from './budget.ts';
import { validateGoal } from './completion.ts';
import {
  ACTIVE_STATUSES, TERMINAL_STATUSES, OPERATOR_HELD_STATUSES, DEFAULT_BUDGET,
  MODEL_CONFIGURATION, MAX_GOAL_CHARS, MAX_RESULT_CHARS, MAX_ERROR_CHARS, DEFAULT_GOAL,
} from './contracts.ts';

async function recentSteps(ctx, runId, limit = 25) {
  return ctx.sr.entities.ACABrainStep.filter({ brain_run_id: runId }, '-step_number', limit);
}
async function lastStep(ctx, runId) {
  return (await ctx.sr.entities.ACABrainStep.filter({ brain_run_id: runId }, '-step_number', 1))[0] || null;
}
async function record(ctx, run, step_number, status, fields = {}) {
  return ctx.sr.entities.ACABrainStep.create({
    brain_run_id: run.id, computer_id: ctx.c.id, agent_id: ctx.c.agent_id,
    session_id: run.session_id || '', step_number, status,
    started_at: iso(), completed_at: iso(), duration_ms: 0, compute_cost: 0, ...fields,
  });
}

// START — one active run per computer, enforced on the server.
async function start(base, body) {
  const ctx = await scoped(base, body.computer_id);
  const active = (await ctx.sr.entities.ACABrainRun.filter({ computer_id: ctx.c.id, status: { $in: ACTIVE_STATUSES } }, 'created_date', 1))[0];
  if (active) fail('BRAIN_ALREADY_ACTIVE', 'An autonomous run already controls this computer');

  const goal = typeof body.goal === 'string' && body.goal.trim() ? body.goal.trim().slice(0, MAX_GOAL_CHARS) : DEFAULT_GOAL;
  let run = await ctx.sr.entities.ACABrainRun.create({
    brain_run_id: 'BRAIN_' + crypto.randomUUID(),
    computer_id: ctx.c.id, agent_id: ctx.c.agent_id, experiment_id: ctx.c.experiment_id,
    controller_user_id: ctx.user.id, goal, status: 'STARTING', stop_reason: '', session_id: '',
    started_at: iso(), ended_at: '', elapsed_ms: 0, steps_used: 0, sim_compute_used: 0,
    consecutive_failures: 0, identical_retries: 0, last_action_signature: '',
    model_configuration: MODEL_CONFIGURATION, model_identifier: '', goal_result: {},
    lock_request: '', lock_expires: '', ...DEFAULT_BUDGET,
  });

  let sessionId = ctx.c.current_session_id || '';
  if (!sessionId) {
    const opened = await dispatch(base, {
      computer_id: ctx.c.id, session_id: '', request_id: 'brain:' + run.id + ':session',
      action_type: 'START_SESSION', args: {}, brain_run_id: run.id,
    });
    if (!opened || opened.execution?.status !== 'COMPLETED') {
      await ctx.sr.entities.ACABrainRun.update(run.id, { status: 'FAILED', stop_reason: 'SESSION_START_FAILED', ended_at: iso() });
      fail('SESSION_START_FAILED', 'Could not open an ACA session for this run');
    }
    sessionId = opened.result.session_id;
  }

  run = await ctx.sr.entities.ACABrainRun.update(run.id, { status: 'RUNNING', session_id: sessionId, started_at: iso() });
  return { run, steps: await recentSteps(ctx, run.id) };
}

// Applies counters without ever overwriting operator control taken mid-step.
async function finish(ctx, run, stepNumber, { failed, compute, signature, goal_result }) {
  const latest = await ctx.sr.entities.ACABrainRun.get(run.id);
  const held = OPERATOR_HELD_STATUSES.includes(latest.status);
  const sameSignature = !!signature && signature === (latest.last_action_signature || '');
  const patch = {
    steps_used: stepNumber,
    sim_compute_used: (latest.sim_compute_used || 0) + compute,
    consecutive_failures: failed ? (latest.consecutive_failures || 0) + 1 : 0,
    identical_retries: failed && sameSignature ? (latest.identical_retries || 0) + 1 : 0,
    last_action_signature: signature || latest.last_action_signature || '',
    elapsed_ms: Date.now() - Date.parse(latest.started_at),
    status: held ? latest.status : 'RUNNING',
  };
  if (goal_result) patch.goal_result = goal_result;
  return { run: await ctx.sr.entities.ACABrainRun.update(run.id, patch), steps: await recentSteps(ctx, run.id) };
}

async function abortStep(ctx, run, stepNumber, fields, paused, code, message) {
  await record(ctx, run, stepNumber, 'ABORTED', { ...fields, error_code: code, error_message: message });
  const held = await ctx.sr.entities.ACABrainRun.update(run.id, {
    steps_used: stepNumber, elapsed_ms: Date.now() - Date.parse(run.started_at),
    status: paused ? 'PAUSED' : 'CANCELLED', stop_reason: paused ? 'OPERATOR_PAUSE' : 'OPERATOR_STOP',
    ended_at: paused ? '' : iso(), lock_request: '', lock_expires: '',
  });
  return { run: held, steps: await recentSteps(ctx, run.id) };
}

// STEP — at most one OBSERVE → DECIDE → VALIDATE → EXECUTE → RECORD iteration.
async function step(base, ctx, run) {
  if (run.status !== 'RUNNING') return { run, steps: await recentSteps(ctx, run.id) };

  // One step at a time per run, enforced server-side by the same atomic
  // conditional update V0.1 uses for its computer lock.
  const token = crypto.randomUUID();
  const lock = await ctx.sr.entities.ACABrainRun.updateMany(
    { id: run.id, status: 'RUNNING', $or: [{ lock_request: '' }, { lock_expires: { $lt: iso() } }] },
    { $set: { lock_request: token, lock_expires: new Date(Date.now() + 180000).toISOString() } },
  );
  if (lock.updated !== 1) fail('BRAIN_BUSY', 'A brain step is already processing for this run');

  try {
    const now = Date.now();
    const gate = enforceBudget(run, now);
    if (!gate.ok) {
      const stopped = await ctx.sr.entities.ACABrainRun.update(run.id, {
        status: 'BUDGET_EXCEEDED', stop_reason: gate.stop_reason, ended_at: iso(),
        elapsed_ms: now - Date.parse(run.started_at), lock_request: '', lock_expires: '',
      });
      return { run: stopped, steps: await recentSteps(ctx, run.id) };
    }

    const stepNumber = (run.steps_used || 0) + 1;
    const previous = await lastStep(ctx, run.id);
    const observation = await buildObservation(ctx, run, previous, gate.remaining);
    const obs = await ctx.sr.entities.ACABrainObservation.create({
      brain_run_id: run.id, computer_id: ctx.c.id, agent_id: ctx.c.agent_id,
      session_id: run.session_id || '', step_number: stepNumber, payload: observation,
      byte_size: JSON.stringify(observation).length,
    });

    await ctx.sr.entities.ACABrainRun.update(run.id, { status: 'THINKING' });
    let raw = null, modelError = '';
    try { raw = await decide(ctx, observation); }
    catch (e) { modelError = String(e?.message || 'MODEL_ERROR').slice(0, MAX_ERROR_CHARS); }

    // Authoritative re-check: the operator may have paused or stopped while the model was thinking.
    const afterThinking = await ctx.sr.entities.ACABrainRun.get(run.id);
    if (afterThinking.status !== 'THINKING') {
      const paused = afterThinking.status === 'PAUSED';
      return abortStep(ctx, run, stepNumber, { observation_id: obs.id }, paused,
        paused ? 'PAUSED_DURING_THINKING' : 'STOPPED_DURING_THINKING',
        'The model returned after the operator took control; nothing was executed.');
    }

    // Validate independently of the model before anything can execute.
    const validation = validateDecision(raw, observation.available_actions);
    const decision = await ctx.sr.entities.ACABrainDecision.create({
      brain_run_id: run.id, computer_id: ctx.c.id, agent_id: ctx.c.agent_id, session_id: run.session_id || '',
      step_number: stepNumber,
      decision_type: validation.ok ? validation.decision.decision_type
        : (['ACTION', 'GOAL_COMPLETE', 'CANNOT_CONTINUE'].includes(raw?.decision_type) ? raw.decision_type : 'ACTION'),
      intent_summary: String(raw?.intent_summary || '').replace(/\s+/g, ' ').slice(0, 240),
      proposed_action: validation.ok && validation.decision.action ? validation.decision.action : {},
      status: validation.ok ? 'VALID' : 'REJECTED',
      rejection_code: validation.ok ? '' : validation.code,
      rejection_message: validation.ok ? '' : String(validation.message || '').slice(0, MAX_ERROR_CHARS),
      model_configuration: MODEL_CONFIGURATION, model_identifier: '',
    });

    if (modelError || !validation.ok) {
      await record(ctx, run, stepNumber, 'REJECTED', {
        observation_id: obs.id, decision_id: decision.id,
        error_code: modelError ? 'MODEL_ERROR' : validation.code,
        error_message: String(modelError || validation.message || '').slice(0, MAX_ERROR_CHARS),
      });
      return finish(ctx, run, stepNumber, { failed: true, compute: 0, signature: '' });
    }

    const d = validation.decision;

    if (d.decision_type === 'CANNOT_CONTINUE') {
      await record(ctx, run, stepNumber, 'COMPLETED', { observation_id: obs.id, decision_id: decision.id, intent_summary: d.intent_summary });
      const stopped = await ctx.sr.entities.ACABrainRun.update(run.id, {
        steps_used: stepNumber, status: 'FAILED', stop_reason: 'MODEL_DECLINED', ended_at: iso(),
        elapsed_ms: Date.now() - Date.parse(run.started_at),
      });
      return { run: stopped, steps: await recentSteps(ctx, run.id) };
    }

    if (d.decision_type === 'GOAL_COMPLETE') {
      const verdict = await validateGoal(ctx);
      await record(ctx, run, stepNumber, verdict.passed ? 'COMPLETED' : 'REJECTED', {
        observation_id: obs.id, decision_id: decision.id, intent_summary: d.intent_summary,
        error_code: verdict.passed ? '' : 'GOAL_NOT_VERIFIED',
        error_message: verdict.passed ? '' : String(verdict.summary?.message || 'The persisted output did not satisfy the goal'),
        result_preview: JSON.stringify(verdict.summary || {}).slice(0, MAX_RESULT_CHARS),
      });
      const goal_result = { ...verdict, checked_at: iso() };
      if (verdict.passed) {
        const done = await ctx.sr.entities.ACABrainRun.update(run.id, {
          steps_used: stepNumber, goal_result, status: 'COMPLETED', stop_reason: 'GOAL_VERIFIED', ended_at: iso(),
          elapsed_ms: Date.now() - Date.parse(run.started_at),
        });
        return { run: done, steps: await recentSteps(ctx, run.id) };
      }
      return finish(ctx, run, stepNumber, { failed: true, compute: 0, signature: '', goal_result });
    }

    // ACTION — re-check once more immediately before crossing the dispatch boundary.
    const beforeAct = await ctx.sr.entities.ACABrainRun.get(run.id);
    if (beforeAct.status !== 'THINKING') {
      const paused = beforeAct.status === 'PAUSED';
      return abortStep(ctx, run, stepNumber, {
        observation_id: obs.id, decision_id: decision.id,
        action_type: d.action.action_type, app_id: d.action.app_id, intent_summary: d.intent_summary,
      }, paused, paused ? 'PAUSED_BEFORE_DISPATCH' : 'STOPPED_BEFORE_DISPATCH',
        'Operator control was taken before the action reached the dispatcher; nothing was executed.');
    }

    await ctx.sr.entities.ACABrainRun.update(run.id, { status: 'ACTING' });
    const startedAt = Date.now();
    let result = null, dispatchError = '';
    try {
      result = await dispatch(ctx, {
        computer_id: ctx.c.id, session_id: run.session_id || '',
        request_id: 'brain:' + run.id + ':' + stepNumber,
        action_type: d.action.action_type, args: d.action.args, brain_run_id: run.id,
      });
    } catch (e) { dispatchError = String(e?.message || 'DISPATCH_FAILED').slice(0, MAX_ERROR_CHARS); }

    const exec = result?.execution || null;
    const ok = !!(exec && exec.status === 'COMPLETED');
    const signature = d.action.action_type + '|' + d.action.app_id + '|' + JSON.stringify(d.action.args);

    await record(ctx, run, stepNumber, ok ? 'COMPLETED' : 'FAILED', {
      observation_id: obs.id, decision_id: decision.id,
      action_type: d.action.action_type, app_id: d.action.app_id,
      aca_execution_id: exec?.id || '', aca_event_id: result?.event?.id || '',
      intent_summary: d.intent_summary,
      result_preview: exec?.output_reference ? JSON.stringify(exec.output_reference).slice(0, MAX_RESULT_CHARS) : '',
      error_code: dispatchError ? 'DISPATCH_FAILED' : (ok ? '' : (exec?.error_code || 'ACTION_FAILED')),
      error_message: dispatchError || (ok ? '' : String(exec?.error_message || 'The action did not complete').slice(0, MAX_ERROR_CHARS)),
      compute_cost: ok ? 1 : 0,
      started_at: new Date(startedAt).toISOString(), completed_at: iso(), duration_ms: Date.now() - startedAt,
    });

    return finish(ctx, run, stepNumber, { failed: !ok, compute: ok ? 1 : 0, signature });
  } finally {
    await ctx.sr.entities.ACABrainRun.updateMany({ id: run.id, lock_request: token }, { $set: { lock_request: '', lock_expires: '' } });
  }
}

async function control(ctx, run, next, reason) {
  if (TERMINAL_STATUSES.includes(run.status)) return { run, steps: await recentSteps(ctx, run.id) };
  if (next === 'RUNNING' && run.status !== 'PAUSED') fail('INVALID_STATE', 'Only a paused run can resume');
  if (next === 'PAUSED' && run.status !== 'RUNNING') fail('INVALID_STATE', 'Only a running run can pause');

  const patch = { status: next, stop_reason: reason, lock_request: '', lock_expires: '' };
  if (next === 'CANCELLED') patch.ended_at = iso();
  if (next === 'RUNNING' || next === 'PAUSED') patch.ended_at = '';
  return { run: await ctx.sr.entities.ACABrainRun.update(run.id, patch), steps: await recentSteps(ctx, run.id) };
}

export async function brain(base, body) {
  const action = body?.action;
  if (action === 'START') return start(base, body);
  if (!['STEP', 'PAUSE', 'RESUME', 'STOP', 'STATUS'].includes(action)) fail('INVALID_REQUEST', 'Unknown brain action');

  const run = await find(base.sr, 'ACABrainRun', body.run_id, 'RUN_NOT_FOUND');
  const ctx = await scoped(base, run.computer_id);

  if (action === 'STATUS') return { run, steps: await recentSteps(ctx, run.id) };
  if (action === 'STEP') return step(base, ctx, run);
  if (action === 'PAUSE') return control(ctx, run, 'PAUSED', 'OPERATOR_PAUSE');
  if (action === 'RESUME') return control(ctx, run, 'RUNNING', '');
  return control(ctx, run, 'CANCELLED', 'OPERATOR_STOP');
}