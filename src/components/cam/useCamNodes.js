import { useMemo, useState } from 'react';

const START_NODES = [
  { id: 'media', type: 'MediaIn', x: 50, y: 105 },
  { id: 'transform', type: 'Transform', x: 240, y: 170 },
  { id: 'camera', type: 'Camera3D', x: 430, y: 70 },
  { id: 'renderer', type: 'Renderer3D', x: 620, y: 105 },
  { id: 'output', type: 'MediaOut', x: 810, y: 105 },
];
const START_EDGES = [['media', 'transform'], ['transform', 'camera'], ['camera', 'renderer'], ['renderer', 'output']];

export default function useCamNodes() {
  const [nodes, setNodes] = useState(START_NODES);
  const [edges, setEdges] = useState(START_EDGES);
  const [selected, setSelected] = useState('camera');
  const [connecting, setConnecting] = useState(null);

  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((node) => [node.id, node])), [nodes]);
  const addNode = (type) => {
    const id = `${type.toLowerCase()}-${Date.now()}`;
    setNodes((items) => [...items, { id, type, x: 330 + (items.length % 3) * 170, y: 35 + (items.length % 2) * 125 }]);
    setSelected(id);
  };
  const deleteSelected = () => {
    if (!selected) return;
    setNodes((items) => items.filter((node) => node.id !== selected));
    setEdges((items) => items.filter(([from, to]) => from !== selected && to !== selected));
    setSelected(null);
  };
  const moveNode = (id, x, y) => setNodes((items) => items.map((node) => node.id === id ? { ...node, x: Math.max(8, x), y: Math.max(8, y) } : node));
  const beginConnection = (id) => setConnecting(id);
  const finishConnection = (id) => {
    if (connecting && connecting !== id) setEdges((items) => items.some(([a, b]) => a === connecting && b === id) ? items : [...items, [connecting, id]]);
    setConnecting(null);
  };
  return { nodes, edges, nodeMap, selected, connecting, setSelected, addNode, deleteSelected, moveNode, beginConnection, finishConnection };
}