import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Utensils } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0d385409d_generated_image.png";

export default function MealPlan() {
  const [goal, setGoal] = useState("maintain");
  const [diet, setDiet] = useState("");
  const [days, setDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Build a dinner plan. Goal: ${goal}. Dietary needs: ${diet || "none"}. Dinners needed: ${days}. Respond as JSON: { "dinners": [{ "day": string, "meal": string, "calories": number, "prep": string }], "grocery": string[] }. Real, simple meals a home cook can actually make. Keep meal names short and prep one phrase.`,
        response_json_schema: {
          type: "object",
          properties: {
            dinners: { type: "array", items: { type: "object", properties: { day: { type: "string" }, meal: { type: "string" }, calories: { type: "number" }, prep: { type: "string" } } } },
            grocery: { type: "array", items: { type: "string" } }
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

  const goals = [["lose", "Lose"], ["maintain", "Maintain"], ["gain", "Gain"]];

  return (
    <LifestyleShell
      logo={LOGO}
      name="MealPlan"
      tagline="Pick a goal and tell it your diet. Get a week of real dinners — with calories, prep time, and one grocery list that covers everything."
      features={["Weekly dinners", "Calories & prep", "One grocery list"]}
      steps={["Choose your goal and diet", "Set how many dinners you need", "Cook through the week off one list"]}
    >
      <div className="space-y-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {goals.map(([v, l]) => (
            <button key={v} onClick={() => setGoal(v)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${goal === v ? "bg-white text-black border-white" : "text-white/60 border-white/15 hover:border-white/40"}`}>{l}</button>
          ))}
        </div>
        <input value={diet} onChange={(e) => setDiet(e.target.value)} placeholder="Diet? (vegan, halal, no seafood…)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />
        <input type="number" min="1" max="14" value={days} onChange={(e) => setDays(e.target.value)} placeholder="Dinners this week" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />
      </div>

      <button onClick={run} disabled={loading} className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Planning…" : "Plan my dinners"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.dinners && (
        <div className="mt-8 space-y-5">
          <div className="space-y-3">
            {result.dinners.map((d, i) => (
              <div key={i} className="border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold flex items-center gap-2"><Utensils className="w-3.5 h-3.5 text-white/40" />{d.meal}</h3>
                  <span className="text-xs text-white/40">{d.day}</span>
                </div>
                <p className="text-xs text-white/50">{d.calories} cal · {d.prep}</p>
              </div>
            ))}
          </div>
          {result.grocery?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Grocery list</p>
              <div className="flex flex-wrap gap-2">
                {result.grocery.map((g, i) => (
                  <span key={i} className="text-xs border border-white/15 rounded-full px-3 py-1">{g}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </LifestyleShell>
  );
}