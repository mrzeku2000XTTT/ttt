import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { base44 } from "@/api/base44Client";
import { X, Send, ChevronDown, Loader2, Globe, PanelLeft, Trash2, Paperclip, FileText, Film, MessageCircle, Rocket } from "lucide-react";
import { KASPA_AI_MODELS, runSkillTurn, AGENT_LOGO } from "./kaspaAIModels";
import { EARN_TASKS, loadCreditState, saveCredits, computeCost } from "./agentCredits";
import ModelLogo from "./agentModelLogos";
import AgentAttachment from "./AgentAttachment";

const SESSIONS_KEY = "kaspa_ai_chat_sessions";
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const BLUE = "#4d6bfe";
const BG = "#000000";
const PANEL = "#121214";
const GLASS = "rgba(255,255,255,0.05)";
const BORDER = "rgba(255,255,255,0.08)";

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]"); } catch { return []; }
}
function saveSessions(s) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s.slice(-50))); } catch {}
}

const Logo = ({ size = 28 }) => (
  <img src={AGENT_LOGO} alt="AGENT." width={size} height={size}
    className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size, mixBlendMode: "screen" }} />
);

const NewBadge = () => (
  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
    style={{ background: "rgba(77,107,254,0.18)", color: "#8fa3ff", border: "1px solid rgba(77,107,254,0.3)" }}>New</span>
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
  const [creditState, setCreditState] = useState({ loggedIn: false, isAdmin: false, credits: 0, completedTasks: [], loaded: false });
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { loadCreditState().then(s => setCreditState({ ...s, loaded: true })); }, []);

  const earnTasksText = EARN_TASKS.map(t => `- **${t.label}** — +${t.reward} K-CREDITS`).join("\n");

  const showEarnTasks = () => {
    setMessages(prev => [...prev, { role: "assistant", content: `**AGENT K-CREDITS**\n\nEvery agent call costs K-CREDITS — the price depends on the model (shown in the model picker), plus **+1** per attached file and **+1** for web search. Admins run unlimited.\n\nEarn credits by completing a task, then send me a screenshot as proof right here — I'll analyze it and confirm or deny:\n\n${earnTasksText}\n\nAttach your proof and tell me which task you completed.` }]);
  };

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
      const snippet = msgs[msgs.length - 1]?.content?.slice(0, 42) || "";
      const updated = exists
        ? prev.map(s => s.id === id ? { ...s, messages: msgs, title, snippet } : s)
        : [{ id, title, snippet, messages: msgs, ts: Date.now() }, ...prev];
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

    // K-CREDITS gate — admins run unlimited
    const cost = computeCost(model, { fileCount: readyFiles.length, webSearch });
    if (creditState.loaded && !creditState.isAdmin && creditState.credits < cost) {
      const denied = [...base, { role: "assistant", content: `You're out of **K-CREDITS** — this call costs **${cost} KC** and you have **${creditState.credits}**.\n\nEarn more by completing a task and sending me a screenshot as proof right here — I'll verify it:\n\n${earnTasksText}` }];
      setMessages(denied); persist(id, denied);
      setInput(""); setAttachedFiles([]);
      return;
    }

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
      // Charge the call + award verified task credits
      if (creditState.loaded && !creditState.isAdmin) {
        let credits = creditState.credits - cost;
        let tasks = creditState.completedTasks;
        if (attachment?.type === "task" && attachment.approved) {
          if (tasks.includes(attachment.taskId)) attachment.alreadyClaimed = true;
          else { credits += attachment.reward; tasks = [...tasks, attachment.taskId]; }
        }
        setCreditState({ ...creditState, credits, completedTasks: tasks });
        saveCredits(creditState, credits, tasks);
      }
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
      className="fixed inset-0 z-[120] flex" style={{ background: BG, fontFamily: FONT }}
      onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); uploadFiles(e.dataTransfer?.files); }}>

      <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf,.csv,.txt,.json" className="hidden"
        onChange={e => { uploadFiles(e.target.files); e.target.value = ""; }} />

      {/* SIDEBAR */}
      <div className="flex flex-col flex-shrink-0 overflow-hidden transition-all duration-200"
        style={{ width: sidebarOpen ? 248 : 0, background: "#0E0E10", borderRight: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
          <Logo size={34} />
          <span className="text-[16px] font-extrabold text-white tracking-tight flex-1">AGENT.</span>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5">
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="px-3 pb-3">
          <button onClick={newChat} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:bg-white/10"
            style={{ background: GLASS, border: `1px solid ${BORDER}` }}>
            New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {sessions.map(s => (
            <div key={s.id} onClick={() => selectSession(s.id)}
              className="group flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors mb-0.5"
              style={{ background: activeId === s.id ? "rgba(255,255,255,0.07)" : "transparent" }}>
              <MessageCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: activeId === s.id ? "#fff" : "rgba(255,255,255,0.35)" }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] truncate" style={{ color: activeId === s.id ? "#fff" : "rgba(255,255,255,0.55)" }}>{s.title}</div>
                {activeId === s.id && s.snippet && (
                  <div className="text-[10px] truncate text-white/30 mt-0.5">{s.snippet}</div>
                )}
              </div>
              <button onClick={(e) => deleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 mt-0.5 text-white/30 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {sessions.length === 0 && <div className="px-3 py-2 text-xs text-white/25">No chats yet</div>}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}`, paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5">
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          {/* Model picker */}
          <div className="relative">
            <button onClick={() => setShowModels(v => !v)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{
                background: "rgba(77,107,254,0.08)",
                border: showModels ? `1.5px solid ${BLUE}` : `1.5px solid rgba(77,107,254,0.35)`,
                boxShadow: showModels ? "0 0 14px rgba(77,107,254,0.4)" : "0 0 8px rgba(77,107,254,0.15)",
              }}>
              <ModelLogo logo={model.logo} size={16} />
              {model.label}
              <ChevronDown className="w-3.5 h-3.5 text-white/40" />
            </button>
            <AnimatePresence>
              {showModels && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-full left-0 mt-2 z-20 rounded-2xl overflow-hidden py-1.5"
                  style={{ background: "#1A1A1E", border: `1px solid ${BORDER}`, boxShadow: "0 16px 48px rgba(0,0,0,0.6)", minWidth: 224, backdropFilter: "blur(20px)" }}>
                  {KASPA_AI_MODELS.map(m => (
                    <button key={m.id} onClick={() => { setModel(m); setShowModels(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-white/5"
                      style={{ background: model.id === m.id ? "rgba(255,255,255,0.06)" : "transparent" }}>
                      <ModelLogo logo={m.logo} size={16} />
                      <span className="text-sm font-medium text-white/90 flex-1">{m.label}</span>
                      {m.badge && <NewBadge />}
                      {!m.badge && m.tag === "Fast" && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md text-white/40" style={{ border: `1px solid ${BORDER}` }}>Fast</span>
                      )}
                      {!creditState.isAdmin && (
                        <span className="text-[9px] text-white/30 tabular-nums flex-shrink-0">{m.cost} KC</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />
          <button onClick={showEarnTasks} title="AGENT K-CREDITS — tap to earn more"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl mr-2 active:scale-95 transition-transform"
            style={{ background: GLASS, border: `1px solid ${BORDER}` }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #f0d060, #c8960c)", color: "#000" }}>K</span>
            <span className="text-xs font-bold text-white tabular-nums">{creditState.isAdmin ? "∞" : creditState.credits}</span>
          </button>
          <button onClick={onClose} className="p-2.5 rounded-xl text-white/60 hover:text-white transition-colors"
            style={{ background: GLASS, border: `1px solid ${BORDER}` }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <img src={AGENT_LOGO} alt="AGENT." className="rounded-full object-cover flex-shrink-0"
                style={{ width: "min(550px, 60vw)", height: "auto", aspectRatio: "1 / 1", mixBlendMode: "screen" }} />
              <h1 className="text-3xl font-extrabold text-white mt-7 tracking-tight">Hi, I'm AGENT.</h1>
              <p className="text-[15px] text-white/40 mt-2 mb-8">Chat, build & launch — anything.</p>
              <button onClick={() => send("Launch my own product — ask me what I want to build, then build it for me as a complete working app.")}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold active:scale-[0.97] transition-transform mb-10"
                style={{ background: "#fff", color: "#0a0a0c", boxShadow: "0 8px 32px rgba(255,255,255,0.12)" }}>
                <Rocket className="w-4 h-4" /> Launch Your Own Product
              </button>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {SUGGESTIONS.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="px-4 py-2 rounded-full text-[12.5px] text-white/60 transition-colors hover:text-white hover:border-white/25"
                    style={{ border: `1px solid ${BORDER}`, background: GLASS }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              <style>{`
                .ttt-md { color: rgba(255,255,255,0.88); }
                .ttt-md p { margin: 0.45em 0; line-height: 1.65; }
                .ttt-md ul, .ttt-md ol { margin: 0.45em 0; padding-left: 1.4em; }
                .ttt-md h1,.ttt-md h2,.ttt-md h3 { font-weight: 700; margin: 0.7em 0 0.3em; color: #fff; }
                .ttt-md code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 4px; font-size: 0.85em; }
                .ttt-md pre { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 0.7em; border-radius: 10px; overflow-x: auto; }
                .ttt-md strong { font-weight: 700; color: #fff; }
                .ttt-md a { color: #8fa3ff; }
                @keyframes thoughtPulse { 0%,100% { opacity: 0.5 } 50% { opacity: 1 } }
              `}</style>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "user" ? (
                    <div className="max-w-[80%]">
                      {m.files?.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-end mb-1.5">
                          {m.files.map((f, fi) => f.kind === "image"
                            ? <img key={fi} src={f.url} alt={f.name} className="h-20 rounded-xl object-cover" style={{ border: `1px solid ${BORDER}` }} />
                            : (
                              <div key={fi} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-white/60" style={{ background: GLASS, border: `1px solid ${BORDER}` }}>
                                {f.kind === "video" ? <Film className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                <span className="max-w-[120px] truncate">{f.name}</span>
                              </div>
                            ))}
                        </div>
                      )}
                      <div className="px-4 py-2.5 rounded-2xl text-[14px] text-white whitespace-pre-wrap"
                        style={{ background: BLUE, boxShadow: "0 4px 20px rgba(77,107,254,0.25)" }}>
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[92%] flex gap-3">
                      <div className="mt-1"><Logo size={28} /></div>
                      <div className="text-[14px] min-w-0 flex-1">
                        {m.pending && loading ? (
                          <div className="space-y-2 py-1">
                            {thoughts.map((t, ti) => (
                              <motion.div key={ti} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 text-[12.5px]"
                                style={{ color: ti === thoughts.length - 1 ? "#8fa3ff" : "rgba(255,255,255,0.35)" }}>
                                {ti === thoughts.length - 1
                                  ? <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                                  : <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.25)" }} />}
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
          <div className="max-w-3xl mx-auto rounded-2xl p-3.5" style={{ border: `1px solid ${BORDER}`, background: PANEL, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1 pb-2.5">
                {attachedFiles.map(f => (
                  <div key={f.key} className="relative group">
                    {f.kind === "image" && f.url
                      ? <img src={f.url} alt={f.name} className="h-14 w-14 rounded-xl object-cover" style={{ border: `1px solid ${BORDER}` }} />
                      : (
                        <div className="h-14 px-3 rounded-xl flex items-center gap-1.5 text-xs text-white/60" style={{ background: GLASS, border: `1px solid ${BORDER}` }}>
                          {f.uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : f.kind === "video" ? <Film className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                          <span className="max-w-[100px] truncate">{f.name}</span>
                        </div>
                      )}
                    <button onClick={() => removeFile(f.key)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Message AGENT. — paste or attach images, videos & files"
              rows={1}
              className="w-full resize-none outline-none text-[14px] text-white placeholder:text-white/30 px-2 pt-1 bg-transparent"
              style={{ minHeight: 44, maxHeight: 120 }} />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors" title="Attach files">
                <Paperclip className="w-4 h-4" />
              </button>
              <button onClick={() => setWebSearch(v => !v)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={webSearch
                  ? { background: "rgba(77,107,254,0.15)", color: "#8fa3ff", border: `1px solid ${BLUE}` }
                  : { background: GLASS, color: "rgba(255,255,255,0.55)", border: `1px solid ${BORDER}` }}>
                <Globe className="w-3.5 h-3.5" /> Search
              </button>
              <button onClick={() => setInput("Build and launch my own product: ")}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors text-white/55 hover:text-white"
                style={{ background: GLASS, border: `1px solid ${BORDER}` }}>
                <Rocket className="w-3.5 h-3.5" /> Launch
              </button>
              <div className="flex-1" />
              <button onClick={() => send()} disabled={loading || (!input.trim() && !attachedFiles.some(f => f.url)) || attachedFiles.some(f => f.uploading)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
                style={{ background: BLUE, boxShadow: "0 0 18px rgba(77,107,254,0.5)" }}>
                {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}