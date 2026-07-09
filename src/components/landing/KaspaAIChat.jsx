import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { X, Plus, Send, ChevronDown, Loader2, Globe, PanelLeft, Trash2, Paperclip, Rocket, FileText, Film } from "lucide-react";
import { KASPA_AI_MODELS, runSkillTurn, AGENT_LOGO } from "./kaspaAIModels";
import AgentAttachment from "./AgentAttachment";

const SESSIONS_KEY = "kaspa_ai_chat_sessions";
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const BLUE = "#4d6bfe";

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]"); } catch { return []; }
}
function saveSessions(s) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s.slice(-50))); } catch {}
}

const Logo = ({ size = 28 }) => (
  <img src={AGENT_LOGO} alt="AGENT." width={size} height={size}
    className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
);

const SUGGESTIONS = [
  "What is the Kaspa price right now?",
  "Generate an image of a golden Kaspa coin",
  "Search the web for the latest Kaspa news",
];

export default function KaspaAIChat({ onClose }) {
  const [model, setModel] = useState(KASPA_AI_MODELS[0]);
  const [showModels, setShowModels] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [sessions, setSessions] = useState(() => loadSessions());
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thoughts, setThoughts] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]); // {name, url, kind, uploading}
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, thoughts]);

  const newChat = () => { setActiveId(null); setMessages([]); if (window.innerWidth < 1024) setSidebarOpen(false); };

  const selectSession = (id) => {
    const s = sessions.find(x => x.id === id);
    if (s) { setActiveId(id); setMessages(s.messages || []); if (window.innerWidth < 1024) setSidebarOpen(false); }
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated); saveSessions(updated);
    if (activeId === id) { setActiveId(null); setMessages([]); }
  };

  const persist = (id, msgs) => {
    setSessions(prev => {
      const exists = prev.some(s => s.id === id);
      const title = msgs.find(m => m.role === "user")?.content?.slice(0, 34) || "New chat";
      const updated = exists
        ? prev.map(s => s.id === id ? { ...s, messages: msgs, title } : s)
        : [{ id, title, messages: msgs, ts: Date.now() }, ...prev];
      saveSessions(updated);
      return updated;
    });
  };

  // ===== FILE UPLOADS (button + paste + drop) =====
  const uploadFiles = async (files) => {
    const list = Array.from(files || []).slice(0, 5);
    if (!list.length) return;
    for (const file of list) {
      const kind = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
      const temp = { name: file.name || `pasted-${kind}`, url: null, kind, uploading: true, key: Date.now() + Math.random() };
      setAttachedFiles(prev => [...prev, temp]);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setAttachedFiles(prev => prev.map(f => f.key === temp.key ? { ...f, url: file_url, uploading: false } : f));
      } catch {
        setAttachedFiles(prev => prev.filter(f => f.key !== temp.key));
      }
    }
  };

  const handlePaste = (e) => {
    const files = Array.from(e.clipboardData?.items || [])
      .filter(i => i.kind === "file").map(i => i.getAsFile()).filter(Boolean);
    if (files.length) { e.preventDefault(); uploadFiles(files); }
  };

  const removeFile = (key) => setAttachedFiles(prev => prev.filter(f => f.key !== key));

  // ===== SEND =====
  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    const readyFiles = attachedFiles.filter(f => f.url);
    if ((!text && !readyFiles.length) || loading || attachedFiles.some(f => f.uploading)) return;
    const id = activeId || Date.now().toString();
    if (!activeId) setActiveId(id);
    const userMsg = { role: "user", content: text || "(see attached files)", files: readyFiles.map(f => ({ name: f.name, url: f.url, kind: f.kind })) };
    const base = [...messages, userMsg];
    setMessages([...base, { role: "assistant", content: "", pending: true }]);
    setInput("");
    setAttachedFiles([]);
    setThoughts(["Reading your message…"]);
    setLoading(true);
    try {
      const { reply, attachment } = await runSkillTurn({
        model, webSearch, history: messages, text,
        fileUrls: readyFiles.map(f => f.url),
        onThought: (t) => setThoughts(prev => [...prev, t]),
      });
      const done = [...base, { role: "assistant", content: reply, attachment }];
      setMessages(done);
      persist(id, done);
    } catch {
      setMessages([...base, { role: "assistant", content: "Something went wrong. Try again." }]);
    }
    setLoading(false);
    setThoughts([]);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex" style={{ background: "#ffffff", fontFamily: FONT }}
      onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); uploadFiles(e.dataTransfer?.files); }}>

      <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.csv,.txt,.json" className="hidden"
        onChange={e => { uploadFiles(e.target.files); e.target.value = ""; }} />

      {/* SIDEBAR */}
      <div className="flex flex-col flex-shrink-0 overflow-hidden transition-all duration-200"
        style={{ width: sidebarOpen ? 240 : 0, background: "#f9fafb", borderRight: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-2 px-4 pt-5 pb-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
          <Logo size={32} />
          <span className="text-[15px] font-bold text-gray-900">AGENT.</span>
        </div>
        <div className="px-3 pb-2">
          <button onClick={newChat} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "rgba(77,107,254,0.08)", color: BLUE }}>
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {sessions.map(s => (
            <div key={s.id} onClick={() => selectSession(s.id)}
              className="group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-[13px] transition-colors"
              style={{ background: activeId === s.id ? "#e8ecff" : "transparent", color: activeId === s.id ? "#1f2937" : "#6b7280" }}>
              <span className="truncate flex-1">{s.title}</span>
              <button onClick={(e) => deleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 ml-1 text-gray-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {sessions.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">No chats yet</div>}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid #f3f4f6", paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
          <button onClick={() => setSidebarOpen(v => !v)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Model picker */}
          <div className="relative">
            <button onClick={() => setShowModels(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-100">
              <span className="w-2 h-2 rounded-full" style={{ background: model.color }} />
              {model.label}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <AnimatePresence>
              {showModels && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-full left-0 mt-1 z-20 rounded-2xl overflow-hidden py-1"
                  style={{ background: "#fff", border: "1px solid #e5e7eb", boxShadow: "0 12px 32px rgba(0,0,0,0.12)", minWidth: 220 }}>
                  {KASPA_AI_MODELS.map(m => (
                    <button key={m.id} onClick={() => { setModel(m); setShowModels(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                      <span className="text-sm font-medium text-gray-800 flex-1">{m.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(77,107,254,0.08)", color: BLUE }}>{m.tag}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <Logo size={60} />
              <h1 className="text-xl font-bold text-gray-900 mb-1 mt-4">Hi, I'm AGENT.</h1>
              <p className="text-sm text-gray-400 mb-7">Chat, build & launch — anything.</p>
              <button onClick={() => send("Launch my own product — ask me what I want to build, then build it for me as a complete working app.")}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white mb-4 active:scale-[0.97] transition-transform"
                style={{ background: BLUE, boxShadow: "0 6px 24px rgba(77,107,254,0.35)" }}>
                <Rocket className="w-4 h-4" /> Launch Your Own Product
              </button>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {SUGGESTIONS.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="px-3.5 py-2 rounded-full text-[13px] text-gray-600 transition-colors hover:border-[#4d6bfe] hover:text-[#4d6bfe]"
                    style={{ border: "1px solid #e5e7eb", background: "#fff" }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              <style>{`
                .ttt-md p { margin: 0.45em 0; line-height: 1.65; }
                .ttt-md ul, .ttt-md ol { margin: 0.45em 0; padding-left: 1.4em; }
                .ttt-md h1,.ttt-md h2,.ttt-md h3 { font-weight: 700; margin: 0.7em 0 0.3em; }
                .ttt-md code { background: #f3f4f6; padding: 1px 5px; border-radius: 4px; font-size: 0.85em; }
                .ttt-md pre { background: #f9fafb; border: 1px solid #e5e7eb; padding: 0.7em; border-radius: 10px; overflow-x: auto; }
                .ttt-md strong { font-weight: 700; }
                @keyframes thoughtPulse { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
              `}</style>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "user" ? (
                    <div className="max-w-[80%]">
                      {m.files?.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-end mb-1.5">
                          {m.files.map((f, fi) => f.kind === "image"
                            ? <img key={fi} src={f.url} alt={f.name} className="h-20 rounded-xl object-cover" />
                            : (
                              <div key={fi} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-gray-600" style={{ background: "#f3f4f6" }}>
                                {f.kind === "video" ? <Film className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                <span className="max-w-[120px] truncate">{f.name}</span>
                              </div>
                            ))}
                        </div>
                      )}
                      <div className="px-4 py-2.5 rounded-2xl text-[14px] text-white whitespace-pre-wrap" style={{ background: BLUE }}>
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[92%] flex gap-3">
                      <div className="mt-1"><Logo size={28} /></div>
                      <div className="text-[14px] text-gray-800 min-w-0 flex-1">
                        {m.pending && loading ? (
                          <div className="space-y-1.5 py-1">
                            {thoughts.map((t, ti) => (
                              <motion.div key={ti} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl rounded-tl-md text-[12.5px]"
                                style={{
                                  background: ti === thoughts.length - 1 ? "rgba(77,107,254,0.08)" : "#f9fafb",
                                  border: `1px solid ${ti === thoughts.length - 1 ? "rgba(77,107,254,0.25)" : "#f3f4f6"}`,
                                  color: ti === thoughts.length - 1 ? BLUE : "#9ca3af",
                                  display: "flex",
                                }}>
                                {ti === thoughts.length - 1
                                  ? <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                                  : <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#d1d5db" }} />}
                                <span style={ti === thoughts.length - 1 ? { animation: "thoughtPulse 1.6s ease-in-out infinite" } : {}}>{t}</span>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <ReactMarkdown className="ttt-md">{m.content}</ReactMarkdown>
                            <AgentAttachment a={m.attachment} />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}>
          <div className="max-w-3xl mx-auto rounded-3xl p-3" style={{ border: "1.5px solid #e5e7eb", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2 pb-2">
                {attachedFiles.map(f => (
                  <div key={f.key} className="relative group">
                    {f.kind === "image" && f.url
                      ? <img src={f.url} alt={f.name} className="h-14 w-14 rounded-xl object-cover" />
                      : (
                        <div className="h-14 px-3 rounded-xl flex items-center gap-1.5 text-xs text-gray-600" style={{ background: "#f3f4f6" }}>
                          {f.uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : f.kind === "video" ? <Film className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                          <span className="max-w-[100px] truncate">{f.name}</span>
                        </div>
                      )}
                    <button onClick={() => removeFile(f.key)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Message AGENT. (${model.label}) — paste or attach images, videos & files`}
              rows={1}
              className="w-full resize-none outline-none text-[14px] text-gray-800 placeholder:text-gray-400 px-2 pt-1 bg-transparent"
              style={{ minHeight: 40, maxHeight: 120 }} />
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-[#4d6bfe] transition-colors"
                style={{ border: "1px solid #e5e7eb" }} title="Attach files">
                <Paperclip className="w-4 h-4" />
              </button>
              <button onClick={() => setWebSearch(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={webSearch
                  ? { background: "rgba(77,107,254,0.12)", color: BLUE, border: `1px solid ${BLUE}` }
                  : { background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                <Globe className="w-3.5 h-3.5" /> Search
              </button>
              <button onClick={() => setInput("Build and launch my own product: ")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{ background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                <Rocket className="w-3.5 h-3.5" /> Launch
              </button>
              <div className="flex-1" />
              <button onClick={() => send()} disabled={loading || (!input.trim() && !attachedFiles.some(f => f.url)) || attachedFiles.some(f => f.uploading)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
                style={{ background: BLUE }}>
                {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}