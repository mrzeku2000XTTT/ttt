import { entries } from '../workspace.ts';
import { availableActions } from './catalog.ts';
import { MAX_RESULT_CHARS, BRAIN_VERSION } from './contracts.ts';

// Built from persisted rows only. This function never reads file contents:
// content reaches the Brain solely as the result of an authorized ACA action.
export async function buildObservation(ctx, run, previousStep, remaining) {
  const list = await entries(ctx);
  const workspace = list.map(e => ({
    file_id: e.id,
    path: e.path,
    kind: e.kind,
    revision_id: e.revision_id || '',
    size_bytes: e.revision?.size_bytes ?? null,
  }));

  const artifacts = (await ctx.sr.entities.AgentArtifact.filter({ computer_id: ctx.c.id }, '-created_date', 40))
    .map(a => ({ artifact_id: a.id, filename: a.filename, type: a.type, size_bytes: a.size_bytes, revision_id: a.revision_id }));

  const notes = (await ctx.sr.entities.ACAMemoryEntry.filter({ computer_id: ctx.c.id }, '-created_date', 10))
    .map(n => ({ title: n.title, text: String(n.text || '').slice(0, 400) }));

  let last_action = null, last_result = null, last_error = null;
  if (previousStep) {
    last_action = { action_type: previousStep.action_type || '', app_id: previousStep.app_id || '', status: previousStep.status };
    last_result = previousStep.result_preview ? previousStep.result_preview.slice(0, MAX_RESULT_CHARS) : null;
    if (previousStep.error_code) last_error = { code: previousStep.error_code, message: String(previousStep.error_message || '').slice(0, 500) };
  }

  return {
    brain_version: BRAIN_VERSION,
    step: (run.steps_used || 0) + 1,
    goal: run.goal,
    agent: { id: ctx.c.agent_id, display_name: ctx.agent.code || ctx.c.agent_id },
    computer: { id: ctx.c.computer_id, status: ctx.c.status },
    session: { id: run.session_id || '', active: !!ctx.c.current_session_id },
    current_app: ctx.c.current_app_id || '',
    workspace,
    artifacts,
    notes,
    installed_apps: ctx.c.installed_app_ids || [],
    available_actions: availableActions(ctx.c),
    last_action,
    last_result,
    last_error,
    goal_validation: run.goal_result && run.goal_result.passed === false
      ? { passed: false, checks: run.goal_result.checks || {}, message: run.goal_result.summary?.message || '' }
      : null,
    budget: remaining,
  };
}