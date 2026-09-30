import React, { useState } from 'react';

const DEFAULT_GOAL = 'Inspect /workspace/inventory.csv and create a useful persisted summary note describing the dataset.';

export default function ACABrainControl({ brain, disabled }) {
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const run = brain.run;
  const active = brain.autonomous;
  const canStart = !disabled && !active && !brain.watching;
  const canPause = run?.status === 'RUNNING';
  const canResume = run?.status === 'PAUSED';

  return (
    <div className="aca-dev aca-brain-control">
      <h3 className="aca-tag aca-cyan">ACA BRAIN · V0.2</h3>
      <div className="aca-dim text-[10px]">Admin · autonomous control</div>

      {active && <div className="aca-brain-live"><span className="aca-brain-dot" />A#011 · AUTONOMOUS ● LIVE</div>}
      {run && !active && <div className="aca-dim text-[10px]">LAST RUN: {run.status}{run.stop_reason ? ' · ' + run.stop_reason : ''}</div>}

      <label className="aca-tag aca-dim mt-1">GOAL</label>
      <textarea className="aca-input aca-brain-goal" rows={3} value={goal} disabled={active} onChange={e => setGoal(e.target.value)} />

      <button className="aca-btn aca-brain-watch" disabled={!canStart} onClick={() => brain.start(goal)}>
        WATCH A#011
      </button>
      <div className="aca-row">
        <button className="aca-btn" disabled={!canPause} onClick={brain.pause}>PAUSE</button>
        <button className="aca-btn" disabled={!canResume} onClick={brain.resume}>RESUME</button>
        <button className="aca-btn" disabled={!active} onClick={brain.stop}>STOP</button>
      </div>

      {brain.error && <div className="aca-danger text-[10px]">{brain.error}</div>}
      <div className="aca-dim text-[10px]">
        The loop advances while this window is open. Closing it stalls the run — it does not keep working in the background.
      </div>
    </div>
  );
}