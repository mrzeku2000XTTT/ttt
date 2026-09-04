import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/189b37fab_generated_image.png";

export default function NameLab() {
  const [what, setWhat] = useState("");
  const [vibe, setVibe] = useState("playful");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!what.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate name ideas. What it is: ${what}. Vibe: ${vibe}. Words/ideas to weave in: ${keywords || "none"}. Respond as JSON: { "names": [{ "name": string, "tagline": string, "why": string }] }. Give 6 names — creative, memorable, easy to say and spell. Each with a short tagline and one-sentence why-it-works.`,
        response_json_schema: {
          type: "object",
          properties: {
            names: { type: "array", items: { type: "object", properties: { name: { type: "string" }, tagline: { type: "string" }, why: { type: "string" } } } }
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

  const vibes = [["playful", "Playful"], ["serious", "Serious"], ["premium", "Premium"], ["techy", "Techy"], ["minimal", "Minimal"]];

  return (
    <LifestyleShell
      logo={LOGO}
      name="NameLab"
      tagline="Describe the thing you're naming — app, business, channel, anything. Get six names with taglines and the thinking behind each."
      features={["6 name ideas", "Taglines included", "Vibe-matched"]}
      steps={["Describe what you're naming", "Pick the vibe and any words to weave in", "Steal the one that sticks"]}
    >
      <div className="space-y-3 mb-4">
        <textarea
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          placeholder="What is it? (a bakery for dogs, a coding YouTube channel…)"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 resize-none"
        />
        <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Words to weave in? (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />
        <div className="flex flex-wrap gap-2">
          {vibes.map(([v, l]) => (
            <button key={v} onClick={() => setVibe(v)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${vibe === v ? "bg-white text-black border-white" : "text-white/60 border-white/15 hover:border-white/40"}`}>{l}</button>
          ))}
        </div>
      </div>

      <button onClick={run} disabled={!what.trim() || loading} className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Naming…" : "Generate names"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.names && (
        <div className="mt-8 space-y-4">
          {result.names.map((n, i) => (
            <div key={i} className="border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3 mb-1">
                <h3 className="font-semibold text-lg">{n.name}</h3>
                <span className="text-[10px] text-white/30">#{i + 1}</span>
              </div>
              <p className="text-sm text-white/50 italic mb-2">"{n.tagline}"</p>
              <p className="text-xs text-white/60">{n.why}</p>
            </div>
          ))}
        </div>
      )}
    </LifestyleShell>
  );
}