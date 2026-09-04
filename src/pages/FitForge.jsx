import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f5fc8763a_generated_image.png";

export default function FitForge() {
  const [goal, setGoal] = useState("strength");
  const [equipment, setEquipment] = useState("");
  const [days, setDays] = useState("4");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Build a weekly workout plan. Goal: ${goal}. Equipment available: ${equipment || "bodyweight only"}. Days per week: ${days}. Respond as JSON: { "weekly_plan": [{ "day": string, "focus": string, "exercises": string[] }], "tips": string[] }. Exercises formatted like "Push-ups — 3×12". Warm up each session with a light 5-min move. Keep it realistic and progressive.`,
        response_json_schema: {
          type: "object",
          properties: {
            weekly_plan: { type: "array", items: { type: "object", properties: { day: { type: "string" }, focus: { type: "string" }, exercises: { type: "array", items: { type: "string" } } } } },
            tips: { type: "array", items: { type: "string" } }
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

  const goals = [["strength", "Strength"], ["fat loss", "Fat loss"], ["endurance", "Endurance"], ["mobility", "Mobility"]];

  return (
    <LifestyleShell
      logo={LOGO}
      name="FitForge"
      tagline="Tell it your goal, your equipment, and how many days you'll actually train. Get a weekly plan that fits your life — not a pro athlete's."
      features={["Any equipment", "Day-by-day", "Progressive"]}
      steps={["Pick your goal", "Say what equipment you have", "Follow the week, repeat and progress"]}
    >
      <div className="space-y-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {goals.map(([v, l]) => (
            <button key={v} onClick={() => setGoal(v)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${goal === v ? "bg-white text-black border-white" : "text-white/60 border-white/15 hover:border-white/40"}`}>{l}</button>
          ))}
        </div>
        <input value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="Equipment? (dumbbells, gym, none…)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />
        <input type="number" min="1" max="7" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Days per week" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />
      </div>

      <button onClick={run} disabled={loading} className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Forging…" : "Build my plan"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.weekly_plan && (
        <div className="mt-8 space-y-5">
          {result.weekly_plan.map((d, i) => (
            <div key={i} className="border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-white/40">{d.day}</span>
                <span className="text-xs font-semibold">{d.focus}</span>
              </div>
              <ul className="space-y-1.5 text-sm text-white/70">
                {d.exercises?.map((ex, j) => (
                  <li key={j} className="flex gap-2"><span className="text-white/30">•</span><span>{ex}</span></li>
                ))}
              </ul>
            </div>
          ))}
          {result.tips?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Coach notes</p>
              <ul className="space-y-1.5 text-sm text-white/70">
                {result.tips.map((t, j) => (
                  <li key={j} className="flex gap-2"><span className="text-white/30">•</span><span>{t}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </LifestyleShell>
  );
}