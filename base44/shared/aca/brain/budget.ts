import { DEFAULT_BUDGET } from './contracts.ts';

export function budgetOf(run) {
  return {
    max_steps: run.max_steps ?? DEFAULT_BUDGET.max_steps,
    max_duration_ms: run.max_duration_ms ?? DEFAULT_BUDGET.max_duration_ms,
    max_consecutive_failures: run.max_consecutive_failures ?? DEFAULT_BUDGET.max_consecutive_failures,
    max_identical_retries: run.max_identical_retries ?? DEFAULT_BUDGET.max_identical_retries,
    sim_compute_budget: run.sim_compute_budget ?? DEFAULT_BUDGET.sim_compute_budget,
  };
}

// Enforced server-side at the top of every STEP, before any model call is made.
// Time spent waiting for the model is included, because elapsed_ms is wall clock.
export function enforceBudget(run, now = Date.now()) {
  const b = budgetOf(run);
  const elapsed = run.started_at ? now - Date.parse(run.started_at) : 0;
  const used = run.steps_used || 0;
  const remaining = {
    steps_remaining: Math.max(0, b.max_steps - used),
    time_remaining_ms: Math.max(0, b.max_duration_ms - elapsed),
    compute_remaining: Math.max(0, b.sim_compute_budget - (run.sim_compute_used || 0)),
  };
  if (used >= b.max_steps) return { ok: false, stop_reason: 'STEP_LIMIT', budget: b, remaining };
  if (elapsed >= b.max_duration_ms) return { ok: false, stop_reason: 'TIME_LIMIT', budget: b, remaining };
  if ((run.consecutive_failures || 0) >= b.max_consecutive_failures) return { ok: false, stop_reason: 'CONSECUTIVE_FAILURES', budget: b, remaining };
  if ((run.identical_retries || 0) >= b.max_identical_retries) return { ok: false, stop_reason: 'IDENTICAL_RETRIES', budget: b, remaining };
  if ((run.sim_compute_used || 0) >= b.sim_compute_budget) return { ok: false, stop_reason: 'COMPUTE_LIMIT', budget: b, remaining };
  return { ok: true, budget: b, remaining };
}