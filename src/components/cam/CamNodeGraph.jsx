import React from 'react';
import CamNode from './CamNode';
import CamNodeToolbar from './CamNodeToolbar';
import useCamNodes from './useCamNodes';

export default function CamNodeGraph({ image, moveLabel, intensity, duration }) {
  const graph = useCamNodes();
  const detail = (type) => ({ MediaIn: image ? 'Source ready' : 'No source', Transform: `${Math.round(intensity * 100)}% · ${duration}s`, Camera3D: moveLabel, Renderer3D: 'Perspective render', MediaOut: 'CAM output' }[type]);
  return (
    <section id="cam-nodes" className="cm-node-panel">
      <div className="cm-panel-heading"><strong>Nodes</strong><span>{graph.nodes.length} tools · {graph.edges.length} links</span></div>
      <CamNodeToolbar onAdd={graph.addNode} onDelete={graph.deleteSelected} onConnect={() => graph.selected && graph.beginConnection(graph.selected)} connecting={graph.connecting} />
      <div className="cm-node-scroll">
        <div className="cm-node-canvas" onClick={() => graph.setSelected(null)}>
          <svg className="cm-node-lines" viewBox="0 0 1020 300" preserveAspectRatio="none">{graph.edges.map(([from, to]) => {
            const a = graph.nodeMap[from], b = graph.nodeMap[to];
            if (!a || !b) return null;
            return <path key={`${from}-${to}`} d={`M${a.x + 148},${a.y + 35} C${a.x + 175},${a.y + 35} ${b.x - 27},${b.y + 35} ${b.x},${b.y + 35}`} />;
          })}</svg>
          {graph.nodes.map((node) => <CamNode key={node.id} node={node} detail={detail(node.type)} selected={graph.selected === node.id} onSelect={graph.setSelected} onMove={graph.moveNode} onOutput={graph.beginConnection} onInput={graph.finishConnection} />)}
        </div>
      </div>
    </section>
  );
}