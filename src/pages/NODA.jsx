import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Zap, Plus, Play, Sparkles, Loader2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import RMXNodeLibrary from "@/components/rmx/RMXNodeLibrary";
import RMXCanvas from "@/components/rmx/RMXCanvas";
import RMXNodeConfig from "@/components/rmx/RMXNodeConfig";
import RMXRunPanel from "@/components/rmx/RMXRunPanel";

export default function NODAPage() {
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [running, setRunning] = useState(false);
  const [runLogs, setRunLogs] = useState([]);
  const [showRunPanel, setShowRunPanel] = useState(false);
  const [workflowName, setWorkflowName] = useState("Untitled NODA Workflow");
  const [worldOpen, setWorldOpen] = useState(false);

  const addNode = (template) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newNode = {
      id,
      type: template.type,
      label: template.label,
      icon: template.icon,
      color: template.color,
      config: { ...(template.defaultConfig || {}) },
      output: null,
    };
    setNodes((prev) => [...prev, newNode]);
    setShowLibrary(false);
    setSelectedNodeId(id);
  };

  const updateNode = (id, updates) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const deleteNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const runWorkflow = async () => {
    if (nodes.length === 0) return;
    setRunning(true);
    setRunLogs([]);
    setShowRunPanel(true);

    const log = (msg, type = "info") => {
      setRunLogs((prev) => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
    };

    log(`▶ Starting "${workflowName}"`);
    let context = {};

    for (const node of nodes) {
      log(`→ ${node.label}...`);
      try {
        const result = await executeNode(node, context);
        context[node.id] = result;
        updateNode(node.id, { output: result });
        log(`✓ ${node.label} complete`, "success");
      } catch (err) {
        log(`✗ ${node.label} failed: ${err.message}`, "error");
        break;
      }
    }
    log(`■ Finished`, "success");
    setRunning(false);
  };

  const executeNode = async (node, context) => {
    const interpolate = (str) => {
      if (typeof str !== "string") return str;
      return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const lastNode = nodes[nodes.length - 1];
        const lastOutput = context[lastNode?.id];
        if (typeof lastOutput === "string") return lastOutput;
        if (lastOutput && typeof lastOutput === "object") return lastOutput[key] || "";
        return "";
      });
    };

    switch (node.type) {
      case "ai_prompt": {
        const prompt = interpolate(node.config.prompt || "");
        const res = await base44.integrations.Core.InvokeLLM({ prompt });
        return res;
      }
      case "ai_image": {
        const prompt = interpolate(node.config.prompt || "");
        const res = await base44.integrations.Core.GenerateImage({ prompt });
        return res?.url || "";
      }
      case "send_email": {
        const to = interpolate(node.config.to || "");
        const subject = interpolate(node.config.subject || "");
        const body = interpolate(node.config.body || "");
        await base44.integrations.Core.SendEmail({ to, subject, body });
        return { sent: true, to };
      }
      case "delay": {
        const ms = (Number(node.config.seconds) || 1) * 1000;
        await new Promise((r) => setTimeout(r, ms));
        return { waited: ms };
      }
      case "filter": {
        const lastVal = Object.values(context).pop();
        const keyword = (node.config.contains || "").toLowerCase();
        const text = String(lastVal || "").toLowerCase();
        if (!text.includes(keyword)) throw new Error(`Filter: "${keyword}" not found`);
        return lastVal;
      }
      case "webhook": {
        const url = interpolate(node.config.url || "");
        const lastVal = Object.values(context).pop();
        const res = await fetch(url, {
          method: node.config.method || "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: lastVal }),
        });
        return await res.text();
      }
      case "save_data": {
        return { saved: true, value: Object.values(context).pop() };
      }
      case "branch": {
        return { branched: true };
      }
      default:
        return { ok: true };
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-zinc-950 via-cyan-950/20 to-zinc-950 overflow-hidden flex flex-col ${worldOpen ? "invisible" : ""}`}>
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={createPageUrl("AppStoreV2")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="hidden sm:block w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black text-base tracking-tight">NODA</span>
            <span className="text-white/30">/</span>
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="bg-transparent text-white font-bold text-sm outline-none border-b border-transparent focus:border-cyan-400 min-w-0 flex-shrink"
            />
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-300 text-[9px] font-bold tracking-widest uppercase">
            <Sparkles className="w-2.5 h-2.5" /> Node Workflow
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
          <button
            onClick={runWorkflow}
            disabled={running || nodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white text-sm font-bold shadow-lg shadow-cyan-500/20"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? "Running" : "Run"}
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        <RMXCanvas
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelect={setSelectedNodeId}
          onDelete={deleteNode}
          onAdd={() => setShowLibrary(true)}
        />

        {/* Right config panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              className="w-80 border-l border-white/10 bg-black/60 backdrop-blur-xl overflow-y-auto"
            >
              <RMXNodeConfig
                node={selectedNode}
                onUpdate={(updates) => updateNode(selectedNode.id, updates)}
                onClose={() => setSelectedNodeId(null)}
                onDelete={() => deleteNode(selectedNode.id)}
                onWorldToggle={setWorldOpen}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Node library modal */}
      <AnimatePresence>
        {showLibrary && (
          <RMXNodeLibrary onPick={addNode} onClose={() => setShowLibrary(false)} />
        )}
      </AnimatePresence>

      {/* Run logs panel */}
      <AnimatePresence>
        {showRunPanel && (
          <RMXRunPanel
            logs={runLogs}
            running={running}
            onClose={() => setShowRunPanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}