import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, Minus, MessageCircle, Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AgentChatPanel({ agent, open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [sessionWallet, setSessionWallet] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const scrollRef = useRef(null);

  // Generate a fresh REAL Kaspa wallet for each chat session — same pipeline as the betting app
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (open && agent && !sessionWallet && !walletLoading) {
        setWalletLoading(true);
        try {
          const res = await base44.functions.invoke("createKaspaWallet", { wordCount: 12 });
          const addr = res?.data?.address;
          if (!cancelled && addr) {
            setSessionWallet(addr);
          }
        } catch (e) {
          // wallet creation failed — leave blank, chat still works
        }
        if (!cancelled) setWalletLoading(false);
      }
    };
    init();
    if (!open) {
      // wipe session on close so next open gets a brand-new identity
      setSessionWallet("");
      setMessages([]);
    }
    return () => { cancelled = true; };
  }, [open, agent]);

  useEffect(() => {
    if (open && messages.length === 0 && agent && sessionWallet) {
      setMessages([
        {
          role: "assistant",
          content: `Hey, I'm ${agent.name} — ${agent.tagline}. You're chatting under a fresh ephemeral Kaspa session wallet (${sessionWallet.slice(0, 18)}…) generated just for this conversation, so nothing leaks. What would you like to know?`,
        },
      ]);
    }
  }, [open, agent, sessionWallet]);

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

PRIVACY: The user is chatting under an ephemeral, anonymous session wallet (${sessionWallet}). You do NOT know their real identity, email, or persistent wallet. NEVER ask for or reference any personal info — treat them only as this session ID. Do not mention other users, prior chats, or anything outside this session.

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
      {open && minimized && (
        <motion.button
          key="mini"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={() => setMinimized(false)}
          className={`absolute right-4 bottom-44 sm:bottom-32 z-30 flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r ${agent.color} text-white text-xs font-bold shadow-2xl hover:scale-105 transition-transform`}
          style={{ boxShadow: "0 0 30px rgba(34,211,238,0.4)" }}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="max-w-[100px] truncate">{agent.name}</span>
        </motion.button>
      )}

      {open && !minimized && (
        <motion.div
          key="panel"
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute top-16 right-3 bottom-44 sm:bottom-28 w-[calc(100%-1.5rem)] sm:w-72 z-30 bg-black/85 backdrop-blur-2xl rounded-2xl ring-1 ring-white/10 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-2.5 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-white text-xs font-bold truncate">{agent.name}</div>
                <div className="flex items-center gap-1" title={sessionWallet || "Generating Kaspa session wallet…"}>
                  <Shield className="w-2.5 h-2.5 text-cyan-300" />
                  <span className="text-cyan-300/80 text-[9px] font-mono truncate">
                    {walletLoading ? "generating…" : sessionWallet ? `${sessionWallet.slice(6, 18)}…` : "session"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setMinimized(true)}
                className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
                title="Minimize"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
                title="Close"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-2.5 py-1.5 rounded-xl text-xs leading-snug ${
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
                <div className="px-2.5 py-1.5 rounded-xl bg-white/10 ring-1 ring-white/10">
                  <Loader2 className="w-3 h-3 text-cyan-300 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 bg-white/5 rounded-xl px-2.5 py-1.5 ring-1 ring-white/10 focus-within:ring-cyan-400/50 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={`Message ${agent.name}…`}
                className="flex-1 bg-transparent text-white text-xs placeholder-white/40 outline-none min-w-0"
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="w-6 h-6 rounded-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-white/30 flex items-center justify-center text-black transition-colors flex-shrink-0"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}