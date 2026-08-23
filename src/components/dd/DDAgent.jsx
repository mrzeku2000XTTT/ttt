import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, Plug, CheckCircle2, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DD_CONNECTED, DD_ACTIVITY } from "@/components/dd/ddData";

const SYSTEM = `You are DD, an intelligent productivity agent inside a unified workspace. You have access to the user's connected tools: ${DD_CONNECTED.map((c) => c.name).join(", ")}. You help organize the day, summarize emails, find files, draft replies, and surface what matters. Be concise, warm, and action-oriented. Today the user has: a client call at 10am, a project review at 2pm, a design sync at 4:30pm, and 3 priorities (reply to Sarah, review Q2 presentation, prepare client call).`;

export default function DDAgent({ initialPrompt, active }) {
  const [messages, setMessages] = useState([{ role: "dd", text: "Hi Alex — I'm DD. What can I help you get done?" }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (initialPrompt) ask(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [messages, busy]);

  const ask = async (prompt) => {
    const text = (prompt ?? input).trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: `${SYSTEM}\n\nUser: ${text}`, model: "gemini_3_flash" });
      setMessages((m) => [...m, { role: "dd", text: typeof res === "string" ? res : res?.text || "Done." }]);
    } catch {
      setMessages((m) => [...m, { role: "dd", text: "I hit a snag right now — please try again." }]);
    }
    setBusy(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">DD Agent</h1>
      <p className="text-sm text-neutral-500 mt-1">Your intelligent workspace assistant.</p>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl flex flex-col h-[60vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-neutral-900 text-white rounded-tr-sm" : "bg-violet-50 text-neutral-800 rounded-tl-sm"}`}>{m.text}</div>
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-sm text-neutral-400"><Loader2 className="w-4 h-4 animate-spin" /> DD is thinking…</div>}
          </div>
          <div className="border-t border-neutral-200 p-3 flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} placeholder="What can I help you get done?" className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 h-10 text-sm outline-none focus:border-violet-300" />
            <button onClick={() => ask()} disabled={busy} className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Side panels */}
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-500" /> Recent actions</h3>
            <div className="space-y-2.5">{DD_ACTIVITY.map((a) => <div key={a.id} className="flex items-center gap-2 text-sm text-neutral-600"><span>{a.icon}</span> {a.text}</div>)}</div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2"><Plug className="w-4 h-4 text-violet-500" /> Connected tools</h3>
            <div className="space-y-2">{DD_CONNECTED.map((c) => <div key={c.id} className="flex items-center gap-2 text-sm"><span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${c.color}`}>{c.letter}</span> <span className="flex-1 text-neutral-700">{c.name}</span><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></div>)}</div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-violet-500" /> Pending approvals</h3>
            <p className="text-sm text-neutral-400">Nothing waiting on you. 🎉</p>
          </div>
        </div>
      </div>
    </div>
  );
}