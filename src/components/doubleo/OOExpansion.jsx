import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Paperclip, X, CheckCircle, Loader2, FileText, Image, Music, Video, Code, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const WELCOME = {
  role: "agent",
  content: "Hey, I'm **00** — your story co-creator. Tell me about your idea. Speak it out loud, type it, or drop some files in. What world are we building today? 🎬",
  id: "welcome"
};

function FileChip({ file, onRemove }) {
  const icons = { image: Image, audio: Music, video: Video, text: FileText };
  const type = file.type.startsWith("image") ? "image" : file.type.startsWith("audio") ? "audio" : file.type.startsWith("video") ? "video" : "text";
  const Icon = icons[type] || FileText;
  return (
    <div className="flex items-center gap-1.5 bg-zinc-100 rounded-full px-2.5 py-1 text-[11px] font-medium text-zinc-600 max-w-[140px]">
      <Icon className="w-3 h-3 flex-shrink-0" />
      <span className="truncate">{file.name}</span>
      <button onClick={onRemove} className="flex-shrink-0"><X className="w-3 h-3" /></button>
    </div>
  );
}

export default function OOExpansion({ onDraftCreated }) {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [canFinish, setCanFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Load saved session
    try {
      const saved = JSON.parse(localStorage.getItem("oo_expansion_messages") || "null");
      if (saved && saved.length > 1) setMessages(saved);
    } catch {}
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // Save session
    if (messages.length > 1) {
      try { localStorage.setItem("oo_expansion_messages", JSON.stringify(messages)); } catch {}
    }
    // Enable finish after 3 user messages
    const userMsgs = messages.filter(m => m.role === "user");
    if (userMsgs.length >= 2) setCanFinish(true);
  }, [messages]);

  const toggleVoice = async () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input not supported in this browser. Try Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Request mic permission explicitly first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert("Microphone access was denied. Please allow mic access in your browser settings.");
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    let finalTranscript = "";

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript + " ";
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setInput(finalTranscript + interim);
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      setIsListening(false);
      if (e.error === "not-allowed") {
        alert("Microphone access denied. Please enable it in browser settings.");
      }
    };

    rec.onend = () => {
      setIsListening(false);
      // Auto-populate whatever was captured
      if (finalTranscript.trim()) {
        setInput(finalTranscript.trim());
      }
    };

    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  };

  const handleFiles = (newFiles) => {
    setFiles(prev => [...prev, ...Array.from(newFiles).slice(0, 5)]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && files.length === 0) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }

    const userMsg = {
      role: "user",
      content: text,
      files: files.map(f => ({ name: f.name, type: f.type })),
      id: Date.now().toString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setFiles([]);
    setIsThinking(true);

    try {
      const context = messages.filter(m => m.role !== "agent" || m.id !== "welcome")
        .slice(-6)
        .map(m => `${m.role === "user" ? "User" : "00"}: ${m.content}`)
        .join("\n");

      const fileContext = userMsg.files.length > 0
        ? `\nAttached files: ${userMsg.files.map(f => f.name + " (" + f.type + ")").join(", ")}`
        : "";

      const prompt = `You are 00 (Double Zero), a creative AI story co-creator inside a storytelling app called "00 Story Studio". You help users brainstorm, develop, and expand their story ideas for books and movies.

Your personality: Enthusiastic, cinematic-minded, insightful. You ask the RIGHT questions to pull out the user's vision. You think in scenes, emotions, and cinematography.

Previous conversation:
${context}

User's latest message: "${text}"${fileContext}

Respond as 00. Keep it conversational and energizing. Ask clarifying questions about characters, tone, setting, conflict, visual style. After about 3-4 exchanges, mention that they can click "Finish Draft" to compile everything into a rough draft. Use **bold** for key story elements you identify. Keep responses under 180 words.`;

      const response = await base44.integrations.Core.InvokeLLM({ prompt });

      setMessages(prev => [...prev, {
        role: "agent",
        content: typeof response === "string" ? response : response?.response || "Let me think on that...",
        id: Date.now().toString()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "agent",
        content: "My thoughts got scrambled. Tell me more and I'll catch up.",
        id: Date.now().toString()
      }]);
    }
    setIsThinking(false);
  };

  const handleFinishDraft = async () => {
    setFinishing(true);
    try {
      const allUserContent = messages.filter(m => m.role === "user").map(m => m.content).join(" | ");
      const agentResponses = messages.filter(m => m.role === "agent" && m.id !== "welcome").map(m => m.content).join(" | ");

      const prompt = `Based on this brainstorm session, compile a structured ROUGH DRAFT for a story/book.

User's brainstorm: ${allUserContent}
Key story elements identified: ${agentResponses}

Output a JSON object with:
- title: story title (suggest one if not given)
- genre: story genre
- logline: one sentence summary
- premise: 2-3 sentence premise
- mainCharacters: array of {name, role, description}
- setting: {time, place, atmosphere}
- themes: array of themes
- tone: emotional tone
- coreConflict: main conflict
- chapterCount: suggested number of chapters (between 8-20)
- movieNotes: {visualStyle, mood, cinematicReferences}
- chapters: array of {number, title, summary} for first 3 chapters

Return ONLY valid JSON.`;

      const raw = await base44.integrations.Core.InvokeLLM({ prompt });
      let draft;
      try {
        const str = typeof raw === "string" ? raw : (raw?.response || "{}");
        const jsonMatch = str.match(/\{[\s\S]*\}/);
        draft = JSON.parse(jsonMatch ? jsonMatch[0] : str);
      } catch {
        draft = { title: "My Story", logline: allUserContent.slice(0, 100), chapterCount: 12 };
      }
      draft.createdAt = new Date().toISOString();
      draft.id = "draft_" + Date.now();
      onDraftCreated(draft);
    } catch {
      onDraftCreated({ title: "My Story", logline: "A story in progress", chapterCount: 12, id: "draft_" + Date.now(), createdAt: new Date().toISOString() });
    }
    setFinishing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="py-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-[800] text-white">Expansion Mode</h2>
          <p className="text-[12px] text-zinc-500">Brainstorm with 00. Voice, text, or drop files.</p>
        </div>
        {canFinish && (
          <button
            onClick={handleFinishDraft}
            disabled={finishing}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-black text-[13px] font-semibold rounded-full hover:bg-cyan-400 disabled:opacity-60 transition-all shadow-lg shadow-cyan-500/20"
          >
            {finishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {finishing ? "Compiling..." : "Finish Draft"}
          </button>
        )}
      </div>

      {/* Chat area */}
      <div
        className={`min-h-[50vh] max-h-[60vh] overflow-y-auto rounded-2xl border transition-colors p-4 space-y-4 mb-4 ${
          isDragging ? "border-cyan-500/40 bg-cyan-500/5" : "bg-[#111318]"
        }`}
        style={{ borderColor: isDragging ? undefined : "rgba(255,255,255,0.06)" }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl text-zinc-500 font-semibold text-sm pointer-events-none z-10">
            Drop files here
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isThinking && (
          <div className="flex gap-2 items-end">
            <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-[900] text-white">00</span>
            </div>
            <div className="bg-white border border-zinc-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400"
                    animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* File chips */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {files.map((f, i) => <FileChip key={i} file={f} onRemove={() => setFiles(prev => prev.filter((_, j) => j !== i))} />)}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 bg-[#111318] rounded-2xl border p-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2.5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your story idea…"
          rows={1}
          className="flex-1 resize-none bg-transparent text-[14px] text-white placeholder-zinc-600 outline-none min-h-[36px] max-h-[120px] py-2 leading-relaxed"
          style={{ overflowY: "auto" }}
        />
        <button
          onClick={toggleVoice}
          className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
            isListening ? "bg-red-500/20 text-red-400 animate-pulse" : "text-zinc-500 hover:text-white hover:bg-white/10"
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button
          onClick={sendMessage}
          disabled={!input.trim() && files.length === 0}
          className="p-2.5 bg-cyan-500 text-black rounded-xl hover:bg-cyan-400 disabled:opacity-40 transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      {isListening && (
        <p className="text-center text-[11px] text-red-500 font-medium mt-2 animate-pulse">🔴 Listening… speak your idea</p>
      )}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const content = msg.content || "";
  // Simple markdown bold
  const formatted = content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 items-end ${isUser ? "flex-row-reverse" : ""}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
          <span className="text-[9px] font-[900] text-white">00</span>
        </div>
      )}
      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed ${
        isUser
          ? "bg-white/10 text-white rounded-br-sm border border-white/10"
          : "bg-[#1a1d24] border border-white/5 text-zinc-200 rounded-bl-sm"
      }`}>
        {formatted}
        {msg.files && msg.files.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {msg.files.map((f, i) => (
              <span key={i} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{f.name}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}