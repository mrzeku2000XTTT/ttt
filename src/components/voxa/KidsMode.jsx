import React, { useEffect, useMemo, useState } from "react";
import { Volume2, Sparkles, Trophy, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { LEARN_LANGUAGES, MULTILANG_FONT, speakText } from "./voxaLanguages";

// Kid-friendly themes — picture-first, simple, colorful.
// Inspired by Duolingo ABC, Gus on the Go, Lingokids, Pili Pop:
//  - audio-first (kids may not read yet)
//  - emoji/picture-word matching
//  - bright big tiles, instant feedback, celebrations
const THEMES = [
  { id: "animals", label: "Animals", emoji: "🐻", color: "from-amber-400/40 to-orange-500/40" },
  { id: "colors", label: "Colors", emoji: "🎨", color: "from-pink-400/40 to-rose-500/40" },
  { id: "numbers", label: "Numbers", emoji: "🔢", color: "from-blue-400/40 to-cyan-500/40" },
  { id: "food", label: "Food", emoji: "🍎", color: "from-red-400/40 to-orange-500/40" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧", color: "from-purple-400/40 to-fuchsia-500/40" },
  { id: "body", label: "Body", emoji: "🖐️", color: "from-emerald-400/40 to-teal-500/40" },
];

// Curated emoji+English seed words per theme. We send these to the LLM and ask
// it ONLY for the translation + pronunciation — keeps responses fast & reliable
// (no risk of made-up emojis or weird answers).
const SEED_WORDS = {
  animals: [
    { word: "Dog", emoji: "🐶" }, { word: "Cat", emoji: "🐱" }, { word: "Cow", emoji: "🐮" },
    { word: "Pig", emoji: "🐷" }, { word: "Lion", emoji: "🦁" }, { word: "Bear", emoji: "🐻" },
    { word: "Frog", emoji: "🐸" }, { word: "Bird", emoji: "🐦" },
  ],
  colors: [
    { word: "Red", emoji: "🟥" }, { word: "Blue", emoji: "🟦" }, { word: "Yellow", emoji: "🟨" },
    { word: "Green", emoji: "🟩" }, { word: "Pink", emoji: "🩷" }, { word: "Orange", emoji: "🟧" },
    { word: "Purple", emoji: "🟪" }, { word: "Black", emoji: "⬛" },
  ],
  numbers: [
    { word: "One", emoji: "1️⃣" }, { word: "Two", emoji: "2️⃣" }, { word: "Three", emoji: "3️⃣" },
    { word: "Four", emoji: "4️⃣" }, { word: "Five", emoji: "5️⃣" }, { word: "Six", emoji: "6️⃣" },
    { word: "Seven", emoji: "7️⃣" }, { word: "Eight", emoji: "8️⃣" },
  ],
  food: [
    { word: "Apple", emoji: "🍎" }, { word: "Banana", emoji: "🍌" }, { word: "Bread", emoji: "🍞" },
    { word: "Milk", emoji: "🥛" }, { word: "Egg", emoji: "🥚" }, { word: "Cheese", emoji: "🧀" },
    { word: "Pizza", emoji: "🍕" }, { word: "Cake", emoji: "🍰" },
  ],
  family: [
    { word: "Mom", emoji: "👩" }, { word: "Dad", emoji: "👨" }, { word: "Baby", emoji: "👶" },
    { word: "Sister", emoji: "👧" }, { word: "Brother", emoji: "👦" }, { word: "Grandma", emoji: "👵" },
    { word: "Grandpa", emoji: "👴" }, { word: "Family", emoji: "👨‍👩‍👧" },
  ],
  body: [
    { word: "Hand", emoji: "✋" }, { word: "Eye", emoji: "👁️" }, { word: "Ear", emoji: "👂" },
    { word: "Nose", emoji: "👃" }, { word: "Mouth", emoji: "👄" }, { word: "Foot", emoji: "🦶" },
    { word: "Hair", emoji: "💇" }, { word: "Tooth", emoji: "🦷" },
  ],
};

function pickRandom(arr, n, exclude = []) {
  const pool = arr.filter((x) => !exclude.includes(x));
  const out = [];
  while (out.length < n && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export default function KidsMode({ language }) {
  const [theme, setTheme] = useState("animals");
  const [words, setWords] = useState([]); // [{ word, emoji, translation, pronunciation }]
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("explore"); // "explore" | "match" | "celebrate"
  const [stars, setStars] = useState(0);
  const [matchRound, setMatchRound] = useState(null); // { target, options }
  const [picked, setPicked] = useState(null);

  const langName = LEARN_LANGUAGES.find((l) => l.code === language)?.name || language;

  // Translate the seed list for the chosen theme
  useEffect(() => {
    let cancelled = false;
    async function translate() {
      setLoading(true);
      setWords([]);
      setStars(0);
      setView("explore");
      setMatchRound(null);
      const seeds = SEED_WORDS[theme] || [];
      try {
        const r = await base44.integrations.Core.InvokeLLM({
          prompt: `Translate these English words to ${langName} for a young child (age 3-8). For each, return the translation in ${langName} (native script) and a simple romanized pronunciation a kid could read aloud. Words: ${seeds.map((s) => s.word).join(", ")}`,
          response_json_schema: {
            type: "object",
            properties: {
              items: {
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
        if (cancelled) return;
        const map = {};
        (r?.items || []).forEach((it) => { map[(it.english || "").toLowerCase()] = it; });
        const merged = seeds.map((s) => {
          const t = map[s.word.toLowerCase()] || {};
          return { word: s.word, emoji: s.emoji, translation: t.translation || s.word, pronunciation: t.pronunciation || "" };
        });
        setWords(merged);
      } catch {}
      if (!cancelled) setLoading(false);
    }
    translate();
    return () => { cancelled = true; };
  }, [theme, langName]);

  // Build a matching round when entering match mode (or after each correct answer)
  const startMatchRound = (pool = words) => {
    if (pool.length < 4) return;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const distractors = pickRandom(pool, 3, [target]);
    const options = [target, ...distractors].sort(() => Math.random() - 0.5);
    setMatchRound({ target, options });
    setPicked(null);
    // Auto-speak the target word so non-readers can play
    setTimeout(() => speakText(target.translation, language), 250);
  };

  const goToMatch = () => {
    setView("match");
    setStars(0);
    startMatchRound();
  };

  const handlePick = (option) => {
    if (picked) return;
    setPicked(option);
    if (option.word === matchRound.target.word) {
      const newStars = stars + 1;
      setStars(newStars);
      setTimeout(() => {
        if (newStars >= 5) {
          setView("celebrate");
        } else {
          startMatchRound();
        }
      }, 900);
    } else {
      // wrong → just clear after a moment, same round
      setTimeout(() => setPicked(null), 900);
    }
  };

  const matchInstruction = useMemo(() => {
    if (!matchRound) return "";
    return `Tap the picture for "${matchRound.target.translation}"`;
  }, [matchRound]);

  return (
    <div>
      {/* Theme tiles */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {THEMES.map((t) => {
          const active = t.id === theme;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                active
                  ? `bg-gradient-to-br ${t.color} border-white/50 shadow-lg scale-105`
                  : "bg-white/6 border-white/10 hover:bg-white/12"
              }`}
            >
              <span className="text-2xl">{t.emoji}</span>
              <span className={`text-[10px] font-bold ${active ? "text-white" : "text-white/70"}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-3xl bg-white/8 backdrop-blur-2xl border border-white/12 p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
          <span className="text-white/60 text-sm">Getting {langName} words ready…</span>
        </div>
      )}

      {/* EXPLORE — picture flashcards grid */}
      {!loading && view === "explore" && words.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {words.map((w, i) => (
              <motion.button
                key={`${theme}-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => speakText(w.translation, language)}
                className="rounded-3xl bg-gradient-to-br from-white/12 to-white/4 backdrop-blur-2xl border-2 border-white/15 p-4 flex flex-col items-center text-center hover:border-pink-400/50 hover:scale-[1.03] active:scale-95 transition-all shadow-xl"
              >
                <div className="text-6xl mb-2">{w.emoji}</div>
                <p className="text-white text-2xl font-black leading-tight" style={{ fontFamily: MULTILANG_FONT }}>
                  {w.translation}
                </p>
                {w.pronunciation && (
                  <p className="text-cyan-300/80 text-sm font-bold mt-1 italic">{w.pronunciation}</p>
                )}
                <p className="text-white/40 text-xs mt-1">{w.word}</p>
                <div className="mt-2 w-9 h-9 rounded-full bg-pink-500/30 border border-pink-300/50 flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-white" />
                </div>
              </motion.button>
            ))}
          </div>
          <button
            onClick={goToMatch}
            disabled={words.length < 4}
            className="mt-5 w-full py-4 rounded-3xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-lg font-black shadow-xl shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" /> Play Match Game!
          </button>
        </>
      )}

      {/* MATCH — kid game */}
      {!loading && view === "match" && matchRound && (
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <button
              onClick={() => setView("explore")}
              className="text-white/60 hover:text-white text-sm font-bold"
            >
              ← Back
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-2xl ${i < stars ? "" : "grayscale opacity-30"}`}>⭐</span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-purple-500/25 to-pink-500/25 backdrop-blur-2xl border-2 border-white/20 p-5 mb-4 text-center">
            <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-2">Find this word</p>
            <p className="text-white text-4xl font-black mb-2" style={{ fontFamily: MULTILANG_FONT }}>
              {matchRound.target.translation}
            </p>
            {matchRound.target.pronunciation && (
              <p className="text-cyan-300/90 text-base italic font-bold mb-3">{matchRound.target.pronunciation}</p>
            )}
            <button
              onClick={() => speakText(matchRound.target.translation, language)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">Hear it</span>
            </button>
            <p className="text-white/50 text-xs mt-3">{matchInstruction}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {matchRound.options.map((opt, i) => {
              const isPicked = picked?.word === opt.word;
              const isCorrect = opt.word === matchRound.target.word;
              const showResult = picked !== null;
              let cls = "bg-white/10 border-white/15 hover:bg-white/15 hover:border-white/30";
              if (showResult && isCorrect) cls = "bg-green-500/30 border-green-300/70 scale-105";
              else if (showResult && isPicked && !isCorrect) cls = "bg-red-500/30 border-red-300/70 animate-pulse";
              else if (showResult) cls = "bg-white/5 border-white/10 opacity-40";
              return (
                <motion.button
                  key={`${opt.word}-${i}`}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePick(opt)}
                  disabled={!!picked}
                  className={`aspect-square rounded-3xl border-2 backdrop-blur-2xl flex items-center justify-center text-7xl shadow-xl transition-all ${cls}`}
                >
                  {opt.emoji}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* CELEBRATE */}
      {!loading && view === "celebrate" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl bg-gradient-to-br from-yellow-400/30 via-pink-500/30 to-purple-500/30 backdrop-blur-2xl border-2 border-yellow-300/40 p-8 text-center shadow-2xl"
        >
          <AnimatePresence>
            <motion.div
              key="trophy"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="inline-block mb-4"
            >
              <Trophy className="w-20 h-20 text-yellow-300 drop-shadow-2xl" />
            </motion.div>
          </AnimatePresence>
          <h2 className="text-white text-3xl font-black mb-2">You did it! 🎉</h2>
          <p className="text-white/80 text-base mb-1">5 stars in {langName}!</p>
          <div className="text-4xl mb-5">⭐⭐⭐⭐⭐</div>
          <button
            onClick={goToMatch}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-purple-700 font-black shadow-xl hover:scale-105 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-4 h-4" /> Play Again
          </button>
        </motion.div>
      )}
    </div>
  );
}