import React, { useEffect, useState } from "react";
import { Loader2, Volume2, CheckCircle2, XCircle, BookOpen, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { LEARN_LANGUAGES, MULTILANG_FONT, speakText } from "./voxaLanguages";

const LEVELS = [
  { id: "beginner", label: "Beginner", color: "from-green-500/20 to-emerald-500/20", border: "border-green-400/40" },
  { id: "intermediate", label: "Intermediate", color: "from-yellow-500/20 to-orange-500/20", border: "border-orange-400/40" },
  { id: "advanced", label: "Advanced", color: "from-purple-500/20 to-pink-500/20", border: "border-purple-400/40" },
];

export default function LessonsMode({ language }) {
  const [level, setLevel] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});

  const langName = LEARN_LANGUAGES.find((l) => l.code === language)?.name || language;

  useEffect(() => {
    if (!level) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLesson(null);
      setQuizAnswers({});
      try {
        const r = await base44.integrations.Core.InvokeLLM({
          prompt: `Create a ${level} level ${langName} lesson. Include:
- title: short engaging lesson title
- intro: 2-3 sentences explaining what the learner will learn
- vocabulary: 6 key words with {word, translation, pronunciation}
- examples: 3 example sentences with {sentence, translation}
- quiz: 4 multiple-choice questions with {question, options (4 strings), correctIndex (0-3)}`,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              intro: { type: "string" },
              vocabulary: {
                type: "array",
                items: { type: "object", properties: { word: { type: "string" }, translation: { type: "string" }, pronunciation: { type: "string" } } },
              },
              examples: {
                type: "array",
                items: { type: "object", properties: { sentence: { type: "string" }, translation: { type: "string" } } },
              },
              quiz: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    options: { type: "array", items: { type: "string" } },
                    correctIndex: { type: "number" },
                  },
                },
              },
            },
          },
        });
        if (!cancelled) setLesson(r);
      } catch {}
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [language, level, langName]);

  if (!level) {
    return (
      <div className="space-y-3">
        <p className="text-white/50 text-sm mb-4">Pick your level — we'll generate a fresh {langName} lesson.</p>
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLevel(l.id)}
            className={`w-full p-5 rounded-3xl bg-gradient-to-br ${l.color} backdrop-blur-2xl border ${l.border} text-left hover:scale-[1.02] transition-transform shadow-xl`}
          >
            <p className="text-white text-xl font-bold">{l.label}</p>
            <p className="text-white/60 text-xs mt-1">
              {l.id === "beginner" && "Basic words, greetings, and short phrases."}
              {l.id === "intermediate" && "Conversational sentences and grammar."}
              {l.id === "advanced" && "Complex structures and nuanced vocabulary."}
            </p>
          </button>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/8 backdrop-blur-2xl border border-white/12 p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        <span className="text-white/60 text-sm">Generating your {langName} lesson…</span>
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="space-y-4">
      <button
        onClick={() => { setLevel(null); setLesson(null); }}
        className="flex items-center gap-2 text-white/60 hover:text-white text-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Change level
      </button>

      <div className="rounded-3xl bg-white/8 backdrop-blur-2xl border border-white/12 p-5">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400/80 text-[10px] uppercase tracking-widest font-semibold">{level} · {langName}</span>
        </div>
        <h2 className="text-white text-xl font-bold mb-2">{lesson.title}</h2>
        <p className="text-white/60 text-sm leading-relaxed">{lesson.intro}</p>
      </div>

      {/* Vocabulary */}
      {lesson.vocabulary?.length > 0 && (
        <div className="rounded-3xl bg-white/8 backdrop-blur-2xl border border-white/12 p-5">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-3">Vocabulary</p>
          <div className="space-y-2">
            {lesson.vocabulary.map((v, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/5">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base" style={{ fontFamily: MULTILANG_FONT }}>{v.word}</p>
                  {v.pronunciation && <p className="text-cyan-300/70 text-xs italic">{v.pronunciation}</p>}
                  <p className="text-white/50 text-xs mt-0.5">{v.translation}</p>
                </div>
                <button
                  onClick={() => speakText(v.word, language)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <Volume2 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Examples */}
      {lesson.examples?.length > 0 && (
        <div className="rounded-3xl bg-white/8 backdrop-blur-2xl border border-white/12 p-5">
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-3">Examples</p>
          <div className="space-y-3">
            {lesson.examples.map((ex, i) => (
              <div key={i} className="p-3 rounded-2xl bg-white/5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-white text-base flex-1" style={{ fontFamily: MULTILANG_FONT }}>{ex.sentence}</p>
                  <button
                    onClick={() => speakText(ex.sentence, language)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0"
                  >
                    <Volume2 className="w-3 h-3 text-white" />
                  </button>
                </div>
                <p className="text-white/50 text-xs mt-1">{ex.translation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz */}
      {lesson.quiz?.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-2xl border border-blue-400/25 p-5">
          <p className="text-blue-300/80 text-[10px] uppercase tracking-widest font-semibold mb-4">Quick Quiz</p>
          <div className="space-y-5">
            {lesson.quiz.map((q, qi) => {
              const picked = quizAnswers[qi];
              const correct = picked !== undefined && picked === q.correctIndex;
              return (
                <div key={qi}>
                  <p className="text-white text-sm font-semibold mb-2">{qi + 1}. {q.question}</p>
                  <div className="space-y-1.5">
                    {q.options?.map((opt, oi) => {
                      const isPicked = picked === oi;
                      const isCorrect = oi === q.correctIndex;
                      const showResult = picked !== undefined;
                      return (
                        <button
                          key={oi}
                          disabled={picked !== undefined}
                          onClick={() => setQuizAnswers((p) => ({ ...p, [qi]: oi }))}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition-all ${
                            !showResult
                              ? "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                              : isCorrect
                                ? "bg-green-500/20 border-green-400/50 text-green-200"
                                : isPicked
                                  ? "bg-red-500/20 border-red-400/50 text-red-200"
                                  : "bg-white/5 border-white/10 text-white/40"
                          }`}
                        >
                          <span style={{ fontFamily: MULTILANG_FONT }}>{opt}</span>
                          {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 inline ml-2" />}
                          {showResult && isPicked && !isCorrect && <XCircle className="w-4 h-4 inline ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}