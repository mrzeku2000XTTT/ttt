import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Lightbulb, Wand2, ArrowLeft, ImagePlus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function PromptPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

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

  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    const preview = URL.createObjectURL(file);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedImage({ url: file_url, preview });
    } catch {
      alert("Image upload failed. Please try again.");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() && !uploadedImage) return;
    const userMessage = { role: "user", content: prompt, imagePreview: uploadedImage?.preview };
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    const currentImage = uploadedImage;
    setPrompt("");
    setUploadedImage(null);
    setShowSuggestions(false);
    setLoading(true);
    try {
      const invokeParams = currentImage
        ? {
            prompt: `The user uploaded an image. Based on the image and this input: "${currentPrompt || 'no text provided'}", understand their intent and generate a helpful, detailed response. If they want a script, write a full script. If they want marketing copy, write that. Adapt to their intent.`,
            model: "gemini_3_pro",
            file_urls: [currentImage.url],
          }
        : { prompt: currentPrompt, model: "gpt_5_mini" };
      const aiResponse = await base44.integrations.Core.InvokeLLM(invokeParams);
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
          <p className="text-white/40 text-xs mt-0.5">AI Prompt Builder &amp; Enhancer</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
            <img
              src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png"
              alt="Prompto"
              className="w-24 h-24 rounded-3xl object-cover shadow-2xl shadow-purple-500/30"
            />
            <div>
              <p className="text-white font-semibold text-xl">Start creating prompts</p>
              <p className="text-white/40 text-sm mt-2">Write anything below or upload an image for AI-powered responses</p>
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
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="uploaded" className="h-32 rounded-xl object-cover mb-2 border border-white/10" />
                  )}
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
        {uploadedImage && (
          <div className="mb-3 flex items-center gap-2">
            <div className="relative inline-block">
              <img src={uploadedImage.preview} alt="upload" className="h-16 w-16 object-cover rounded-xl border border-white/20" />
              <button onClick={() => setUploadedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-white/40 text-xs">Image attached — AI will analyze it with your prompt</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleImageUpload(e.target.files[0])} />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="w-11 h-11 bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            title="Upload image">
            {uploading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <ImagePlus className="w-4 h-4 text-white/70" />
            }
          </button>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={uploadedImage ? "Describe what you want from this image..." : "Type a prompt..."}
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-all"
          />
          <button type="button" onClick={enhancePrompt} disabled={loading || !prompt.trim()}
            className="w-11 h-11 bg-white/5 hover:bg-white/10 disabled:opacity-40 border border-white/10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            title="Enhance with AI">
            <Wand2 className="w-4 h-4 text-white" />
          </button>
          <button type="submit" disabled={loading || (!prompt.trim() && !uploadedImage)}
            className="w-11 h-11 bg-purple-600/40 hover:bg-purple-600/60 disabled:opacity-40 border border-purple-500/30 rounded-full flex items-center justify-center transition-all flex-shrink-0">
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
        <p className="text-white/20 text-xs mt-2 text-center">Press Enter or click Send · Upload an image for visual AI analysis</p>
      </div>
    </div>
  );
}