import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Layers, Repeat2, HelpCircle } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e24b89eff_generated_image.png";

export default function StudyBuddy() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    setShowAnswers(false);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Build a study pack. Topic: ${topic}. Level: ${level}. Respond as JSON: { "outline": [{ "section": string, "points": string[] }], "flashcards": [{ "front": string, "back": string }], "quiz": [{ "q": string, "a": string }] }. Outline is 4-6 sections with 3-4 punchy points each. Flashcards: 6. Quiz: 5 questions with short answers.`,
        response_json_schema: {
          type: "object",
          properties: {
            outline: { type: "array", items: { type: "object", properties: { section: { type: "string" }, points: { type: "array", items: { type: "string" } } } } },
            flashcards: { type: "array", items: { type: "object", properties: { front: { type: "string" }, back: { type: "string" } } } },
            quiz: { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } } } }
          }
        }
      });
      setResult(res);
    } catch (e) {
      setResult({ error: e.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  const levels = [["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]];

  return (
    <LifestyleShell
      logo={LOGO}
      name="StudyBuddy"
      tagline="Any topic, any level. Get a clear study outline, flashcards to drill, and a quick quiz to check you actually got it."
      features={["Study outline", "Flashcards", "Self-quiz"]}
      steps={["Type what you want to learn", "Pick your level", "Read, drill the flashcards, then quiz yourself"]}
    >
      <div className="space-y-3 mb-4">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (e.g. photosynthesis, WW2 causes…)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />
        <div className="flex flex-wrap gap-2">
          {levels.map(([v, l]) => (
            <button key={v} onClick={() => setLevel(v)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${level === v ? "bg-white text-black border-white" : "text-white/60 border-white/15 hover:border-white/40"}`}>{l}</button>
          ))}
        </div>
      </div>

      <button onClick={run} disabled={!topic.trim() || loading} className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Studying up…" : "Build my study pack"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.outline && (
        <div className="mt-8 space-y-6">
          {result.outline.map((s, i) => (
            <div key={i}>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> {s.section}
              </p>
              <ul className="space-y-1.5 text-sm text-white/70">
                {s.points?.map((p, j) => (
                  <li key={j} className="flex gap-2"><span className="text-white/30">•</span><span>{p}</span></li>
                ))}
              </ul>
            </div>
          ))}

          {result.flashcards?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5"><Repeat2 className="w-3.5 h-3.5" /> Flashcards</p>
              <div className="space-y-2">
                {result.flashcards.map((f, i) => (
                  <div key={i} className="border border-white/10 rounded-xl p-3">
                    <p className="text-sm font-semibold">{f.front}</p>
                    <p className="text-xs text-white/50 mt-1">{f.back}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.quiz?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Quiz yourself</p>
              <div className="space-y-2">
                {result.quiz.map((q, i) => (
                  <div key={i} className="border border-white/10 rounded-xl p-3">
                    <p className="text-sm text-white/80">{i + 1}. {q.q}</p>
                    {showAnswers && <p className="text-xs text-emerald-400 mt-1.5">{q.a}</p>}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowAnswers(!showAnswers)} className="mt-3 w-full border border-white/15 rounded-xl py-2.5 text-sm font-medium text-white/70 hover:border-white/40 transition-colors">
                {showAnswers ? "Hide answers" : "Show answers"}
              </button>
            </div>
          )}
        </div>
      )}
    </LifestyleShell>
  );
}