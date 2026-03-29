import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Send, Sparkles, Lightbulb, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function PromptPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Generate suggestions based on current input
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
        const suggestions = JSON.parse(result);
        setSuggestions(suggestions);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Suggestion generation failed:", error);
    }
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
    } catch (error) {
      console.error("Enhancement failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage = { role: "user", content: prompt };
    setMessages([...messages, userMessage]);
    setPrompt("");
    setShowSuggestions(false);
    setLoading(true);

    try {
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        model: "gpt_5_mini"
      });
      
      const aiMessage = { role: "assistant", content: aiResponse };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage = { role: "assistant", content: "Error generating response. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => navigate(-1)} className="absolute inset-0" />

      <motion.div
        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{
          background: "rgba(15, 15, 20, 0.7)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
          height: "92dvh",
          maxHeight: "92dvh"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/40 to-pink-500/40 backdrop-blur-md border border-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">Prompto</h1>
              <p className="text-white/40 text-xs mt-0.5">AI Prompt Builder & Enhancer</p>
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 backdrop-blur transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white/40" />
              </div>
              <div>
                <p className="text-white/70 font-medium">Start creating prompts</p>
                <p className="text-white/40 text-sm mt-1">Write anything to get AI-powered responses</p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl backdrop-blur-md ${msg.role === "user" ? "bg-purple-500/30 border border-purple-400/30 text-white" : "bg-white/10 border border-white/15 text-white/90"}`}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 py-3 border-t border-white/10 bg-white/5 backdrop-blur-md"
          >
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-400/60" />
              <p className="text-white/50 text-xs font-medium">Suggestions</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(suggestion)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-xs text-white/80 backdrop-blur transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="border-t border-white/10 px-5 py-4 flex-shrink-0 bg-white/5 backdrop-blur-md">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type a prompt..."
              className="flex-1 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all"
            />
            <button
              type="button"
              onClick={enhancePrompt}
              disabled={loading || !prompt.trim()}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-white/15 rounded-full flex items-center justify-center transition-all backdrop-blur"
              title="Enhance with AI"
            >
              <Wand2 className="w-4 h-4 text-white" />
            </button>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="w-10 h-10 bg-purple-500/30 hover:bg-purple-500/50 disabled:opacity-50 border border-purple-400/30 rounded-full flex items-center justify-center transition-all backdrop-blur"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-white/30 text-xs">Press Enter or click Send to get AI response</p>
        </form>
      </motion.div>
    </div>
  );
}