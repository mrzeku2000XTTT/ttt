import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, BookOpen, Film, Mic, ChevronRight, ArrowRight } from "lucide-react";
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
    icon: "🎙",
    title: "Voice Expansion",
    desc: "Speak your story idea. 00 listens, analyzes, and builds your world in real time.",
    tag: "Active",
    tagColor: "bg-cyan-500",
    tab: "expansion",
  },
  {
    icon: "⚡",
    title: "Brief Agent",
    desc: "Command center. Organizes your rough draft into scenes, tasks, and sub-agents.",
    tag: "Ready",
    tagColor: "bg-violet-500",
    tab: "brief",
  },
  {
    icon: "📖",
    title: "Chapter Studio",
    desc: "Write each chapter with cinematic mood, lighting, and camera direction auto-generated.",
    tag: "Studio",
    tagColor: "bg-emerald-500",
    tab: "chapters",
  },
  {
    icon: "🎬",
    title: "Movie Engine",
    desc: "Every scene gets enhanced into a movie-ready prompt with visual direction.",
    tag: "Coming",
    tagColor: "bg-zinc-600",
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
  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-end overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/098382f40_generated_image.png"
            alt="00 Agent"
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-[#08090c]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08090c]/60 via-transparent to-[#08090c]/30" />
        </div>

        {/* Cyan glowing ring — like reference */}
        <div className="absolute top-[15%] left-[8%] w-28 h-28 rounded-full border border-cyan-400/40 flex items-center justify-center pointer-events-none"
          style={{ boxShadow: "0 0 40px rgba(0,212,255,0.15), inset 0 0 40px rgba(0,212,255,0.05)" }}>
          <div className="w-16 h-16 rounded-full border border-cyan-400/30 flex items-center justify-center"
            style={{ boxShadow: "0 0 20px rgba(0,212,255,0.2)" }}>
            <div className="w-3 h-3 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 12px rgba(0,212,255,0.8)" }} />
          </div>
        </div>

        {/* Scanning line animation */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none"
          animate={{ top: ["15%", "85%", "15%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Hero text */}
        <div className="relative z-10 w-full px-6 sm:px-10 pb-14">
          <p className="text-[11px] font-bold tracking-[0.3em] text-cyan-400 uppercase mb-3">Story Intelligence · Active</p>
          <h1 className="text-[clamp(2.8rem,8vw,6rem)] font-[900] tracking-tight leading-[0.88] mb-5 max-w-2xl">
            00<br />
            <span className="text-zinc-400">Story</span><br />
            <span className="text-zinc-600">Studio</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-md leading-relaxed mb-8">
            Turn any idea into a book. Turn any book into a film. 
            Voice-first AI agents handle the entire production pipeline.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onStartExpansion}
              className="flex items-center gap-2 px-7 py-3.5 bg-cyan-500 text-black text-[13px] font-[800] rounded-full hover:bg-cyan-400 active:scale-95 transition-all shadow-xl shadow-cyan-500/30"
            >
              <Mic className="w-4 h-4" /> Start Expansion
            </button>
            {roughDraft && (
              <button
                onClick={onGoToBrief}
                className="flex items-center gap-2 px-7 py-3.5 border border-white/20 text-white text-[13px] font-semibold rounded-full hover:bg-white/5 active:scale-95 transition-all"
              >
                Brief Agent <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Filter tabs row (like reference) ── */}
      <div className="sticky top-14 z-30 bg-[#08090c]/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between gap-3 h-12 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1">
            {["Command", "Story", "Modules", "Scene", "Compile"].map((label, i) => (
              <button key={label}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                  i === 0 ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={onStartExpansion}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 text-black text-[11px] font-bold rounded-full hover:bg-cyan-400 transition-all flex-shrink-0"
          >
            <Sparkles className="w-3 h-3" /> Assemble
          </button>
        </div>
      </div>

      {/* ── Feature cards grid (like reference) ── */}
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_CARDS.map((card, i) => (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onTabChange(card.tab)}
              className="relative text-left bg-[#111318] border border-white/8 rounded-2xl overflow-hidden hover:border-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/5 transition-all group active:scale-[0.98]"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              {/* Card image area */}
              <div className="h-36 bg-gradient-to-br from-[#1a1d24] to-[#0f1116] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0,212,255,0.15) 0%, transparent 70%)"
                }} />
                <span className="text-5xl relative z-10">{card.icon}</span>
                {/* Corner circuit decoration */}
                <div className="absolute bottom-2 right-2 w-8 h-8 border border-cyan-400/20 rounded"
                  style={{ boxShadow: "0 0 8px rgba(0,212,255,0.1)" }} />
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-cyan-400/30" />
              </div>
              {/* Card body */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-[13px] font-bold text-white leading-tight">{card.title}</h3>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-white ${card.tagColor} ml-2 flex-shrink-0`}>
                    {card.tag}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{card.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-cyan-400 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* ── Bottom stats row ── */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {STAT_CARDS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="bg-[#111318] border rounded-2xl p-4 flex items-center gap-4"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#1a1d24] flex items-center justify-center flex-shrink-0"
                style={{ boxShadow: "0 0 15px rgba(0,212,255,0.1)" }}>
                <div className="w-3 h-3 rounded-full bg-cyan-400/60" />
              </div>
              <div>
                <div className="text-[20px] font-[900] text-white leading-none">{s.value}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Workflow section ── */}
        <div className="mt-10 bg-[#111318] rounded-2xl border p-6 sm:p-8" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 8px rgba(0,212,255,0.8)" }} />
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">Production Pipeline</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Expansion", desc: "Voice or text brainstorm with 00. Upload any file for context.", icon: Mic },
              { num: "02", title: "Brief Agent", desc: "Compiles draft, assigns sub-agents, structures your book.", icon: Zap },
              { num: "03", title: "Chapter Studio", desc: "Write with AI co-pilot. Every chapter gets cinematic direction.", icon: Film },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex gap-4">
                  <div className="text-[28px] font-[900] text-white/10 leading-none flex-shrink-0">{step.num}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-[13px] font-bold text-white">{step.title}</span>
                    </div>
                    <p className="text-[12px] text-zinc-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}