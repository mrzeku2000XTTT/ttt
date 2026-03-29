import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Send, Sparkles, History } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PromptPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = { role: "user", content: prompt };
    setMessages([...messages, userMessage]);
    setPrompt("");
    setLoading(true);

    try {
      // Placeholder for AI integration
      const aiMessage = { role: "assistant", content: "Response coming soon..." };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate(-1)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ background: "linear-gradient(160deg,#0a0a14 0%,#080810 100%)", border: "1px solid rgba(255,255,255,0.08)", height: "92dvh", maxHeight: "92dvh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">Prompto</h1>
              <p className="text-white/40 text-xs mt-0.5">AI Prompt Builder</p>
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white/40" />
              </div>
              <div>
                <p className="text-white/70 font-medium">Start creating prompts</p>
                <p className="text-white/40 text-sm mt-1">Write anything to get started</p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl ${msg.role === "user" ? "bg-white/10 text-white" : "bg-white/5 border border-white/10 text-white/80"}`}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="border-t border-white/10 px-5 py-4 flex-shrink-0">
          <div className="flex gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type a prompt..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-full flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}