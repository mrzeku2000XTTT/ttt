import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Plus, Search, ImageIcon, Mic, Globe, Zap, Loader2, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "What is Kaspa and why is it fast?",
  "Explain DAG blockchains vs traditional chains",
  "What's the latest on KAS price?",
  "How does Kaspa's proof of work differ?",
  "Tell me about TTT — the Kaspa super-app",
];

const ThinkingDots = () => (
  <div className="flex items-center gap-1 py-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-2 h-2 rounded-full bg-slate-400"
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
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
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors group"
      >
        <Zap className="w-3 h-3 text-emerald-500" />
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
            <div className="mt-1.5 pl-3 border-l-2 border-emerald-200 text-xs text-slate-400 italic leading-relaxed">
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
        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm bg-slate-900 text-white text-sm leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 mb-5">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center mt-0.5">
        <span className="text-white text-[10px] font-black">G</span>
      </div>
      <div className="flex-1 min-w-0">
        {msg.thought && <ThoughtProcess text={msg.thought} />}
        {msg.loading ? (
          <ThinkingDots />
        ) : (
          <div className="prose prose-sm prose-slate max-w-none text-slate-800">
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
  const [mode, setMode] = useState("expert"); // expert | think
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
      const systemPrompt = `You are Grok — a truth-seeking, witty AI assistant deeply knowledgeable about Kaspa blockchain, cryptocurrency, DAG technology, and the TTT ecosystem (a Kaspa-based super-app). You give sharp, accurate, well-reasoned answers. Be concise yet thorough. Use markdown for structure when helpful.`;

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
    } catch (err) {
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
        className="absolute inset-0 bg-black/30 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Chat window */}
      <div className="relative w-full sm:max-w-2xl h-[92vh] sm:h-[82vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/80">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-white text-xs font-black">G</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Grok</h2>
              <p className="text-[10px] text-slate-400 -mt-0.5">Truth-seeking AI · Powered by TTT</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
              <button
                onClick={() => setMode("expert")}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  mode === "expert" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Expert
              </button>
              <button
                onClick={() => setMode("think")}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  mode === "think" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Zap className="w-2.5 h-2.5" /> Think
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <span className="text-white text-xl font-black">G</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Ask anything</h3>
                <p className="text-sm text-slate-500">Kaspa, crypto, Web3, or anything else</p>
              </div>
              <div className="w-full space-y-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-sm text-slate-700 font-medium transition-all group flex items-center justify-between"
                  >
                    <span>{s}</span>
                    <Send className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 flex-shrink-0 ml-2" />
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
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-white">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 focus-within:border-slate-400 focus-within:bg-white transition-all shadow-sm">
            <button className="flex-shrink-0 text-slate-400 hover:text-slate-600 mb-0.5 transition-colors">
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
              className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-900 placeholder-slate-400 max-h-32 leading-relaxed"
              style={{ minHeight: "24px" }}
            />
            <div className="flex items-center gap-1 flex-shrink-0 mb-0.5">
              <button className="text-slate-300 hover:text-slate-500 transition-colors">
                <Globe className="w-4 h-4" />
              </button>
              <button className="text-slate-300 hover:text-slate-500 transition-colors">
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-full bg-slate-900 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm ml-1"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            Grok can make mistakes. Powered by TTT · Kaspa ecosystem
          </p>
        </div>
      </div>
    </motion.div>
  );
}