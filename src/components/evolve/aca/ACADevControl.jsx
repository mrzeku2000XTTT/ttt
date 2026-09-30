import React from 'react';

export default function ACADevControl({ aca, autonomous }) {
  const active = !!aca.computer?.current_session_id;
  const lock = !!autonomous;
  const off = value => lock || value;

  return (
    <div className="aca-dev">
      <h3 className="aca-tag aca-cyan">ACA DEV CONTROL</h3>
      <div className="aca-dim text-[10px]">Admin · manual control · no AI brain</div>
      {lock && <div className="aca-brain-lock">AUTONOMOUS RUN CONTROLS THIS COMPUTER · DEV ACTIONS DISABLED</div>}
      <button data-aca-target="control:start" className="aca-btn" disabled={off(aca.disabled || active)} onClick={() => aca.action('START_SESSION')}>START SESSION</button>
      <button className="aca-btn" disabled={off(aca.disabled || active)} onClick={aca.demo}>RUN REAL CSV DEMO</button>
      <button className="aca-btn" disabled={off(aca.disabled || !active || aca.workspace.data.files.some(f => f.path === '/workspace/inventory.csv'))} onClick={() => aca.action('CREATE_FIXTURE')}>CREATE INVENTORY</button>
      <button data-aca-target="control:end" className="aca-btn" disabled={off(aca.disabled || !active)} onClick={() => aca.action('END_SESSION')}>END SESSION</button>
      <label className="aca-tag aca-dim mt-2">REPLAY SESSION</label>
      <select className="aca-input" value={aca.replayId} onChange={e => e.target.value ? aca.replay(e.target.value) : aca.live()}>
        <option value="">LIVE</option>
        {aca.sessions.filter(s => s.status === 'COMPLETED').map(s => <option key={s.id} value={s.id}>{s.session_id.slice(-8)} · {s.actions_count} actions</option>)}
      </select>
      <div className="aca-dim text-[10px]">Use the app panels to open/edit/save files, transform data, run approved commands and create artifacts. All use acaAction.</div>
    </div>
  );
}