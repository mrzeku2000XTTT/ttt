import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import CamNode from './CamNode';
import CamNodeToolbar from './CamNodeToolbar';

// Port centers on a 148px-wide node: out = right edge +1, in = left edge -1, y = +34
const portOut = (n) => ({ x: n.x + 149, y: n.y + 34 });
const portIn = (n) => ({ x: n.x - 1, y: n.y + 34 });

export default function CamNodeGraph({ graph, image, moveLabel, intensity, duration, isMax, onMax }) {
  const canvasEl = useRef(null);
  const [wire, setWire] = useState(null);
  const detail = (type) => ({ MediaIn: image ? 'Source ready' : 'No source', Transform: `${Math.round(intensity * 100)}% · ${duration}s`, Camera3D: moveLabel, Renderer3D: 'Perspective render', MediaOut: 'CAM output' }[type]);

  // Escape cancels a pending connection so wires never dangle
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') graph.cancelConnection(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [graph.cancelConnection]);

  const trackWire = (e) => {
    if (!graph.connecting || !canvasEl.current) return;
    const r = canvasEl.current.getBoundingClientRect();
    setWire({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const src = graph.connecting ? graph.nodeMap[graph.connecting] : null;

  return (
    <section id="cam-nodes" className="cm-node-panel">
      <div className="cm-panel-heading"><strong>Nodes</strong><span className="cm-panel-tools"><span>{graph.nodes.length} tools · {graph.edges.length} links</span><button onClick={onMax} title={isMax ? 'Restore workspace' : 'Fullscreen nodes'}>{isMax ? <Minimize2 /> : <Maximize2 />}</button></span></div>
      <CamNodeToolbar onAdd={graph.addNode} onDelete={graph.deleteSelected} onConnect={() => graph.selected && graph.beginConnection(graph.selected)} connecting={graph.connecting} />
      <div className="cm-node-scroll" onPointerMove={trackWire}>
        <div ref={canvasEl} className="cm-node-canvas" onClick={() => { if (graph.connecting) graph.cancelConnection(); graph.setSelected(null); }}>
          <svg className="cm-node-lines" viewBox="0 0 1020 300" preserveAspectRatio="none">
            {graph.edges.map(([from, to]) => {
              const a = graph.nodeMap[from], b = graph.nodeMap[to];
              if (!a || !b) return null;
              const p = portOut(a), q = portIn(b);
              return <path key={`${from}-${to}`} d={`M${p.x},${p.y} C${p.x + 27},${p.y} ${q.x - 27},${q.y} ${q.x},${q.y}`} />;
            })}
            {src && wire && (() => { const p = portOut(src); return <path className="cm-node-wire-live" d={`M${p.x},${p.y} C${p.x + 27},${p.y} ${wire.x - 27},${wire.y} ${wire.x},${wire.y}`} />; })()}
          </svg>
          {graph.nodes.map((node) => <CamNode key={node.id} node={node} detail={detail(node.type)} selected={graph.selected === node.id} onSelect={graph.setSelected} onMove={graph.moveNode} onOutput={graph.beginConnection} onInput={graph.finishConnection} />)}
        </div>
      </div>
    </section>
  );
}