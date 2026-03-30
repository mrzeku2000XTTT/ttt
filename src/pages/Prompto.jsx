import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Lightbulb, Wand2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function PromptPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (prompt.trim().length > 3) {
      generateSuggestions(prompt);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [prompt]);

  const generateSuggestions = async (text) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 short, actionable prompt enhancement suggestions (2-5 words each) to improve this user prompt: "${text}". Return as JSON array: ["suggestion1", "suggestion2", "suggestion3"]`,
        model: "gemini_3_flash"
      });
      try {
        const s = JSON.parse(result);
        setSuggestions(s);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
    } catch {}
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const enhanced = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a prompt engineering expert. Enhance and improve this user prompt to be more specific, detailed, and effective for AI tasks: "${prompt}". Provide the enhanced prompt only, no explanation.`,
        model: "gemini_3_pro"
      });
      setPrompt(enhanced);
    } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    const userMessage = { role: "user", content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt("");
    setShowSuggestions(false);
    setLoading(true);
    try {
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: userMessage.content,
        model: "gpt_5_mini"
      });
      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error generating response. Please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <Link to={createPageUrl("AppStore")} className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <img
          src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png"
          alt="Prompto"
          className="w-8 h-8 rounded-xl object-cover"
        />
        <div>
          <h1 className="text-white font-bold text-lg leading-none">Prompto</h1>
          <p className="text-white/40 text-xs mt-0.5">AI Prompt Builder & Enhancer</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-xl">Start creating prompts</p>
              <p className="text-white/40 text-sm mt-2">Write anything below to get AI-powered responses</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 w-full max-w-xl">
              {["Write a movie script outline", "Explain quantum computing simply", "Create a marketing campaign"].map((ex, i) => (
                <button key={i} onClick={() => setPrompt(ex)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/70 text-left transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-purple-600/30 border border-purple-500/30 text-white"
                    : "bg-white/5 border border-white/10 text-white/90"
                }`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10 max-w-3xl w-full mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-400/60" />
            <p className="text-white/40 text-xs font-medium">Suggestions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => setPrompt(s)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-white/70 transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 px-4 py-4 max-w-3xl w-full mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type a prompt..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
          />
          <button type="button" onClick={enhancePrompt} disabled={loading || !prompt.trim()}
            className="w-11 h-11 bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 rounded-full flex items-center justify-center transition-all"
            title="Enhance with AI">
            <Wand2 className="w-4 h-4 text-white" />
          </button>
          <button type="submit" disabled={loading || !prompt.trim()}
            className="w-11 h-11 bg-purple-600/40 hover:bg-purple-600/60 disabled:opacity-40 border border-purple-500/30 rounded-full flex items-center justify-center transition-all">
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        <p className="text-white/20 text-xs mt-2 text-center">Press Enter or click Send to get AI response</p>
      </div>
    </div>
  );
}