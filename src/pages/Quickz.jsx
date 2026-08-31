import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Search, Plus, Sparkles, Trash2, Loader2, X, Zap, FileText } from "lucide-react";

const STORAGE_KEY = "quickz_notes_v1";

// ── local-only storage helpers ──────────────────────────────
function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveNotes(notes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {}
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const fmtDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

// escape regex special chars in the query for safe highlighting
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// all match positions of a case-insensitive query inside a text
function matchPositions(text, q) {
  if (!q) return [];
  const out = [];
  const re = new RegExp(escRe(q), "gi");
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push(m.index);
    if (m.index === re.lastIndex) re.lastIndex++; // avoid zero-length loop
  }
  return out;
}

// render the full text with every match highlighted; the current match is emphasized
function renderHighlighted(text, q, currentStart = -1) {
  if (!q) return text;
  const re = new RegExp(escRe(q), "gi");
  const parts = [];
  let last = 0, m, k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const isCurrent = m.index === currentStart;
    parts.push(
      <mark key={k++} className={isCurrent ? "bg-[#6e5ce6]/45 text-[#1d1d1f] rounded px-0.5" : "bg-[#6e5ce6]/20 text-[#1d1d1f] rounded px-0.5"}>{m[0]}</mark>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

// render a snippet centered on the first match with the query highlighted
function HighlightedSnippet({ text, q, max = 120 }) {
  if (!q) {
    const t = (text || "").slice(0, max);
    return <span className="line-clamp-2">{t || "No additional text"}</span>;
  }
  const pos = matchPositions(text, q);
  if (!pos.length) return <span className="line-clamp-2">{(text || "").slice(0, max) || "No additional text"}</span>;
  const start = Math.max(0, pos[0] - 30);
  const end = Math.min(text.length, start + max);
  let slice = text.slice(start, end);
  if (start > 0) slice = "…" + slice;
  if (end < text.length) slice = slice + "…";
  const re = new RegExp(escRe(q), "gi");
  const parts = [];
  let last = 0, m;
  while ((m = re.exec(slice)) !== null) {
    if (m.index > last) parts.push(slice.slice(last, m.index));
    parts.push(<mark key={m.index} className="bg-[#6e5ce6]/20 text-[#1d1d1f] rounded px-0.5">{m[0]}</mark>);
    last = m.index + m[0].length;
  }
  if (last < slice.length) parts.push(slice.slice(last));
  return <span className="line-clamp-2">{parts}</span>;
}

export default function Quickz() {
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const bodyRef = useRef(null);

  // hydrate from localStorage on mount
  useEffect(() => {
    const loaded = loadNotes();
    setNotes(loaded);
    if (loaded.length) setActiveId(loaded[0].id);
  }, []);

  // persist whenever notes change
  useEffect(() => { saveNotes(notes); }, [notes]);

  const active = useMemo(() => notes.find((n) => n.id === activeId) || null, [notes, activeId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) =>
      (n.title || "").toLowerCase().includes(q) ||
      (n.body || "").toLowerCase().includes(q)
    );
  }, [notes, query]);

  const createNote = () => {
    const n = { id: uid(), title: "", body: "", created: Date.now(), updated: Date.now() };
    setNotes((arr) => [n, ...arr]);
    setActiveId(n.id);
    setQuery("");
    setTimeout(() => bodyRef.current?.focus(), 60);
  };

  const updateActive = (patch) => {
    if (!active) return;
    setNotes((arr) => arr.map((n) => (n.id === active.id ? { ...n, ...patch, updated: Date.now() } : n)));
  };

  const deleteNote = (id) => {
    setNotes((arr) => arr.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  // ── AI: enhance / expand the current note ──────────────────
  const aiEnhance = async () => {
    if (!active || aiBusy) return;
    const text = (active.body || "").trim();
    if (!text) return;
    setAiBusy(true);
    setAiError("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI note-taking assistant. Improve the user's note: fix clarity, grammar and structure, expand briefly on the ideas, and add 2-3 concise bullet takeaways at the end if useful. Keep it tight and faithful to the original intent — do not invent facts. Return ONLY the improved note text, no preamble.

ORIGINAL NOTE:
${text}`,
      });
      const improved = typeof res === "string" ? res : (res?.text || JSON.stringify(res));
      updateActive({ body: improved });
    } catch (e) {
      setAiError(e?.message || "AI failed. Try again.");
    } finally {
      setAiBusy(false);
    }
  };

  // ── AI: generate a note from a prompt ──────────────────────
  const aiGenerate = async (prompt) => {
    if (!prompt.trim() || aiBusy) return;
    setAiBusy(true);
    setAiError("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI note-taking assistant. Write a clean, well-structured note about the following topic. Use a short title on the first line, then a concise body with optional short bullet points. Keep it useful and skimmable — no fluff, no preamble.

TOPIC: ${prompt.trim()}`,
      });
      const out = typeof res === "string" ? res : (res?.text || JSON.stringify(res));
      const lines = out.split("\n");
      const title = lines[0].replace(/^#+\s*/, "").trim() || prompt.trim().slice(0, 40);
      const body = lines.slice(1).join("\n").trim();
      const n = { id: uid(), title, body, created: Date.now(), updated: Date.now() };
      setNotes((arr) => [n, ...arr]);
      setActiveId(n.id);
      setQuery("");
    } catch (e) {
      setAiError(e?.message || "AI failed. Try again.");
    } finally {
      setAiBusy(false);
    }
  };

  const [genPrompt, setGenPrompt] = useState("");
  const [showGen, setShowGen] = useState(false);
  const [matchIdx, setMatchIdx] = useState(0);

  // matches of the current search query inside the active note's body
  const matches = useMemo(() => active ? matchPositions(active.body || "", query.trim()) : [], [active, query]);
  useEffect(() => { setMatchIdx(0); }, [query, activeId]);

  const jumpToMatch = (i) => {
    if (!matches.length || !bodyRef.current) return;
    const idx = ((i % matches.length) + matches.length) % matches.length;
    setMatchIdx(idx);
    const start = matches[idx];
    const q = query.trim();
    const ta = bodyRef.current;
    ta.focus();
    ta.setSelectionRange(start, start + q.length);
    // best-effort scroll the textarea so the match is visible
    try {
      const lineHeight = parseFloat(window.getComputedStyle(ta).lineHeight) || 22;
      const linesBefore = ta.value.slice(0, start).split("\n").length - 1;
      ta.scrollTop = Math.max(0, (linesBefore - 2) * lineHeight);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-[#1d1d1f]/50 hover:text-[#1d1d1f] text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
              <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2932a5b3f_generated_image.png" alt="Quickz" className="w-7 h-7 object-cover" />
            </div>
            <span className="font-semibold tracking-tight text-[15px]">Quickz</span>
            <span className="hidden sm:inline text-[11px] text-[#1d1d1f]/40 font-medium ml-1">· AI notes, local only</span>
          </div>

          {/* search bar */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-[#1d1d1f]/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes"
                className="w-full h-9 pl-9 pr-8 rounded-full bg-black/[0.05] border border-transparent focus:bg-white focus:border-[#1d1d1f]/15 outline-none text-sm placeholder:text-[#1d1d1f]/35 transition-all"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#1d1d1f]/40 hover:text-[#1d1d1f]">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowGen((s) => !s)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-[#1d1d1f] text-white text-[13px] font-medium hover:bg-[#000] transition-colors"
          >
            <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">AI</span>
          </button>
          <button
            onClick={createNote}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#1d1d1f] text-white hover:bg-[#000] transition-colors"
            title="New note"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* AI generate bar */}
        {showGen && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Sparkles className="w-4 h-4 text-[#6e5ce6] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={genPrompt}
                  onChange={(e) => setGenPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { aiGenerate(genPrompt); setGenPrompt(""); setShowGen(false); } }}
                  placeholder="Ask AI to write a note about…"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-[#6e5ce6]/30 outline-none text-sm focus:border-[#6e5ce6]/60 transition-colors"
                />
              </div>
              <button
                onClick={() => { aiGenerate(genPrompt); setGenPrompt(""); setShowGen(false); }}
                disabled={aiBusy || !genPrompt.trim()}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-[#6e5ce6] text-white text-[13px] font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Write
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {notes.length === 0 ? (
          <EmptyState onCreate={createNote} onAI={() => setShowGen(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5">
            {/* note list */}
            <aside className="order-2 md:order-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1d1d1f]/40 mb-2 px-1">
                {filtered.length} note{filtered.length !== 1 ? "s" : ""}{query ? ` · "${query}"` : ""}
              </p>
              <div className="space-y-1.5 max-h-[calc(100vh-13rem)] overflow-y-auto pr-1">
                {filtered.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setActiveId(n.id);
                      if (query.trim()) setTimeout(() => {
                        const pos = matchPositions(n.body || "", query.trim());
                        if (pos.length && bodyRef.current) {
                          setMatchIdx(0);
                          bodyRef.current.focus();
                          bodyRef.current.setSelectionRange(pos[0], pos[0] + query.trim().length);
                        }
                      }, 50);
                    }}
                    className={`group w-full text-left p-3 rounded-xl border transition-all ${
                      activeId === n.id
                        ? "bg-white border-[#1d1d1f]/15 shadow-sm"
                        : "bg-white/60 border-transparent hover:bg-white hover:border-black/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[13px] truncate flex-1">{n.title || "Untitled"}</p>
                      <span
                        onClick={(e) => { e.stopPropagation(); deleteNote(n.id); }}
                        className="opacity-0 group-hover:opacity-100 text-[#1d1d1f]/30 hover:text-red-500 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <p className="text-[12px] text-[#1d1d1f]/50 line-clamp-2 mt-0.5"><HighlightedSnippet text={n.body || ""} q={query.trim()} /></p>
                    <p className="text-[10px] text-[#1d1d1f]/30 mt-1">{fmtDate(n.updated)}</p>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-[12px] text-[#1d1d1f]/40 text-center py-6">No notes match "{query}"</p>
                )}
              </div>
            </aside>

            {/* editor */}
            <section className="order-1 md:order-2">
              {active ? (
                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                  <div className="px-5 pt-5">
                    <div className="flex items-start gap-3">
                      <input
                        value={active.title}
                        onChange={(e) => updateActive({ title: e.target.value })}
                        placeholder="Title"
                        className="flex-1 text-2xl font-bold tracking-tight outline-none placeholder:text-[#1d1d1f]/20 bg-transparent"
                      />
                      {query.trim() && matches.length > 0 && (
                        <div className="inline-flex items-center gap-1 h-7 px-2 rounded-full bg-[#6e5ce6]/10 border border-[#6e5ce6]/20 text-[11px] font-medium text-[#6e5ce6] flex-shrink-0">
                          <button onClick={() => jumpToMatch(matchIdx - 1)} className="px-1 hover:opacity-60">‹</button>
                          <span>{matchIdx + 1}/{matches.length}</span>
                          <button onClick={() => jumpToMatch(matchIdx + 1)} className="px-1 hover:opacity-60">›</button>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-[#1d1d1f]/30 mt-1">{fmtDate(active.updated)}</p>
                  </div>
                  <div className="px-5 py-4 relative">
                    {query.trim() && (active.body || "").toLowerCase().includes(query.trim().toLowerCase()) && (
                      <div
                        aria-hidden
                        className="absolute inset-0 px-5 py-4 pointer-events-none whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[#1d1d1f]/90 overflow-hidden"
                      >
                        {renderHighlighted(active.body || "", query.trim(), matches[matchIdx] ?? -1)}
                      </div>
                    )}
                    <textarea
                      ref={bodyRef}
                      value={active.body}
                      onChange={(e) => updateActive({ body: e.target.value })}
                      placeholder="Start writing…"
                      className={`relative w-full min-h-[40vh] resize-y outline-none text-[15px] leading-relaxed placeholder:text-[#1d1d1f]/25 bg-transparent ${query.trim() && (active.body || "").toLowerCase().includes(query.trim().toLowerCase()) ? "text-transparent caret-[#1d1d1f]" : "text-[#1d1d1f]/90"}`}
                    />
                  </div>
                  <div className="px-5 py-3 border-t border-black/[0.06] flex items-center justify-between gap-3 bg-[#fafafa]">
                    {aiError ? (
                      <p className="text-[12px] text-red-500">{aiError}</p>
                    ) : (
                      <p className="text-[11px] text-[#1d1d1f]/35 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#6e5ce6]" /> AI can enhance this note
                      </p>
                    )}
                    <button
                      onClick={aiEnhance}
                      disabled={aiBusy || !(active.body || "").trim()}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#6e5ce6] text-white text-[12px] font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                      {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Enhance
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm h-[60vh] flex flex-col items-center justify-center text-center px-6">
                  <FileText className="w-8 h-8 text-[#1d1d1f]/20 mb-3" />
                  <p className="text-[#1d1d1f]/50 text-sm">Select a note or create a new one</p>
                  <button onClick={createNote} className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#1d1d1f] text-white text-[13px] font-medium hover:bg-black transition-colors">
                    <Plus className="w-4 h-4" /> New note
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      <p className="text-center text-[10px] text-[#1d1d1f]/30 pb-6">Stored locally on this device · nothing leaves your browser</p>
    </div>
  );
}

function EmptyState({ onCreate, onAI }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <div className="w-16 h-16 rounded-2xl overflow-hidden mb-5 shadow-sm">
        <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2932a5b3f_generated_image.png" alt="Quickz" className="w-16 h-16 object-cover" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Quickz</h1>
      <p className="text-[#1d1d1f]/50 text-sm mt-2 max-w-sm">
        An infinite, local-only notepad with AI. Capture ideas fast, search instantly, and let AI write or enhance your notes.
      </p>
      <div className="flex items-center gap-2 mt-6">
        <button onClick={onCreate} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-[#1d1d1f] text-white text-sm font-medium hover:bg-black transition-colors">
          <Plus className="w-4 h-4" /> New note
        </button>
        <button onClick={onAI} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-white border border-black/10 text-[#1d1d1f] text-sm font-medium hover:border-[#6e5ce6]/40 transition-colors">
          <Sparkles className="w-4 h-4 text-[#6e5ce6]" /> Write with AI
        </button>
      </div>
    </div>
  );
}