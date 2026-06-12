import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, BookOpen, Sparkles, Loader2, ChevronLeft, PenLine, Tag, Star, StarOff } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const ROBOT_BG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e1b0bd70e_generated_image.png";

const NOTE_COLORS = [
  { id: "default", label: "Slate", line: "rgba(255,255,255,0.06)", text: "#fff" },
  { id: "blue",    label: "Blue",  line: "rgba(10,132,255,0.2)",    text: "#0a84ff" },
  { id: "purple",  label: "Purple",line: "rgba(191,90,242,0.2)",    text: "#bf5af2" },
  { id: "green",   label: "Green", line: "rgba(48,209,88,0.2)",     text: "#30d158" },
  { id: "yellow",  label: "Yellow",line: "rgba(255,214,10,0.2)",    text: "#ffd60a" },
  { id: "red",     label: "Red",   line: "rgba(255,69,58,0.2)",     text: "#ff453a" },
];

function loadNotes() {
  try { return JSON.parse(localStorage.getItem("oo_notes") || "[]"); } catch { return []; }
}

function saveNotes(notes) {
  try { localStorage.setItem("oo_notes", JSON.stringify(notes)); } catch {}
}

function createNote(colorId = "default") {
  return { id: "note_" + Date.now(), title: "", body: "", color: colorId, starred: false, tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export default function DoubleONotesPage() {
  const [notes, setNotes] = useState(loadNotes);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAI, setShowAI] = useState(false);
  const roughDraft = (() => { try { return JSON.parse(localStorage.getItem("oo_rough_draft") || "null"); } catch { return null; } })();

  useEffect(() => { saveNotes(notes); }, [notes]);

  const activeNote = notes.find(n => n.id === activeId);

  const addNote = (colorId = "default") => {
    const n = createNote(colorId);
    setNotes(prev => [n, ...prev]);
    setActiveId(n.id);
  };

  const updateNote = (id, changes) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...changes, updatedAt: new Date().toISOString() } : n));
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const toggleStar = (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, starred: !n.starred } : n));
  };

  const aiExpand = async () => {
    if (!activeNote || !aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const context = roughDraft ? `Story: "${roughDraft.title}" | ${roughDraft.logline}` : "";
      const raw = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a creative writing assistant inside "00 Story Studio". 
${context}
The user has this note: "${activeNote.title ? `Title: ${activeNote.title}\n` : ""}${activeNote.body}"
User wants: "${aiPrompt}"
Write a clear, helpful response (max 200 words). Be specific and practical. No filler.`
      });
      const aiText = typeof raw === "string" ? raw : (raw?.response || "");
      updateNote(activeNote.id, { body: activeNote.body + (activeNote.body ? "\n\n" : "") + "── AI ──\n" + aiText });
      setAiPrompt("");
      setShowAI(false);
    } catch {}
    setAiLoading(false);
  };

  const filtered = notes
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0) || new Date(b.updatedAt) - new Date(a.updatedAt));

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#000" }}>
      {/* Robot background */}
      <div className="fixed inset-0 z-0">
        <img src={ROBOT_BG} alt="" className="w-full h-full object-cover object-center opacity-20" style={{ filter: "saturate(0.4) blur(2px)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 60%, #000 100%)" }} />
      </div>

      {/* Animated ambient orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ x: [0, 60, 0], y: [0, -40, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #0a84ff, transparent)", top: "10%", left: "5%" }} />
        <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #bf5af2, transparent)", bottom: "15%", right: "10%" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-14 pb-32">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/DoubleO" className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-all"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)" }}>
              <ChevronLeft className="w-3.5 h-3.5" /> Studio
            </Link>
            <div>
              <h1 className="text-[26px] font-[900] text-white tracking-tight">Story Notes</h1>
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {roughDraft?.title || "00 Story Studio"} · {notes.length} notes
              </p>
            </div>
          </div>

          {/* Stats glass widget */}
          <div className="hidden sm:flex items-center gap-3">
            {[
              { label: "Notes", val: notes.length, color: "#0a84ff" },
              { label: "Starred", val: notes.filter(n => n.starred).length, color: "#ffd60a" },
            ].map(stat => (
              <motion.div key={stat.label} whileHover={{ scale: 1.03 }}
                className="px-4 py-2.5 rounded-2xl text-center"
                style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="text-[20px] font-[900]" style={{ color: stat.color }}>{stat.val}</div>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Search + add row */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <PenLine className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…"
              className="flex-1 bg-transparent text-[14px] text-white outline-none placeholder-white/25" />
          </div>
          <div className="flex items-center gap-2">
            {NOTE_COLORS.map(c => (
              <button key={c.id} onClick={() => addNote(c.id)}
                title={`Add ${c.label} note`}
                className="w-7 h-7 rounded-full transition-all hover:scale-110 border"
                style={{ background: c.line, borderColor: c.text + "33" }} />
            ))}
            <button onClick={() => addNote()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-bold text-white transition-all hover:brightness-110"
              style={{ background: "#0a84ff", backdropFilter: "blur(10px)" }}>
              <Plus className="w-4 h-4" /> Note
            </button>
          </div>
        </div>

        {/* Layout: list + editor */}
        <div className="flex gap-4 min-h-[70vh]">

          {/* Note list */}
          <div className="w-72 flex-shrink-0 space-y-2 overflow-y-auto" style={{ maxHeight: "75vh" }}>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.3)" }}>No notes yet.<br />Tap + to start writing.</p>
              </div>
            )}
            {filtered.map(note => {
              const col = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
              const isActive = note.id === activeId;
              return (
                <motion.button key={note.id} layout onClick={() => setActiveId(note.id)}
                  className="w-full text-left p-4 rounded-2xl transition-all"
                  style={{ background: isActive ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: isActive ? `1px solid ${col.text}40` : "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-[700] text-white truncate flex-1">{note.title || "Untitled"}</p>
                    <button onClick={e => { e.stopPropagation(); toggleStar(note.id); }} className="flex-shrink-0">
                      {note.starred ? <Star className="w-3.5 h-3.5" style={{ color: "#ffd60a" }} fill="#ffd60a" /> : <StarOff className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />}
                    </button>
                  </div>
                  <p className="text-[11px] mt-1 line-clamp-2" style={{ color: "rgba(255,255,255,0.4)" }}>{note.body || "Empty note…"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.text }} />
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Notebook editor */}
          <div className="flex-1 min-w-0">
            {!activeNote ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}
                  className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <BookOpen className="w-7 h-7" style={{ color: "rgba(255,255,255,0.3)" }} />
                </motion.div>
                <p className="text-[15px] font-[700] text-white mb-1">Select a note to read or edit</p>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>Or create a new one →</p>
              </div>
            ) : (
              <NotebookEditor note={activeNote} onUpdate={updateNote} onDelete={deleteNote}
                onAIExpand={aiExpand} aiLoading={aiLoading} aiPrompt={aiPrompt} setAiPrompt={setAiPrompt}
                showAI={showAI} setShowAI={setShowAI} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notebook Editor ────────────────────────────────────────────────────────

function NotebookEditor({ note, onUpdate, onDelete, onAIExpand, aiLoading, aiPrompt, setAiPrompt, showAI, setShowAI }) {
  const col = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
  const textRef = useRef(null);

  return (
    <motion.div key={note.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col rounded-3xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(28px)", border: `1px solid ${col.text}25` }}>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: col.text }} />
          <input value={note.title} onChange={e => onUpdate(note.id, { title: e.target.value })}
            placeholder="Note title…"
            className="text-[16px] font-[700] text-white bg-transparent outline-none placeholder-white/20 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAI(!showAI)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
            style={{ background: showAI ? "rgba(191,90,242,0.2)" : "rgba(255,255,255,0.06)", color: showAI ? "#bf5af2" : "rgba(255,255,255,0.5)", border: showAI ? "1px solid rgba(191,90,242,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
            <Sparkles className="w-3 h-3" /> AI Assist
          </button>
          <button onClick={() => onDelete(note.id)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-red-500/15"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* AI assist bar */}
      <AnimatePresence>
        {showAI && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-6 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(191,90,242,0.12)", background: "rgba(191,90,242,0.05)" }}>
            <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: "#bf5af2" }} />
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") onAIExpand(); }}
              placeholder="Ask 00 to expand, rewrite, or suggest…"
              className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder-white/25" />
            <button onClick={onAIExpand} disabled={aiLoading || !aiPrompt.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-bold text-white disabled:opacity-50"
              style={{ background: "#bf5af2" }}>
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Go"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notebook body — lined paper effect */}
      <div className="flex-1 relative overflow-hidden">
        {/* Line pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(transparent, transparent 31px, ${col.line} 31px, ${col.line} 32px)`,
          backgroundPosition: "0 48px"
        }} />
        {/* Red margin line */}
        <div className="absolute top-0 bottom-0 left-14 w-px opacity-40" style={{ background: "rgba(255,69,58,0.4)" }} />

        <textarea ref={textRef} value={note.body}
          onChange={e => onUpdate(note.id, { body: e.target.value })}
          placeholder="Start writing…"
          className="relative w-full h-full bg-transparent outline-none resize-none text-white placeholder-white/15 px-16 pb-8"
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "15px",
            lineHeight: "32px",
            paddingTop: "52px",
            minHeight: "500px",
            color: "rgba(255,255,255,0.88)",
            letterSpacing: "0.01em",
          }} />
      </div>

      {/* Footer */}
      <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          {note.body.split(/\s+/).filter(Boolean).length} words · updated {new Date(note.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <div className="flex items-center gap-2">
          {NOTE_COLORS.map(c => (
            <button key={c.id} onClick={() => onUpdate(note.id, { color: c.id })}
              className="w-4 h-4 rounded-full transition-all hover:scale-125"
              style={{ background: c.text, opacity: note.color === c.id ? 1 : 0.35, outline: note.color === c.id ? `2px solid ${c.text}` : "none", outlineOffset: "2px" }} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}