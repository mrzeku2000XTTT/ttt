import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Plug, CheckCircle2, Trash2 } from "lucide-react";
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

export default function DDAgent({ initialPrompt, active }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("guest");
  const [onboarding, setOnboarding] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [googleContext, setGoogleContext] = useState("");
  const [realConnected, setRealConnected] = useState([]);
  const [realActivity, setRealActivity] = useState([]);
  const scrollRef = useRef(null);

  const fetchGoogleContext = async (em) => {
    try {
      const res = await base44.functions.invoke("ddFetchGoogleContext", {});
      if (res?.data?.context) setGoogleContext(res.data.context);
    } catch { /* not connected — that's ok */ }
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
        setMessages([{ role: "dd", text: `Hi ${name} — I'm DD, your workspace assistant. Ask me anything and I'll help you get it done.` }]);
      }
      setLoaded(true);
      fetchGoogleContext(em);
      // Fetch real connected apps + activity from backend
      try {
        const [apps, acts] = await Promise.all([
          base44.entities.DDConnectedApp.filter({ user_email: em }, "-created_date", 6).catch(() => []),
          base44.entities.DDActivity.filter({ user_email: em }, "-created_date", 4).catch(() => []),
        ]);
        setRealConnected(apps);
        setRealActivity(acts);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (loaded) saveHistory(email, messages);
  }, [messages, email, loaded]);

  useEffect(() => {
    if (loaded && initialPrompt) ask(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt, loaded]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [messages, busy]);

  const ask = async (prompt) => {
    const text = (prompt ?? input).trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const sys = buildSystem(onboarding, email, googleContext);
      const history = messages.slice(-8).map((m) => `${m.role === "user" ? "User" : "DD"}: ${m.text}`).join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${sys}\n\nConversation so far:\n${history}\n\nUser: ${text}`,
        model: "gemini_3_flash",
      });
      setMessages((m) => [...m, { role: "dd", text: typeof res === "string" ? res : res?.text || "Done." }]);
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
          <p className="text-sm text-neutral-500 mt-1">Your intelligent workspace assistant.</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button onClick={clearHistory} className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 px-3 h-9 rounded-lg hover:bg-neutral-100">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          )}
          <DDSettings />
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
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-neutral-900 text-white rounded-tr-sm" : "bg-neutral-100 text-neutral-800 rounded-tl-sm"}`}>{m.text}</div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2">
                <DDLogo size={28} showWord={false} animate={false} />
                <div className="flex items-center gap-2 text-sm text-neutral-400"><Loader2 className="w-4 h-4 animate-spin" /> DD is thinking…</div>
              </div>
            )}
          </div>
          <div className="border-t border-neutral-200 p-3 flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="What can I help you get done?" className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 h-10 text-sm outline-none focus:border-neutral-400" />
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
              const Logo = GOOGLE_LOGOS[c.app_name?.toLowerCase().replace(/\s/g, "")] || null;
              return <div key={c.id} className="flex items-center gap-2 text-sm">
                {Logo ? <Logo className="w-5 h-5" /> : <span className="w-5 h-5 rounded-md bg-neutral-100" />}
                <span className="flex-1 text-neutral-700">{c.app_name}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>;
            })}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}