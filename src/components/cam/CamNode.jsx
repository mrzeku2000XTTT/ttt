import React, { useRef } from 'react';

export default function CamNode({ node, selected, detail, onSelect, onMove, onOutput, onInput }) {
  const drag = useRef(null);
  const down = (e) => {
    if (e.target.dataset.port) return;
    drag.current = { sx: e.clientX, sy: e.clientY, x: node.x, y: node.y };
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect(node.id);
  };
  const move = (e) => {
    if (!drag.current) return;
    onMove(node.id, drag.current.x + e.clientX - drag.current.sx, drag.current.y + e.clientY - drag.current.sy);
  };
  return (
    <div className={`cm-node ${selected ? 'cm-node-selected' : ''}`} style={{ left: node.x, top: node.y }} onClick={(e) => e.stopPropagation()} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }}>
      {node.type !== 'MediaIn' && <button data-port="input" onClick={() => onInput(node.id)} className="cm-node-port cm-node-port-in" title="Connect input" />}
      <div className="cm-node-title"><span>{node.type}</span><span className="cm-node-dot" /></div>
      <p>{detail}</p>
      {node.type !== 'MediaOut' && <button data-port="output" onClick={() => onOutput(node.id)} className="cm-node-port cm-node-port-out" title="Start connection" />}
    </div>
  );
}