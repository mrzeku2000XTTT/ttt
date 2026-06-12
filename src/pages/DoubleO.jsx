import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mic, ChevronRight, BookOpen, Film, History, Clock, Trash2, ArrowRight, PenLine } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import OOExpansion from "@/components/doubleo/OOExpansion";
import OOBriefAgent from "@/components/doubleo/OOBriefAgent";
import OOChapterEditor from "@/components/doubleo/OOChapterEditor";

// ── Apple dark palette ──────────────────────────────────────────────────────
// bg: #000 / #0c0c0e / #1c1c1e / #2c2c2e / #3a3a3c
// text: #fff / #ebebf5cc / #ebebf599 / #ebebf54d
// accent: system blue #0a84ff, cyan #32ade6

const FEATURE_CARDS = [
  { img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e1b0bd70e_generated_image.png", borderColor: "#0a84ff", title: "Voice Expansion", desc: "Speak your story. 00 builds your world.", tag: "ACTIVE", tagColor: "#0a84ff", tab: "expansion" },
  { img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b9d1a2d06_generated_image.png", borderColor: "#ffd60a", title: "Brief Agent", desc: "Command center. Organizes scenes and tasks.", tag: "READY", tagColor: "#ffd60a", tab: "brief" },
  { img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/32bf43779_generated_image.png", borderColor: "#30d158", title: "Chapter + Scene Studio", desc: "AI-written chapters with scenes, cuts, and cinematics.", tag: "STUDIO", tagColor: "#30d158", tab: "chapters" },
  { img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2e4ef678a_generated_image.png", borderColor: "#ff453a", title: "Movie Engine", desc: "Every scene becomes a movie-ready prompt.", tag: "SOON", tagColor: "#ff453a", tab: "home" },
];

function getDraftHistory() {
  try { return JSON.parse(localStorage.getItem("oo_draft_history") || "[]"); } catch { return []; }
}

function saveDraftToHistory(draft) {
  try {
    const history = getDraftHistory();
    const existing = history.findIndex(d => d.id === draft.id);
    if (existing >= 0) history[existing] = { ...draft, updatedAt: new Date().toISOString() };
    else history.unshift({ ...draft, updatedAt: new Date().toISOString() });
    localStorage.setItem("oo_draft_history", JSON.stringify(history.slice(0, 10)));
  } catch {}
}

export default function DoubleOPage() {
  const [activeTab, setActiveTab] = useState(() => {
    try { return localStorage.getItem("oo_active_tab") || "home"; } catch { return "home"; }
  });
  const [roughDraft, setRoughDraft] = useState(() => {
    try { return JSON.parse(localStorage.getItem("oo_rough_draft") || "null"); } catch { return null; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [draftHistory, setDraftHistory] = useState(getDraftHistory);

  const setTab = (t) => {
    setActiveTab(t);
    try { localStorage.setItem("oo_active_tab", t); } catch {}
    window.scrollTo(0, 0);
  };

  const handleDraftCreated = (draft) => {
    setRoughDraft(draft);
    localStorage.setItem("oo_rough_draft", JSON.stringify(draft));
    saveDraftToHistory(draft);
    setDraftHistory(getDraftHistory());
    setTab("brief");
  };

  const loadDraft = (draft) => {
    setRoughDraft(draft);
    localStorage.setItem("oo_rough_draft", JSON.stringify(draft));
    setShowHistory(false);
    setTab("brief");
  };

  const deleteDraftFromHistory = (id) => {
    const updated = draftHistory.filter(d => d.id !== id);
    setDraftHistory(updated);
    localStorage.setItem("oo_draft_history", JSON.stringify(updated));
  };

  const isHome = activeTab === "home";

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "#000" }}>

      {/* ── Draft History Drawer ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col"
              style={{ background: "#1c1c1e", borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between px-5 pt-12 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <h3 className="text-[16px] font-[700] text-white">Project History</h3>
                  <p className="text-[11px] text-white/40 mt-0.5">Tap to revisit any draft</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white" style={{ background: "rgba(255,255,255,0.08)" }}>✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {draftHistory.length === 0 ? (
                  <p className="text-[13px] text-white/30 text-center mt-8">No projects yet. Start a new expansion!</p>
                ) : draftHistory.map(draft => (
                  <div key={draft.id} className="rounded-2xl p-4 relative group" style={{ background: "#2c2c2e" }}>
                    <button onClick={() => loadDraft(draft)} className="w-full text-left">
                      <p className="text-[14px] font-[700] text-white truncate">{draft.title || "Untitled Story"}</p>
                      <p className="text-[11px] text-white/40 mt-1 line-clamp-2">{draft.logline || draft.premise || "No logline"}</p>
                      <p className="text-[10px] mt-2" style={{ color: "#0a84ff" }}>{new Date(draft.updatedAt || draft.createdAt).toLocaleDateString()} · {draft.chapterCount || "?"} chapters · {draft.targetPages || "?"} pages</p>
                    </button>
                    <button onClick={() => deleteDraftFromHistory(draft.id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-red-400"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => { loadDraft(draft); setTab("chapters"); }}
                      className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(10,132,255,0.15)", color: "#0a84ff" }}>
                      <BookOpen className="w-3 h-3" /> Open Chapters
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Floating bottom tab bar ── */}
      {!isHome && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full px-2 py-1.5 shadow-2xl"
          style={{ background: "rgba(28,28,30,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={() => setTab("home")}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            ← Home
          </button>
          <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.1)" }} />
          {[
            { id: "expansion", label: "Expansion" },
            { id: "brief", label: "Brief" },
            { id: "chapters", label: "Chapters" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
              style={activeTab === t.id
                ? { background: "#0a84ff", color: "#fff", fontWeight: 700 }
                : { color: "rgba(255,255,255,0.45)" }}>
              {t.label}
              {t.id === "brief" && roughDraft && activeTab !== "brief" && (
                <span className="inline-block w-1.5 h-1.5 rounded-full ml-1 align-middle" style={{ background: "#0a84ff" }} />
              )}
            </button>
          ))}
          <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.1)" }} />
          <Link to="/DoubleONotes" className="p-1.5 rounded-full transition-all flex items-center" title="Notes"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            <PenLine className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => setShowHistory(true)}
            className="p-1.5 rounded-full transition-all"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            <History className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {isHome && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <OOLandingPage onStartExpansion={() => setTab("expansion")} roughDraft={roughDraft}
              onGoToBrief={() => setTab("brief")} onTabChange={setTab} onShowHistory={() => setShowHistory(true)} />
          </motion.div>
        )}
        {activeTab === "expansion" && (
          <motion.div key="expansion" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="max-w-3xl mx-auto px-0 sm:px-4 pt-2 pb-28">
              <OOExpansion onDraftCreated={handleDraftCreated} />
            </div>
          </motion.div>
        )}
        {activeTab === "brief" && (
          <motion.div key="brief" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="max-w-3xl mx-auto px-0 sm:px-4 pt-2 pb-28">
              <OOBriefAgent roughDraft={roughDraft} onGoToChapters={() => setTab("chapters")} />
            </div>
          </motion.div>
        )}
        {activeTab === "chapters" && (
          <motion.div key="chapters" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="max-w-4xl mx-auto px-0 sm:px-4 pt-2 pb-28">
              <OOChapterEditor roughDraft={roughDraft} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OOLandingPage({ onStartExpansion, roughDraft, onGoToBrief, onTabChange, onShowHistory }) {
  return (
    <div className="min-h-screen pb-10" style={{ background: "#000" }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <Link to="/AppStoreV2" className="text-[12px] font-medium transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}>← Store</Link>
        <button onClick={onShowHistory} className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-all"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
          <History className="w-3.5 h-3.5" /> History
        </button>
      </div>

      {/* Title */}
      <div className="px-5 pb-6">
        <h1 className="font-[900] text-[2.6rem] leading-[0.92] uppercase tracking-tight text-white">
          00<br /><span style={{ color: "rgba(255,255,255,0.35)" }}>Story</span><br /><span style={{ color: "rgba(255,255,255,0.15)" }}>Studio</span>
        </h1>
        <p className="text-[13px] mt-3 max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
          Turn any idea into a 40-page book. Turn any book into a film-ready script.
        </p>
      </div>

      {/* Resume banner */}
      {roughDraft && (
        <div className="mx-5 mb-5 rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.25)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(10,132,255,0.2)" }}>
            <BookOpen className="w-5 h-5" style={{ color: "#0a84ff" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-[700] text-white truncate">{roughDraft.title}</p>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{roughDraft.chapterCount || "?"} chapters · {roughDraft.targetPages || "?"} pages</p>
          </div>
          <button onClick={onGoToBrief} className="flex items-center gap-1 text-[12px] font-[700] flex-shrink-0" style={{ color: "#0a84ff" }}>
            Resume <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Feature cards — desktop horizontal */}
      <div className="hidden sm:flex gap-3 px-5 overflow-x-auto pb-4" style={{ minHeight: "500px" }}>
        <button onClick={onStartExpansion}
          className="flex-shrink-0 rounded-2xl overflow-hidden flex flex-col justify-end p-5 cursor-pointer active:scale-95 transition-transform"
          style={{ width: "180px", minHeight: "480px", background: "linear-gradient(180deg, #0c0c0e 0%, #000 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-white font-[900] text-[1.8rem] leading-[1] uppercase text-left">THE<br />CINEMA<br />SCHEDULE</h2>
          <p className="text-[11px] font-bold mt-2" style={{ color: "#0a84ff" }}>Start →</p>
        </button>
        {FEATURE_CARDS.map((card) => (
          <button key={card.title} onClick={() => onTabChange(card.tab)}
            className="relative flex-1 rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform"
            style={{ minHeight: "480px", minWidth: "160px", border: `1.5px solid ${card.borderColor}` }}>
            <img src={card.img} alt={card.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-[900] text-[1rem] leading-tight mb-1">{card.title}</h3>
              <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                <span className="font-bold" style={{ color: card.tagColor }}>{card.tag}</span> — {card.desc}
              </p>
              {card.tab !== "home" && <p className="mt-2 text-[11px] font-bold" style={{ color: card.tagColor }}>Open →</p>}
            </div>
          </button>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden px-5 space-y-3">
        <button onClick={onStartExpansion}
          className="w-full rounded-2xl overflow-hidden flex items-center gap-4 p-4 active:scale-[0.98] transition-transform"
          style={{ background: "rgba(10,132,255,0.08)", border: "1.5px solid rgba(10,132,255,0.35)" }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(10,132,255,0.15)" }}>
            <Mic className="w-5 h-5" style={{ color: "#0a84ff" }} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#0a84ff" }}>Begin</p>
            <h3 className="text-white font-[900] text-[1rem]">Start Expansion</h3>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Voice or text brainstorm with 00</p>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }} />
        </button>
        {FEATURE_CARDS.map((card) => (
          <button key={card.title} onClick={() => onTabChange(card.tab)}
            className="relative w-full rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform"
            style={{ height: "180px", border: `1.5px solid ${card.borderColor}` }}>
            <img src={card.img} alt={card.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
              <div>
                <h3 className="text-white font-[900] text-[1rem] leading-tight">{card.title}</h3>
                <p className="text-[10px] font-bold" style={{ color: card.tagColor }}>{card.tag}</p>
              </div>
              {card.tab !== "home" && <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: card.tagColor }} />}
            </div>
          </button>
        ))}
      </div>

      <div className="text-center mt-10 px-5 space-y-1">
        <p className="text-[10px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.2)" }}>Production Pipeline</p>
        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>01 Expansion → 02 Brief Agent → 03 Chapter + Scene Studio</p>
      </div>
    </div>
  );
}