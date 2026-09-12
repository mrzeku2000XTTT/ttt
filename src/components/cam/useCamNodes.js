import { useMemo, useState } from 'react';

const START_NODES = [
  { id: 'media', type: 'MediaIn', x: 50, y: 105 },
  { id: 'transform', type: 'Transform', x: 240, y: 170 },
  { id: 'camera', type: 'Camera3D', x: 430, y: 70 },
  { id: 'renderer', type: 'Renderer3D', x: 620, y: 105 },
  { id: 'output', type: 'MediaOut', x: 810, y: 105 },
];
const START_EDGES = [['media', 'transform'], ['transform', 'camera'], ['camera', 'renderer'], ['renderer', 'output']];
// Which ports each node type physically has — connections must respect these
const PORT_TYPES = {
  MediaIn: { input: false, output: true },
  Transform: { input: true, output: true },
  Camera3D: { input: true, output: true },
  Renderer3D: { input: true, output: true },
  MediaOut: { input: true, output: false },
};

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
  const beginConnection = (id) => { if (PORT_TYPES[nodeMap[id]?.type]?.output) setConnecting(id); };
  const cancelConnection = () => setConnecting(null);
  const finishConnection = (id) => {
    if (connecting && connecting !== id && PORT_TYPES[nodeMap[id]?.type]?.input) {
      setEdges((items) => (items.some(([a, b]) => a === connecting && b === id) ? items : [...items, [connecting, id]]));
    }
    setConnecting(null);
  };
  // CAM AI Agent — build a node chain from a natural-language spec
  const addAINodes = (spec) => {
    const safe = (spec || []).filter((s) => s && PORT_TYPES[s.type]);
    if (!safe.length) return { added: 0 };
    const stamp = Date.now();
    const base = nodes.length;
    const created = safe.map((s, i) => ({ id: `${s.type.toLowerCase()}-ai${stamp}-${i}`, type: s.type, x: 290 + ((base + i) % 3) * 170, y: 30 + ((base + i) % 2) * 125 }));
    const pool = [...nodes, ...created];
    const newEdges = [];
    created.forEach((n, i) => {
      if (i > 0) newEdges.push([created[i - 1].id, n.id]);
      const target = safe[i].attach_to;
      const src = target && pool.find((nd) => nd.id === target || nd.type === target);
      if (src && src.id !== n.id) newEdges.push([src.id, n.id]);
    });
    const seen = new Set();
    const unique = newEdges.filter(([f, t]) => {
      const key = `${f}->${t}`;
      if (f === t || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setNodes((items) => [...items, ...created]);
    setEdges((items) => [...items, ...unique.filter(([f, t]) => !items.some(([a, b]) => a === f && b === t))]);
    setSelected(created[0].id);
    return { added: created.length };
  };
  return { nodes, edges, nodeMap, selected, connecting, setSelected, addNode, deleteSelected, moveNode, beginConnection, cancelConnection, finishConnection, addAINodes };
}