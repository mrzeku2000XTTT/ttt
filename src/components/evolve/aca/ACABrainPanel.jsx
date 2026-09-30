import React from 'react';

const LABELS = {
  STARTING: 'STARTING', RUNNING: 'RUNNING', THINKING: 'THINKING', ACTING: 'ACTING',
  PAUSED: 'PAUSED', STOPPING: 'STOPPING', COMPLETED: 'COMPLETED', FAILED: 'FAILED',
  CANCELLED: 'CANCELLED', BUDGET_EXCEEDED: 'BUDGET EXCEEDED',
};

function Cell({ label, value, tone }) {
  return (
    <span className="aca-brain-cell">
      <span className="aca-tag aca-dim">{label}</span>
      <span className={tone || ''}>{value}</span>
    </span>
  );
}

export default function ACABrainPanel({ brain }) {
  const run = brain.run;
  if (!run) return null;
  const latest = brain.steps[0] || null;
  const result = latest?.result_preview ? latest.result_preview.slice(0, 400) : '';
  const done = run.status === 'COMPLETED';
  const stopped = ['CANCELLED', 'FAILED', 'BUDGET_EXCEEDED'].includes(run.status);

  return (
    <div className="aca-brain-panel">
      <Cell label="GOAL" value={run.goal} />
      <Cell label="STATUS" value={LABELS[run.status] || run.status} tone={done ? 'aca-cyan' : stopped ? 'aca-danger' : 'aca-brain-live-text'} />
      <Cell label="STEP" value={(run.steps_used || 0) + ' / ' + run.max_steps} />
      <Cell label="APP" value={(latest?.app_id || '—').replace('aca.', '')} />
      <Cell label="LAST ACTION" value={(latest?.action_type || '—') + (latest?.status ? ' · ' + latest.status : '')} />
      <Cell label="SIM COMPUTE" value={(run.sim_compute_used || 0) + ' / ' + run.sim_compute_budget} />
      {latest?.intent_summary && <Cell label="INTENT" value={latest.intent_summary} />}
      {latest?.error_message && <Cell label="ERROR" value={latest.error_message} tone="aca-danger" />}
      {!latest?.error_message && result && <Cell label="LAST RESULT" value={result} />}
      {run.goal_result?.summary?.message && (
        <Cell label="VERIFICATION" value={run.goal_result.summary.message} tone={run.goal_result.passed ? 'aca-cyan' : 'aca-danger'} />
      )}
    </div>
  );
}