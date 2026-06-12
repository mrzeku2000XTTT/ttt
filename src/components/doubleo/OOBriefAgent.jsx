import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Zap, ChevronRight, RefreshCw, AtSign } from "lucide-react";
import { base44 } from "@/api/base44Client";

const BRIEF_INTRO = [
  { role: "agent", content: "**Brief Agent** online. 📋\n\nI've received the rough draft from 00. I've analyzed your story and I'm ready to coordinate everything — scenes, tone, structure, and tasks.\n\nReady to start drafting your vision?" },
];

export default function OOBriefAgent({ roughDraft, onGoToChapters }) {
  const [phase, setPhase] = useState("compiling"); // compiling | chat | morph
  const [messages, setMessages] = useState(BRIEF_INTRO);
  const [input, setInput] = useState("");
  const [showDraftPicker, setShowDraftPicker] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [compilationProgress, setCompilationProgress] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Load saved
    try {
      const saved = JSON.parse(localStorage.getItem("oo_brief_messages") || "null");
      if (saved && saved.length > 1) { setMessages(saved); setPhase("chat"); return; }
    } catch {}
    // Simulate compilation
    if (roughDraft) {
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 18 + 5;
        if (p >= 100) { clearInterval(interval); setCompilationProgress(100); setTimeout(() => setPhase("chat"), 600); }
        else setCompilationProgress(Math.min(p, 99));
      }, 200);
      return () => clearInterval(interval);
    } else {
      setPhase("chat");
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length > 1) {
      try { localStorage.setItem("oo_brief_messages", JSON.stringify(messages.slice(-30))); } catch {}
    }
  }, [messages]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (val.endsWith("@")) setShowDraftPicker(true);
    else setShowDraftPicker(false);
  };

  const attachDraft = () => {
    setInput(prev => prev.replace(/@$/, `@roughdraft "${roughDraft?.title || "My Story"}" `));
    setShowDraftPicker(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    const userMsg = { role: "user", content: text, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);
    setShowDraftPicker(false);

    try {
      const context = messages.slice(-8).map(m => `${m.role === "user" ? "User" : "Brief Agent"}: ${m.content}`).join("\n");
      const draftContext = roughDraft ? `Story: "${roughDraft.title}" | Genre: ${roughDraft.genre || "Unknown"} | Logline: ${roughDraft.logline || ""} | Chapters: ${roughDraft.chapterCount || 12}` : "";

      const prompt = `You are Brief Agent — the command center and creative director inside "00 Story Studio". You're sharp, organized, and cinematic. You take user's story rough draft and help refine, structure, and prepare it for chapter writing.

Draft Info: ${draftContext}
Previous chat: ${context}
User says: "${text}"

If user mentions "@roughdraft" or refers to the draft, acknowledge it specifically. If user asks for fixes or improvements, give concrete numbered pointers. If user says "morph" or "apply changes", tell them you're transforming into Co-Engineer mode and ask them to click "Morph to Engineer". 

Keep responses under 200 words. Be decisive and creative. Use **bold** for key decisions.`;

      const raw = await base44.integrations.Core.InvokeLLM({ prompt });
      const content = typeof raw === "string" ? raw : (raw?.response || "Processing...");
      
      const shouldMorph = text.toLowerCase().includes("morph") || content.toLowerCase().includes("morph to engineer");
      
      setMessages(prev => [...prev, { role: "agent", content, id: Date.now().toString(), showMorph: shouldMorph }]);
    } catch {
      setMessages(prev => [...prev, { role: "agent", content: "Signal lost. Try again.", id: Date.now().toString() }]);
    }
    setIsThinking(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (phase === "compiling") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full border-4 border-zinc-100 border-t-zinc-900 animate-spin mx-auto mb-6" />
          <h2 className="text-[20px] font-[800] text-zinc-900 mb-2">Brief Agent Compiling</h2>
          <p className="text-[13px] text-zinc-400 mb-8">Analyzing rough draft · Organizing tasks · Briefing sub-agents</p>
          <div className="w-64 h-1.5 bg-zinc-100 rounded-full overflow-hidden mx-auto">
            <motion.div
              className="h-full bg-zinc-900 rounded-full"
              animate={{ width: `${compilationProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">{Math.round(compilationProgress)}%</p>
        </motion.div>
      </div>
    );
  }

  if (phase === "morph") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <motion.div
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-6"
          >
            <RefreshCw className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-[22px] font-[900] text-zinc-900 mb-2">Morphing to Co-Engineer</h2>
          <p className="text-[13px] text-zinc-400 mb-8">Brief Agent is transforming into your Chapter Co-Engineer</p>
          <button
            onClick={onGoToChapters}
            className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white rounded-full text-[13px] font-semibold hover:bg-zinc-800 transition-all"
          >
            Open Chapter Editor <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="py-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-[800] text-white">Brief Agent</h2>
          <p className="text-[12px] text-zinc-500">Command center · Use @ to reference your draft</p>
        </div>
        {roughDraft && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-semibold text-zinc-300">
            <Zap className="w-3 h-3" />
            <span className="truncate max-w-[100px]">{roughDraft.title || "Draft ready"}</span>
          </div>
        )}
      </div>

      {!roughDraft && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-[12px] text-amber-700">
          No draft yet — go to Expansion tab first to brainstorm and finish a draft.
        </div>
      )}

      {/* Chat */}
      <div className="min-h-[50vh] max-h-[60vh] overflow-y-auto rounded-2xl border p-4 space-y-4 mb-4 bg-[#111318]" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {messages.map((msg) => (
          <BriefBubble key={msg.id} msg={msg} onMorph={() => setPhase("morph")} onGoChapters={onGoToChapters} />
        ))}
        {isThinking && (
          <div className="flex gap-2 items-end">
            <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <div className="bg-white border border-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400"
                    animate={{ y: [0,-4,0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Draft picker */}
      <AnimatePresence>
        {showDraftPicker && roughDraft && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="mb-2 bg-[#111318] border rounded-xl shadow-lg overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <button onClick={attachDraft} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                <span className="text-[9px] font-[900] text-white">00</span>
              </div>
              <div>
                <p className="text-[12px] font-bold text-white">{roughDraft.title || "My Story"}</p>
                <p className="text-[10px] text-zinc-500">{roughDraft.logline?.slice(0, 60) || "Rough draft"}</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="flex items-end gap-2 bg-[#111318] rounded-2xl border p-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <button onClick={() => setInput(prev => prev + "@")} className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors flex-shrink-0">
          <AtSign className="w-4 h-4" />
        </button>
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder='Type or use @ to attach a draft…'
          rows={1}
          className="flex-1 resize-none bg-transparent text-[14px] text-white placeholder-zinc-600 outline-none min-h-[36px] max-h-[120px] py-2 leading-relaxed"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isThinking}
          className="p-2.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-40 transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function BriefBubble({ msg, onMorph, onGoChapters }) {
  const isUser = msg.role === "user";
  const content = msg.content || "";
  const formatted = content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 items-end ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <Zap className="w-3 h-3 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl text-[13px] leading-relaxed ${
        isUser ? "bg-white/10 text-white rounded-br-sm px-4 py-3 border border-white/10"
               : "bg-[#1a1d24] border border-white/5 text-zinc-200 rounded-bl-sm px-4 py-3"
      }`}>
        <div className="whitespace-pre-line">{formatted}</div>
        {msg.showMorph && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <button onClick={onMorph} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white text-[11px] font-bold rounded-full hover:bg-zinc-800 transition-all">
              <RefreshCw className="w-3 h-3" /> Morph to Engineer
            </button>
            <button onClick={onGoChapters} className="flex items-center gap-1.5 px-4 py-2 border border-zinc-200 text-zinc-700 text-[11px] font-semibold rounded-full hover:bg-zinc-50 transition-all">
              Go to Chapters <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}