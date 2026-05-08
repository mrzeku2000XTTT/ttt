import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2, Sparkles, Copy, Check, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

const AGENT_PERSONAS = [
  {
    id: "alpha",
    name: "Alpha",
    color: "from-cyan-400 to-blue-500",
    accent: "cyan",
    glow: "shadow-cyan-500/40",
    ring: "ring-cyan-400/50",
    persona: "You are Alpha — the analytical, structured, fact-driven agent. Output rigorous, well-organized, evidence-based content. Be precise, methodical, and thorough.",
  },
  {
    id: "beta",
    name: "Beta",
    color: "from-fuchsia-500 to-pink-500",
    accent: "fuchsia",
    glow: "shadow-fuchsia-500/40",
    ring: "ring-fuchsia-400/50",
    persona: "You are Beta — the creative, bold, imaginative agent. Output playful, unexpected, vivid, and emotionally resonant content. Take creative risks and surprise the user.",
  },
  {
    id: "gamma",
    name: "Gamma",
    color: "from-amber-400 to-orange-500",
    accent: "amber",
    glow: "shadow-amber-500/40",
    ring: "ring-amber-400/50",
    persona: "You are Gamma — the practical, action-oriented, results-driven agent. Output concise, actionable, real-world content. Focus on what works, what's executable, and what delivers value fast.",
  },
];

export default function TrinityPage() {
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([null, null, null]);
  const [errors, setErrors] = useState([null, null, null]);
  const [lastPrompt, setLastPrompt] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runTrinity = async () => {
    const prompt = input.trim();
    if (!prompt || running) return;
    setRunning(true);
    setLastPrompt(prompt);
    setResults([null, null, null]);
    setErrors([null, null, null]);

    const promises = AGENT_PERSONAS.map(async (agent, idx) => {
      try {
        const fullPrompt = `${agent.persona}\n\nUSER REQUEST:\n${prompt}\n\nYour response (stay in character, distinct from the other two agents):`;
        const res = await base44.integrations.Core.InvokeLLM({ prompt: fullPrompt });
        const text = typeof res === "string" ? res : res?.text || JSON.stringify(res);
        setResults((prev) => {
          const next = [...prev];
          next[idx] = text;
          return next;
        });
      } catch (e) {
        setErrors((prev) => {
          const next = [...prev];
          next[idx] = e.message || "Agent failed";
          return next;
        });
      }
    });

    await Promise.allSettled(promises);
    setRunning(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      runTrinity();
    }
  };

  const reset = () => {
    setInput("");
    setResults([null, null, null]);
    setErrors([null, null, null]);
    setLastPrompt("");
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0612] via-[#120821] to-[#0a0612] text-white">
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-5 bg-black/50 backdrop-blur-2xl border-b border-white/10"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex items-center justify-between w-full h-14 max-w-6xl mx-auto">
          <Link
            to="/AppStoreV2"
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors h-11 px-3 -ml-1 rounded-lg active:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[14px] font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <img
              src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3e8b286e0_generated_image.png"
              alt="Trinity"
              className="w-7 h-7 rounded-lg ring-1 ring-white/20"
            />
            <span className="text-[15px] font-[900] tracking-tight">TRINITY</span>
          </div>
          <button
            onClick={reset}
            disabled={running}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-white/60 hover:text-white h-10 px-3 rounded-full transition-colors disabled:opacity-30"
            title="Reset"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-fuchsia-300/80">
              Three Agents · One Prompt
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-[900] tracking-tight mb-3 bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
            Trinity
          </h1>
          <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto">
            Drop any request. Three distinct AI agents create three different results — in parallel. Pick your favorite, or remix all three.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 max-w-3xl mx-auto"
        >
          <div className="relative rounded-2xl bg-white/5 border border-white/15 backdrop-blur-xl shadow-2xl shadow-fuchsia-500/10 overflow-hidden">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g. Three taglines for a Kaspa wallet · Three logo concepts · Three plot ideas for a sci-fi short..."
              rows={3}
              disabled={running}
              style={{ fontSize: "16px" }}
              className="w-full px-5 py-4 bg-transparent text-white placeholder:text-white/30 outline-none resize-none disabled:opacity-50"
            />
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/10 bg-black/30">
              <div className="text-[10px] text-white/40">⏎ to send · Shift+⏎ newline</div>
              <button
                onClick={runTrinity}
                disabled={!input.trim() || running}
                className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-amber-400 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold text-xs shadow-lg shadow-fuchsia-500/30"
              >
                {running ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Thinking…
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Run Trinity
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AGENT_PERSONAS.map((agent, idx) => (
            <AgentResultCard
              key={agent.id}
              agent={agent}
              index={idx}
              result={results[idx]}
              error={errors[idx]}
              loading={running && !results[idx] && !errors[idx]}
              prompt={lastPrompt}
            />
          ))}
        </div>

        {!lastPrompt && !running && (
          <div className="mt-12 text-center">
            <div className="text-white/30 text-xs mb-3 font-bold tracking-widest uppercase">Try</div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                "Three names for a Kaspa-themed coffee shop",
                "Three short poems about decentralization",
                "Three startup ideas using AI agents",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentResultCard({ agent, index, result, error, loading, prompt }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.05 }}
      className={`relative rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl overflow-hidden ${
        result ? `ring-1 ${agent.ring} ${agent.glow} shadow-xl` : ""
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg ${agent.glow}`}>
            <span className="text-black font-black text-xs">{agent.name[0]}</span>
          </div>
          <div>
            <div className="text-white font-black text-sm leading-none">{agent.name}</div>
            <div className="text-[9px] text-white/40 font-bold tracking-widest uppercase mt-0.5">
              Agent #{index + 1}
            </div>
          </div>
        </div>
        {result && (
          <button
            onClick={copy}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
            title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <div className="p-4 min-h-[200px]">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-40 gap-2"
            >
              <Loader2 className="w-5 h-5 animate-spin text-white/60" />
              <div className="text-[10px] text-white/40 font-bold tracking-widest uppercase">
                Generating…
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs"
            >
              ⚠️ {error}
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap"
            >
              {result}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="flex items-center justify-center h-40 text-center"
            >
              <div className="text-white/30 text-xs italic">
                {prompt ? "Waiting…" : "Output appears here"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}