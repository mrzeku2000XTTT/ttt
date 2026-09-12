import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import CamNode from './CamNode';
import CamNodeToolbar from './CamNodeToolbar';
import useCamNodeViewport from '@/components/cam/useCamNodeViewport';

// Port centers on a 148px-wide node: out = right edge +1, in = left edge -1, y = +34
const portOut = (n) => ({ x: n.x + 149, y: n.y + 34 });
const portIn = (n) => ({ x: n.x - 1, y: n.y + 34 });

export default function CamNodeGraph({ graph, image, moveLabel, intensity, duration, isMax, onMax, tabs }) {
  const viewport = useCamNodeViewport();
  const [wire, setWire] = useState(null);
  const detail = (type) => ({ MediaIn: image ? 'Source ready' : 'No source', Transform: `${Math.round(intensity * 100)}% · ${duration}s`, Camera3D: moveLabel, Renderer3D: 'Perspective render', MediaOut: 'CAM output' }[type]);

  // Escape cancels a pending connection so wires never dangle
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') graph.cancelConnection(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [graph.cancelConnection]);

  const trackWire = (e) => {
    viewport.handlers.onPointerMove(e);
    if (graph.connecting) setWire(viewport.point(e));
  };
  const src = graph.connecting ? graph.nodeMap[graph.connecting] : null;

  return (
    <section id="cam-nodes" className="cm-node-panel">
      <div className="cm-panel-heading">{tabs || <strong>Nodes</strong>}<span className="cm-panel-tools"><button onClick={() => viewport.zoom(0.8)} title="Zoom nodes out">−</button><span>{Math.round(viewport.view.zoom * 100)}%</span><button onClick={() => viewport.zoom(1.25)} title="Zoom nodes in">+</button><button onClick={() => viewport.fit(graph.nodes)}>Fit</button><span>{graph.nodes.length} tools · {graph.edges.length} links</span><button onClick={onMax} title={isMax ? 'Restore workspace' : 'Fullscreen nodes'}>{isMax ? <Minimize2 /> : <Maximize2 />}</button></span></div>
      <CamNodeToolbar onAdd={graph.addNode} onDelete={graph.deleteSelected} onConnect={() => graph.selected && graph.beginConnection(graph.selected)} connecting={graph.connecting} />
      <div ref={viewport.ref} className="cm-node-scroll cm-node-infinite" {...viewport.handlers} onPointerMove={trackWire} style={{ backgroundPosition: `${viewport.view.x}px ${viewport.view.y}px`, backgroundSize: `${24 * viewport.view.zoom}px ${24 * viewport.view.zoom}px` }} onClick={(e) => { if (!e.target.closest('.cm-node')) { graph.cancelConnection(); graph.setSelected(null); } }}>
        <div className="cm-node-world" style={{ transform: `translate(${viewport.view.x}px, ${viewport.view.y}px) scale(${viewport.view.zoom})` }}>
          <svg className="cm-node-lines cm-node-infinite-lines">
            {graph.edges.map(([from, to]) => {
              const a = graph.nodeMap[from], b = graph.nodeMap[to];
              if (!a || !b) return null;
              const p = portOut(a), q = portIn(b);
              return <path key={`${from}-${to}`} d={`M${p.x},${p.y} C${p.x + 27},${p.y} ${q.x - 27},${q.y} ${q.x},${q.y}`} />;
            })}
            {src && wire && (() => { const p = portOut(src); return <path className="cm-node-wire-live" d={`M${p.x},${p.y} C${p.x + 27},${p.y} ${wire.x - 27},${wire.y} ${wire.x},${wire.y}`} />; })()}
          </svg>
          {graph.nodes.map((node) => <CamNode key={node.id} node={node} zoom={viewport.view.zoom} detail={detail(node.type)} selected={graph.selected === node.id} onSelect={graph.setSelected} onMove={graph.moveNode} onOutput={graph.beginConnection} onInput={graph.finishConnection} />)}
        </div>
      </div>
    </section>
  );
}