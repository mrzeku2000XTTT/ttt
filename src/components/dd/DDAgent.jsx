import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Plug, Trash2, Unlink, ExternalLink, Search, FileText, Table } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DDLogo from "@/components/dd/DDLogo";
import DDLogoCustomizer from "@/components/dd/DDLogoCustomizer";
import DDSettings from "@/components/dd/DDSettings";
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

function buildSystem(onboarding, email, googleContext) {
  const o = onboarding || {};
  const name = o.name || "there";
  const style = o.style || "brief and direct";
  const parts = [
    `You are DD, a personal productivity agent inside a unified workspace. You are brand new — tailored specifically for this user.`,
    `User name: ${name}.`,
    o.role ? `Role: ${o.role}.` : "",
    o.priorities ? `Current top priorities: ${o.priorities}.` : "",
    o.workHours ? `Working hours: ${o.workHours}.` : "",
    o.focus ? `Today's main focus: ${o.focus}.` : "",
    `Communication style: ${style}.`,
    googleContext ? `\n--- REAL USER DATA (from connected Google apps) ---\n${googleContext}\n--- END REAL DATA ---` : "",
    `You help organize the user's day, summarize what matters, draft replies, and surface priorities. Be concise, warm, and action-oriented. Use the real data above when available. Do not invent or fabricate data — if you don't have info, say so.`,
  ].filter(Boolean);
  return parts.join(" ");
}

// Classify user intent to route to the right tool
async function classifyIntent(text) {
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Classify this user message into exactly one intent:\n- "research": wants to search, research, or look up something online\n- "create_doc": wants to create or write a Google Doc document\n- "create_sheet": wants to create a Google Sheet or spreadsheet\n- "general": normal chat, questions, or productivity help\n\nMessage: "${text}"\n\nRespond with ONLY the intent name.`,
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
  const scrollRef = useRef(null);
  const consumedNonceRef = useRef(-1);

  const fetchGoogleContext = async () => {
    try {
      const types = ["googledrive", "googlecalendar", "gmail"];
      const parts = [];
      for (const t of types) {
        try {
          const res = await base44.functions.invoke("ddGoogleAction", { action: "fetch", connectorType: t });
          if (res?.data) {
            if (t === "googledrive" && res.data.files?.length) {
              parts.push(`Recent Drive files: ${res.data.files.slice(0, 5).map(f => f.name).join(", ")}`);
            }
            if (t === "googlecalendar" && res.data.events?.length) {
              parts.push(`Upcoming events: ${res.data.events.slice(0, 5).map(e => `${e.summary} at ${e.start?.dateTime || e.start?.date}`).join("; ")}`);
            }
            if (t === "gmail" && res.data.messages?.length) {
              parts.push(`Recent emails: ${res.data.messages.slice(0, 5).map(m => m.subject).join(", ")}`);
            }
          }
        } catch {}
      }
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
      } catch {}
      const ob = getOnboarding();
      setOnboarding(ob);
      const saved = loadHistory(em);
      if (saved && saved.length > 0) {
        setMessages(saved);
      } else {
        const name = ob?.name || "there";
        setMessages([{ role: "dd", text: `Hi ${name} — I'm DD, your workspace assistant. I can research with ChatGPT, create Google Docs & Sheets, and help organize your day. What can I do for you?` }]);
      }
      setLoaded(true);
      fetchGoogleContext();
      try {
        const apps = await base44.entities.DDConnectedApp.filter({ user_email: em }, "-created_date", 10).catch(() => []);
        setRealConnected(apps);
      } catch {}
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
    try {
      const apps = await base44.entities.DDConnectedApp.filter({ user_email: email }, "-created_date", 10).catch(() => []);
      setRealConnected(apps);
    } catch {}
  };

  const handleDisconnect = async (c) => {
    setDisconnecting(c.app_name);
    try {
      // Find the connector type for this app
      const typeMap = {
        "Google Drive": "googledrive",
        "Google Docs": "googledocs",
        "Google Sheets": "googlesheets",
        "Google Calendar": "googlecalendar",
        "Gmail": "gmail",
      };
      const type = typeMap[c.app_name];
      const idMap = {
        googledrive: "6a8cde30137d405112693b7a",
        googledocs: "6a8cde51e37e03bca068b3b2",
        googlesheets: "6a8cde30137d405112693b7a",
        googlecalendar: "6a8cde500c8f9518850896d0",
        gmail: "6a8cde4f5e2470cbe4b913d5",
      };
      const cId = idMap[type];
      if (cId) {
        try { await base44.connectors.disconnectAppUser(cId); } catch {}
      }
      await base44.entities.DDConnectedApp.delete(c.id);
      await refreshConnected();
    } catch {}
    setDisconnecting(null);
  };

  const ask = async (prompt) => {
    const text = (prompt ?? input).trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);

    try {
      // Step 1: Classify intent
      const { intent, title } = await classifyIntent(text);

      if (intent === "research") {
        // Use ChatGPT research subagent
        const res = await base44.functions.invoke("ddResearchAgent", { query: text });
        const answer = res?.data?.answer || "I couldn't complete the research.";
        const sources = res?.data?.sources || [];
        const links = sources.slice(0, 5).map((s) => ({ label: s.title || s.url, url: s.url }));
        setMessages((m) => [...m, {
          role: "dd",
          text: answer,
          links,
          badge: "Researched with ChatGPT",
        }]);
      } else if (intent === "create_doc") {
        // Create a real Google Doc
        const docTitle = title || text.slice(0, 50);
        const res = await base44.functions.invoke("ddGoogleAction", {
          action: "create", connectorType: "googledocs", createType: "doc", title: docTitle, content: "",
        });
        if (res?.data?.url) {
          setMessages((m) => [...m, {
            role: "dd",
            text: `I created a Google Doc titled "${res.data.title}" for you. Click below to open and edit it.`,
            links: [{ label: "Open Google Doc", url: res.data.url }],
            badge: "Created with Google Docs",
          }]);
        } else {
          setMessages((m) => [...m, { role: "dd", text: res?.data?.error || "I couldn't create the Doc. Make sure Google Docs is connected in Settings." }]);
        }
      } else if (intent === "create_sheet") {
        // Create a real Google Sheet
        const sheetTitle = title || text.slice(0, 50);
        const res = await base44.functions.invoke("ddGoogleAction", {
          action: "create", connectorType: "googlesheets", createType: "sheet", title: sheetTitle,
        });
        if (res?.data?.url) {
          setMessages((m) => [...m, {
            role: "dd",
            text: `I created a Google Sheet titled "${res.data.title}" for you. Click below to open and edit it.`,
            links: [{ label: "Open Google Sheet", url: res.data.url }],
            badge: "Created with Google Sheets",
          }]);
        } else {
          setMessages((m) => [...m, { role: "dd", text: res?.data?.error || "I couldn't create the Sheet. Make sure Google Drive is connected in Settings." }]);
        }
      } else {
        // General chat with InvokeLLM
        const sys = buildSystem(onboarding, email, googleContext);
        const history = messages.slice(-8).map((m) => `${m.role === "user" ? "User" : "DD"}: ${m.text}`).join("\n");
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `${sys}\n\nConversation so far:\n${history}\n\nUser: ${text}`,
          model: "gemini_3_flash",
        });
        setMessages((m) => [...m, { role: "dd", text: typeof res === "string" ? res : res?.text || "Done." }]);
      }
    } catch {
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">DD Agent</h1>
          <p className="text-sm text-neutral-500 mt-1">Research with ChatGPT, create Google Docs & Sheets, organize your day.</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button onClick={clearHistory} className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 px-3 h-9 rounded-lg hover:bg-neutral-100">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          )}
          <DDSettings onConnectionChange={refreshConnected} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl flex flex-col h-[60vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
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
                  <div className="whitespace-pre-wrap">{m.text}</div>
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
                <div className="flex items-center gap-2 text-sm text-neutral-400"><Loader2 className="w-4 h-4 animate-spin" /> DD is working on it…</div>
              </div>
            )}
          </div>
          <div className="border-t border-neutral-200 p-3 flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="Ask DD to research, create a doc, or anything…" className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 h-10 text-sm outline-none focus:border-neutral-400" />
            <button onClick={() => ask()} disabled={busy} className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-4">
          <DDLogoCustomizer />
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