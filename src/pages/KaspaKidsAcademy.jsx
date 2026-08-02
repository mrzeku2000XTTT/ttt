import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Rocket, CheckCircle2, Lock } from "lucide-react";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import { SECTIONS, ALL_CHAPTERS } from "@/components/kaspakids/academyChapters";
import KidsLesson from "@/components/kaspakids/KidsLesson";

const MASCOT = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0809726ab_generated_image.png";
const STORE_KEY = "slobz_academy_progress";

export default function KaspaKidsAcademyPage() {
  const [done, setDone] = useState({});
  const [active, setActive] = useState(null); // chapter object or null

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved) setDone(JSON.parse(saved));
    } catch {}
  }, []);

  const markLearned = (n) => {
    setDone((d) => {
      const next = { ...d, [n]: true };
      try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const doneCount = Object.keys(done).length;
  const total = ALL_CHAPTERS.length;
  const allDone = doneCount >= total;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="relative min-h-screen bg-[#e0d7f5] font-body text-[#1F1B2E] overflow-x-hidden">
      <SlobzBlobs />

      {/* TOP BAR */}
      <div className="relative z-20 flex items-center gap-3 h-14 px-3 sm:px-5 border-b border-[#7C4DFF]/15 bg-[#e0d7f5]/85 backdrop-blur-xl sticky top-0" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/AppStoreV2" className="flex items-center gap-2 text-[#5A4B8A] hover:text-[#3D2E7C] text-sm">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Store</span>
        </Link>
        <div className="flex items-center gap-2 text-sm font-display font-black text-[#3D2E7C]">🎓 <span>Slobz Trading Academy</span></div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-[#7C4DFF]/20">
          <span className="text-[10px] text-[#7f7f7f] uppercase tracking-widest font-bold">Progress</span>
          <span className="font-display font-black text-sm text-[#3D2E7C]">{doneCount}/{total}</span>
        </div>
      </div>

      {/* HERO + PROGRESS BAR */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-2 text-center">
        <motion.img
          src={MASCOT}
          alt="Slobby"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] object-cover shadow-[0_12px_30px_rgba(124,92,252,0.35)] mx-auto -rotate-3"
        />
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-display font-black text-2xl sm:text-3xl text-[#3D2E7C] tracking-tight mt-3">
          30 Chapters · Real AI Tutor 🟣
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#5A4B8A] text-sm mt-2 max-w-md mx-auto">
          Slobby (a real AI) teaches you every chapter live — with examples, analogies, quizzes, and you can ask it anything. Finish all {total} to unlock the playground.
        </motion.p>
        <div className="mt-3 h-2.5 rounded-full bg-white/70 border border-[#7C4DFF]/15 overflow-hidden max-w-md mx-auto">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-[#7C4DFF] to-[#FF8A6B] rounded-full" />
        </div>
      </div>

      {/* SECTIONS + CHAPTERS */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-4 space-y-6 pb-28">
        {SECTIONS.map((section) => (
          <div key={section.name}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: section.color }} />
              <h2 className="font-display font-black text-sm tracking-wide" style={{ color: section.color }}>{section.name}</h2>
              <span className="text-[10px] text-[#7f7f7f] font-bold">
                {section.chapters.filter((c) => done[c.n]).length}/{section.chapters.length}
              </span>
            </div>
            <div className="space-y-2">
              {section.chapters.map((c, idx) => {
                const Icon = c.icon;
                const isDone = done[c.n];
                return (
                  <motion.button
                    key={c.n}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => setActive({ ...c, section: section.name, sectionColor: section.color })}
                    className={`w-full text-left flex items-center gap-3 rounded-2xl bg-white shadow-[0_6px_18px_rgba(124,77,255,0.08)] border p-3 transition-all active:scale-[0.98] ${isDone ? "border-[#4CAF50]/40" : "border-white hover:border-[#7C4DFF]/40"}`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: section.color + "22" }}>
                      <Icon className="w-5 h-5" style={{ color: section.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded-md" style={{ background: section.color }}>{c.n}</span>
                        <span className="font-display font-extrabold text-sm text-[#1F1B2E] truncate">{c.title}</span>
                      </div>
                      <p className="text-[11px] text-[#7f7f7f] truncate mt-0.5">{c.keyIdea}</p>
                    </div>
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-[#4CAF50] flex-shrink-0" />
                    ) : (
                      <span className="text-[10px] font-black text-[#9f8fbf] uppercase tracking-widest flex-shrink-0">Learn</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}

        {/* FINAL GATE */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 text-center border ${allDone ? "bg-gradient-to-br from-[#7C4DFF] to-[#6b3fe0] border-transparent" : "bg-white border-[#e6d9fb]"}`}
        >
          {allDone ? (
            <>
              <div className="text-3xl mb-1">🎉</div>
              <h3 className="font-display font-black text-lg text-white">You finished all {total} chapters!</h3>
              <p className="text-white/80 text-sm mt-1 mb-3">You're a Slobz Trading Graduate. Enter the playground like a pro.</p>
              <Link to="/KaspaKids" className="inline-flex items-center gap-1.5 h-11 px-6 rounded-full bg-white text-[#3D2E7C] font-display font-extrabold text-sm shadow-lg">
                <Rocket className="w-4 h-4" /> Enter the Playground
              </Link>
            </>
          ) : (
            <>
              <div className="text-2xl mb-1"><Lock className="w-7 h-7 mx-auto text-[#7C4DFF]" /></div>
              <h3 className="font-display font-black text-base text-[#1F1B2E]">Unlock the playground</h3>
              <p className="text-[#7f7f7f] text-xs mt-1">{total - doneCount} chapter(s) left — tap any chapter to learn with Slobby.</p>
            </>
          )}
        </motion.div>
      </div>

      {/* FLOATING CTA when all done */}
      {allDone && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 px-2 w-full max-w-sm">
          <Link to="/KaspaKids" className="flex items-center justify-center gap-1.5 h-12 w-full rounded-full bg-gradient-to-r from-[#FF8A6B] to-[#F96B4C] text-white font-display font-extrabold text-sm shadow-[0_12px_30px_rgba(249,107,76,0.45)]">
            <Rocket className="w-4 h-4" /> Enter the Playground →
          </Link>
        </motion.div>
      )}

      {active && (
        <KidsLesson chapter={active} onClose={() => setActive(null)} onLearned={markLearned} />
      )}
    </div>
  );
}