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
  const [xPostModal, setXPostModal] = useState(null); // { text, intent }

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

  const handleBrainBuild = (newNodes, name) => {
    // Brain always builds + runs into the CURRENTLY ACTIVE tab. Capture id NOW
    // so concurrent Brain calls from different tabs each target their own tab.
    const targetTabId = activeTab?.id;
    if (!targetTabId) return;

    // Cancel pending auto-run timer for THIS tab and skip the next auto cycle.
    if (autoRunTimersRef.current[targetTabId]) {
      clearTimeout(autoRunTimersRef.current[targetTabId]);
    }
    skipNextAutoRunRef.current[targetTabId] = true;

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
        } else {
          log(`✓ ${node.label} complete`, "success");
        }
      } catch (err) {
        log(`✗ ${node.label} failed: ${err.message}`, "error");
        allSucceeded = false;
        break;
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
                  },
                },
                key_questions: { type: "array", items: { type: "string" } },
                angles: { type: "array", items: { type: "string" } },
              },
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
          if (prev.type === "ai_image" && typeof out === "string" && /^https?:\/\//.test(out)) {
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
        // Walk back to find most recent text output AND most recent image URL
        const idx = nodeList.findIndex((n) => n.id === node.id);
        let textPart = "";
        let imageUrl = "";
        for (let i = idx - 1; i >= 0; i--) {
          const prev = nodeList[i];
          const out = context[prev.id];
          if (out === undefined || out === null) continue;
          if (prev.type === "ai_image" && typeof out === "string" && /^https?:\/\//.test(out)) {
            if (!imageUrl) imageUrl = out;
            continue;
          }
          if (!textPart) textPart = stringify(out).trim();
        }

        const overrideText = interpolate(node.config.content_override || "").trim();
        const content = (overrideText || textPart || "").trim();
        if (!content) throw new Error("No content to post — add an AI Prompt or text-producing step before this");

        // Anonymous posting — no wallet, no role, no identifiable info.
        // Author name override is allowed but defaults to a generic anon label.
        const overrideName = (node.config.author_name || "").trim();
        const authorName = overrideName || "Anonymous";

        const payload = {
          content,
          author_name: authorName,
          author_role: "user",
        };
        if (imageUrl) {
          payload.image_url = imageUrl;
          payload.media_files = [{ url: imageUrl, type: "image/png", name: "noda-generated.png", size: 0 }];
        }

        const created = await base44.entities.Post.create(payload);
        return {
          posted: true,
          post_id: created?.id,
          author: authorName,
          anonymous: true,
          has_image: !!imageUrl,
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
          if (prev.type === "ai_image" && typeof out === "string" && /^https?:\/\//.test(out)) {
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