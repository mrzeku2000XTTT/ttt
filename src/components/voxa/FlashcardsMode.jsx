import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Loader2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { LEARN_LANGUAGES, MULTILANG_FONT, speakText } from "./voxaLanguages";

const CATEGORIES = [
  { id: "greetings", label: "Greetings" },
  { id: "food", label: "Food & Dining" },
  { id: "travel", label: "Travel" },
  { id: "shopping", label: "Shopping" },
  { id: "numbers", label: "Numbers & Time" },
  { id: "emergency", label: "Emergency" },
];

export default function FlashcardsMode({ language }) {
  const [category, setCategory] = useState("greetings");
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const langName = LEARN_LANGUAGES.find((l) => l.code === language)?.name || language;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setCards([]);
      setIdx(0);
      setRevealed(false);
      try {
        const r = await base44.integrations.Core.InvokeLLM({
          prompt: `Give me 10 essential ${langName} phrases for "${category}". For each, return: english (the English phrase), translation (in ${langName}), pronunciation (a romanized/phonetic guide for English speakers).`,
          response_json_schema: {
            type: "object",
            properties: {
              cards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    english: { type: "string" },
                    translation: { type: "string" },
                    pronunciation: { type: "string" },
                  },
                },
              },
            },
          },
        });
        if (!cancelled) setCards(Array.isArray(r?.cards) ? r.cards : []);
      } catch {}
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [language, category, langName]);

  const next = () => { setRevealed(false); setIdx((i) => Math.min(i + 1, cards.length - 1)); };
  const prev = () => { setRevealed(false); setIdx((i) => Math.max(i - 1, 0)); };

  const card = cards[idx];

  return (
    <div>
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${
              category === c.id
                ? "bg-cyan-500/25 border-cyan-400/50 text-cyan-200"
                : "bg-white/6 border-white/12 text-white/60 hover:bg-white/12"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="mt-4 relative h-72">
        {loading ? (
          <div className="absolute inset-0 rounded-3xl bg-white/8 backdrop-blur-2xl border border-white/12 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-white/50 text-sm">Loading {langName} flashcards…</span>
          </div>
        ) : !card ? (
          <div className="absolute inset-0 rounded-3xl bg-white/8 backdrop-blur-2xl border border-white/12 flex items-center justify-center text-white/40 text-sm">
            No cards available.
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.button
              key={`${category}-${idx}-${revealed}`}
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.3 }}
              onClick={() => setRevealed((r) => !r)}
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 backdrop-blur-2xl border border-white/15 p-6 flex flex-col items-center justify-center text-center shadow-2xl hover:border-white/25 transition-colors"
            >
              {!revealed ? (
                <>
                  <span className="text-white/40 text-[10px] uppercase tracking-widest mb-3">English</span>
                  <p className="text-white text-3xl font-bold leading-tight">{card.english}</p>
                  <span className="text-white/30 text-xs mt-6">Tap to reveal</span>
                </>
              ) : (
                <>
                  <span className="text-cyan-300/70 text-[10px] uppercase tracking-widest mb-3">{langName}</span>
                  <p className="text-white text-3xl font-bold leading-tight" style={{ fontFamily: MULTILANG_FONT }}>
                    {card.translation}
                  </p>
                  {card.pronunciation && (
                    <p className="text-cyan-300/80 text-base mt-3 italic">{card.pronunciation}</p>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); speakText(card.translation, language); }}
                    className="mt-5 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Volume2 className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-semibold">Listen</span>
                  </button>
                </>
              )}
            </motion.button>
          </AnimatePresence>
        )}
      </div>

      {/* Nav */}
      {cards.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={idx === 0}
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400/70" />
            <span className="text-white/60 text-sm font-semibold">{idx + 1} / {cards.length}</span>
          </div>
          <button
            onClick={next}
            disabled={idx >= cards.length - 1}
            className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-white/20 transition-all disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}