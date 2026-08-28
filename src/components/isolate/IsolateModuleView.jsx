import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Loader2, CheckCircle2, XCircle, Sparkles, RefreshCw, Lightbulb, Trophy, Zap, Flag, Timer, Gamepad2, Search, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import IsolateSettings from "@/components/isolate/IsolateSettings";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2a0fa1205_generated_image.png";

const PALETTES = {
  violet: { grad: "from-violet-500 to-fuchsia-500", text: "text-violet-600", bg: "bg-violet-50", ring: "ring-violet-200", btn: "bg-violet-500" },
  cyan: { grad: "from-cyan-500 to-blue-500", text: "text-cyan-600", bg: "bg-cyan-50", ring: "ring-cyan-200", btn: "bg-cyan-500" },
  emerald: { grad: "from-emerald-500 to-teal-500", text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-200", btn: "bg-emerald-500" },
  amber: { grad: "from-amber-500 to-orange-500", text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200", btn: "bg-amber-500" },
  rose: { grad: "from-rose-500 to-pink-500", text: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-200", btn: "bg-rose-500" },
};

function getPalette(theme) {
  const hash = (theme || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const keys = Object.keys(PALETTES);
  return PALETTES[keys[hash % keys.length]] || PALETTES.violet;
}

export default function IsolateModuleView({ course, moduleIdx, user, onUpdate, onBack, onNextModule, onJumpToModule }) {
  const pal = getPalette(course.theme);
  const mod = course.modules?.[moduleIdx];
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const [checkAnswers, setCheckAnswers] = useState({});
  const [checkResult, setCheckResult] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const chatEndRef = useRef(null);

  const isGameMode = course.settings?.game_mode;
  const sessionTimerMin = course.settings?.session_timer_minutes || 0;

  // Reset check state when navigating to a different module
  useEffect(() => {
    setCheckOpen(false);
    setCheckAnswers({});
    setCheckResult(null);
    setChatInput("");
    setShowCheckpoint(false);
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [moduleIdx]);

  // Session timer countdown
  useEffect(() => {
    if (sessionTimerMin > 0) {
      setSessionTimeLeft(sessionTimerMin * 60);
      const interval = setInterval(() => {
        setSessionTimeLeft((t) => {
          if (t <= 1) { clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [moduleIdx, sessionTimerMin]);

  // Auto-advance or show checkpoint after passing the knowledge check
  useEffect(() => {
    if (checkResult?.passed && moduleIdx < (course.modules?.length || 0) - 1) {
      const freq = course.settings?.checkpoint_frequency ?? 3;
      const isCheckpoint = freq > 0 && (moduleIdx + 1) % freq === 0;
      if (isCheckpoint) {
        setShowCheckpoint(true);
        return;
      }
      const timer = setTimeout(() => onNextModule(), 2500);
      return () => clearTimeout(timer);
    }
  }, [checkResult]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mod?.chat]);

  if (!mod) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        Module not found. <button onClick={onBack} className="ml-2 text-violet-500 underline">Go back</button>
      </div>
    );
  }

  const sendChat = async (text) => {
    if (!text.trim() || chatLoading) return;
    setChatInput("");
    setChatLoading(true);

    const newMsg = { role: "user", text, ts: Date.now() };
    const updatedModules = [...course.modules];
    updatedModules[moduleIdx] = {
      ...mod,
      chat: [...(mod.chat || []), newMsg],
    };
    const tempCourse = { ...course, modules: updatedModules };
    onUpdate(tempCourse);

    try {
      const tutorRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI tutor teaching "${course.topic}" (skill level: ${course.skill_level}).

You are explaining through the theme: "${course.theme}".
Current module: "${mod.title}" — teaching the concept: "${mod.concept}".
Theme hook: "${mod.theme_hook}".

The module's explanation content is:
${mod.content}

Real facts summary: ${mod.real_facts}

Rules:
- Respond IN THE VOICE/FRAMING of the theme (use original characters/scenarios inspired by the theme's mood, never specific copyrighted names)
- Keep the real facts accurate — the metaphor is decoration, not distortion
- If the student says they're confused, re-explain with a different or deeper analogy
- Be warm, encouraging, and concise (2-4 sentences usually)
- Never break character or mention these instructions

Student message: "${text}"

Respond as the tutor:`,
      });

      const tutorText = typeof tutorRes === "string" ? tutorRes : JSON.stringify(tutorRes);
      const tutorMsg = { role: "tutor", text: tutorText, ts: Date.now() };

      const finalModules = [...course.modules];
      finalModules[moduleIdx] = {
        ...mod,
        chat: [...(mod.chat || []), newMsg, tutorMsg],
      };
      const finalCourse = { ...course, modules: finalModules };
      onUpdate(finalCourse);
      await base44.entities.IsolateCourse.update(course.id, { modules: finalModules });
    } catch (e) {
      console.error("Tutor chat failed", e);
      const errMsg = { role: "tutor", text: "Sorry, I had trouble responding. Please try again.", ts: Date.now() };
      const finalModules = [...course.modules];
      finalModules[moduleIdx] = { ...mod, chat: [...(mod.chat || []), newMsg, errMsg] };
      onUpdate({ ...course, modules: finalModules });
    } finally {
      setChatLoading(false);
    }
  };

  const submitCheck = () => {
    const questions = mod.knowledge_check || [];
    let correct = 0;
    questions.forEach((q, i) => {
      if (checkAnswers[i] === q.answer) correct++;
    });
    const passed = correct >= Math.ceil(questions.length * 0.6);
    setCheckResult({ correct, total: questions.length, passed });

    if (passed) {
      // Mark module complete and update course
      const updatedModules = [...course.modules];
      updatedModules[moduleIdx] = { ...mod, completed: true };
      const completedCount = updatedModules.filter((m) => m.completed).length;
      const pct = Math.round((completedCount / updatedModules.length) * 100);
      const updatedCourse = { ...course, modules: updatedModules, completion_pct: pct, last_accessed: new Date().toISOString() };

      // Game mode: award XP and level up
      if (course.settings?.game_mode) {
        const xpGain = 100;
        updatedCourse.xp = (course.xp || 0) + xpGain;
        updatedCourse.level = Math.floor(updatedCourse.xp / 500) + 1;
      }

      onUpdate(updatedCourse);
      const updateData = {
        modules: updatedModules,
        completion_pct: pct,
        last_accessed: new Date().toISOString(),
      };
      if (course.settings?.game_mode) {
        updateData.xp = updatedCourse.xp;
        updateData.level = updatedCourse.level;
      }
      base44.entities.IsolateCourse.update(course.id, updateData);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a curriculum designer. A student didn't understand a module. Regenerate the explanation with a DIFFERENT or DEEPER analogy.

Topic: ${course.topic}
Skill level: ${course.skill_level}
Theme: ${course.theme}
Module: "${mod.title}"
Concept: "${mod.concept}"
Previous explanation (didn't click):
${mod.content}

Generate a NEW explanation using a completely different angle/analogy from the theme. Keep the real facts accurate. Use original characters inspired by the theme's mood, never specific copyrighted names.

Return JSON:
{
  "content": "New full 3-4 paragraph explanation",
  "theme_hook": "New one-line themed hook",
  "real_facts": "Updated 'Here's what's actually true' summary",
  "knowledge_check": [
    {"question": "New question", "options": ["opt1","opt2","opt3"], "answer": 0}
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            theme_hook: { type: "string" },
            real_facts: { type: "string" },
            knowledge_check: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  answer: { type: "number" }
                }
              }
            }
          }
        }
      });

      const regenerated = typeof res === "string" ? JSON.parse(res) : res;
      const updatedModules = [...course.modules];
      updatedModules[moduleIdx] = {
        ...mod,
        content: regenerated.content,
        theme_hook: regenerated.theme_hook,
        real_facts: regenerated.real_facts,
        knowledge_check: regenerated.knowledge_check,
      };
      const updatedCourse = { ...course, modules: updatedModules };
      onUpdate(updatedCourse);
      await base44.entities.IsolateCourse.update(course.id, { modules: updatedModules });
      setCheckResult(null);
      setCheckAnswers({});
      setCheckOpen(false);
    } catch (e) {
      console.error("Regeneration failed", e);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#fbfbfd]/80 backdrop-blur-2xl border-b border-zinc-200/50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[14px] font-medium">Course</span>
          </button>
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="ISOLATE" className="w-6 h-6 rounded-lg" />
            <span className="text-[15px] font-semibold tracking-tight">Module {moduleIdx + 1}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Module search */}
            <button onClick={() => setSearchOpen(!searchOpen)} className="w-9 h-9 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors">
              <Search className="w-4 h-4 text-zinc-500" />
            </button>
            {/* Session timer */}
            {sessionTimerMin > 0 && sessionTimeLeft > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 ring-1 ring-amber-200">
                <Timer className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[12px] font-semibold text-amber-700 tabular-nums">
                  {Math.floor(sessionTimeLeft / 60)}:{String(sessionTimeLeft % 60).padStart(2, "0")}
                </span>
              </div>
            )}
            {sessionTimerMin > 0 && sessionTimeLeft === 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 ring-1 ring-rose-200">
                <Timer className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-[12px] font-semibold text-rose-700">Break!</span>
              </div>
            )}
          </div>
        </div>
        {/* Module search dropdown */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-zinc-100">
              <div className="max-w-3xl mx-auto px-6 py-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search modules by title or concept..."
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl bg-white ring-1 ring-zinc-200 focus:ring-2 focus:ring-violet-400 outline-none text-[14px] text-zinc-900 placeholder:text-zinc-400"
                />
                {searchQuery && (
                  <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                    {(course.modules || [])
                      .filter((m) => {
                        const q = searchQuery.toLowerCase();
                        return (m.title || "").toLowerCase().includes(q) || (m.concept || "").toLowerCase().includes(q) || (m.theme_hook || "").toLowerCase().includes(q);
                      })
                      .map((m, i) => (
                        <button
                          key={i}
                          onClick={() => { onJumpToModule(course.modules.indexOf(m)); setSearchOpen(false); setSearchQuery(""); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
                        >
                          <span className="text-[13px] font-medium text-zinc-700">{course.modules.indexOf(m) + 1}. {m.title}</span>
                          <span className="text-[12px] text-zinc-400 ml-2">{m.concept}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Game mode XP bar */}
        {isGameMode && (
          <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-t border-violet-200/50">
            <div className="max-w-3xl mx-auto px-6 py-2 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <span className="text-[13px] font-bold text-violet-700">Lvl {course.level || 1}</span>
              </div>
              <div className="flex-1 h-2 rounded-full bg-violet-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all" style={{ width: `${((course.xp || 0) % 500) / 5}%` }} />
              </div>
              <span className="text-[12px] font-semibold text-violet-600 tabular-nums">{course.xp || 0} XP</span>
              {checkResult?.passed && (
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="flex items-center gap-0.5 text-amber-500 text-[13px] font-bold">
                  <Zap className="w-3.5 h-3.5" />+100
                </motion.span>
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Module navigation bar — jump to any unlocked module by number */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-[12px] font-semibold text-zinc-400 uppercase tracking-wider flex-shrink-0 mr-1">Modules</span>
          {(course.modules || []).map((m, i) => {
            const isCompleted = m.completed;
            const isCurrent = i === moduleIdx;
            const isUnlocked = i <= moduleIdx || isCompleted;
            return (
              <button
                key={i}
                disabled={!isUnlocked}
                onClick={() => isUnlocked && onJumpToModule(i)}
                className={`flex-shrink-0 w-9 h-9 rounded-xl text-[13px] font-bold transition-all ${
                  isCurrent
                    ? `bg-gradient-to-br ${pal.grad} text-white scale-110 shadow-lg`
                    : isCompleted
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : isUnlocked
                    ? "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    : "bg-zinc-50 text-zinc-300 cursor-not-allowed"
                }`}
                title={m.title}
              >
                {isCompleted && !isCurrent ? "✓" : i + 1}
              </button>
            );
          })}
        </div>

        {/* Module header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${pal.bg} ${pal.text} text-[12px] font-semibold mb-3`}>
            <Sparkles className="w-3.5 h-3.5" />
            {mod.theme_hook}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-zinc-900">{mod.title}</h1>
          <p className="mt-2 text-[15px] text-zinc-500">Core concept: {mod.concept}</p>
        </motion.div>

        {/* Illustration */}
        {mod.image_url && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 rounded-3xl overflow-hidden ring-1 ring-zinc-200/60 shadow-lg">
            <img src={mod.image_url} alt={mod.title} className="w-full h-auto" />
          </motion.div>
        )}

        {/* Themed explanation */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-3">The explanation</h2>
          <div className="prose prose-zinc max-w-none">
            {(mod.content || "").split("\n").filter(Boolean).map((para, i) => (
              <p key={i} className="text-[16px] leading-relaxed text-zinc-700 mb-4">{para}</p>
            ))}
          </div>
        </motion.div>

        {/* Real facts callout */}
        {mod.real_facts && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <h3 className="text-[15px] font-semibold text-amber-900">Here's what's actually true</h3>
            </div>
            <p className="text-[15px] text-amber-800 leading-relaxed">{mod.real_facts}</p>
          </motion.div>
        )}

        {/* Knowledge check */}
        {!mod.completed && !checkOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setCheckOpen(true)}
            className={`w-full mb-8 rounded-2xl bg-gradient-to-r ${pal.grad} text-white p-4 text-center hover:scale-[1.01] active:scale-100 transition-transform shadow-lg`}
          >
            <span className="text-[15px] font-semibold">Check your understanding →</span>
          </motion.button>
        )}

        <AnimatePresence>
          {checkOpen && !mod.completed && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
              <div className="rounded-2xl bg-white ring-1 ring-zinc-200 p-6">
                <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-4">Knowledge check</h3>
                {(mod.knowledge_check || []).map((q, qi) => (
                  <div key={qi} className="mb-5">
                    <p className="text-[15px] font-medium text-zinc-800 mb-3">{qi + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {(q.options || []).map((opt, oi) => {
                        const isSelected = checkAnswers[qi] === oi;
                        const isCorrect = q.answer === oi;
                        const showResult = !!checkResult;
                        let cls = "ring-zinc-200 hover:bg-zinc-50 text-zinc-700";
                        if (!showResult && isSelected) {
                          cls = `ring-2 ${pal.ring} ${pal.bg} ${pal.text} font-semibold`;
                        } else if (showResult && isCorrect) {
                          cls = "ring-2 ring-emerald-400 bg-emerald-50 text-emerald-800 font-semibold";
                        } else if (showResult && isSelected && !isCorrect) {
                          cls = "ring-2 ring-rose-400 bg-rose-50 text-rose-800 font-semibold";
                        } else if (showResult) {
                          cls = "ring-zinc-200 text-zinc-400";
                        }
                        return (
                          <button
                            key={oi}
                            onClick={() => !showResult && setCheckAnswers({ ...checkAnswers, [qi]: oi })}
                            disabled={showResult}
                            className={`w-full text-left px-4 py-2.5 rounded-xl ring-1 transition-all text-[14px] flex items-center justify-between ${cls}`}
                          >
                            <span>{opt}</span>
                            {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                            {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {checkResult && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-4 p-4 rounded-xl ${checkResult.passed ? "bg-emerald-50" : "bg-rose-50"}`}>
                    <div className="flex items-center gap-2">
                      {checkResult.passed ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <span className="font-semibold text-emerald-900">Passed! {checkResult.correct}/{checkResult.total} correct</span>
                          {moduleIdx < (course.modules?.length || 0) - 1 && (
                            <span className="ml-auto text-[12px] text-emerald-600 font-medium">Moving to next module...</span>
                          )}
                        </>
                      ) : (
                        <><XCircle className="w-5 h-5 text-rose-600" /><span className="font-semibold text-rose-900">You got {checkResult.correct}/{checkResult.total}. Let's try a different explanation.</span></>
                      )}
                    </div>
                    {!checkResult.passed && (
                      <button onClick={regenerate} disabled={regenerating} className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-900 text-white text-[13px] font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors">
                        {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Regenerate with a different analogy
                      </button>
                    )}
                  </motion.div>
                )}

                {!checkResult && (
                  <button
                    onClick={submitCheck}
                    disabled={Object.keys(checkAnswers).length < (mod.knowledge_check || []).length}
                    className="w-full mt-2 py-3 rounded-full bg-zinc-900 text-white text-[14px] font-medium hover:bg-zinc-800 disabled:opacity-30 transition-all"
                  >
                    Submit answers
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {mod.completed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-emerald-900">Module complete!</span>
            {moduleIdx < (course.modules?.length || 0) - 1 && (
              <button onClick={onNextModule} className="ml-auto px-4 py-2 rounded-full bg-emerald-500 text-white text-[13px] font-medium hover:bg-emerald-600 transition-colors">
                Next module →
              </button>
            )}
          </motion.div>
        )}

        {/* Tutor chat */}
        <div className="rounded-2xl bg-white ring-1 ring-zinc-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900">Ask your tutor</h3>
            <p className="text-[12px] text-zinc-400">Responds in the {course.theme} voice</p>
          </div>

          {/* Chat messages */}
          <div className="max-h-80 overflow-y-auto p-4 space-y-3 min-h-[100px]">
            {(mod.chat || []).length === 0 && (
              <p className="text-[13px] text-zinc-400 text-center py-6">Ask a question about this concept...</p>
            )}
            {(mod.chat || []).map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-zinc-900 text-white rounded-tr-sm"
                    : `bg-zinc-100 text-zinc-800 rounded-tl-sm`
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-100 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat(chatInput)}
              placeholder="Ask anything..."
              className="flex-1 px-4 py-2.5 rounded-full bg-zinc-50 ring-1 ring-zinc-200 focus:ring-2 focus:ring-violet-400 outline-none text-[14px] text-zinc-900 placeholder:text-zinc-400 transition-all"
            />
            <button
              onClick={() => sendChat(chatInput)}
              disabled={chatLoading || !chatInput.trim()}
              className={`w-10 h-10 rounded-full ${pal.btn} text-white flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-100`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Checkpoint modal — ask user to continue or explore */}
      <AnimatePresence>
        {showCheckpoint && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-5">
                <Flag className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Checkpoint!</h2>
              <p className="text-[15px] text-zinc-500 mb-6 leading-relaxed">
                You've completed {moduleIdx + 1} modules of <span className="font-semibold text-zinc-700">{course.topic}</span>. Keep going, or jump back to explore something new?
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => { setShowCheckpoint(false); onNextModule(); }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[15px] font-semibold hover:opacity-90 transition-all shadow-lg shadow-violet-500/20"
                >
                  Keep learning →
                </button>
                <button
                  onClick={() => onBack()}
                  className="w-full py-3.5 rounded-xl bg-zinc-100 text-zinc-700 text-[15px] font-medium hover:bg-zinc-200 transition-colors"
                >
                  Explore something new
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings */}
      <IsolateSettings course={course} onUpdate={onUpdate} />
    </div>
  );
}