import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Plus, Mic, Globe, Zap, Loader2, ChevronDown, Minimize2, Maximize2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "What is Kaspa and why is it fast?",
  "Explain DAG blockchains vs traditional chains",
  "What's the latest on KAS price?",
  "How does Kaspa's proof of work differ?",
  "Tell me about TTT — the Kaspa super-app",
];

const glassStyle = {
  background: "linear-gradient(135deg, rgba(10,10,10,0.96) 0%, rgba(20,20,30,0.98) 100%)",
  backdropFilter: "blur(40px)",
  WebkitBackdropFilter: "blur(40px)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const ThinkingDots = () => (
  <div className="flex items-center gap-1 py-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-2 h-2 rounded-full bg-white/30"
        animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
      />
    ))}
  </div>
);

const ThoughtProcess = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors group"
      >
        <Zap className="w-3 h-3 text-emerald-400" />
        <span className="font-medium">Thought for a moment</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 pl-3 border-l-2 border-emerald-500/30 text-xs text-white/30 italic leading-relaxed">
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MessageBubble = ({ msg }) => {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div
          className="max-w-[75%] px-4 py-3 text-sm leading-relaxed text-white"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px 16px 4px 16px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 mb-5">
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <span className="text-white text-[10px] font-black">ZK</span>
      </div>
      <div className="flex-1 min-w-0">
        {msg.thought && <ThoughtProcess text={msg.thought} />}
        {msg.loading ? (
          <ThinkingDots />
        ) : (
          <div className="prose prose-sm max-w-none text-white/85 prose-headings:text-white prose-strong:text-white prose-code:text-emerald-400 prose-a:text-emerald-400">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default function GrokChat({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("expert");
  const [fullscreen, setFullscreen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");

    const userMsg = { role: "user", content: q, id: Date.now() };
    const placeholderId = Date.now() + 1;
    const placeholder = { role: "assistant", content: "", loading: true, id: placeholderId };

    setMessages((prev) => [...prev, userMsg, placeholder]);
    setLoading(true);

    try {
      const useThinking = mode === "think";
      const systemPrompt = `You are ZK — a truth-seeking, witty AI assistant deeply knowledgeable about Kaspa blockchain, cryptocurrency, DAG technology, and the TTT ecosystem (a Kaspa-based super-app). You give sharp, accurate, well-reasoned answers. Be concise yet thorough. Use markdown for structure when helpful.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nUser: ${q}`,
        model: useThinking ? "claude_sonnet_4_6" : "automatic",
        add_context_from_internet: false,
      });

      const thought = useThinking
        ? `Analyzing the question about "${q.slice(0, 60)}${q.length > 60 ? "…" : ""}" — considering context, accuracy, and best framing…`
        : null;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? { ...m, content: typeof result === "string" ? result : JSON.stringify(result), loading: false, thought }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? { ...m, content: "Something went wrong. Please try again.", loading: false }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  const windowClass = fullscreen
    ? "fixed inset-0 z-[201] flex flex-col"
    : "relative w-full sm:max-w-2xl h-[92vh] sm:h-[82vh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Chat window */}
      <div
        className={windowClass}
        style={glassStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gloss sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <span className="text-white text-[9px] font-black tracking-tight">ZK</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">ZK</h2>
              <p className="text-[10px] text-white/40 -mt-0.5">Truth-seeking AI · Powered by TTT</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <div
              className="flex items-center gap-1 rounded-full p-1"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <button
                onClick={() => setMode("expert")}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  mode === "expert"
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                Expert
              </button>
              <button
                onClick={() => setMode("think")}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  mode === "think"
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                <Zap className="w-2.5 h-2.5" /> Think
              </button>
            </div>

            {/* Minimize / Fullscreen toggle */}
            <button
              onClick={() => setFullscreen((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              title={fullscreen ? "Minimize" : "Fullscreen"}
            >
              {fullscreen
                ? <Minimize2 className="w-3.5 h-3.5 text-white/60" />
                : <Maximize2 className="w-3.5 h-3.5 text-white/60" />
              }
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 40px rgba(255,255,255,0.04)" }}
                >
                  <span className="text-white text-base font-black tracking-tight">ZK</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Ask anything</h3>
                <p className="text-sm text-white/40">Kaspa, crypto, Web3, or anything else</p>
              </div>
              <div className="w-full space-y-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full text-left px-4 py-3 text-sm text-white/70 font-medium transition-all group flex items-center justify-between hover:text-white"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "12px",
                    }}
                  >
                    <span>{s}</span>
                    <Send className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div
            className="flex items-end gap-2 px-4 py-2.5 transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "16px",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <button className="flex-shrink-0 text-white/30 hover:text-white/60 mb-0.5 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask anything…"
              className="flex-1 bg-transparent resize-none outline-none text-sm text-white placeholder-white/25 max-h-32 leading-relaxed"
              style={{ minHeight: "24px" }}
            />
            <div className="flex items-center gap-1 flex-shrink-0 mb-0.5">
              <button className="text-white/20 hover:text-white/50 transition-colors">
                <Globe className="w-4 h-4" />
              </button>
              <button className="text-white/20 hover:text-white/50 transition-colors">
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all ml-1 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-white/20 mt-2">
            ZK can make mistakes. Powered by TTT · Kaspa ecosystem
          </p>
        </div>
      </div>
    </motion.div>
  );
}