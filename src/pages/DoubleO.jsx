import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, BookOpen, Film, Mic, ChevronRight, ArrowRight, Radio, Clapperboard, FileText, Cpu, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

import OOExpansion from "@/components/doubleo/OOExpansion";
import OOBriefAgent from "@/components/doubleo/OOBriefAgent";
import OOChapterEditor from "@/components/doubleo/OOChapterEditor";

const NAV_TABS = [
  { id: "home", label: "Command" },
  { id: "expansion", label: "Expansion" },
  { id: "brief", label: "Brief Agent" },
  { id: "chapters", label: "Chapters" },
  { id: "engineer", label: "Engineer" },
  { id: "canvas", label: "Canvas" },
];

const FEATURE_CARDS = [
  {
    img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e1b0bd70e_generated_image.png",
    borderColor: "#00bfff",
    title: "Voice Expansion",
    desc: "Speak your story idea. 00 listens, analyzes, and builds your world in real time.",
    tag: "ACTIVE",
    tagColor: "#00bfff",
    tab: "expansion",
  },
  {
    img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b9d1a2d06_generated_image.png",
    borderColor: "#ffd700",
    title: "Brief Agent",
    desc: "Command center. Organizes your rough draft into scenes, tasks, and sub-agents.",
    tag: "READY",
    tagColor: "#ffd700",
    tab: "brief",
  },
  {
    img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/32bf43779_generated_image.png",
    borderColor: "#00e676",
    title: "Chapter Studio",
    desc: "Write each chapter with cinematic mood, lighting, and camera direction auto-generated.",
    tag: "STUDIO",
    tagColor: "#00e676",
    tab: "chapters",
  },
  {
    img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2e4ef678a_generated_image.png",
    borderColor: "#ff3d3d",
    title: "Movie Engine",
    desc: "Every scene gets enhanced into a movie-ready prompt with visual direction.",
    tag: "COMING",
    tagColor: "#ff3d3d",
    tab: "home",
  },
];

const STAT_CARDS = [
  { label: "Story Agents", value: "3+", sub: "Working in parallel" },
  { label: "File Types", value: "∞", sub: "Images, audio, video, code" },
  { label: "Output Format", value: "Book", sub: "Movie-ready scripts" },
];

export default function DoubleOPage() {
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);
  const [roughDraft, setRoughDraft] = useState(() => {
    try { return JSON.parse(localStorage.getItem("oo_rough_draft") || "null"); } catch { return null; }
  });

  const handleDraftCreated = (draft) => {
    setRoughDraft(draft);
    localStorage.setItem("oo_rough_draft", JSON.stringify(draft));
    setActiveTab("brief");
  };

  const isHome = activeTab === "home";

  return (
    <div className="min-h-screen bg-[#08090c] text-white overflow-x-hidden">

      {/* ── Floating bottom tab bar (always visible on inner pages) ── */}
      {!isHome && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1.5 shadow-2xl">
          <button
            onClick={() => setActiveTab("home")}
            className="px-3 py-1.5 rounded-full text-zinc-500 hover:text-white text-[12px] font-medium transition-all hover:bg-white/5"
          >
            ← Home
          </button>
          <div className="w-px h-4 bg-white/10" />
          {[
            { id: "expansion", label: "Expansion" },
            { id: "brief", label: "Brief" },
            { id: "chapters", label: "Chapters" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                activeTab === t.id
                  ? "bg-cyan-500 text-black font-bold"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t.label}
              {t.id === "brief" && roughDraft && activeTab !== "brief" && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 ml-1 align-middle" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {isHome && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <OOLandingPage
              onStartExpansion={() => setActiveTab("expansion")}
              roughDraft={roughDraft}
              onGoToBrief={() => setActiveTab("brief")}
              onTabChange={setActiveTab}
            />
          </motion.div>
        )}
        {activeTab === "expansion" && (
          <motion.div key="expansion" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="max-w-3xl mx-auto px-0 sm:px-4 pt-2">
              <OOExpansion onDraftCreated={handleDraftCreated} />
            </div>
          </motion.div>
        )}
        {activeTab === "brief" && (
          <motion.div key="brief" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="max-w-3xl mx-auto px-0 sm:px-4 pt-2">
              <OOBriefAgent roughDraft={roughDraft} onGoToChapters={() => setActiveTab("chapters")} />
            </div>
          </motion.div>
        )}
        {activeTab === "chapters" && (
          <motion.div key="chapters" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="max-w-4xl mx-auto px-0 sm:px-4 pt-2">
              <OOChapterEditor roughDraft={roughDraft} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OOLandingPage({ onStartExpansion, roughDraft, onGoToBrief, onTabChange }) {
  return (
    <div className="min-h-screen bg-black pb-10">

      {/* ── Back to store ── */}
      <div className="px-4 pt-5 pb-3">
        <Link to="/AppStoreV2" className="text-zinc-600 hover:text-zinc-400 text-[12px] font-medium transition-colors">
          ← Store
        </Link>
      </div>

      {/* ── Title ── */}
      <div className="px-4 pb-4">
        <h1 className="text-white font-[900] text-[2.2rem] leading-[0.95] uppercase tracking-tight">
          00<br /><span className="text-zinc-500">Story</span><br /><span className="text-zinc-700">Studio</span>
        </h1>
        <p className="text-zinc-500 text-[12px] mt-2 max-w-xs leading-relaxed">
          Turn any idea into a book. Turn any book into a film.
        </p>
      </div>

      {/* ── Desktop: horizontal slideshow | Mobile: vertical stack ── */}

      {/* DESKTOP */}
      <div className="hidden sm:flex gap-3 px-4 overflow-x-auto pb-4" style={{ minHeight: "500px" }}>
        {/* Hero card */}
        <button
          onClick={onStartExpansion}
          className="flex-shrink-0 rounded-2xl overflow-hidden border-2 border-white/20 flex flex-col justify-end p-5 cursor-pointer active:scale-95 transition-transform"
          style={{ width: "180px", minHeight: "480px", background: "linear-gradient(180deg, #111 0%, #000 100%)" }}
        >
          <h2 className="text-white font-[900] text-[1.8rem] leading-[1] uppercase text-left">
            THE<br />CINEMA<br />SCHEDULE
          </h2>
          <p className="text-cyan-400 text-[11px] font-bold mt-2">Start →</p>
        </button>

        {/* Feature cards */}
        {FEATURE_CARDS.map((card) => (
          <button
            key={card.title}
            onClick={() => onTabChange(card.tab)}
            className="relative flex-1 rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform"
            style={{ minHeight: "480px", minWidth: "160px", border: `2px solid ${card.borderColor}` }}
          >
            <img src={card.img} alt={card.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-[900] text-[1rem] leading-tight mb-1">{card.title}</h3>
              <p className="text-[10px] text-zinc-300 leading-relaxed">
                <span className="font-bold" style={{ color: card.tagColor }}>{card.tag}</span> — {card.desc}
              </p>
              {card.tab !== "home" && (
                <p className="mt-2 text-[11px] font-bold" style={{ color: card.tagColor }}>Open →</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* MOBILE: vertical stack of cards */}
      <div className="sm:hidden px-4 space-y-3">
        {/* Start card */}
        <button
          onClick={onStartExpansion}
          className="w-full rounded-2xl overflow-hidden border-2 border-cyan-500/50 flex items-center gap-4 p-4 active:scale-[0.98] transition-transform"
          style={{ background: "linear-gradient(135deg, #0a1a2a 0%, #000 100%)" }}
        >
          <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Mic className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="text-left">
            <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest">Begin</p>
            <h3 className="text-white font-[900] text-[1rem]">Start Expansion</h3>
            <p className="text-zinc-500 text-[11px]">Voice or text brainstorm with 00</p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-600 ml-auto flex-shrink-0" />
        </button>

        {/* Feature cards */}
        {FEATURE_CARDS.map((card) => (
          <button
            key={card.title}
            onClick={() => onTabChange(card.tab)}
            className="relative w-full rounded-2xl overflow-hidden text-left active:scale-[0.98] transition-transform"
            style={{ height: "180px", border: `2px solid ${card.borderColor}` }}
          >
            <img src={card.img} alt={card.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
              <div>
                <h3 className="text-white font-[900] text-[1rem] leading-tight">{card.title}</h3>
                <p className="text-[10px] font-bold" style={{ color: card.tagColor }}>{card.tag}</p>
              </div>
              {card.tab !== "home" && (
                <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: card.tagColor }} />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* ── Pipeline ── */}
      <div className="text-center mt-8 px-4 space-y-1">
        <p className="text-zinc-600 text-[11px] tracking-widest uppercase">Production Pipeline</p>
        <p className="text-zinc-400 text-[12px]">01 Expansion → 02 Brief Agent → 03 Chapter Studio</p>
      </div>
    </div>
  );
}