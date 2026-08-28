import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Heart, Swords, Trophy, CheckCircle2, XCircle, RotateCcw, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2a0fa1205_generated_image.png";

export default function IsolateGame({ course, moduleIdx, onUpdate, onBack }) {
  const mod = course.modules?.[moduleIdx];
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [bossName, setBossName] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [playerHP, setPlayerHP] = useState(3);
  const [bossHP, setBossHP] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameOver, setGameOver] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mod) generateGame();
  }, [moduleIdx]);

  const generateGame = async () => {
    if (!mod) return;
    setLoading(true);
    setError("");
    setSelected(null);
    setShowFeedback(false);
    setGameOver(null);
    setCurrentQ(0);
    setPlayerHP(3);
    setScore(0);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a game designer. Create a battle-quiz game based on a learning module.

Topic: ${course.topic}
Theme: ${course.theme}
Module: "${mod.title}"
Concept: "${mod.concept}"
Module content: ${mod.content}
Real facts: ${mod.real_facts}

Generate exactly 6 battle questions. Each question must have:
1. "scenario" — a short one-sentence battle scene set in the theme's world (use original characters inspired by the theme's mood, NEVER specific copyrighted names)
2. "question" — a clear question testing the real concept
3. "options" — exactly 4 options
4. "answer" — the index (0-3) of the correct option
5. "explanation" — one sentence explaining why the correct answer is right

Make questions progressively harder. Cover different aspects of the module's concept.

Return JSON:
{
  "boss_name": "A themed boss name (e.g. 'The Dragon of Variables')",
  "questions": [
    {
      "scenario": "Themed battle scene",
      "question": "The real concept question",
      "options": ["opt1","opt2","opt3","opt4"],
      "answer": 0,
      "explanation": "Why this is correct"
    }
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            boss_name: { type: "string" },
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  scenario: { type: "string" },
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  answer: { type: "number" },
                  explanation: { type: "string" },
                },
              },
            },
          },
        },
      });

      const data = typeof res === "string" ? JSON.parse(res) : res;
      const qs = data.questions || [];
      setQuestions(qs);
      setBossName(data.boss_name || "The Boss");
      setBossHP(qs.length);
    } catch (e) {
      console.error("Game generation failed", e);
      setError(e.message || "Failed to generate game.");
    } finally {
      setLoading(false);
    }
  };

  const answer = (idx) => {
    if (showFeedback || gameOver) return;
    setSelected(idx);
    setShowFeedback(true);
    const q = questions[currentQ];
    const isCorrect = idx === q.answer;

    setTimeout(() => {
      let newBossHP = bossHP;
      let newPlayerHP = playerHP;
      if (isCorrect) {
        setScore((s) => s + 100);
        newBossHP = bossHP - 1;
        setBossHP(newBossHP);
      } else {
        newPlayerHP = playerHP - 1;
        setPlayerHP(newPlayerHP);
      }
      if (newBossHP <= 0) {
        setGameOver("win");
        awardXP(150);
      } else if (newPlayerHP <= 0) {
        setGameOver("lose");
      } else if (currentQ >= questions.length - 1) {
        setGameOver("lose");
      }
    }, 2200);
  };

  const nextQuestion = () => {
    setSelected(null);
    setShowFeedback(false);
    setCurrentQ((q) => q + 1);
  };

  const awardXP = (amount) => {
    if (!course.settings?.game_mode) return;
    const newXP = (course.xp || 0) + amount;
    const newLevel = Math.floor(newXP / 500) + 1;
    const updatedCourse = { ...course, xp: newXP, level: newLevel };
    onUpdate(updatedCourse);
    base44.entities.IsolateCourse.update(course.id, { xp: newXP, level: newLevel });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin mx-auto mb-4" />
        </motion.div>
        <p className="text-zinc-500 font-medium">Generating your battle...</p>
        <p className="text-[13px] text-zinc-400 mt-1">Crafting themed challenges from this module</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex flex-col items-center justify-center">
        <p className="text-rose-500 mb-4">{error}</p>
        <button onClick={onBack} className="px-4 py-2 rounded-full bg-zinc-900 text-white text-[14px] font-medium">Back to module</button>
      </div>
    );
  }

  const q = questions[currentQ];
  const isCorrect = selected === q?.answer;

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-2xl border-b border-zinc-200/50">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[14px] font-medium">Back to module</span>
          </button>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="ISOLATE" className="w-6 h-6 rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">Concept Battle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-[14px] font-bold text-zinc-700 tabular-nums">{score}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {gameOver ? (
            <motion.div key="gameover" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className={`w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center ${gameOver === "win" ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-zinc-700 to-zinc-800"}`}
              >
                {gameOver === "win" ? <Trophy className="w-12 h-12 text-white" /> : <XCircle className="w-12 h-12 text-white" />}
              </motion.div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
                {gameOver === "win" ? "Victory!" : "Defeated"}
              </h2>
              <p className="text-zinc-500 mb-1">
                {gameOver === "win" ? "You conquered the battle and earned 150 XP!" : "The boss was too strong this time."}
              </p>
              <p className="text-[14px] text-zinc-400 mb-8">
                Final score: {score} • Questions cleared: {gameOver === "win" ? questions.length : currentQ + (isCorrect ? 1 : 0)}
              </p>
              <div className="flex gap-2 justify-center">
                <button onClick={generateGame} className="flex items-center gap-1.5 px-5 py-3 rounded-full bg-zinc-900 text-white text-[14px] font-medium hover:bg-zinc-800 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                  Play again
                </button>
                <button onClick={onBack} className="px-5 py-3 rounded-full bg-white ring-1 ring-zinc-200 text-zinc-700 text-[14px] font-medium hover:bg-zinc-50 transition-colors">
                  Back to module
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={currentQ} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              {/* Boss section */}
              <div className="rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 mb-6 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Battle {currentQ + 1} of {questions.length}</div>
                    <h3 className="text-xl font-bold tracking-tight mt-0.5">{bossName}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Heart key={i} className={`w-5 h-5 ${i < playerHP ? "text-rose-500 fill-rose-500" : "text-white/20"}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-white/50 flex-shrink-0" />
                  <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      animate={{ width: `${(bossHP / questions.length) * 100}%` }}
                      className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
                    />
                  </div>
                  <span className="text-[12px] font-bold tabular-nums text-white/70">{bossHP}/{questions.length}</span>
                </div>
              </div>

              {/* Scenario */}
              <div className="rounded-2xl bg-violet-50 ring-1 ring-violet-200 p-4 mb-4">
                <p className="text-[14px] text-violet-800 italic leading-relaxed">{q?.scenario}</p>
              </div>

              {/* Question */}
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-5">{q?.question}</h2>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {(q?.options || []).map((opt, oi) => {
                  const isSelected = selected === oi;
                  const isCorrectOpt = q?.answer === oi;
                  let cls = "ring-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800";
                  if (showFeedback && isCorrectOpt) {
                    cls = "ring-2 ring-emerald-400 bg-emerald-50 text-emerald-800 font-semibold";
                  } else if (showFeedback && isSelected && !isCorrectOpt) {
                    cls = "ring-2 ring-rose-400 bg-rose-50 text-rose-800 font-semibold";
                  } else if (showFeedback) {
                    cls = "ring-zinc-200 bg-white text-zinc-400";
                  }
                  return (
                    <button
                      key={oi}
                      onClick={() => answer(oi)}
                      disabled={showFeedback}
                      className={`w-full text-left px-5 py-4 rounded-2xl ring-1 transition-all text-[15px] flex items-center justify-between ${cls}`}
                    >
                      <span>{opt}</span>
                      {showFeedback && isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                      {showFeedback && isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {showFeedback && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-5 ${isCorrect ? "bg-emerald-50 ring-1 ring-emerald-200" : "bg-rose-50 ring-1 ring-rose-200"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="font-semibold text-emerald-900">Correct strike! +100</span><Zap className="w-4 h-4 text-amber-500 ml-auto" /></>
                      ) : (
                        <><XCircle className="w-5 h-5 text-rose-600" /><span className="font-semibold text-rose-900">You took a hit! -1 HP</span></>
                      )}
                    </div>
                    <p className="text-[14px] text-zinc-700 leading-relaxed">{q?.explanation}</p>
                    {currentQ < questions.length - 1 && (
                      <button onClick={nextQuestion} className="mt-4 w-full py-3 rounded-full bg-zinc-900 text-white text-[14px] font-medium hover:bg-zinc-800 transition-colors">
                        Next battle →
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}