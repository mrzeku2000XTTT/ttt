import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Bot, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { IOS_FONT, KASPA_LOGO } from "./shared";

const SUGGESTIONS = [
  "What is Kaspa?",
  "Explain my balance",
  "How do I send KAS?",
  "What is BlockDAG?",
];

export default function AIPanel({ balance, address, activeWallet, price, preferences, activeTab }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const context = `You are an AI assistant inside a Kaspa wallet dashboard. The user is viewing their dashboard. Context: Balance: ${balance ?? "loading"} KAS, Active wallet: ${activeWallet === "kasware" ? "Kasware" : "TTT Wallet"}, Price: $${price ?? "loading"} per KAS, Current tab: ${activeTab}, Website: ${preferences?.site || "not set"}, KRC type: ${preferences?.krcType || "not set"}. Keep answers concise and helpful. Explain things simply for users new to crypto.`;

  const ask = async (question) => {
    if (!question.trim() || loading) return;
    const newMessages = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${context}\n\nUser question: ${question}`,
      });
      const answer = typeof res === "string" ? res : res?.answer || res?.response || "I couldn't process that. Please try again.";
      setMessages([...newMessages, { role: "assistant", content: answer }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="px-5 flex flex-col" style={{ fontFamily: IOS_FONT, minHeight: "60vh" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(10,132,255,0.15)" }}>
          <img src={KASPA_LOGO} alt="" className="w-4 h-4 object-contain" />
        </div>
        <div>
          <div className="text-xs font-semibold text-white">AI Assistant</div>
          <div className="text-[10px] text-white/40">Ask about your dashboard or Kaspa</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(10,132,255,0.1)" }}>
              <Sparkles className="w-5 h-5 text-[#0A84FF]" />
            </div>
            <p className="text-xs text-white/40 text-center mb-4">Ask me anything about your wallet,<br/>Kaspa, or how to use this dashboard.</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)}
                  className="px-2.5 py-1.5 rounded-full text-[10px] text-white/60 hover:text-white transition-colors"
                  style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"}`}
                style={{
                  background: msg.role === "user" ? "#0A84FF" : "rgba(28,28,30,0.8)",
                  border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown className="text-xs text-white/80 prose prose-sm prose-invert max-w-none [&_p]:mb-1 [&_p:last-child]:mb-0">{msg.content}</ReactMarkdown>
                ) : (
                  <p className="text-xs text-white">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1.5"
              style={{ background: "rgba(28,28,30,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Loader2 className="w-3 h-3 animate-spin text-white/40" />
              <span className="text-[10px] text-white/40">Thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(28,28,30,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(input)}
          placeholder="Ask a question…"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none" />
        <button onClick={() => ask(input)} disabled={loading || !input.trim()}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ background: "#0A84FF" }}>
          <Send className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}