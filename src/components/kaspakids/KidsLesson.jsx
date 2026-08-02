import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Sparkles, Send, CheckCircle2, RotateCcw, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MASCOT = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0809726ab_generated_image.png";

// Slobby = the Slobz tutor. Kid-friendly, purple, encouraging, emojis, analogies.
const TUTOR_SYSTEM = `You are Slobby, a friendly, encouraging trading tutor for kids ages 10-14. You teach inside the Slobz Trading Playground (a Kaspa-themed kids' app, purple/lavender mascot). 
Rules:
- Simple words. Explain ANY jargon the moment you use it.
- Use fun analogies a kid understands (pizza, lemonade, video-game loot, trading cards).
- Short sentences. Emojis are welcome. Never scary or boring.
- Be accurate about real trading concepts, but keep it safe and educational.
- Never give real financial advice or promise profits. Remind kids this is learning, not a way to get rich.`;

export default function KidsLesson({ chapter, onClose, onLearned }) {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizPicked, setQuizPicked] = useState(null);
  const [qa, setQa] = useState([]); // {q, a}
  const [askText, setAskText] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [learned, setLearned] = useState(false);
  const scrollRef = useRef(null);

  const fetchLesson = async () => {
    setLoading(true);
    setError(null);
    setLesson(null);
    setQuizPicked(null);
    setQa([]);
    setLearned(false);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${TUTOR_SYSTEM}\n\nTeach Chapter ${chapter.n}: "${chapter.title}".\nTopic to cover: ${chapter.topic}\nKey idea to anchor: ${chapter.keyIdea}\n\nCreate a complete, kid-friendly lesson. Return JSON with: intro (1-2 sentences hook), key_points (4-6 bullet strings), example (a concrete example a kid can picture), analogy (a relatable analogy), pro_tip (one actionable trading tip), quiz (object with question, options array of 4 strings, correct_index 0-3).`,
        response_json_schema: {
          type: "object",
          properties: {
            intro: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            example: { type: "string" },
            analogy: { type: "string" },
            pro_tip: { type: "string" },
            quiz: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct_index: { type: "number" },
              },
            },
          },
        },
      });
      setLesson(res);
    } catch (e) {
      setError(e?.message || "Couldn't load the lesson. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chapter) fetchLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter?.n]);

  const handleAsk = async () => {
    if (!askText.trim() || askLoading) return;
    const q = askText.trim();
    setAskText("");
    setAskLoading(true);
    try {
      const a = await base44.integrations.Core.InvokeLLM({
        prompt: `${TUTOR_SYSTEM}\n\nYou are teaching Chapter ${chapter.n}: "${chapter.title}" (${chapter.topic}). The kid just asked:\n"${q}"\n\nAnswer in 2-4 short, fun sentences. Stay on topic. If off-topic, gently steer back to trading basics.`,
      });
      setQa((prev) => [...prev, { q, a: typeof a === "string" ? a : JSON.stringify(a) }]);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
    } catch (e) {
      setQa((prev) => [...prev, { q, a: "Hmm, my brain hiccuped 🫠. Try asking again!" }]);
    } finally {
      setAskLoading(false);
    }
  };

  const markLearned = () => {
    setLearned(true);
    onLearned?.(chapter.n);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="bg-white w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* HEADER */}
          <div className="flex items-center gap-3 p-4 border-b border-[#7C4DFF]/15 bg-gradient-to-r from-[#f3eefa] to-[#e0d7f5]">
            <img src={MASCOT} alt="Slobby" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: chapter.sectionColor }}>{chapter.section} · Ch. {chapter.n}</div>
              <h2 className="font-display font-black text-base text-[#1F1B2E] truncate">{chapter.title}</h2>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/70 hover:bg-white text-[#5A4B8A] flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* BODY */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#7f7f7f]">
                <Loader2 className="w-7 h-7 animate-spin text-[#7C4DFF]" />
                <span className="text-sm font-bold">Slobby is preparing your lesson…</span>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-sm text-[#e54848] mb-3">{error}</p>
                <button onClick={fetchLesson} className="h-9 px-4 rounded-full bg-[#7C4DFF] text-white text-xs font-bold inline-flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}

            {lesson && (
              <>
                <p className="text-sm text-[#3D2E7C] leading-relaxed font-bold">{lesson.intro}</p>

                <div className="rounded-2xl bg-[#f7f3ff] border border-[#e6d9fb] p-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#7C4DFF] mb-2">Key Points</div>
                  <ul className="space-y-1.5">
                    {(lesson.key_points || []).map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#3D2E7C] leading-snug">
                        <Sparkles className="w-3.5 h-3.5 text-[#7C4DFF] mt-0.5 flex-shrink-0" /> <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#FF8A6B] mb-1">Example</div>
                  <p className="text-xs text-[#5A4B8A] leading-relaxed">{lesson.example}</p>
                </div>

                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#4CAF50] mb-1">Analogy</div>
                  <p className="text-xs text-[#5A4B8A] leading-relaxed italic">🧠 {lesson.analogy}</p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-[#FF8A6B]/15 to-[#7C4DFF]/10 border border-[#FF8A6B]/30 p-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#F96B4C] mb-1">Pro Tip</div>
                  <p className="text-xs text-[#3D2E7C] leading-relaxed font-bold">⭐ {lesson.pro_tip}</p>
                </div>

                {/* QUIZ */}
                {lesson.quiz && (
                  <div className="rounded-2xl border border-[#7C4DFF]/25 p-3">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#7C4DFF] mb-2 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> Quick Quiz
                    </div>
                    <p className="text-sm font-bold text-[#1F1B2E] mb-2">{lesson.quiz.question}</p>
                    <div className="space-y-1.5">
                      {(lesson.quiz.options || []).map((opt, i) => {
                        const isPicked = quizPicked === i;
                        const isCorrect = lesson.quiz.correct_index === i;
                        const show = quizPicked !== null;
                        return (
                          <button
                            key={i}
                            onClick={() => setQuizPicked(i)}
                            disabled={show}
                            className={`w-full text-left text-xs px-3 py-2 rounded-xl border transition-all flex items-center gap-2 ${show ? (isCorrect ? "bg-[#4CAF50]/15 border-[#4CAF50]/60 text-[#2e7d32]" : isPicked ? "bg-[#e54848]/15 border-[#e54848]/60 text-[#c0392b]" : "bg-white border-[#e6d9fb] text-[#5A4B8A]") : "bg-white border-[#e6d9fb] text-[#3D2E7C] hover:border-[#7C4DFF]/50"}`}
                          >
                            <span className="font-black">{String.fromCharCode(65 + i)}.</span> {opt}
                            {show && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-[#4CAF50]" />}
                          </button>
                        );
                      })}
                    </div>
                    {quizPicked !== null && (
                      <p className="text-xs mt-2 font-bold" style={{ color: quizPicked === lesson.quiz.correct_index ? "#2e7d32" : "#c0392b" }}>
                        {quizPicked === lesson.quiz.correct_index ? "Correct! 🎉 Slobby is proud of you." : "Not quite — the right one is highlighted green. Re-read the key points!"}
                      </p>
                    )}
                  </div>
                )}

                {/* Q&A */}
                {qa.length > 0 && (
                  <div className="space-y-2">
                    {qa.map((item, i) => (
                      <div key={i} className="space-y-1">
                        <div className="rounded-xl bg-[#3D2E7C] text-white text-xs px-3 py-2 ml-auto max-w-[85%]">{item.q}</div>
                        <div className="rounded-xl bg-[#f7f3ff] border border-[#e6d9fb] text-[#3D2E7C] text-xs px-3 py-2 max-w-[90%] flex items-start gap-2">
                          <img src={MASCOT} alt="" className="w-5 h-5 rounded-lg object-cover flex-shrink-0" /> <span className="leading-snug">{item.a}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ASK BAR */}
          {!loading && !error && lesson && (
            <div className="border-t border-[#7C4DFF]/15 p-3 bg-white">
              <div className="flex items-center gap-2">
                <input
                  value={askText}
                  onChange={(e) => setAskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  placeholder="Ask Slobby a question…"
                  className="flex-1 h-9 px-3 rounded-full bg-[#f3eefa] border border-[#e6d9fb] text-xs text-[#1F1B2E] placeholder-[#9f8fbf] outline-none focus:border-[#7C4DFF]"
                />
                <button onClick={handleAsk} disabled={askLoading || !askText.trim()} className="w-9 h-9 rounded-full bg-[#7C4DFF] text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0">
                  {askLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={markLearned}
                disabled={learned}
                className={`w-full mt-2 h-10 rounded-full text-xs font-display font-extrabold flex items-center justify-center gap-1.5 transition-all ${learned ? "bg-[#4CAF50]/20 text-[#2e7d32] border border-[#4CAF50]/50" : "bg-gradient-to-r from-[#7C4DFF] to-[#6b3fe0] text-white shadow-lg"}`}
              >
                {learned ? <><CheckCircle2 className="w-4 h-4" /> Chapter learned!</> : "Mark this chapter as learned"}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}