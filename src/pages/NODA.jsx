import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Zap, Plus, Play, Sparkles, Loader2, Eye, EyeOff, Wand2, Mail, X, Repeat, Brain, Save,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import RMXNodeLibrary from "@/components/rmx/RMXNodeLibrary";
import RMXCanvas from "@/components/rmx/RMXCanvas";
import RMXNodeConfig from "@/components/rmx/RMXNodeConfig";
import RMXRunPanel from "@/components/rmx/RMXRunPanel";
import RMXBrainBox from "@/components/rmx/RMXBrainBox";
import NodaSaveModal from "@/components/rmx/NodaSaveModal";

export default function NODAPage() {
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [running, setRunning] = useState(false);
  const [runLogs, setRunLogs] = useState([]);
  const [showRunPanel, setShowRunPanel] = useState(false);
  const [workflowName, setWorkflowName] = useState("Untitled NODA Workflow");
  const [worldOpen, setWorldOpen] = useState(false);
  const [layoutHidden, setLayoutHidden] = useState(false);
  const [exampleModalOpen, setExampleModalOpen] = useState(false);
  const [exampleEmail, setExampleEmail] = useState("");
  const [toast, setToast] = useState(null);
  const [autoRun, setAutoRun] = useState(false);
  const [brainOpen, setBrainOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [xPostModal, setXPostModal] = useState(null); // { text, intent }
  const autoRunTimerRef = useRef(null);
  const runningRef = useRef(false);
  const isAutoRunRef = useRef(false);
  useEffect(() => { runningRef.current = running; }, [running]);

  useEffect(() => {
    base44.auth.me().then((u) => setCurrentUserEmail(u?.email || "")).catch(() => {});
  }, []);

  const handleBrainBuild = (newNodes, name) => {
    setNodes(newNodes);
    if (name) setWorkflowName(name);
    setSelectedNodeId(null);
    setAutoRun(true);
    showToast(`Brain built ${newNodes.length} step${newNodes.length === 1 ? "" : "s"} — running now`);
    // Kick off the run immediately as an EXPLICIT run (not auto-run) so X compose opens
    setTimeout(() => {
      if (!runningRef.current) {
        isAutoRunRef.current = false;
        runWorkflow();
      }
    }, 250);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // Auto-run: debounce-trigger workflow whenever nodes/config change
  useEffect(() => {
    if (!autoRun || nodes.length === 0) return;
    if (autoRunTimerRef.current) clearTimeout(autoRunTimerRef.current);
    autoRunTimerRef.current = setTimeout(() => {
      if (!runningRef.current) {
        isAutoRunRef.current = true;
        runWorkflow();
      }
    }, 1200);
    return () => clearTimeout(autoRunTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, JSON.stringify(nodes.map((n) => ({ id: n.id, type: n.type, config: n.config })))]);

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

  const loadExample = () => {
    setExampleEmail("");
    setExampleModalOpen(true);
  };

  const buildExampleWorkflow = (myEmail) => {
    if (!myEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(myEmail.trim())) {
      showToast("Please enter a valid email", "error");
      return;
    }
    const t = Date.now();
    const example = [
      {
        id: `node_${t}_a`,
        type: "ai_prompt",
        label: "AI Prompt",
        icon: "Brain",
        color: "from-purple-500 to-pink-500",
        config: {
          prompt:
            "Write a short, friendly daily briefing about Kaspa (KAS) — 3 bullet points covering what's interesting today, in plain English. Keep it under 120 words.",
        },
        output: null,
      },
      {
        id: `node_${t}_b`,
        type: "send_email",
        label: "Send Email",
        icon: "Mail",
        color: "from-amber-500 to-orange-500",
        config: {
          to: myEmail.trim(),
          from_name: "NODA Daily Briefing",
          subject: "Your Kaspa briefing for today",
          body: "Hey 👋\n\nHere's your Kaspa briefing:\n\n{{result}}\n\n— NODA",
        },
        output: null,
      },
    ];
    setNodes(example);
    setWorkflowName("Daily Kaspa Email Briefing");
    setSelectedNodeId(null);
    setExampleModalOpen(false);
    showToast(`Example loaded — will email ${myEmail.trim()}`);
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
        if (node.type === "send_email" && result?.sent) {
          log(`✓ Email sent to ${result.to}`, "success");
        } else {
          log(`✓ ${node.label} complete`, "success");
        }
      } catch (err) {
        log(`✗ ${node.label} failed: ${err.message}`, "error");
        break;
      }
    }
    log(`■ Finished`, "success");
    setRunning(false);
    isAutoRunRef.current = false;
  };

  const executeNode = async (node, context) => {
    // Find most recent previous node's output (walk backward from current node)
    const getPrevOutput = () => {
      const idx = nodes.findIndex((n) => n.id === node.id);
      for (let i = idx - 1; i >= 0; i--) {
        const out = context[nodes[i].id];
        if (out !== undefined && out !== null) return out;
      }
      return "";
    };

    // For email body: collect ALL prior outputs (text + image URLs) in order
    const getAllPriorOutputs = () => {
      const idx = nodes.findIndex((n) => n.id === node.id);
      const parts = [];
      for (let i = 0; i < idx; i++) {
        const prev = nodes[i];
        const out = context[prev.id];
        if (out === undefined || out === null) continue;
        if (prev.type === "ai_image" && typeof out === "string") {
          parts.push(out); // raw URL — email step will turn into <img>
        } else {
          parts.push(stringify(out));
        }
      }
      return parts.join("\n\n");
    };

    const stringify = (val) => {
      if (val === null || val === undefined) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object") {
        try { return JSON.stringify(val, null, 2); } catch { return String(val); }
      }
      return String(val);
    };

    // Convert basic Markdown (**bold**, ## headings, etc.) to clean HTML for emails
    const markdownToHtml = (str) => {
      if (typeof str !== "string") return str;
      let s = str;
      // Headings: ###### → ## (h6 → h2)
      s = s.replace(/^######\s+(.+)$/gm, "<h6 style=\"margin:12px 0 6px;font-size:13px;font-weight:700;\">$1</h6>");
      s = s.replace(/^#####\s+(.+)$/gm, "<h5 style=\"margin:12px 0 6px;font-size:14px;font-weight:700;\">$1</h5>");
      s = s.replace(/^####\s+(.+)$/gm, "<h4 style=\"margin:14px 0 6px;font-size:15px;font-weight:700;\">$1</h4>");
      s = s.replace(/^###\s+(.+)$/gm, "<h3 style=\"margin:16px 0 8px;font-size:17px;font-weight:700;\">$1</h3>");
      s = s.replace(/^##\s+(.+)$/gm, "<h2 style=\"margin:18px 0 8px;font-size:20px;font-weight:800;\">$1</h2>");
      s = s.replace(/^#\s+(.+)$/gm, "<h1 style=\"margin:20px 0 10px;font-size:24px;font-weight:800;\">$1</h1>");
      // Bold + italic
      s = s.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
      s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?]|$)/g, "$1<em>$2</em>");
      // Inline code
      s = s.replace(/`([^`]+)`/g, "<code style=\"background:#f4f4f5;padding:2px 5px;border-radius:4px;font-family:monospace;font-size:0.9em;\">$1</code>");
      // Bullet lists
      s = s.replace(/^[\-\*]\s+(.+)$/gm, "<li>$1</li>");
      s = s.replace(/(<li>[\s\S]*?<\/li>)(?=\n(?!<li>)|$)/g, "<ul style=\"margin:8px 0;padding-left:20px;\">$1</ul>");
      // Links [text](url)
      s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\" style=\"color:#06b6d4;\">$1</a>");
      return s;
    };

    const interpolate = (str) => {
      if (typeof str !== "string") return str;
      return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        if (key === "result") {
          // For email steps, expand {{result}} to ALL prior outputs (text + image URLs).
          // For other steps, just use the most recent output.
          if (node.type === "send_email") return getAllPriorOutputs();
          const prev = getPrevOutput();
          return stringify(prev);
        }
        const prev = getPrevOutput();
        if (prev && typeof prev === "object") return stringify(prev[key] ?? "");
        return stringify(prev);
      });
    };

    // Retry helper for flaky network calls (AI image gen especially)
    const withRetry = async (fn, attempts = 2) => {
      let lastErr;
      for (let i = 0; i < attempts; i++) {
        try { return await fn(); }
        catch (e) {
          lastErr = e;
          if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800));
        }
      }
      throw lastErr;
    };

    switch (node.type) {
      case "ai_prompt": {
        const prompt = interpolate(node.config.prompt || "");
        const res = await withRetry(() => base44.integrations.Core.InvokeLLM({ prompt }));
        return res;
      }
      case "ai_image": {
        const prompt = interpolate(node.config.prompt || "");
        const res = await withRetry(() => base44.integrations.Core.GenerateImage({ prompt }));
        return res?.url || "";
      }
      case "send_email": {
        const to = interpolate(node.config.to || "").trim();
        const subject = interpolate(node.config.subject || "").trim();
        const fromName = (node.config.from_name || "").trim();
        if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
          throw new Error(`Invalid recipient email: "${to}"`);
        }
        if (!subject) throw new Error("Subject is required");

        // Collect every image URL produced by previous ai_image steps
        const idx = nodes.findIndex((n) => n.id === node.id);
        const imageUrls = [];
        const textOutputs = [];
        for (let i = 0; i < idx; i++) {
          const prev = nodes[i];
          const out = context[prev.id];
          if (prev.type === "ai_image" && typeof out === "string" && /^https?:\/\//.test(out)) {
            imageUrls.push(out);
          } else if (prev.type === "ai_prompt" && out) {
            textOutputs.push(stringify(out));
          }
        }

        let body = interpolate(node.config.body || "");
        if (!body) throw new Error("Body is required");

        // Convert to HTML and embed images. If body looks like plain text, wrap it.
        const isHtml = /<[a-z][\s\S]*>/i.test(body);
        // Convert Markdown (**, ##, lists, links) to HTML so emails don't show raw markup
        let htmlBody = isHtml ? body : markdownToHtml(body).replace(/\n/g, "<br/>");

        // Replace any raw image URLs in body with <img> tags
        htmlBody = htmlBody.replace(
          /(https?:\/\/[^\s<"']+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s<"']*)?)/gi,
          (url) => `<img src="${url}" alt="" style="max-width:100%;border-radius:12px;margin:12px 0;display:block;" />`
        );

        // If there are image URLs from prior ai_image steps that aren't already in the body, append them
        const stillMissing = imageUrls.filter((u) => !htmlBody.includes(u));
        if (stillMissing.length) {
          htmlBody += stillMissing
            .map((u) => `<img src="${u}" alt="" style="max-width:100%;border-radius:12px;margin:12px 0;display:block;" />`)
            .join("");
        }

        const payload = { to, subject, body: htmlBody };
        if (fromName) payload.from_name = fromName;
        await base44.integrations.Core.SendEmail(payload);
        return {
          sent: true,
          to,
          subject,
          images_embedded: imageUrls.length,
          sent_at: new Date().toISOString(),
        };
      }
      case "send_to_x": {
        // Use the most recent TEXT output (skip ai_image URLs — X can't preview them inline anyway).
        const idx = nodes.findIndex((n) => n.id === node.id);
        let textPart = "";
        for (let i = idx - 1; i >= 0; i--) {
          const prev = nodes[i];
          const out = context[prev.id];
          if (out === undefined || out === null) continue;
          if (prev.type === "ai_image") continue; // skip image steps
          textPart = stringify(out).trim();
          break;
        }
        // Fallback: if no text step exists, use whatever the previous output was
        const fullText = textPart || stringify(getPrevOutput()).trim();
        // X limits tweets to 280 chars
        const tweetText = fullText.length > 275
          ? fullText.slice(0, 272).trimEnd() + "…"
          : fullText;
        // Skip opening X during auto-run — only fire on explicit Run clicks
        if (isAutoRunRef.current) {
          return { skipped: "auto-run", chars: tweetText.length };
        }
        try { await navigator.clipboard.writeText(fullText); } catch {}
        const intent = `https://x.com/intent/post?text=${encodeURIComponent(tweetText)}`;
        // Try popup first (works if browser allows), but ALWAYS show fallback modal
        // with a real <a> link the user can click — popups get blocked after async awaits.
        let popup = null;
        try {
          popup = window.open(intent, "_blank", "noopener,noreferrer");
        } catch {}
        const popupBlocked = !popup || popup.closed || typeof popup.closed === "undefined";
        if (popupBlocked) {
          setXPostModal({ text: tweetText, intent, fullText });
        }
        return {
          opened: !popupBlocked,
          fallback_modal: popupBlocked,
          copied: true,
          chars: tweetText.length,
          truncated: fullText.length > 275,
        };
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
    <div className={`fixed inset-0 bg-gradient-to-br from-zinc-950 via-cyan-950/20 to-zinc-950 overflow-hidden flex-col ${worldOpen ? "hidden" : "flex"}`}>
      {/* Floating restore button when layout is hidden */}
      {layoutHidden && (
        <button
          onClick={() => setLayoutHidden(false)}
          className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-md border border-white/20 hover:bg-white/10 rounded-full text-white text-xs font-bold shadow-lg"
        >
          <Eye className="w-3.5 h-3.5" /> Show NODA
        </button>
      )}
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
      <div className={`relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-xl ${layoutHidden ? "hidden" : ""}`}>
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
            onClick={() => setBrainOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 hover:from-fuchsia-500/30 hover:to-cyan-500/30 border border-fuchsia-500/40 rounded-lg text-fuchsia-100 text-sm font-bold shadow-lg shadow-fuchsia-500/10"
            title="Describe what you want — AI builds the workflow"
          >
            <Brain className="w-4 h-4" /> Brain
          </button>
          <button
            onClick={loadExample}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-purple-200 text-sm font-bold"
            title="Load example: Daily Kaspa email briefing"
          >
            <Wand2 className="w-4 h-4" /> Example
          </button>
          <button
            onClick={() => setShowLibrary(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-sm font-bold"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
          <button
            onClick={() => setSaveOpen(true)}
            disabled={nodes.length === 0 || !currentUserEmail}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-emerald-200 text-sm font-bold"
            title="Save workflow so other apps can call it"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          <button
            onClick={() => setLayoutHidden(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm font-bold"
            title="Hide NODA layout"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const next = !autoRun;
              setAutoRun(next);
              showToast(next ? "Auto-run ON — runs on changes" : "Auto-run OFF");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
              autoRun
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 shadow-lg shadow-emerald-500/10"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            }`}
            title="Auto-run workflow on every change"
          >
            <Repeat className={`w-4 h-4 ${autoRun ? "animate-pulse" : ""}`} />
            Auto
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
      <div className={`relative z-10 flex-1 flex overflow-hidden ${layoutHidden ? "hidden" : ""}`}>
        <RMXCanvas
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelect={setSelectedNodeId}
          onDelete={deleteNode}
          onAdd={() => setShowLibrary(true)}
        />

        {/* Right config panel - split screen */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-l border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden"
            >
              <div className="w-80 sm:w-96 h-full overflow-y-auto">
                <RMXNodeConfig
                  node={selectedNode}
                  onUpdate={(updates) => updateNode(selectedNode.id, updates)}
                  onClose={() => setSelectedNodeId(null)}
                  onDelete={() => deleteNode(selectedNode.id)}
                  onWorldToggle={setWorldOpen}
                />
              </div>
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

      {/* Brain modal — natural-language workflow builder */}
      <RMXBrainBox
        open={brainOpen}
        onClose={() => setBrainOpen(false)}
        onBuild={handleBrainBuild}
        currentEmail={currentUserEmail}
      />

      {/* Save & Publish modal — exposes workflow to other apps */}
      <NodaSaveModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        nodes={nodes}
        workflowName={workflowName}
        ownerEmail={currentUserEmail}
        onSaved={(saved) => {
          if (saved?.name) setWorkflowName(saved.name);
          showToast(`Saved "${saved.name}" — callable by other apps`);
        }}
      />


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

      {/* Example email modal */}
      <AnimatePresence>
        {exampleModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setExampleModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Wand2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-white font-bold text-sm">Load example</span>
                </div>
                <button
                  onClick={() => setExampleModalOpen(false)}
                  className="text-white/50 hover:text-white p-1 rounded-md hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-white/60 text-xs mb-3 leading-relaxed">
                  Daily Kaspa briefing → AI writes it → emails to you. Where should we send it?
                </p>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    autoFocus
                    type="email"
                    value={exampleEmail}
                    onChange={(e) => setExampleEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && buildExampleWorkflow(exampleEmail)}
                    placeholder="you@example.com"
                    className="w-full bg-black/40 border border-white/10 focus:border-cyan-400/60 focus:bg-black/60 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setExampleModalOpen(false)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => buildExampleWorkflow(exampleEmail)}
                    className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-bold shadow-lg shadow-cyan-500/20"
                  >
                    Load
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* X post fallback modal — for when popup is blocked */}
      <AnimatePresence>
        {xPostModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[105] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={() => setXPostModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-950 border border-sky-500/30 rounded-2xl shadow-2xl shadow-sky-500/10 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-gradient-to-r from-sky-500/15 to-blue-500/15">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center border border-white/20">
                    <span className="text-white font-black text-sm">𝕏</span>
                  </div>
                  <span className="text-white font-bold text-sm">Ready to post</span>
                </div>
                <button
                  onClick={() => setXPostModal(null)}
                  className="text-white/50 hover:text-white p-1 rounded-md hover:bg-white/5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="px-3 py-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{xPostModal.text}</p>
                </div>
                <p className="text-white/50 text-xs">
                  Browser blocked the popup. Click below to open X compose with your post pre-filled.
                </p>
                <a
                  href={xPostModal.intent}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setTimeout(() => setXPostModal(null), 200)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-black hover:bg-zinc-800 border border-white/20 text-white font-bold text-sm shadow-lg"
                >
                  <span className="font-black text-base">𝕏</span> Open X to Post
                </a>
                <button
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(xPostModal.fullText); } catch {}
                    showToast("Copied to clipboard");
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold"
                >
                  Copy text instead
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-[110] max-w-xs"
          >
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl backdrop-blur-xl border shadow-2xl ${
              toast.type === "error"
                ? "bg-red-500/15 border-red-500/40 text-red-200"
                : "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${toast.type === "error" ? "bg-red-400" : "bg-emerald-400"} animate-pulse`} />
              <span className="text-xs font-semibold">{toast.msg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}