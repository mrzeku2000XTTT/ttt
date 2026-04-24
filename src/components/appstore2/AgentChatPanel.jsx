import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AgentChatPanel({ agent, open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0 && agent) {
      setMessages([
        {
          role: "assistant",
          content: `Hey, I'm ${agent.name} — ${agent.tagline}. ${agent.description} What would you like to know?`,
        },
      ]);
    }
  }, [open, agent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const history = newMessages
        .map((m) => `${m.role === "user" ? "User" : agent.name}: ${m.content}`)
        .join("\n");

      const prompt = `You are ${agent.name}, an AI agent on the TTT (Kaspa) platform.
Your tagline: ${agent.tagline}
Your role: ${agent.description}

Stay in character. Be concise (2-4 sentences usually), helpful, and friendly. If asked about features outside your role, politely redirect to what you specialize in.

Conversation so far:
${history}

Reply as ${agent.name}:`;

      const reply = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry — I had trouble connecting. Try again in a moment." },
      ]);
    }
    setLoading(false);
  };

  if (!agent) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute top-0 right-0 bottom-0 w-full sm:w-96 z-30 bg-black/85 backdrop-blur-2xl border-l border-white/10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg`}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white text-sm font-bold">{agent.name}</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-300 text-[10px] font-mono uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-cyan-500 text-black font-medium"
                      : "bg-white/10 text-white ring-1 ring-white/10"
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <Loader2 className="w-4 h-4 text-cyan-300 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-3 py-2 ring-1 ring-white/10 focus-within:ring-cyan-400/50 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={`Message ${agent.name}…`}
                className="flex-1 bg-transparent text-white text-sm placeholder-white/40 outline-none"
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/30 flex items-center justify-center text-black transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}