import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Upload, Trash2, Minus, Video } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "kaspa_avatar_video_url";

export default function KaspaAvatarChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm the Kaspa AI — ask me anything about Kaspa, blockDAG, mining, KRC-20, or the ecosystem. 🔷" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("Please upload a video file (mp4, webm, etc.)");
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setVideoUrl(file_url);
      localStorage.setItem(STORAGE_KEY, file_url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload video");
    }
    setUploading(false);
  };

  const removeVideo = () => {
    setVideoUrl("");
    localStorage.removeItem(STORAGE_KEY);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const context = messages.slice(-8).map(m => `${m.role === "user" ? "User" : "Kaspa AI"}: ${m.content}`).join("\n");
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the Kaspa AI assistant on the "What is Kaspa?" page. You are an expert on:
- Kaspa blockDAG architecture, GHOSTDAG/PHANTOM protocol
- Proof of Work mining (kHeavyHash), GPU mining
- KRC-20 tokens, Kasplex L2, DeFi ecosystem
- Kaspa history: fair launch (no premine, no ICO), community governance
- Rust node rewrite, BPS upgrades, DAGKnight
- Technical details: 10,000+ TPS, 1-second blocks, 32 BPS target
- Community projects, exchanges, wallet options

Be concise, accurate, and friendly. Use emojis occasionally. If asked about something unrelated to Kaspa, briefly answer but steer back to Kaspa topics.

Conversation so far:
${context}

User: ${userMsg}

Respond as Kaspa AI:`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
      });
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Try again! 🙏" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating avatar bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed z-50 bottom-6 right-6 w-16 h-16 rounded-full overflow-hidden shadow-2xl shadow-cyan-500/30 ring-2 ring-cyan-400/50"
            style={{ background: "linear-gradient(135deg, #0e7490, #7c3aed)" }}
          >
            {videoUrl ? (
              <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl">🔷</span>
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-50 bottom-6 right-6 flex flex-col"
            style={{
              width: "min(400px, calc(100vw - 2rem))",
              height: "560px",
              borderRadius: "20px",
              background: "rgba(12, 12, 18, 0.92)",
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
              overflow: "hidden",
            }}
          >
            {/* Header with video avatar */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-cyan-500/40 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #0e7490, #7c3aed)" }}>
                  {videoUrl ? (
                    <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">🔷</div>
                  )}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Kaspa AI</div>
                  <div className="text-white/40 text-[10px]">Ask about Kaspa</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Upload video button */}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-cyan-400 transition-colors hover:bg-white/10"
                  title={videoUrl ? "Change avatar video" : "Upload avatar video"}
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                </button>
                <input ref={fileRef} type="file" accept="video/*" onChange={handleUpload} className="hidden" />
                {videoUrl && (
                  <button
                    onClick={removeVideo}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 transition-colors hover:bg-white/10"
                    title="Remove video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors hover:bg-white/10"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); setMessages([{ role: "assistant", content: "Hey! I'm the Kaspa AI — ask me anything about Kaspa, blockDAG, mining, KRC-20, or the ecosystem. 🔷" }]); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 transition-colors hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Video display area (if video exists, show larger looping version) */}
            {videoUrl && (
              <div className="px-4 pt-3">
                <div className="rounded-xl overflow-hidden ring-1 ring-white/10" style={{ height: "120px" }}>
                  <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] text-sm leading-relaxed px-3 py-2 rounded-2xl"
                    style={msg.role === "user" ? {
                      background: "rgba(6,182,212,0.25)",
                      color: "rgba(255,255,255,0.95)",
                      borderBottomRightRadius: "6px",
                    } : {
                      background: "rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.85)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderBottomLeftRadius: "6px",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-2xl rounded-bl-md flex items-center gap-1.5"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {!videoUrl && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full mb-2 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                  style={{ background: "rgba(6,182,212,0.1)", border: "1px dashed rgba(6,182,212,0.3)" }}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload animated avatar video
                </button>
              )}
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Ask about Kaspa..."
                  className="flex-1 bg-transparent text-white/90 text-sm outline-none placeholder-white/30"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
                  style={{ background: input.trim() && !isLoading ? "rgba(6,182,212,0.4)" : "transparent" }}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}