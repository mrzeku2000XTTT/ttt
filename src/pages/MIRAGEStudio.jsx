import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Loader2, Sparkles, Trash2, Lock, PanelRightClose, PanelRightOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MirageCanvas from "@/components/mirage/MirageCanvas";
import MirageToolLibrary from "@/components/mirage/MirageToolLibrary";
import MirageNodeConfig from "@/components/mirage/MirageNodeConfig";
import MirageRunPanel from "@/components/mirage/MirageRunPanel";
import { MIRAGE_LOGO } from "@/components/mirage/mirageTools";

export default function MIRAGEStudioPage() {
  const [authState, setAuthState] = useState("loading");
  useEffect(() => {
    base44.auth.me()
      .then((u) => setAuthState(u?.role === "admin" ? "admin" : "denied"))
      .catch(() => setAuthState("denied"));
  }, []);

  if (authState === "loading") {
    return <div className="fixed inset-0 bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }
  if (authState === "denied") {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-zinc-500" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Admin Only</h1>
          <p className="text-white/50 text-sm mb-8">MIRAGE Studio is restricted to admins.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 h-11 rounded-full bg-white text-black text-sm font-bold"><ArrowLeft className="w-4 h-4" /> Home</Link>
        </div>
      </div>
    );
  }
  return <StudioInner />;
}

function StudioInner() {
  const [nodes, setNodes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showRunPanel, setShowRunPanel] = useState(false);
  const [runStatus, setRunStatus] = useState({}); // { [nodeId]: 'running'|'done'|'error' }
  const [workflowName, setWorkflowName] = useState("Untitled MIRAGE");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const addTool = (tool) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newNode = {
      id,
      toolId: tool.id,
      appName: tool.appName,
      icon: tool.icon,
      color: tool.color,
      logo: tool.logo,
      config: { ...(tool.defaultConfig || {}) },
      output: null,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedId(id);
    setShowLibrary(false);
  };

  const updateNode = (updated) => {
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  const deleteNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const clearAll = () => {
    setNodes([]);
    setSelectedId(null);
    setRunStatus({});
  };

  const runWorkflow = async () => {
    if (nodes.length === 0 || running) return;
    setRunning(true);
    setShowRunPanel(true);
    setLogs([]);
    setRunStatus({});

    const localLogs = [];
    const onLog = (entry) => {
      localLogs.push(entry);
      setLogs([...localLogs]);
    };

    // Track per-node status by intercepting log messages by index
    let i = 0;
    const orderedNodes = [...nodes];
    let prev = null;
    const outputs = [];

    onLog({ msg: `▶ MIRAGE awakening · ${orderedNodes.length} tool${orderedNodes.length === 1 ? "" : "s"}`, type: "info", time: new Date().toLocaleTimeString() });

    try {
      const { runMirageNode } = await import("@/components/mirage/mirageEngine");
      for (i = 0; i < orderedNodes.length; i++) {
        const node = orderedNodes[i];
        setRunStatus((s) => ({ ...s, [node.id]: "running" }));
        onLog({ msg: `→ ${node.appName}…`, type: "info", time: new Date().toLocaleTimeString() });
        try {
          const result = await runMirageNode(node, prev, outputs);
          outputs.push(result);
          prev = result;
          setNodes((cur) => cur.map((n) => (n.id === node.id ? { ...n, output: result } : n)));
          setRunStatus((s) => ({ ...s, [node.id]: "done" }));
          onLog({ msg: `✓ ${node.appName} complete`, type: "success", time: new Date().toLocaleTimeString() });
        } catch (err) {
          setRunStatus((s) => ({ ...s, [node.id]: "error" }));
          onLog({ msg: `✗ ${node.appName} failed: ${err.message}`, type: "error", time: new Date().toLocaleTimeString() });
          throw err;
        }
      }
      onLog({ msg: `■ MIRAGE complete`, type: "success", time: new Date().toLocaleTimeString() });
    } catch (e) {
      // already logged
    }
    setRunning(false);
  };

  const selectedNode = nodes.find((n) => n.id === selectedId);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="relative z-30 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/MIRAGE"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="hidden sm:block w-px h-6 bg-white/10" />
          <Link to="/MIRAGE" className="flex items-center gap-2 min-w-0">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/30">
              <img src={MIRAGE_LOGO} alt="MIRAGE" className="w-full h-full object-cover" />
            </div>
            <span className="text-white font-black text-base tracking-tight">MIRAGE</span>
          </Link>
          <span className="text-white/30">/</span>
          <input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-transparent text-white font-bold text-sm outline-none border-b border-transparent focus:border-emerald-400 min-w-0"
          />
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-200 text-[9px] font-black tracking-widest uppercase">
            <Sparkles className="w-2.5 h-2.5" /> Studio
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold"
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {sidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{sidebarOpen ? "Hide" : "Show"} Panel</span>
          </button>
          {nodes.length > 0 && (
            <button
              onClick={clearAll}
              disabled={running}
              className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-30 text-white/70 text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <button
            onClick={runWorkflow}
            disabled={running || nodes.length === 0}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-amber-400 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold shadow-lg shadow-emerald-500/30"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Running" : "Run MIRAGE"}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden">
        <MirageCanvas
          nodes={nodes}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={() => setShowLibrary(true)}
          onDelete={deleteNode}
          runStatus={runStatus}
        />

        {/* Node config side panel */}
        <AnimatePresence>
          {selectedNode && sidebarOpen && (
            <MirageNodeConfig
              node={selectedNode}
              onUpdate={updateNode}
              onClose={() => setSelectedId(null)}
              onDelete={() => deleteNode(selectedNode.id)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Library modal */}
      <AnimatePresence>
        {showLibrary && (
          <MirageToolLibrary onPick={addTool} onClose={() => setShowLibrary(false)} />
        )}
      </AnimatePresence>

      {/* Run logs */}
      <AnimatePresence>
        {showRunPanel && (
          <MirageRunPanel logs={logs} running={running} onClose={() => setShowRunPanel(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}