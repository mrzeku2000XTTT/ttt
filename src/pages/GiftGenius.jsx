import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Gift, Heart, Sparkles } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/50eec4208_generated_image.png";

export default function GiftGenius() {
  const [relationship, setRelationship] = useState("");
  const [age, setAge] = useState("");
  const [interests, setInterests] = useState("");
  const [budget, setBudget] = useState("");
  const [occasion, setOccasion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!interests.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest 5 thoughtful gift ideas. Recipient — relationship: ${relationship || "unknown"}, age: ${age || "unknown"}, interests: ${interests}. Budget: ${budget || "any"}. Occasion: ${occasion || "general"}. Respond as JSON: { "ideas": [{ "name": string, "why": string, "estimated_price": string, "where": string }] }. Make them specific and genuinely thoughtful, not generic. Respect the budget.`,
        response_json_schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  why: { type: "string" },
                  estimated_price: { type: "string" },
                  where: { type: "string" }
                }
              }
            }
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

  return (
    <LifestyleShell
      logo={LOGO}
      name="GiftGenius"
      tagline="Describe the person. Get five specific, thoughtful gift ideas — each with a reason, a rough price, and where to find it."
      features={["Thoughtful picks", "Budget-aware", "Where to buy"]}
      steps={["Who are they to you, and how old?", "List what they love and your budget", "Get five ideas you'd actually be proud to give"]}
    >
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <input
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Relationship (sister, coworker…)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30"
          />
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30"
          />
        </div>
        <textarea
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="What do they love? (hobbies, shows, foods, vibe…)"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 resize-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget (e.g. $50)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30"
          />
          <input
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            placeholder="Occasion (birthday…)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30"
          />
        </div>
      </div>

      <button
        onClick={run}
        disabled={!interests.trim() || loading}
        className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Thinking…" : "Find gifts"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.ideas && (
        <div className="mt-8 space-y-4">
          {result.ideas.map((g, i) => (
            <div key={i} className="border border-white/10 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white/40" />
                  {g.name}
                </h3>
                <span className="text-xs text-white/50 whitespace-nowrap">{g.estimated_price}</span>
              </div>
              <p className="text-sm text-white/60 mb-3">{g.why}</p>
              <p className="text-xs text-white/40 flex items-center gap-1.5">
                <Heart className="w-3 h-3" /> {g.where}
              </p>
            </div>
          ))}
        </div>
      )}
    </LifestyleShell>
  );
}