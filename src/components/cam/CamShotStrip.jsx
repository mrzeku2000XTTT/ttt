import React from 'react';
import { Film, Plus, Trash2 } from 'lucide-react';
import { moveById } from './camMoves';

export default function CamShotStrip({ shots, activeIndex, onAdd, onPlay, onLoad, onDelete, canUse }) {
  return (
    <div id="cam-clips" className="cm-shot-strip"><div className="cm-panel-heading"><strong>Clips</strong><span>Shot sequence</span></div><div className="cm-shot-actions"><button onClick={onAdd} disabled={!canUse}><Plus /> Add Shot</button><button onClick={onPlay} disabled={!canUse || !shots.length}><Film /> Play All</button></div>
      <div className="cm-shot-list">{shots.length === 0 ? <span>No clips yet</span> : shots.map((shot, index) => <button key={shot.id} className={index === activeIndex ? 'active' : ''} onClick={() => onLoad(shot)}><i>{String(index + 1).padStart(2, '0')}</i><b>{moveById(shot.move).label}</b><small>{shot.duration}s</small><em onClick={(e) => { e.stopPropagation(); onDelete(shot.id); }}><Trash2 /></em></button>)}</div>
    </div>
  );
}