import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { X, Plus, Send, ChevronDown, Loader2, Globe, PanelLeft, Sparkles, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { KASPA_AI_MODELS, runSkillTurn } from "./kaspaAIModels";

const SESSIONS_KEY = "kaspa_ai_chat_sessions";
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const BLUE = "#4d6bfe";

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]"); } catch { return []; }
}
function saveSessions(s) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s.slice(-50))); } catch {}
}

function Attachment({ a }) {
  if (!a) return null;
  if (a.type === "image") return <img src={a.url} alt="Generated" className="mt-3 rounded-xl max-w-full" style={{ maxHeight: 380 }} />;
  if (a.type === "audio") return <audio controls src={a.url} className="mt-3 w-full" />;
  if (a.type === "price") return (
    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(77,107,254,0.08)", border: "1px solid rgba(77,107,254,0.2)" }}>
      <span className="text-sm font-bold" style={{ color: BLUE }}>KAS ${a.price < 1 ? a.price.toFixed(4) : a.price.toFixed(2)}</span>
      {a.change != null && (
        <span className="text-xs font-medium flex items-center gap-0.5" style={{ color: a.change >= 0 ? "#16a34a" : "#dc2626" }}>
          {a.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(a.change).toFixed(1)}%
        </span>
      )}
    </div>
  );
  if (a.type === "balance") return (
    <div className="mt-3 px-4 py-2.5 rounded-xl" style={{ background: "rgba(77,107,254,0.08)", border: "1px solid rgba(77,107,254,0.2)" }}>
      <div className="text-sm font-bold" style={{ color: BLUE }}>{Number(a.balance).toLocaleString()} KAS</div>
      <div className="text-[10px] text-gray-400 font-mono truncate max-w-[240px]">{a.address}</div>
    </div>
  );
  return null;
}

const SUGGESTIONS = [
  "What is the Kaspa price right now?",
  "Generate an image of a golden Kaspa coin",
  "Explain the GhostDAG protocol simply",
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
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

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

  const send = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    const id = activeId || Date.now().toString();
    if (!activeId) setActiveId(id);
    const userMsg = { role: "user", content: text };
    const next = [...messages, userMsg, { role: "assistant", content: "", pending: true }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply, attachment } = await runSkillTurn({ model, webSearch, history: [...messages, userMsg], text });
      const done = [...messages, userMsg, { role: "assistant", content: reply, attachment }];
      setMessages(done);
      persist(id, done);
    } catch {
      setMessages([...messages, userMsg, { role: "assistant", content: "Something went wrong. Try again." }]);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex" style={{ background: "#ffffff", fontFamily: FONT }}>

      {/* SIDEBAR */}
      <div className="flex flex-col flex-shrink-0 overflow-hidden transition-all duration-200"
        style={{ width: sidebarOpen ? 240 : 0, background: "#f9fafb", borderRight: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-2 px-4 pt-5 pb-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BLUE }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-bold text-gray-900">TTT AI</span>
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
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: BLUE }}>
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Hi, I'm TTT AI.</h1>
              <p className="text-sm text-gray-400 mb-7">How can I help you today?</p>
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
              `}</style>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "user" ? (
                    <div className="max-w-[80%] px-4 py-2.5 rounded-2xl text-[14px] text-white whitespace-pre-wrap" style={{ background: BLUE }}>
                      {m.content}
                    </div>
                  ) : (
                    <div className="max-w-[92%] flex gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ background: BLUE }}>
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="text-[14px] text-gray-800 min-w-0">
                        {m.pending && loading ? (
                          <div className="flex items-center gap-2 py-2 text-gray-400 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
                          </div>
                        ) : (
                          <>
                            <ReactMarkdown className="ttt-md">{m.content}</ReactMarkdown>
                            <Attachment a={m.attachment} />
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
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Message ${model.label}…`}
              rows={1}
              className="w-full resize-none outline-none text-[14px] text-gray-800 placeholder:text-gray-400 px-2 pt-1 bg-transparent"
              style={{ minHeight: 40, maxHeight: 120 }} />
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => setWebSearch(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={webSearch
                  ? { background: "rgba(77,107,254,0.12)", color: BLUE, border: `1px solid ${BLUE}` }
                  : { background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                <Globe className="w-3.5 h-3.5" /> Search
              </button>
              <span className="text-[10px] text-gray-300 hidden sm:block">Images · Voice · Kaspa price · Balances — just ask</span>
              <div className="flex-1" />
              <button onClick={() => send()} disabled={loading || !input.trim()}
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