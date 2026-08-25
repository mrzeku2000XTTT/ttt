import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Plug, Trash2, Unlink, ExternalLink, Search, FileText, Table, AtSign, Zap, Palette, ChevronDown, Infinity as InfinityIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DDLogo from "@/components/dd/DDLogo";
import DDLogoCustomizer from "@/components/dd/DDLogoCustomizer";
import DDSettings from "@/components/dd/DDSettings";
import DDCreditBar from "@/components/dd/DDCreditBar";
import { GOOGLE_LOGOS } from "@/components/dd/DDGoogleLogos";
import { getOnboarding } from "@/components/dd/DDOnboarding";

const HISTORY_KEY = "dd_chat_history_v1";

function loadHistory(email) {
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY}_${email || "guest"}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveHistory(email, msgs) {
  try {
    localStorage.setItem(`${HISTORY_KEY}_${email || "guest"}`, JSON.stringify(msgs));
  } catch {}
}

// Map app names to their connector type and capabilities
const TOOL_CAPABILITIES = {
  "Google Drive": { type: "googledrive", can: "list and open your Drive files" },
  "Google Docs": { type: "googledocs", can: "create and edit Google Docs — say 'create a doc' or 'write a document'" },
  "Google Sheets": { type: "googlesheets", can: "create Google Sheets — say 'create a sheet' or 'make a spreadsheet'" },
  "Google Calendar": { type: "googlecalendar", can: "view your upcoming calendar events" },
  "Gmail": { type: "gmail", can: "read your recent emails" },
  "ChatGPT": { type: "chatgpt", can: "research any topic with real web search — say 'research X'" },
};

// Real workspace connectors — used to check actual OAuth status
const DD_CONNECTORS = [
  { id: "6a8cde30137d405112693b7a", type: "googledrive", name: "Google Drive" },
  { id: "6a8cde51e37e03bca068b3b2", type: "googledocs", name: "Google Docs" },
  { id: "6a8cde30137d405112693b7a", type: "googlesheets", name: "Google Sheets" },
  { id: "6a8cde500c8f9518850896d0", type: "googlecalendar", name: "Google Calendar" },
  { id: "6a8cde4f5e2470cbe4b913d5", type: "gmail", name: "Gmail" },
];

function buildSystem(onboarding, email, googleContext, availableTools) {
  const o = onboarding || {};
  const name = o.name || "there";
  const style = o.style || "brief and direct";
  const toolsList = availableTools.length > 0
    ? `\n--- AVAILABLE TOOLS (connected and ready to use) ---\n${availableTools.map(t => `@${t} — ${TOOL_CAPABILITIES[t]?.can || "available"}`).join("\n")}\nWhen the user @-mentions a tool, they expect you to USE that tool. If they ask you to create something with a mentioned tool, do it. If a tool is listed above, it IS connected and working.\n--- END TOOLS ---`
    : "\nNo tools are currently connected. Tell the user to click Settings to connect Google.";
  const parts = [
    `You are DD, a personal productivity agent inside a unified workspace. You are brand new — tailored specifically for this user.`,
    `User name: ${name}.`,
    o.role ? `Role: ${o.role}.` : "",
    o.priorities ? `Current top priorities: ${o.priorities}.` : "",
    o.workHours ? `Working hours: ${o.workHours}.` : "",
    o.focus ? `Today's main focus: ${o.focus}.` : "",
    `Communication style: ${style}.`,
    toolsList,
    googleContext ? `\n--- REAL USER DATA (from connected Google apps) ---\n${googleContext}\n--- END REAL DATA ---` : "",
    `You help organize the user's day, summarize what matters, draft replies, and surface priorities. Be concise, warm, and action-oriented. Use the real data above when available. Do not invent or fabricate data — if you don't have info, say so.`,
  ].filter(Boolean);
  return parts.join(" ");
}

// Classify user intent to route to the right tool
async function classifyIntent(text, availableTools) {
  const toolsHint = availableTools.length > 0
    ? `\nCurrently connected tools: ${availableTools.join(", ")}`
    : "";
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Classify this user message into exactly one intent:\n- "research": wants to search, research, or look up something online (uses ChatGPT + web search)\n- "create_doc": wants to create or write a Google Doc document\n- "create_sheet": wants to create a Google Sheet or spreadsheet\n- "general": normal chat, questions, or productivity help${toolsHint}\n\nMessage: "${text}"\n\nRespond with ONLY the intent name and a short title if creating.`,
      response_json_schema: {
        type: "object",
        properties: {
          intent: { type: "string", enum: ["research", "create_doc", "create_sheet", "general"] },
          title: { type: "string", description: "A short title for the doc/sheet if creating, otherwise empty" },
        },
      },
    });
    return { intent: res?.intent || "general", title: res?.title || "" };
  } catch {
    return { intent: "general", title: "" };
  }
}

export default function DDAgent({ initialPrompt, nonce, active }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("guest");
  const [onboarding, setOnboarding] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [googleContext, setGoogleContext] = useState("");
  const [realConnected, setRealConnected] = useState([]);
  const [disconnecting, setDisconnecting] = useState(null);
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [agentName, setAgentName] = useState(() => { try { return localStorage.getItem("dd_agent_name") || "DD"; } catch { return "DD"; } });
  const [isAdmin, setIsAdmin] = useState(false);
  const [creditRefreshKey, setCreditRefreshKey] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const consumedNonceRef = useRef(-1);

  // Derive available tool names from connected apps; ChatGPT is always available (shared key)
  const availableTools = [...realConnected.map((c) => c.app_name), "ChatGPT"].filter((n) => TOOL_CAPABILITIES[n]);

  const filteredMentions = availableTools.filter((t) =>
    t.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const fetchGoogleContext = async () => {
    try {
      const types = ["googledrive", "googlecalendar", "gmail"];
      const results = await Promise.all(types.map((t) =>
        base44.functions.invoke("ddGoogleAction", { action: "fetch", connectorType: t }).catch(() => null)
      ));
      const parts = [];
      results.forEach((res, i) => {
        const t = types[i];
        if (!res?.data) return;
        if (t === "googledrive" && res.data.files?.length) {
          parts.push(`Recent Drive files: ${res.data.files.slice(0, 5).map(f => f.name).join(", ")}`);
        }
        if (t === "googlecalendar" && res.data.events?.length) {
          parts.push(`Upcoming events: ${res.data.events.slice(0, 5).map(e => `${e.summary} at ${e.start?.dateTime || e.start?.date}`).join("; ")}`);
        }
        if (t === "gmail" && res.data.messages?.length) {
          parts.push(`Recent emails: ${res.data.messages.slice(0, 5).map(m => m.subject).join(", ")}`);
        }
      });
      if (parts.length) setGoogleContext(parts.join("\n"));
    } catch {}
  };

  useEffect(() => {
    (async () => {
      let em = "guest";
      try {
        const u = await base44.auth.me();
        em = u?.email || "guest";
        setEmail(em);
        setIsAdmin(u?.role === "admin");
      } catch {}
      const ob = getOnboarding();
      setOnboarding(ob);
      const saved = loadHistory(em);
      if (saved && saved.length > 0) {
        setMessages(saved);
      } else {
        const name = ob?.name || "there";
        setMessages([{ role: "dd", text: `Hi ${name} — I'm ${agentName}, your workspace assistant. I can research with ChatGPT, create Google Docs & Sheets, and help organize your day. What can I do for you?` }]);
      }
      setLoaded(true);
      fetchGoogleContext();
      refreshConnected();
    })();
  }, []);

  useEffect(() => {
    if (loaded) saveHistory(email, messages);
  }, [messages, email, loaded]);

  // Only auto-ask when a NEW prompt arrives (tracked by nonce, not text)
  useEffect(() => {
    if (loaded && initialPrompt && nonce !== consumedNonceRef.current) {
      consumedNonceRef.current = nonce;
      ask(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, nonce, loaded]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [messages, busy]);

  const refreshConnected = async () => {
    const results = await Promise.all(DD_CONNECTORS.map((c) =>
      base44.functions.invoke("ddGoogleAction", { action: "status", connectorType: c.type, connectorId: c.id }).catch(() => null)
    ));
    const connected = [];
    results.forEach((res, i) => {
      if (res?.connected) connected.push({ app_name: DD_CONNECTORS[i].name, id: DD_CONNECTORS[i].type });
    });
    setRealConnected(connected);
  };

  const handleDisconnect = async (c) => {
    setDisconnecting(c.app_name);
    try {
      const connector = DD_CONNECTORS.find((x) => x.name === c.app_name);
      if (connector) {
        try { await base44.connectors.disconnectAppUser(connector.id); } catch {}
      }
      await refreshConnected();
    } catch {}
    setDisconnecting(null);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    // Detect @-mention: check if user just typed @ or is typing after @
    const atIdx = val.lastIndexOf("@");
    if (atIdx !== -1) {
      const afterAt = val.slice(atIdx + 1);
      // Only show mentions if @ was just typed (no spaces after @ yet, or filtering)
      if (!afterAt.includes(" ") && afterAt.length <= 20) {
        setShowMention(true);
        setMentionQuery(afterAt);
        setMentionIndex(0);
        return;
      }
    }
    setShowMention(false);
  };

  const insertMention = (toolName) => {
    const atIdx = input.lastIndexOf("@");
    if (atIdx !== -1) {
      const before = input.slice(0, atIdx);
      const after = input.slice(input.lastIndexOf("@") + 1 + mentionQuery.length);
      setInput(`${before}@${toolName} ${after}`);
    }
    setShowMention(false);
    setMentionQuery("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (showMention && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % filteredMentions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + filteredMentions.length) % filteredMentions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMentions[mentionIndex]);
        return;
      } else if (e.key === "Escape") {
        setShowMention(false);
        return;
      }
    }
    if (e.key === "Enter" && !showMention) ask();
  };

  // Render text with @-mentions highlighted — only highlight known tool names
  const renderText = (text) => {
    if (!text) return text;
    const toolNames = Object.keys(TOOL_CAPABILITIES);
    if (toolNames.length === 0) return text;
    const sorted = [...toolNames].sort((a, b) => b.length - a);
    const pattern = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const regex = new RegExp(`@(${pattern})`, "g");
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      const toolName = match[1];
      const isAvailable = availableTools.some((t) => t.toLowerCase() === toolName.toLowerCase());
      parts.push(
        <span key={parts.length} className={`px-1.5 py-0.5 rounded-md font-medium ${isAvailable ? "bg-blue-500/25 text-blue-200" : "bg-white/15 text-white/60"}`}>
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  };

  const ask = async (prompt) => {
    const text = (prompt ?? input).trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);

    try {
      // Run the orchestrator — real agent loop with tool use
      const history = messages.slice(-8).map((m) => ({ role: m.role, text: m.text }));
      const res = await base44.functions.invoke("ddOrchestrator", {
        message: text,
        history,
        onboarding,
        model: "gemini_3_flash",
        agentName,
      });

      const data = res?.data || res;
      const answer = data?.answer || "I couldn't complete that.";
      const steps = data?.steps || [];
      const credits = data?.credits || 0;
      const kaspa = data?.kaspa_cost || 0;
      const kkdagCost = data?.kkdag_cost || credits;

      // Build links from step results (e.g., created docs/sheets)
      const links = [];
      for (const s of steps) {
        if (s.result_preview?.includes("http")) {
          const match = s.result_preview.match(/https?:\/\/[^\s]+/);
          if (match) links.push({ label: s.tool === "create_doc" ? "Open Google Doc" : s.tool === "create_sheet" ? "Open Google Sheet" : "Open", url: match[0] });
        }
      }

      setMessages((m) => [...m, {
        role: "dd",
        text: answer,
        steps: steps.map((s) => ({ tool: s.tool, preview: (s.result_preview || "").slice(0, 120) })),
        credits,
        kaspa,
        kkdag: kkdagCost,
        links,
      }]);
      setCreditRefreshKey((k) => k + 1);
    } catch (e) {
      setMessages((m) => [...m, { role: "dd", text: "I hit a snag right now — please try again." }]);
    }
    setBusy(false);
  };

  const clearHistory = () => {
    const name = onboarding?.name || "there";
    const fresh = [{ role: "dd", text: `Hi ${name} — fresh start. What can I help you with?` }];
    setMessages(fresh);
    saveHistory(email, fresh);
  };

  if (!loaded) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="h-[60vh] bg-white border border-neutral-200 rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-3 sm:px-6 py-3 sm:py-4 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight truncate">{agentName} Agent</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 truncate">Research with ChatGPT, create Google Docs & Sheets, organize your day.</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {messages.length > 1 && (
            <button onClick={clearHistory} className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 px-2 sm:px-3 h-9 rounded-lg hover:bg-neutral-100">
              <Trash2 className="w-4 h-4" /><span className="hidden sm:inline">Clear</span>
            </button>
          )}
          <DDCreditBar refreshKey={creditRefreshKey} />
          <DDSettings onConnectionChange={refreshConnected} />
        </div>
      </div>

      {/* Hideable face customizer (top) */}
      <div className="mt-3">
        <button
          onClick={() => setShowCustomizer(!showCustomizer)}
          className="w-full flex items-center justify-between px-3 h-10 rounded-xl bg-white border border-neutral-200 hover:border-neutral-300 text-sm text-neutral-700"
        >
          <span className="flex items-center gap-2 font-medium"><Palette className="w-4 h-4 text-neutral-600" /> Customize {agentName} face</span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showCustomizer ? "rotate-180" : ""}`} />
        </button>
        {showCustomizer && (
          <div className="mt-2"><DDLogoCustomizer /></div>
        )}
      </div>

      <div className="flex-1 min-h-0 mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat — mobile-native full-height column */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl flex flex-col min-h-0 h-full">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "dd" && (
                  <div className="shrink-0 mt-0.5">
                    <DDLogo size={28} showWord={false} animate={false} />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-neutral-900 text-white rounded-tr-sm" : "bg-neutral-100 text-neutral-800 rounded-tl-sm"}`}>
                  {m.badge && (
                    <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-medium text-neutral-500">
                      {m.badge.includes("ChatGPT") ? <Search className="w-3 h-3" /> : m.badge.includes("Docs") ? <FileText className="w-3 h-3" /> : <Table className="w-3 h-3" />}
                      {m.badge}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{m.role === "user" ? renderText(m.text) : m.text}</div>
                  {m.steps && m.steps.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-neutral-200/60 space-y-1">
                      <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wide">Agent steps</p>
                      {m.steps.map((s, j) => (
                        <div key={j} className="text-[11px] text-neutral-500 flex items-start gap-1.5">
                          <span className="text-neutral-400 mt-0.5">→</span>
                          <span><span className="font-medium text-neutral-700">{s.tool}</span>{s.preview ? `: ${s.preview}` : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(m.credits || m.kaspa) && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 text-amber-500" />
                        {isAdmin ? <InfinityIcon className="w-3 h-3 text-violet-500" /> : <>{m.credits.toFixed(1)} credits</>}
                      </span>
                      <span>·</span>
                      <span>≈ {m.kkdag?.toFixed(0) || m.credits.toFixed(0)} KKDAG</span>
                      <span>·</span>
                      <span>{m.kaspa.toFixed(4)} KAS</span>
                    </div>
                  )}
                  {m.links && m.links.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {m.links.map((l, j) => (
                        <a key={j} href={l.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                          <ExternalLink className="w-3 h-3" /> {l.label || l.url}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2">
                <DDLogo size={28} showWord={false} animate={false} />
                <div className="flex items-center gap-2 text-sm text-neutral-400"><Loader2 className="w-4 h-4 animate-spin" /> {agentName} is working on it…</div>
              </div>
            )}
          </div>
          <div className="border-t border-neutral-200 p-3">
            {availableTools.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1"><AtSign className="w-3 h-3" /> Mention:</span>
                {availableTools.map((t) => {
                  const key = t.toLowerCase().replace(/\s/g, "");
                  const Logo = GOOGLE_LOGOS[key];
                  return (
                    <button key={t} onClick={() => insertMention(t)} className="flex items-center gap-1 px-2 h-6 rounded-full bg-neutral-50 border border-neutral-200 hover:border-neutral-300 text-[11px] text-neutral-600">
                      {Logo && <Logo className="w-3 h-3" />}
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-2 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${agentName} anything… type @ to mention`}
                className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 h-10 text-sm outline-none focus:border-neutral-400"
              />
              <button onClick={() => ask()} disabled={busy} className="w-10 h-10 flex-shrink-0 rounded-xl bg-neutral-900 text-white flex items-center justify-center disabled:opacity-50"><Send className="w-4 h-4" /></button>
              {showMention && filteredMentions.length > 0 && (
                <div className="absolute bottom-full mb-1 left-0 right-12 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredMentions.map((t, i) => {
                    const key = t.toLowerCase().replace(/\s/g, "");
                    const Logo = GOOGLE_LOGOS[key];
                    return (
                      <button
                        key={t}
                        onClick={() => insertMention(t)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${i === mentionIndex ? "bg-neutral-100" : "hover:bg-neutral-50"}`}
                      >
                        {Logo && <Logo className="w-4 h-4" />}
                        <span className="flex-1 text-neutral-700">@{t}</span>
                        <span className="text-[10px] text-neutral-400">{TOOL_CAPABILITIES[t]?.can?.split("—")[0]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side panel — connected tools (hidden on mobile, customizer is at top) */}
        <div className="hidden lg:block space-y-4 min-h-0 overflow-y-auto">
          <div className="bg-white border border-neutral-200 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2"><Plug className="w-4 h-4 text-neutral-700" /> Connected tools</h3>
            {realConnected.length === 0 ? <p className="text-sm text-neutral-400">No apps connected yet. Click Settings to connect Google.</p> :
            <div className="space-y-2">{realConnected.map((c) => {
              const key = c.app_name?.toLowerCase().replace(/\s/g, "");
              const Logo = GOOGLE_LOGOS[key] || null;
              return <div key={c.id} className="flex items-center gap-2 text-sm">
                {Logo ? <Logo className="w-5 h-5 shrink-0" /> : <span className="w-5 h-5 rounded-md bg-neutral-100 shrink-0" />}
                <span className="flex-1 text-neutral-700 truncate">{c.app_name}</span>
                <button
                  onClick={() => handleDisconnect(c)}
                  disabled={disconnecting === c.app_name}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 px-2 h-7 rounded-lg hover:bg-red-50 disabled:opacity-40"
                  title="Disconnect"
                >
                  {disconnecting === c.app_name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                </button>
              </div>;
            })}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}