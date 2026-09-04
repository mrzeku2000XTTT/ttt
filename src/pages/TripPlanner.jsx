import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, Calendar, Cloud } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/113f18b6a_generated_image.png";

export default function TripPlanner() {
  const [dest, setDest] = useState("");
  const [days, setDays] = useState("3");
  const [interests, setInterests] = useState("");
  const [pace, setPace] = useState("balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!dest.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Plan a trip itinerary. Destination: ${dest}. Days: ${days}. Interests: ${interests || "the classics"}. Pace: ${pace}. Respond as JSON: { "days": [{ "day": string, "morning": string, "afternoon": string, "evening": string, "eat": string }], "tips": string[] }. Each slot is one concrete, real activity or place. Eat is one specific local food or spot to try. Tips are 3-5 local know-how notes (transport, timing, reservations).`,
        response_json_schema: {
          type: "object",
          properties: {
            days: { type: "array", items: { type: "object", properties: { day: { type: "string" }, morning: { type: "string" }, afternoon: { type: "string" }, evening: { type: "string" }, eat: { type: "string" } } } },
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

  const paces = [["relaxed", "Relaxed"], ["balanced", "Balanced"], ["packed", "Packed"]];

  return (
    <LifestyleShell
      logo={LOGO}
      name="TripPlanner"
      tagline="Tell it where, how long, and what you love. Get a day-by-day itinerary — morning to night — with real activities and one must-try bite per day."
      features={["Day-by-day", "Pace-matched", "Local tips"]}
      steps={["Enter your destination and days", "Add interests and pick your pace", "Follow the days — or steal the parts you like"]}
    >
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-white/30">
          <MapPin className="w-4 h-4 text-white/40" />
          <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Where to? (e.g. Lisbon)" className="w-full bg-transparent outline-none text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-white/30">
            <Calendar className="w-4 h-4 text-white/40" />
            <input type="number" min="1" max="14" value={days} onChange={(e) => setDays(e.target.value)} className="w-full bg-transparent outline-none text-sm" />
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-white/30">
            <Cloud className="w-4 h-4 text-white/40" />
            <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Interests (food, art…)" className="w-full bg-transparent outline-none text-sm" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {paces.map(([v, l]) => (
            <button key={v} onClick={() => setPace(v)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${pace === v ? "bg-white text-black border-white" : "text-white/60 border-white/15 hover:border-white/40"}`}>{l}</button>
          ))}
        </div>
      </div>

      <button onClick={run} disabled={!dest.trim() || loading} className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Planning…" : "Plan my trip"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.days && (
        <div className="mt-8 space-y-5">
          {result.days.map((d, i) => (
            <div key={i} className="border border-white/10 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wider text-white/40 mb-3">{d.day}</p>
              <div className="space-y-2 text-sm">
                <Slot label="Morning" value={d.morning} />
                <Slot label="Afternoon" value={d.afternoon} />
                <Slot label="Evening" value={d.evening} />
                <div className="pt-2 border-t border-white/5 mt-2">
                  <p className="text-xs text-white/40">Must try</p>
                  <p className="text-white/80">{d.eat}</p>
                </div>
              </div>
            </div>
          ))}
          {result.tips?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Local tips</p>
              <ul className="space-y-1.5 text-sm text-white/70">
                {result.tips.map((t, i) => (
                  <li key={i} className="flex gap-2"><span className="text-white/30">•</span><span>{t}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </LifestyleShell>
  );
}

function Slot({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-white/40 w-16 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  );
}