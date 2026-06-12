import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Zap, Film, Mic, MicOff, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import OOExpansion from "@/components/doubleo/OOExpansion";
import OOBriefAgent from "@/components/doubleo/OOBriefAgent";
import OOChapterEditor from "@/components/doubleo/OOChapterEditor";

const TABS = [
  { id: "home", label: "Studio", icon: Film },
  { id: "expansion", label: "Expansion", icon: Sparkles },
  { id: "brief", label: "Brief Agent", icon: Zap },
  { id: "chapters", label: "Chapters", icon: BookOpen },
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
    <div className="min-h-screen bg-white text-zinc-900 font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',sans-serif]">
      {/* Subtle shader background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[60vw] h-[40vh] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #000 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 right-0 w-[50vw] h-[50vh] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #3b3b3b 0%, transparent 70%)", filter: "blur(100px)" }} />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-5 bg-white/80 backdrop-blur-2xl border-b border-zinc-100">
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors h-14 -ml-2 px-2">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[13px] font-medium">App Store</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[22px] font-[900] tracking-tighter text-zinc-900">00</span>
          <span className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase">Story Studio</span>
        </div>
        <div className="w-24" />
      </nav>

      {/* Tab bar */}
      <div className="fixed top-14 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-4xl mx-auto flex items-center gap-1 px-4 h-12 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all ${
                  active ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === "brief" && roughDraft && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="pt-[6.5rem] pb-20 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <OOHomeLanding onStartExpansion={() => setActiveTab("expansion")} roughDraft={roughDraft} onGoToBrief={() => setActiveTab("brief")} />
            </motion.div>
          )}
          {activeTab === "expansion" && (
            <motion.div key="expansion" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <OOExpansion onDraftCreated={handleDraftCreated} />
            </motion.div>
          )}
          {activeTab === "brief" && (
            <motion.div key="brief" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <OOBriefAgent roughDraft={roughDraft} onGoToChapters={() => setActiveTab("chapters")} />
            </motion.div>
          )}
          {activeTab === "chapters" && (
            <motion.div key="chapters" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              <OOChapterEditor roughDraft={roughDraft} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OOHomeLanding({ onStartExpansion, roughDraft, onGoToBrief }) {
  return (
    <div className="max-w-3xl mx-auto px-5">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="text-center py-16 sm:py-24">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-[28px] bg-zinc-900 mb-8 shadow-2xl shadow-zinc-900/30">
          <span className="text-5xl font-[900] text-white tracking-tighter">00</span>
        </div>
        <h1 className="text-[clamp(2.5rem,7vw,5rem)] font-[900] tracking-tight leading-[0.9] mb-5">
          Your story.<br />
          <span className="text-zinc-400">Becomes a film.</span>
        </h1>
        <p className="text-zinc-500 text-base sm:text-lg max-w-md mx-auto leading-relaxed mb-10">
          Brainstorm with voice. Build your book chapter by chapter. Let 00's agents transform your story into a movie-ready production.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onStartExpansion}
            className="flex items-center gap-2 px-8 py-3.5 bg-zinc-900 text-white text-[14px] font-semibold rounded-full hover:bg-zinc-800 active:scale-95 transition-all shadow-lg shadow-zinc-900/20"
          >
            <Sparkles className="w-4 h-4" /> Start Expansion
          </button>
          {roughDraft && (
            <button
              onClick={onGoToBrief}
              className="flex items-center gap-2 px-8 py-3.5 border border-zinc-200 text-zinc-700 text-[14px] font-semibold rounded-full hover:bg-zinc-50 active:scale-95 transition-all"
            >
              Continue with Brief Agent <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          { icon: "🎙", title: "Voice Brainstorm", desc: "Talk to 00. Your mic becomes your pen." },
          { icon: "📖", title: "Book Builder", desc: "Chapter-by-chapter with AI guidance and structure." },
          { icon: "🎬", title: "Movie-Ready", desc: "Every scene gets mood, lighting & cinematic direction." },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <div className="text-[14px] font-bold text-zinc-900 mb-1">{f.title}</div>
            <div className="text-[12px] text-zinc-500 leading-relaxed">{f.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Workflow */}
      <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6 mb-8">
        <h2 className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest mb-5">How it works</h2>
        <div className="space-y-4">
          {[
            { step: "01", title: "Expansion Mode", desc: "Brainstorm your story idea with voice or text. Upload references — images, music, scripts, video." },
            { step: "02", title: "Brief Agent", desc: "Your rough draft gets organized into tasks, scenes, and structure by the Brief Agent." },
            { step: "03", title: "Chapter Editor", desc: "Write each chapter with AI co-writing. Every scene auto-generates mood, lighting, and cinematic notes." },
          ].map((s) => (
            <div key={s.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-[900] text-white">{s.step}</span>
              </div>
              <div>
                <div className="text-[13px] font-bold text-zinc-900">{s.title}</div>
                <div className="text-[12px] text-zinc-500 leading-relaxed mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}