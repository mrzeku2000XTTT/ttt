import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Zap, Plus, Play, Sparkles, Loader2, Eye, EyeOff, Wand2, Mail, X, Repeat, Brain, Save,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import RMXNodeLibrary from "@/components/rmx/RMXNodeLibrary";
import RMXInfiniteCanvas from "@/components/rmx/RMXInfiniteCanvas";
import RMXNodeConfig from "@/components/rmx/RMXNodeConfig";
import RMXRunPanel from "@/components/rmx/RMXRunPanel";
import RMXBrainBox from "@/components/rmx/RMXBrainBox";
import NodaSaveModal from "@/components/rmx/NodaSaveModal";
import NodaWorkflowTabs from "@/components/rmx/NodaWorkflowTabs";
import SplitDivider from "@/components/rmx/SplitDivider";
import { inspectWorkflowRun } from "@/components/rmx/nodaInspector";

// Tab factory — each tab carries its own run state so multiple tabs can run concurrently.
const makeTab = (name = "Untitled NODA Workflow") => ({
  id: `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  name,
  nodes: [],
  selectedNodeId: null,
  running: false,
  runLogs: [],
  showRunPanel: false,
  autoRun: false,
});

export default function NODAPage() {
  // Multi-workflow tabs
  const [tabs, setTabs] = useState(() => [makeTab()]);
  const [activeTabId, setActiveTabId] = useState(() => null);

  // Active tab is always derived
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Mirrored convenience accessors — keep existing logic untouched
  const nodes = activeTab?.nodes || [];
  const selectedNodeId = activeTab?.selectedNodeId || null;
  const workflowName = activeTab?.name || "Untitled NODA Workflow";

  // Initialize active tab id once
  useEffect(() => {
    if (!activeTabId && tabs[0]) setActiveTabId(tabs[0].id);
  }, [activeTabId, tabs]);

  const updateActiveTab = (updater) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === (activeTabId || prev[0].id) ? { ...t, ...updater(t) } : t))
    );
  };

  const setNodes = (nextOrFn) => {
    updateActiveTab((t) => ({
      nodes: typeof nextOrFn === "function" ? nextOrFn(t.nodes) : nextOrFn,
    }));
  };

  const setSelectedNodeId = (id) => updateActiveTab(() => ({ selectedNodeId: id }));
  const setWorkflowName = (name) => updateActiveTab(() => ({ name }));

  // Tab actions
  const handleNewTab = () => {
    const t = makeTab(`Workflow ${tabs.length + 1}`);
    setTabs((prev) => [...prev, t]);
    setActiveTabId(t.id);
  };
  const handleCloseTab = (id) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const fresh = makeTab();
        setActiveTabId(fresh.id);
        return [fresh];
      }
      if (id === activeTabId) {
        const fallback = next[Math.max(0, idx - 1)];
        setActiveTabId(fallback.id);
      }
      return next;
    });
  };
  const handleRenameTab = (id, name) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  const [showLibrary, setShowLibrary] = useState(false);
  const [worldOpen, setWorldOpen] = useState(false);

  // Per-tab run state — derived from active tab so each tab runs independently.
  const running = !!activeTab?.running;
  const runLogs = activeTab?.runLogs || [];
  const showRunPanel = !!activeTab?.showRunPanel;

  // Helper: update a SPECIFIC tab by id (not the active one) — critical for concurrent runs
  // because the user may switch tabs mid-run.
  const updateTabById = (tabId, updater) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, ...(typeof updater === "function" ? updater(t) : updater) } : t))
    );
  };

  // Track currently-running tab ids in a ref so we can guard against double-run on the same tab.
  const runningTabsRef = useRef(new Set());

  // Resizable config-panel width (desktop only)
  const [configPanelWidth, setConfigPanelWidth] = useState(() => {
    try {
      const saved = parseInt(localStorage.getItem("noda_config_w") || "", 10);
      return Number.isFinite(saved) ? Math.max(280, Math.min(720, saved)) : 384;
    } catch {
      return 384;
    }
  });
  useEffect(() => {
    try { localStorage.setItem("noda_config_w", String(configPanelWidth)); } catch {}
  }, [configPanelWidth]);
  const [layoutHidden, setLayoutHidden] = useState(false);
  const [exampleModalOpen, setExampleModalOpen] = useState(false);
  const [exampleEmail, setExampleEmail] = useState("");
  const [toast, setToast] = useState(null);
  const [brainOpen, setBrainOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [k6ixApiKey, setK6ixApiKey] = useState(() => localStorage.getItem("noda_k6ix_api_key") || "");
  const [xPostModal, setXPostModal] = useState(null); // { text, intent }

  const updateK6ixApiKey = (value) => {
    setK6ixApiKey(value);
    localStorage.setItem("noda_k6ix_api_key", value);
  };

  // Auto-run state is per-tab now.
  const autoRun = !!activeTab?.autoRun;
  const setAutoRun = (val) => updateActiveTab(() => ({ autoRun: val }));

  // Per-tab auto-run timers + skip flags (keyed by tab id)
  const autoRunTimersRef = useRef({}); // { [tabId]: timeoutId }
  const skipNextAutoRunRef = useRef({}); // { [tabId]: boolean }
  // Track if a run was triggered by auto-run (per tab) — used to suppress popups during auto runs.
  const autoRunFlagRef = useRef({}); // { [tabId]: boolean }

  useEffect(() => {
    base44.auth.me().then((u) => setCurrentUserEmail(u?.email || "")).catch(() => {});
  }, []);

  // Original Brain request per tab — lets the Inspector verify the run did what was asked.
  const brainIntentRef = useRef({}); // { [tabId]: string }

  const handleBrainBuild = (newNodes, name, intentText) => {
    // Brain always builds + runs into the CURRENTLY ACTIVE tab. Capture id NOW
    // so concurrent Brain calls from different tabs each target their own tab.
    const targetTabId = activeTab?.id;
    if (!targetTabId) return;

    // Cancel pending auto-run timer for THIS tab and skip the next auto cycle.
    if (autoRunTimersRef.current[targetTabId]) {
      clearTimeout(autoRunTimersRef.current[targetTabId]);
    }
    skipNextAutoRunRef.current[targetTabId] = true;
    brainIntentRef.current[targetTabId] = intentText || "";

    // Apply build to the target tab (use updateTabById — works even if user switches tabs)
    updateTabById(targetTabId, () => ({
      nodes: newNodes,
      ...(name ? { name } : {}),
      selectedNodeId: null,
      autoRun: false,
    }));

    showToast(`Brain built ${newNodes.length} step${newNodes.length === 1 ? "" : "s"} — running now`);

    // Kick off the run immediately with the FRESH nodes for this specific tab.
    setTimeout(() => {
      if (!runningTabsRef.current.has(targetTabId)) {
        autoRunFlagRef.current[targetTabId] = false;
        runWorkflowForTab(targetTabId, newNodes, name);
      }
    }, 100);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // Auto-run: debounce-trigger workflow whenever ANY tab's nodes/config change
  // and that tab has autoRun enabled. Each tab gets its own debounce timer.
  useEffect(() => {
    tabs.forEach((tab) => {
      if (!tab.autoRun || tab.nodes.length === 0) return;
      if (skipNextAutoRunRef.current[tab.id]) {
        skipNextAutoRunRef.current[tab.id] = false;
        return;
      }
      if (autoRunTimersRef.current[tab.id]) clearTimeout(autoRunTimersRef.current[tab.id]);
      autoRunTimersRef.current[tab.id] = setTimeout(() => {
        if (!runningTabsRef.current.has(tab.id)) {
          autoRunFlagRef.current[tab.id] = true;
          runWorkflowForTab(tab.id);
        }
      }, 1200);
    });
    return () => {
      // Don't clear timers globally — each tab manages its own.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tabs.map((t) => ({
    id: t.id,
    autoRun: t.autoRun,
    sig: t.nodes.map((n) => ({ id: n.id, type: n.type, config: n.config })),
  })))]);

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

  // Run a workflow on a SPECIFIC tab. Multiple tabs can run concurrently —
  // each invocation captures its own tab id, nodes, and run state.
  const runWorkflowForTab = async (tabId, overrideNodes, overrideName) => {
    if (!tabId) return;
    if (runningTabsRef.current.has(tabId)) return; // already running on this tab — guard

    // Snapshot the tab at the moment we start (handles user switching tabs mid-run)
    const tabAtStart = tabs.find((t) => t.id === tabId);
    const activeNodes = Array.isArray(overrideNodes) && overrideNodes.length > 0
      ? overrideNodes
      : (tabAtStart?.nodes || []);
    if (activeNodes.length === 0) return;
    const wfName = overrideName || tabAtStart?.name || "Untitled NODA Workflow";

    runningTabsRef.current.add(tabId);
    updateTabById(tabId, () => ({ running: true, runLogs: [], showRunPanel: true }));

    const log = (msg, type = "info") => {
      const entry = { msg, type, time: new Date().toLocaleTimeString() };
      updateTabById(tabId, (t) => ({ runLogs: [...(t.runLogs || []), entry] }));
    };

    // Per-tab node updater — must NOT use updateNode (which targets the active tab)
    const updateNodeInTab = (nodeId, updates) => {
      updateTabById(tabId, (t) => ({
        nodes: t.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
      }));
    };

    log(`▶ Starting "${wfName}"`);
    let context = {};
    const startedAt = Date.now();
    let allSucceeded = true;

    for (const node of activeNodes) {
      log(`→ ${node.label}...`);
      try {
        const result = await executeNode(node, context, activeNodes, tabId);
        context[node.id] = result;
        updateNodeInTab(node.id, { output: result });
        if (node.type === "send_email" && result?.sent) {
          log(`✓ Email sent to ${result.to}`, "success");
        } else if (node.type === "post_to_ttt" && result?.posted) {
          log(`✓ Posted to TTT feed as "${result.author}" (post ${result.post_id}) — check /Feed`, "success");
        } else if (node.type === "post_to_ttt") {
          log(`⚠ post_to_ttt returned no post id — the post may NOT be on the feed`, "error");
        } else {
          log(`✓ ${node.label} complete`, "success");
        }
      } catch (err) {
        log(`✗ ${node.label} failed: ${err.message}`, "error");
        allSucceeded = false;
        break;
      }
    }
    // ── INSPECTOR: a second AI agent checks the work ──────────────────────
    // Runs after every Brain-built run (we know the user's original intent).
    // Failed checks get ONE automatic retry, then a re-check verdict is logged.
    const intentText = brainIntentRef.current[tabId];
    if (intentText) {
      log(`🔍 Inspector: checking the work against your request…`);
      try {
        const verdict = await inspectWorkflowRun({ intent: intentText, nodes: activeNodes, context });
        (verdict.checks || []).forEach((c) => {
          const n = activeNodes[c.step - 1];
          log(`${c.pass ? "✓" : "✗"} Inspector · ${n?.label || `step ${c.step}`}: ${c.reason}`, c.pass ? "success" : "error");
        });
        (verdict.missing || []).forEach((m) => log(`✗ Inspector · missing: ${m}`, "error"));

        const retryIdx = (verdict.retry_steps || []).filter((i) => i >= 1 && i <= activeNodes.length);
        if (verdict.overall_pass) {
          log(`🔍 Inspector verdict: PASS — ${verdict.summary}`, "success");
        } else if (retryIdx.length) {
          log(`🔍 Inspector: retrying ${retryIdx.length} failed step${retryIdx.length === 1 ? "" : "s"}…`);
          for (const i of retryIdx) {
            const node = activeNodes[i - 1];
            log(`↻ Retrying ${node.label}...`);
            try {
              const result = await executeNode(node, context, activeNodes, tabId);
              context[node.id] = result;
              updateNodeInTab(node.id, { output: result });
              log(`✓ ${node.label} retry complete`, "success");
              allSucceeded = true;
            } catch (err) {
              log(`✗ ${node.label} retry failed: ${err.message}`, "error");
            }
          }
          // Final re-check after retries
          const recheck = await inspectWorkflowRun({ intent: intentText, nodes: activeNodes, context });
          log(`🔍 Inspector final verdict: ${recheck.overall_pass ? "PASS" : "FAIL"} — ${recheck.summary}`, recheck.overall_pass ? "success" : "error");
          allSucceeded = allSucceeded && recheck.overall_pass;
        } else {
          log(`🔍 Inspector verdict: FAIL — ${verdict.summary}`, "error");
        }
      } catch (e) {
        log(`🔍 Inspector unavailable: ${e.message}`, "error");
      }
    }

    log(`■ Finished`, "success");

    // APEX zero-knowledge proof — seal only on full success.
    if (allSucceeded && currentUserEmail) {
      try {
        const durationMs = Date.now() - startedAt;
        const proofPayload = `${wfName}|${activeNodes.length}|${durationMs}|${startedAt}|${currentUserEmail}`;
        const buf = new TextEncoder().encode(proofPayload);
        const hashBuf = await crypto.subtle.digest("SHA-256", buf);
        const proofHash = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        await base44.entities.ApexProof.create({
          owner_email: currentUserEmail,
          workflow_id: `local-${startedAt}`,
          workflow_name: wfName,
          node_count: activeNodes.length,
          duration_ms: durationMs,
          proof_hash: proofHash,
          completed_at: new Date().toISOString(),
        });
        log(`🛡 APEX proof sealed`, "success");
      } catch (e) {
        // Silent — APEX failures must never block NODA
      }
    }

    updateTabById(tabId, () => ({ running: false }));
    runningTabsRef.current.delete(tabId);
    autoRunFlagRef.current[tabId] = false;
  };

  // Thin wrapper: Run button always runs the currently active tab.
  const runWorkflow = (overrideNodes) => {
    const tabId = activeTab?.id;
    if (!tabId) return;
    autoRunFlagRef.current[tabId] = false;
    return runWorkflowForTab(tabId, overrideNodes);
  };

  const executeNode = async (node, context, overrideNodes, tabId) => {
    const nodeList = Array.isArray(overrideNodes) && overrideNodes.length > 0 ? overrideNodes : nodes;
    const isAutoRun = !!(tabId && autoRunFlagRef.current[tabId]);
    // Find most recent previous node's output (walk backward from current node)
    const getPrevOutput = () => {
      const idx = nodeList.findIndex((n) => n.id === node.id);
      for (let i = idx - 1; i >= 0; i--) {
        const out = context[nodeList[i].id];
        if (out !== undefined && out !== null) return out;
      }
      return "";
    };

    // For email body: collect ALL prior outputs (text + image URLs) in order
    const getAllPriorOutputs = () => {
      const idx = nodeList.findIndex((n) => n.id === node.id);
      const parts = [];
      for (let i = 0; i < idx; i++) {
        const prev = nodeList[i];
        const out = context[prev.id];
        if (out === undefined || out === null) continue;
        if ((prev.type === "ai_image" || prev.type === "k6ix_image" || prev.type === "k6ix_video") && typeof out === "string") {
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

    const callK6ix = async (endpoint, body) => {
      if (!k6ixApiKey.trim()) throw new Error("Add your K6ix API key first");
      const res = await fetch(`https://k6ix.base44.app/functions/${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${k6ixApiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || `K6ix request failed (${res.status})`);
      return data;
    };

    const parseLines = (value) => String(value || "").split("\n").map((v) => v.trim()).filter(Boolean);
    const parseJson = (value) => {
      if (!value || !String(value).trim()) return undefined;
      return JSON.parse(value);
    };

    switch (node.type) {
      case "ai_prompt": {
        const prompt = interpolate(node.config.prompt || "");
        const model = node.config.model && node.config.model !== "automatic" ? node.config.model : null;
        const useInternet = node.config.use_internet === "yes";
        const payload = { prompt };
        if (model) payload.model = model;
        // add_context_from_internet only works with gemini_3_flash / gemini_3_1_pro
        if (useInternet && (!model || model === "gemini_3_flash" || model === "gemini_3_1_pro")) {
          payload.add_context_from_internet = true;
          if (!model) payload.model = "gemini_3_flash";
        }
        const res = await withRetry(() => base44.integrations.Core.InvokeLLM(payload));
        return res;
      }
      case "ai_summarize": {
        const prev = stringify(getPrevOutput());
        if (!prev) throw new Error("Nothing to summarize — add a step before this");
        const style = node.config.style || "bullets";
        const length = node.config.length || "short";
        const styleHint = {
          bullets: "5-7 concise bullet points",
          paragraph: "a single tight paragraph",
          tldr: "a one-line TLDR",
          tweet: "under 280 characters, punchy, tweet-style",
        }[style];
        const lengthHint = { short: "very short", medium: "moderate", long: "detailed" }[length];
        const res = await withRetry(() => base44.integrations.Core.InvokeLLM({
          prompt: `Summarize the following content as ${styleHint}. Keep it ${lengthHint}. No filler, no preamble.\n\n---\n${prev}`,
        }));
        return res;
      }
      case "ai_translate": {
        const prev = stringify(getPrevOutput());
        if (!prev) throw new Error("Nothing to translate");
        const lang = (node.config.target_language || "Spanish").trim();
        const res = await withRetry(() => base44.integrations.Core.InvokeLLM({
          prompt: `Translate the following into ${lang}. Output ONLY the translation, no explanation.\n\n---\n${prev}`,
        }));
        return res;
      }
      case "ai_extract": {
        const prev = stringify(getPrevOutput());
        if (!prev) throw new Error("Nothing to extract from");
        const fieldsRaw = (node.config.fields || "title, summary").split(",").map((s) => s.trim()).filter(Boolean);
        const properties = {};
        fieldsRaw.forEach((f) => { properties[f.replace(/\s+/g, "_")] = { type: "string" }; });
        const res = await withRetry(() => base44.integrations.Core.InvokeLLM({
          prompt: `Extract the following fields from the text below: ${fieldsRaw.join(", ")}. If a field is missing, return empty string.\n\n---\n${prev}`,
          response_json_schema: { type: "object", properties },
        }));
        return res;
      }
      case "ai_classify": {
        const prev = stringify(getPrevOutput());
        if (!prev) throw new Error("Nothing to classify");
        const mode = node.config.mode || "sentiment";
        const cats = (node.config.categories || "positive, neutral, negative").split(",").map((s) => s.trim()).filter(Boolean);
        let prompt = "";
        let schema;
        if (mode === "score") {
          prompt = `Score the following text from 0 to 100 on overall quality / relevance. Return ONLY a number.\n\n---\n${prev}`;
          schema = { type: "object", properties: { score: { type: "number" }, reason: { type: "string" } } };
        } else {
          prompt = `Classify the following text into ONE of these categories: ${cats.join(", ")}. Return the category name and a brief reason.\n\n---\n${prev}`;
          schema = { type: "object", properties: { category: { type: "string" }, reason: { type: "string" } } };
        }
        const res = await withRetry(() => base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema }));
        return res;
      }
      case "fetch_url": {
        const url = interpolate(node.config.url || "").trim();
        if (!/^https?:\/\//.test(url)) throw new Error("Provide a full https:// URL");
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const html = await resp.text();
        // Strip tags for clean text
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 8000);
        return text;
      }
      case "fetch_rss": {
        const url = interpolate(node.config.url || "").trim();
        const limit = Math.max(1, Math.min(50, Number(node.config.limit) || 10));
        if (!/^https?:\/\//.test(url)) throw new Error("Provide a full RSS URL");
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const xml = await resp.text();
        const items = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, limit);
        const parsed = items.map((m) => {
          const block = m[1];
          const get = (tag) => {
            const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
            return r ? r[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim() : "";
          };
          return { title: get("title"), link: get("link"), pubDate: get("pubDate"), description: get("description").slice(0, 300) };
        });
        return `# RSS — ${parsed.length} items\n\n` + parsed.map((it, i) => `**${i + 1}. ${it.title}**\n${it.pubDate}\n${it.link}\n${it.description}`).join("\n\n---\n\n");
      }
      case "hacker_news": {
        const feed = node.config.feed || "top";
        const limit = Math.max(1, Math.min(30, Number(node.config.limit) || 10));
        const feedMap = { top: "topstories", new: "newstories", best: "beststories", ask: "askstories", show: "showstories" };
        const idsResp = await fetch(`https://hacker-news.firebaseio.com/v0/${feedMap[feed] || "topstories"}.json`);
        const ids = (await idsResp.json()).slice(0, limit);
        const stories = await Promise.all(ids.map((id) => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())));
        return `# Hacker News — ${feed} (${stories.length})\n\n` + stories.map((s, i) => `**${i + 1}. ${s.title}** _(${s.score} pts · ${s.descendants || 0} comments)_\n${s.url || `https://news.ycombinator.com/item?id=${s.id}`}`).join("\n\n");
      }
      case "reddit": {
        const sub = (node.config.subreddit || "kaspa").replace(/^r\//, "").trim();
        const sort = node.config.sort || "hot";
        const limit = Math.max(1, Math.min(50, Number(node.config.limit) || 10));
        const resp = await fetch(`https://www.reddit.com/r/${sub}/${sort}.json?limit=${limit}`);
        if (!resp.ok) throw new Error(`Reddit returned HTTP ${resp.status}`);
        const data = await resp.json();
        const posts = (data?.data?.children || []).map((c) => c.data);
        return `# r/${sub} — ${sort} (${posts.length})\n\n` + posts.map((p, i) => `**${i + 1}. ${p.title}** _(${p.score} ↑ · ${p.num_comments} 💬 · u/${p.author})_\nhttps://reddit.com${p.permalink}\n${(p.selftext || "").slice(0, 280)}`).join("\n\n---\n\n");
      }
      case "weather": {
        const city = (interpolate(node.config.city || "Austin")).trim();
        // Geocode (free, no key)
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then((r) => r.json());
        const loc = geo?.results?.[0];
        if (!loc) throw new Error(`Couldn't find city: ${city}`);
        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`).then((r) => r.json());
        const c = w.current || {};
        const d = w.daily || {};
        const codeText = (code) => ({ 0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Foggy", 51: "Drizzle", 61: "Rain", 71: "Snow", 80: "Showers", 95: "Thunderstorm" })[code] || `Code ${code}`;
        const days = (d.time || []).map((day, i) => `- ${day}: ${Math.round(d.temperature_2m_min[i])}°-${Math.round(d.temperature_2m_max[i])}°F · ${codeText(d.weather_code[i])}`).join("\n");
        return `# Weather — ${loc.name}, ${loc.country}\n\n**Now:** ${Math.round(c.temperature_2m)}°F · ${codeText(c.weather_code)} · Humidity ${c.relative_humidity_2m}% · Wind ${Math.round(c.wind_speed_10m)} mph\n\n**Forecast:**\n${days}`;
      }
      case "crypto_price": {
        const coin = (node.config.coin || "kaspa").trim().toLowerCase();
        const currency = (node.config.currency || "usd").trim().toLowerCase();
        const resp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=${encodeURIComponent(currency)}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`);
        if (!resp.ok) throw new Error(`CoinGecko HTTP ${resp.status}`);
        const data = await resp.json();
        const d = data[coin];
        if (!d) throw new Error(`Coin not found: ${coin}`);
        const price = d[currency];
        const change = d[`${currency}_24h_change`];
        const mcap = d[`${currency}_market_cap`];
        const vol = d[`${currency}_24h_vol`];
        return `# ${coin.toUpperCase()} / ${currency.toUpperCase()}\n\n**Price:** ${price}\n**24h:** ${change?.toFixed(2)}%\n**Market Cap:** ${Math.round(mcap).toLocaleString()}\n**24h Volume:** ${Math.round(vol).toLocaleString()}`;
      }
      case "wikipedia": {
        const topic = (interpolate(node.config.topic || "")).trim();
        if (!topic) throw new Error("Topic is required");
        const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
        if (!resp.ok) throw new Error(`Wikipedia HTTP ${resp.status}`);
        const d = await resp.json();
        return `# ${d.title}\n\n${d.extract || "No summary available."}\n\n${d.content_urls?.desktop?.page || ""}`;
      }
      case "math_eval": {
        const expr = interpolate(node.config.expression || "").trim();
        if (!expr) throw new Error("Expression is required");

        // Fast path — pure math: digits, operators, parens, decimals, whitespace only.
        const isPureMath = /^[\d+\-*/().\s]+$/.test(expr);
        const evalSafe = (s) => {
          // eslint-disable-next-line no-new-func
          const r = Function(`"use strict"; return (${s})`)();
          if (typeof r !== "number" || !Number.isFinite(r)) {
            throw new Error("Math evaluation produced non-numeric result");
          }
          return r;
        };
        if (isPureMath) return evalSafe(expr);

        // Natural language path — let the LLM convert it to a safe arithmetic expression.
        // We pull in any prior output as context so phrases like "10% of {{result}}" work.
        const prevContext = stringify(getPrevOutput()).slice(0, 2000);
        const llmRes = await withRetry(() =>
          base44.integrations.Core.InvokeLLM({
            prompt: `Convert this natural-language math request into a single arithmetic expression I can evaluate in JavaScript. Only use digits, decimals, and the operators + - * / ( ). NO variables, NO functions, NO words.

Request: """${expr}"""

${prevContext ? `Previous step output (use any numbers from this if relevant):\n"""${prevContext}"""` : ""}

Also return the final numeric answer.`,
            response_json_schema: {
            type: "object",
            properties: {
              expression: { type: "string", description: "Pure arithmetic, e.g. (1500 * 0.15) + 200" },
              answer: { type: "number" },
              explanation: { type: "string" },
            },
            required: ["expression", "answer", "explanation"],
            },
          })
        );

        const cleanExpr = (llmRes?.expression || "").trim();
        // Validate the LLM output is safe before evaluating ourselves
        if (cleanExpr && /^[\d+\-*/().\s]+$/.test(cleanExpr)) {
          try {
            const verified = evalSafe(cleanExpr);
            return {
              answer: verified,
              expression: cleanExpr,
              from: expr,
              explanation: llmRes?.explanation || "",
            };
          } catch {
            // fall through to LLM's own answer
          }
        }
        // Trust the LLM's numeric answer if local eval failed
        if (typeof llmRes?.answer === "number" && Number.isFinite(llmRes.answer)) {
          return {
            answer: llmRes.answer,
            expression: cleanExpr || expr,
            from: expr,
            explanation: llmRes?.explanation || "",
          };
        }
        throw new Error(`Couldn't compute: "${expr}"`);
      }
      case "ai_image": {
        const prompt = interpolate(node.config.prompt || "");
        const res = await withRetry(() => base44.integrations.Core.GenerateImage({ prompt }));
        return res?.url || "";
      }
      case "k6ix_image": {
        const data = await callK6ix("generateK6ixImage", {
          prompt: interpolate(node.config.prompt || ""),
          existing_image_urls: parseLines(node.config.existing_image_urls),
        });
        return data?.url || data;
      }
      case "k6ix_video": {
        const data = await callK6ix("generateK6ixVideo", {
          prompt: interpolate(node.config.prompt || ""),
          duration: Number(node.config.duration || 6),
          aspect_ratio: node.config.aspect_ratio || "16:9",
        });
        return data?.url || data;
      }
      case "k6ix_llm": {
        const data = await callK6ix("invokeK6ixLLM", {
          prompt: interpolate(node.config.prompt || ""),
          add_context_from_internet: node.config.add_context_from_internet === true || node.config.add_context_from_internet === "yes",
          response_json_schema: parseJson(node.config.response_json_schema),
          file_urls: parseLines(node.config.file_urls),
          model: node.config.model || "automatic",
        });
        return data?.response ?? data;
      }
      case "k6ix_scrape": {
        return await callK6ix("scrapeK6ixWebsite", {
          url: interpolate(node.config.url || "").trim(),
        });
      }
      case "ultramock_mp4": {
        // Find most recent image URL from prior steps to use as device screen content
        const idx = nodeList.findIndex((n) => n.id === node.id);
        let mediaUrl = "";
        for (let i = idx - 1; i >= 0; i--) {
          const prev = nodeList[i];
          const out = context[prev.id];
          if (out === undefined || out === null) continue;
          if ((prev.type === "ai_image" || prev.type === "k6ix_image" || prev.type === "k6ix_video") && typeof out === "string" && /^https?:\/\//.test(out)) {
            mediaUrl = out;
            break;
          }
          if (typeof out === "string" && /^https?:\/\/[^\s"']+\.(png|jpg|jpeg|gif|webp)/i.test(out)) {
            mediaUrl = out.match(/https?:\/\/[^\s"']+\.(?:png|jpg|jpeg|gif|webp)/i)[0];
            break;
          }
        }

        const tagline = interpolate(node.config.tagline || "").trim();
        const device = node.config.device || "iphone";
        const background = node.config.background || "sunset";
        const preset = node.config.preset || "spinSlow";
        const duration = Math.max(1, Math.min(30, Number(node.config.duration) || 4));
        const emailTo = (node.config.email_to || "").trim();

        // Skip popups during auto-run — only fire on explicit Run clicks
        if (isAutoRun) {
          return { skipped: "auto-run", tagline, device, preset, duration, mediaUrl };
        }

        // Build the UltraMock render URL (absolute so it works in emails)
        const params = new URLSearchParams({
          auto: "1",
          text: tagline,
          device,
          background,
          preset,
          duration: String(duration),
        });
        if (mediaUrl) params.set("media", mediaUrl);
        if (emailTo) params.set("email", emailTo);
        const renderPath = `/UltraMock?${params.toString()}`;
        const absoluteRenderUrl = `${window.location.origin}${renderPath}`;

        // ✅ RELIABLE EMAIL: Send the email IMMEDIATELY from NODA with the image attached
        // and a "Generate MP4" button. This way the user always gets an email — even if
        // they close the UltraMock tab. The MP4 is then generated on-demand when they
        // click the link in the email (which auto-runs UltraMock and emails the MP4 link).
        let emailSent = false;
        let emailError = null;
        if (emailTo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo)) {
          try {
            const subject = tagline ? `Your NODA video: ${tagline.slice(0, 60)}` : "Your NODA video is ready to render";
            const imageBlock = mediaUrl
              ? `<div style="text-align:center;margin:16px 0;"><img src="${mediaUrl}" alt="" style="max-width:100%;border-radius:12px;" /></div>`
              : "";
            const taglineBlock = tagline
              ? `<p style="font-size:18px;font-weight:bold;text-align:center;margin:16px 0;color:#111;">${tagline}</p>`
              : "";
            const body = `<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;">
${taglineBlock}
${imageBlock}
<div style="text-align:center;margin:28px 0;">
  <a href="${absoluteRenderUrl}" style="background:#06b6d4;color:#000;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block;font-size:15px;">🎬 Generate & Download MP4</a>
</div>
<p style="font-size:13px;color:#555;text-align:center;line-height:1.5;">Click the button above to open UltraMock and auto-generate your <strong>${duration}s ${preset}</strong> animation. The MP4 will download automatically and a copy of the link will be emailed back to you.</p>
<p style="font-size:11px;color:#999;text-align:center;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">Sent by NODA · UltraMock</p>
</div>`;
            await base44.integrations.Core.SendEmail({
              to: emailTo,
              from_name: "NODA · UltraMock",
              subject,
              body,
            });
            emailSent = true;
            console.log("[NODA] ✅ UltraMock email sent to", emailTo);
          } catch (e) {
            emailError = e.message || "send failed";
            console.error("[NODA] UltraMock email failed:", e);
          }
        }

        // Also open the render tab so the MP4 starts downloading right away
        try { window.open(renderPath, "_blank", "noopener,noreferrer"); } catch {}

        return {
          opened: true,
          render_url: absoluteRenderUrl,
          tagline,
          device,
          background,
          preset,
          duration,
          media: mediaUrl || null,
          email_to: emailTo || null,
          email_sent: emailSent,
          email_error: emailError,
          note: emailSent
            ? `✅ Email sent to ${emailTo} with image + MP4 generation link. UltraMock also opened to render the MP4 now.`
            : emailTo
            ? `⚠️ Email failed (${emailError}). UltraMock opened to render the MP4.`
            : "UltraMock opened in a new tab — it will auto-build and download the MP4.",
        };
      }
      case "deep_research": {
        const topic = interpolate(node.config.topic || "").trim();
        const depth = (node.config.depth || "deep").toLowerCase();
        if (!topic) throw new Error("Research topic is required");
        // Phase 1 — discovery: ask the model (with internet) for sources, key questions, and angles
        const discovery = await withRetry(() =>
          base44.integrations.Core.InvokeLLM({
            prompt: `You are a deep research agent. Topic: """${topic}"""

Search the web RIGHT NOW for current information. Return:
- 8-12 distinct authoritative sources (URLs + 1-line summary each)
- 6-8 key questions a thorough investigator should answer about this topic
- 3-4 distinct angles / sub-topics to dig into

Be thorough. Use real, current web data — not training data.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                sources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { url: { type: "string" }, title: { type: "string" }, summary: { type: "string" } },
                    required: ["url", "title", "summary"],
                  },
                },
                key_questions: { type: "array", items: { type: "string" } },
                angles: { type: "array", items: { type: "string" } },
              },
              required: ["sources", "key_questions", "angles"],
            },
            model: "gemini_3_flash",
          })
        );

        // Phase 2 — synthesis: deep dive answering each question with web context
        const questions = (discovery?.key_questions || []).slice(0, depth === "shallow" ? 3 : 8);
        const synthesis = await withRetry(() =>
          base44.integrations.Core.InvokeLLM({
            prompt: `You are completing a deep research report on: """${topic}"""

Already-found sources:
${(discovery?.sources || []).map((s, i) => `${i + 1}. ${s.title || s.url} — ${s.url}\n   ${s.summary || ""}`).join("\n")}

Key questions to answer (use live web search for each):
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Angles to cover:
${(discovery?.angles || []).map((a) => `- ${a}`).join("\n")}

Write a comprehensive research report (markdown). Structure:
# ${topic}
## Executive Summary  (3-5 bullet key findings)
## Detailed Findings  (one section per key question, with concrete facts, numbers, dates, names)
## Different Perspectives  (cover the angles)
## Sources  (numbered list of URLs you actually used)

Be specific. Cite numbers, dates, names, quotes. No filler. No "as an AI". Use real current data.`,
            add_context_from_internet: true,
            model: "gemini_3_flash",
          })
        );

        return typeof synthesis === "string" ? synthesis : JSON.stringify(synthesis);
      }
      case "read_ttt_feed": {
        const limit = Math.max(1, Math.min(100, Number(node.config.limit) || 20));
        const keyword = (node.config.keyword || "").trim().toLowerCase();
        const posts = await base44.entities.Post.list("-created_date", limit * 2);
        const filtered = keyword
          ? posts.filter((p) => (p.content || "").toLowerCase().includes(keyword))
          : posts;
        const top = filtered.slice(0, limit);
        if (top.length === 0) return "No TTT posts found.";
        // Format as readable markdown so downstream AI steps can reason over it
        const formatted = top
          .map((p, i) => {
            const date = p.created_date ? new Date(p.created_date).toISOString().split("T")[0] : "";
            const author = p.author_name || "anon";
            const stamp = p.is_stamped ? " ✓" : "";
            const tips = p.tips_received ? ` · ${p.tips_received} KAS tipped` : "";
            const content = (p.content || "").trim().slice(0, 600);
            return `**${i + 1}. @${author}${stamp}** _(${date}${tips})_\n${content}`;
          })
          .join("\n\n---\n\n");
        return `# TTT Feed — ${top.length} recent post${top.length === 1 ? "" : "s"}${keyword ? ` matching "${keyword}"` : ""}\n\n${formatted}`;
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
        const idx = nodeList.findIndex((n) => n.id === node.id);
        const imageUrls = [];
        for (let i = 0; i < idx; i++) {
          const prev = nodeList[i];
          const out = context[prev.id];
          if ((prev.type === "ai_image" || prev.type === "k6ix_image" || prev.type === "k6ix_video") && typeof out === "string" && /^https?:\/\//.test(out)) {
            imageUrls.push(out);
          }
        }

        const rawBody = node.config.body || "";
        const hasResultToken = /\{\{\s*result\s*\}\}/i.test(rawBody);
        let body = interpolate(rawBody);
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

        // Only append images if the body did NOT use {{result}} — otherwise images are already embedded
        // via the {{result}} expansion (which includes all prior outputs including image URLs).
        if (!hasResultToken && imageUrls.length) {
          htmlBody += imageUrls
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
      case "post_to_ttt": {
        // Collect ALL images from prior steps: typed image nodes AND any image
        // URLs embedded inside text outputs (research, LLM, scrape, fetch...).
        const idx = nodeList.findIndex((n) => n.id === node.id);
        let textPart = "";
        const imageUrls = [];
        const imgRe = /https?:\/\/[^\s"'<>)]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s"'<>)]*)?/gi;
        for (let i = idx - 1; i >= 0; i--) {
          const prev = nodeList[i];
          const out = context[prev.id];
          if (out === undefined || out === null) continue;
          if ((prev.type === "ai_image" || prev.type === "k6ix_image" || prev.type === "k6ix_video") && typeof out === "string" && /^https?:\/\//.test(out)) {
            if (!imageUrls.includes(out)) imageUrls.push(out);
            continue;
          }
          const str = stringify(out);
          const found = str.match(imgRe);
          if (found) found.forEach((u) => { if (!imageUrls.includes(u)) imageUrls.push(u); });
          if (!textPart) textPart = str.trim();
        }

        // Explicit image_url config always wins (supports {{result}})
        const overrideImage = interpolate(node.config.image_url || "").trim();
        if (overrideImage && /^https?:\/\//.test(overrideImage) && !imageUrls.includes(overrideImage)) {
          imageUrls.unshift(overrideImage);
        }

        const overrideText = interpolate(node.config.content_override || "").trim();
        const content = (overrideText || textPart || "").trim();
        if (!content && imageUrls.length === 0) throw new Error("No content to post — add an AI Prompt or AI Image step before this");

        // Anonymous posting — no wallet, no role, no identifiable info.
        // Author name override is allowed but defaults to a generic anon label.
        const overrideName = (node.config.author_name || "").trim();
        const authorName = overrideName || "Anonymous";

        const payload = {
          content: content || "📸",
          author_name: authorName,
          author_role: "user",
        };
        if (imageUrls.length) {
          payload.image_url = imageUrls[0];
          payload.media_files = imageUrls.slice(0, 4).map((u, i2) => ({ url: u, type: "image/png", name: `noda-image-${i2 + 1}.png`, size: 0 }));
        }

        const created = await base44.entities.Post.create(payload);
        return {
          posted: true,
          post_id: created?.id,
          author: authorName,
          anonymous: true,
          has_image: imageUrls.length > 0,
          images_attached: imageUrls.length,
          chars: content.length,
        };
      }
      case "send_to_x": {
        // Find most recent TEXT output AND most recent IMAGE URL from prior steps.
        const idx = nodeList.findIndex((n) => n.id === node.id);
        let textPart = "";
        let imageUrl = "";
        for (let i = idx - 1; i >= 0; i--) {
          const prev = nodeList[i];
          const out = context[prev.id];
          if (out === undefined || out === null) continue;
          if ((prev.type === "ai_image" || prev.type === "k6ix_image" || prev.type === "k6ix_video") && typeof out === "string" && /^https?:\/\//.test(out)) {
            if (!imageUrl) imageUrl = out;
            continue;
          }
          if (!textPart) textPart = stringify(out).trim();
        }
        const fullText = textPart || stringify(getPrevOutput()).trim();
        // X limits tweets to 280 chars
        const tweetText = fullText.length > 275
          ? fullText.slice(0, 272).trimEnd() + "…"
          : fullText;
        // Skip opening X during auto-run — only fire on explicit Run clicks
        if (isAutoRun) {
          return { skipped: "auto-run", chars: tweetText.length };
        }
        // Try to fetch the image as a Blob so the user can paste it into the X composer
        // (X intent URL doesn't support image params — clipboard is the reliable path).
        let imageCopied = false;
        if (imageUrl && navigator.clipboard && window.ClipboardItem) {
          try {
            const resp = await fetch(imageUrl);
            const blob = await resp.blob();
            // Clipboard API needs PNG — convert if needed
            let finalBlob = blob;
            if (blob.type !== "image/png") {
              const bitmap = await createImageBitmap(blob);
              const canvas = document.createElement("canvas");
              canvas.width = bitmap.width;
              canvas.height = bitmap.height;
              canvas.getContext("2d").drawImage(bitmap, 0, 0);
              finalBlob = await new Promise((r) => canvas.toBlob(r, "image/png"));
            }
            await navigator.clipboard.write([new ClipboardItem({ "image/png": finalBlob })]);
            imageCopied = true;
          } catch (e) {
            // image clipboard failed — fall back to copying text
          }
        }
        // If we couldn't put the image on the clipboard, copy the text instead
        if (!imageCopied) {
          try { await navigator.clipboard.writeText(fullText); } catch {}
        }
        const intent = `https://x.com/intent/post?text=${encodeURIComponent(tweetText)}`;
        let popup = null;
        try {
          popup = window.open(intent, "_blank", "noopener,noreferrer");
        } catch {}
        const popupBlocked = !popup || popup.closed || typeof popup.closed === "undefined";
        if (popupBlocked || imageUrl) {
          // Always show the modal when we have an image — user needs to paste it
          setXPostModal({ text: tweetText, intent, fullText, imageUrl, imageCopied });
        }
        return {
          opened: !popupBlocked,
          fallback_modal: popupBlocked || !!imageUrl,
          copied: !imageCopied,
          image_copied: imageCopied,
          image_url: imageUrl || null,
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
          <Link to={createPageUrl("NODA")} className="flex items-center gap-2 min-w-0 hover:opacity-90 transition-opacity" title="NODA home">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/40 overflow-hidden">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent" />
              <Zap className="relative w-4 h-4 text-white drop-shadow" />
            </div>
            <span className="text-white font-black text-base tracking-tight">NODA</span>
          </Link>
          <span className="text-white/30">/</span>
          <input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-transparent text-white font-bold text-sm outline-none border-b border-transparent focus:border-cyan-400 min-w-0 flex-shrink"
          />
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded-full text-cyan-300 text-[9px] font-bold tracking-widest uppercase">
            <Sparkles className="w-2.5 h-2.5" /> Node Workflow
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="password"
            value={k6ixApiKey}
            onChange={(e) => updateK6ixApiKey(e.target.value)}
            placeholder="K6ix API key"
            className="hidden xl:block w-36 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-cyan-400"
            title="K6ix API key"
          />
          <button
            data-agent-id="brain"
            aria-label="Brain"
            onClick={() => setBrainOpen(true)}
            className="flex items-center justify-center w-9 h-9 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 hover:from-fuchsia-500/30 hover:to-cyan-500/30 border border-fuchsia-500/40 rounded-lg text-fuchsia-100 shadow-lg shadow-fuchsia-500/10"
            title="Brain — describe what you want, AI builds the workflow"
          >
            <Brain className="w-4 h-4" />
          </button>
          <button
            aria-label="Example"
            onClick={loadExample}
            className="flex items-center justify-center w-9 h-9 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-purple-200"
            title="Load example: Daily Kaspa email briefing"
          >
            <Wand2 className="w-4 h-4" />
          </button>
          <button
            aria-label="Add node"
            onClick={() => setShowLibrary(true)}
            className="flex items-center justify-center w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white"
            title="Add node"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            aria-label="Save"
            onClick={() => setSaveOpen(true)}
            disabled={nodes.length === 0 || !currentUserEmail}
            className="flex items-center justify-center w-9 h-9 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-emerald-200"
            title="Save workflow so other apps can call it"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            aria-label="Hide layout"
            onClick={() => setLayoutHidden(true)}
            className="flex items-center justify-center w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white"
            title="Hide NODA layout"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            aria-label="Auto-run"
            onClick={() => {
              const next = !autoRun;
              setAutoRun(next);
              showToast(next ? "Auto-run ON — runs on changes" : "Auto-run OFF");
            }}
            className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
              autoRun
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 shadow-lg shadow-emerald-500/10"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            }`}
            title="Auto-run workflow on every change"
          >
            <Repeat className={`w-4 h-4 ${autoRun ? "animate-pulse" : ""}`} />
          </button>
          <button
            data-agent-id="run"
            aria-label="Run"
            onClick={runWorkflow}
            disabled={running || nodes.length === 0}
            className="flex items-center justify-center w-9 h-9 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white shadow-lg shadow-cyan-500/20"
            title={running ? "Running…" : "Run workflow"}
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Workflow tabs */}
      <div className={layoutHidden ? "hidden" : ""}>
        <NodaWorkflowTabs
          tabs={tabs.map((t) => ({ ...t, isRunning: !!t.running }))}
          activeTabId={activeTab?.id}
          onSelect={setActiveTabId}
          onNew={handleNewTab}
          onClose={handleCloseTab}
          onRename={handleRenameTab}
        />
      </div>

      {/* Workspace */}
      <div className={`relative z-10 flex-1 flex overflow-hidden ${layoutHidden ? "hidden" : ""}`}>
        <RMXInfiniteCanvas
          key={activeTab?.id}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelect={setSelectedNodeId}
          onDelete={deleteNode}
          onAdd={() => setShowLibrary(true)}
        />

        {/* Right config panel - resizable split screen (desktop) */}
        <AnimatePresence>
          {selectedNode && (
            <>
              {/* Drag handle — desktop only */}
              <div className="hidden lg:block">
                <SplitDivider onResize={setConfigPanelWidth} minWidth={280} maxWidth={720} />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-shrink-0 border-l border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden"
                style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? configPanelWidth : undefined }}
              >
                <div className="w-full sm:w-96 lg:w-full h-full overflow-y-auto">
                  <RMXNodeConfig
                    node={selectedNode}
                    onUpdate={(updates) => updateNode(selectedNode.id, updates)}
                    onClose={() => setSelectedNodeId(null)}
                    onDelete={() => deleteNode(selectedNode.id)}
                    onWorldToggle={setWorldOpen}
                  />
                </div>
              </motion.div>
            </>
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


      {/* Run logs panel — shows the active tab's logs */}
      <AnimatePresence>
        {showRunPanel && (
          <RMXRunPanel
            logs={runLogs}
            running={running}
            onClose={() => updateActiveTab(() => ({ showRunPanel: false }))}
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
                {xPostModal.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
                    <img src={xPostModal.imageUrl} alt="" className="w-full h-auto block" />
                  </div>
                )}
                <div className="px-3 py-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{xPostModal.text}</p>
                </div>
                {xPostModal.imageUrl ? (
                  <div className="px-3 py-2.5 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-100 text-xs leading-relaxed">
                    {xPostModal.imageCopied ? (
                      <>
                        <strong>Image copied to clipboard.</strong> Open X, then press <kbd className="px-1.5 py-0.5 bg-black/40 border border-white/20 rounded text-[10px] font-mono">Ctrl/Cmd+V</kbd> in the composer to attach it.
                      </>
                    ) : (
                      <>
                        Couldn't auto-copy the image. Right-click the preview above → <em>Copy image</em>, then paste in X.
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-white/50 text-xs">
                    Click below to open X compose with your post pre-filled.
                  </p>
                )}
                <a
                  href={xPostModal.intent}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setTimeout(() => setXPostModal(null), 200)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-black hover:bg-zinc-800 border border-white/20 text-white font-bold text-sm shadow-lg"
                >
                  <span className="font-black text-base">𝕏</span> Open X to Post
                </a>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try { await navigator.clipboard.writeText(xPostModal.fullText); } catch {}
                      showToast("Text copied — paste in X");
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold"
                  >
                    Copy text
                  </button>
                  {xPostModal.imageUrl && (
                    <button
                      onClick={async () => {
                        try {
                          const resp = await fetch(xPostModal.imageUrl);
                          const blob = await resp.blob();
                          let finalBlob = blob;
                          if (blob.type !== "image/png") {
                            const bitmap = await createImageBitmap(blob);
                            const canvas = document.createElement("canvas");
                            canvas.width = bitmap.width;
                            canvas.height = bitmap.height;
                            canvas.getContext("2d").drawImage(bitmap, 0, 0);
                            finalBlob = await new Promise((r) => canvas.toBlob(r, "image/png"));
                          }
                          await navigator.clipboard.write([new ClipboardItem({ "image/png": finalBlob })]);
                          showToast("Image copied — paste in X with Ctrl/Cmd+V");
                        } catch (e) {
                          showToast("Couldn't copy. Right-click the preview → Copy image", "error");
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-100 text-xs font-bold"
                    >
                      Copy image
                    </button>
                  )}
                </div>
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