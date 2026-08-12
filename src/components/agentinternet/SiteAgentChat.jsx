import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SiteLogo from "./SiteLogo";
import AgentWalletBar from "./AgentWalletBar";

function hostOf(url) {
  try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; }
}

export default function SiteAgentChat({ app, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [fast, setFast] = useState(true);
  const endRef = useRef(null);
  const knowledgeRef = useRef(null);

  useEffect(() => { setMessages([]); setInput(""); knowledgeRef.current = null; }, [app?.id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const raw = await base44.functions.invoke("siteAgentChat", {
        url: app.url,
        name: app.name,
        description: app.description,
        category: app.category,
        messages: next,
        knowledge: knowledgeRef.current,
        fast,
      });
      const res = raw?.data ?? raw;
      if (res?.knowledge) knowledgeRef.current = res.knowledge;
      setMessages([...next, { role: "assistant", content: res?.answer || "I couldn't read that site right now." }]);
    } catch (err) {
      setMessages([...next, { role: "assistant", content: "Something went wrong reaching that site." }]);
    } finally {
      setBusy(false);
    }
  };

  const suggestions = ["What is this site?", "How do I use it?", "Is it safe?"];

  return (
    <AnimatePresence>
      {app && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 260 }}
          className="fixed top-0 right-0 bottom-0 z-[220] w-full sm:w-[420px] bg-[#050505] border-l border-white/10 flex flex-col"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
            <SiteLogo app={app} size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{app.name} agent</p>
              <p className="text-[11px] text-emerald-400/70 font-mono truncate">{hostOf(app.url)}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          <AgentWalletBar />

          <div className="flex items-center gap-2 px-4 py-1.5 border-b border-white/5">
            <button
              onClick={() => setFast(f => !f)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 transition-colors ${
                fast
                  ? "bg-cyan-500/20 border border-cyan-400/40 text-cyan-200"
                  : "bg-white/[0.05] border border-white/10 text-white/50 hover:text-white"
              }`}
            >
              <Zap className="w-3 h-3" /> {fast ? "Quick replies on" : "Quick replies off"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-white/50 text-[13px] leading-relaxed">
                  Ask anything about <span className="text-white">{app.name}</span> — I read its site, docs and FAQ.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] text-white/60 hover:text-white hover:bg-white/10"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-cyan-500/15 border border-cyan-400/30 text-cyan-50"
                    : "bg-white/[0.05] border border-white/10 text-white/80"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 text-white/40 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> Reading the site…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="p-3 border-t border-white/10 flex items-center gap-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask about ${app.name}…`}
              className="flex-1 h-11 px-4 rounded-full bg-white/[0.06] border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 min-w-0"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="w-11 h-11 flex-shrink-0 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}