import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SiteLogo from "./SiteLogo";

/**
 * Agent battle — ask one question to up to 3 site agents at once and compare
 * their answers side by side.
 */
export default function AgentBattleModal({ open, onClose, pool }) {
  const [picked, setPicked] = useState([]);
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState(null);
  const [running, setRunning] = useState(false);

  const toggle = (app) => {
    setPicked(prev => {
      const exists = prev.find(p => (p.id || p.url) === (app.id || app.url));
      if (exists) return prev.filter(p => (p.id || p.url) !== (app.id || app.url));
      return prev.length >= 3 ? prev : [...prev, app];
    });
  };

  const run = async () => {
    const q = question.trim();
    if (!q || picked.length === 0) return;
    setRunning(true);
    setAnswers(picked.map(p => ({ app: p, text: null })));
    const results = await Promise.all(
      picked.map(async (app) => {
        try {
          const raw = await base44.functions.invoke("siteAgentChat", {
            url: app.url,
            name: app.name,
            description: app.description,
            category: app.category,
            messages: [{ role: "user", content: q }],
          });
          const res = raw?.data ?? raw;
          return { app, text: res?.answer || "No answer." };
        } catch (e) {
          return { app, text: e?.message || "Agent failed to respond." };
        }
      })
    );
    setAnswers(results);
    setRunning(false);
  };

  const reset = () => { setPicked([]); setQuestion(""); setAnswers(null); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[310] bg-black/95 backdrop-blur-xl flex flex-col"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
            <button onClick={() => { reset(); onClose?.(); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
            <Swords className="w-4 h-4 text-fuchsia-400" />
            <span className="text-white font-bold text-sm">Agent Battle</span>
            <span className="text-white/30 text-[11px] font-mono ml-auto">{picked.length}/3 selected</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-4xl mx-auto">
              <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest mb-2">Pick up to 3 agents</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {(pool || []).slice(0, 40).map((app, i) => {
                  const on = picked.find(p => (p.id || p.url) === (app.id || app.url));
                  return (
                    <button
                      key={app.id || i}
                      onClick={() => toggle(app)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] transition-colors ${
                        on ? "bg-fuchsia-500/20 border-fuchsia-400/50 text-fuchsia-200" : "bg-white/[0.04] border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      <SiteLogo app={app} size={16} />
                      <span className="max-w-[140px] truncate">{app.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 mb-5">
                <input
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") run(); }}
                  placeholder="Ask all selected agents one question…"
                  className="flex-1 px-4 h-11 rounded-full bg-white/[0.06] border border-white/15 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-fuchsia-500/50"
                />
                <button
                  onClick={run}
                  disabled={running || !question.trim() || picked.length === 0}
                  className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 hover:bg-fuchsia-500/30 disabled:opacity-40 transition-colors"
                >
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>

              {answers && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {answers.map(({ app, text }, i) => (
                    <div key={app.id || i} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.06]">
                        <SiteLogo app={app} size={24} />
                        <span className="text-white text-[13px] font-medium truncate">{app.name}</span>
                      </div>
                      {text == null ? (
                        <div className="flex items-center gap-2 text-white/40 text-[11px]">
                          <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                        </div>
                      ) : (
                        <p className="text-white/70 text-[12px] leading-relaxed">{text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}