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

  return (
    <div className="min-h-screen bg-[#08090c] text-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-5 bg-[#08090c]/80 backdrop-blur-xl border-b border-white/5">
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors h-14 -ml-2 px-2">
          <span className="text-[13px] font-medium">← Store</span>
        </Link>

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {NAV_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id === "engineer" || tab.id === "canvas" ? "chapters" : tab.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-cyan-500 text-black font-bold"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
                {tab.id === "brief" && roughDraft && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setActiveTab("expansion")}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black text-[12px] font-bold rounded-full hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/30"
        >
          <Sparkles className="w-3.5 h-3.5" /> Start Now
        </button>
      </nav>

      {/* ── Content ── */}
      <div className="pt-14">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
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
              <div className="max-w-3xl mx-auto px-0 sm:px-4 pt-4">
                <OOExpansion onDraftCreated={handleDraftCreated} />
              </div>
            </motion.div>
          )}
          {activeTab === "brief" && (
            <motion.div key="brief" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <div className="max-w-3xl mx-auto px-0 sm:px-4 pt-4">
                <OOBriefAgent roughDraft={roughDraft} onGoToChapters={() => setActiveTab("chapters")} />
              </div>
            </motion.div>
          )}
          {activeTab === "chapters" && (
            <motion.div key="chapters" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <div className="max-w-4xl mx-auto px-0 sm:px-4 pt-4">
                <OOChapterEditor roughDraft={roughDraft} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OOLandingPage({ onStartExpansion, roughDraft, onGoToBrief, onTabChange }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const prevSlide = () => setActiveSlide((p) => (p - 1 + FEATURE_CARDS.length) % FEATURE_CARDS.length);
  const nextSlide = () => setActiveSlide((p) => (p + 1) % FEATURE_CARDS.length);

  return (
    <div className="min-h-screen bg-black pb-20">

      {/* ── Cinematic Card Slideshow ── */}
      <div className="relative flex items-center justify-center px-4 sm:px-12 py-4" style={{ minHeight: "520px" }}>

        {/* Left arrow */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Cards row */}
        <div className="flex items-stretch gap-3 w-full max-w-6xl overflow-hidden">

          {/* Hero / title card */}
          <div
            className="flex-shrink-0 rounded-2xl overflow-hidden border-2 border-white/20 flex flex-col justify-end p-5 cursor-pointer"
            style={{ width: "200px", minHeight: "460px", background: "linear-gradient(180deg, #111 0%, #000 100%)" }}
            onClick={onStartExpansion}
          >
            <h2 className="text-white font-[900] text-[2rem] leading-[1] uppercase">
              THE<br />CINEMA<br />SEDULE
            </h2>
          </div>

          {/* Feature cards */}
          {FEATURE_CARDS.map((card, i) => {
            const isActive = i === activeSlide;
            return (
              <motion.button
                key={card.title}
                onClick={() => { setActiveSlide(i); onTabChange(card.tab); }}
                className="relative flex-1 rounded-2xl overflow-hidden text-left flex-shrink-0"
                style={{
                  minHeight: "460px",
                  border: `2px solid ${card.borderColor}`,
                  boxShadow: isActive ? `0 0 24px ${card.borderColor}55` : "none",
                  minWidth: 0,
                }}
                animate={{ scale: isActive ? 1.02 : 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Full-bleed image */}
                <img
                  src={card.img}
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Dark gradient at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Text overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-[900] text-[1.1rem] leading-tight mb-1">{card.title}</h3>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    <span className="font-bold mr-1" style={{ color: card.tagColor }}>{card.tag}</span>
                    — {card.desc}
                  </p>
                  {card.tab !== "home" && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold" style={{ color: card.tagColor }}>
                      Open →
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 z-20 w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Stats + Pipeline bar ── */}
      <div className="text-center mt-4 space-y-2">
        <p className="text-white text-lg font-semibold">
          3+ Story Agents &nbsp;|&nbsp; ∞ File Types &nbsp;|&nbsp; Book Output Format
        </p>
        <p className="text-zinc-500 text-sm tracking-widest uppercase">
          PRODUCTION PIPELINE:&nbsp;
          <span className="text-zinc-400">01 Expansion</span>
          <span className="text-zinc-600 mx-2">|</span>
          <span className="text-zinc-400">02 Brief Agent</span>
          <span className="text-zinc-600 mx-2">|</span>
          <span className="text-zinc-400">03 Chapter Studio</span>
        </p>
      </div>
    </div>
  );
}