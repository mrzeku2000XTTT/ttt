import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin, Calendar, Cloud } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/872a7dba0_generated_image.png";

export default function PackPal() {
  const [dest, setDest] = useState("");
  const [days, setDays] = useState("3");
  const [type, setType] = useState("city");
  const [weather, setWeather] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!dest.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Build a packing list for a trip. Destination: ${dest}. Days: ${days}. Trip type: ${type}. Weather/notes: ${weather || "unknown"}. Respond as JSON: { "categories": [{ "category": string, "items": string[] }], "essentials": string[], "reminders": string[] }. Be specific and practical — exact counts where it matters (e.g. "4 underwear"). Group sensibly (Clothes, Toiletries, Tech, Documents, etc.).`,
        response_json_schema: {
          type: "object",
          properties: {
            categories: { type: "array", items: { type: "object", properties: { category: { type: "string" }, items: { type: "array", items: { type: "string" } } } } },
            essentials: { type: "array", items: { type: "string" } },
            reminders: { type: "array", items: { type: "string" } }
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

  const types = [["city", "City"], ["beach", "Beach"], ["business", "Business"], ["snow", "Snow"], ["hiking", "Hiking"]];

  return (
    <LifestyleShell
      logo={LOGO}
      name="PackPal"
      tagline="Tell it where you're going and for how long. Get a smart, categorized packing list plus the essentials you always forget."
      features={["Trip-type tuned", "Weather-aware", "Don't-forget list"]}
      steps={["Enter your destination and trip length", "Pick the trip type and add the weather", "Get a categorized list you can actually pack from"]}
    >
      <div className="space-y-3 mb-4">
        <Field icon={<MapPin className="w-4 h-4 text-white/40" />}>
          <input
            value={dest}
            onChange={(e) => setDest(e.target.value)}
            placeholder="Where to? (e.g. Tokyo)"
            className="w-full bg-transparent outline-none text-sm"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field icon={<Calendar className="w-4 h-4 text-white/40" />}>
            <input
              type="number"
              min="1"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full bg-transparent outline-none text-sm"
            />
          </Field>
          <Field icon={<Cloud className="w-4 h-4 text-white/40" />}>
            <input
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder="Weather (e.g. 15°C, rain)"
              className="w-full bg-transparent outline-none text-sm"
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          {types.map(([v, label]) => (
            <button
              key={v}
              onClick={() => setType(v)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                type === v ? "bg-white text-black border-white" : "text-white/60 border-white/15 hover:border-white/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={run}
        disabled={!dest.trim() || loading}
        className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Packing…" : "Build my list"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.categories && (
        <div className="mt-8 space-y-5">
          {result.categories.map((c, i) => (
            <div key={i}>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">{c.category}</p>
              <div className="flex flex-wrap gap-2">
                {c.items?.map((it, j) => (
                  <span key={j} className="text-sm border border-white/15 rounded-full px-3 py-1 text-white/80">
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {result.essentials?.length > 0 && (
            <div className="border border-amber-400/20 bg-amber-400/5 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wider text-amber-300/80 mb-2">Don't forget</p>
              <ul className="space-y-1.5 text-sm text-white/80">
                {result.essentials.map((s, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-amber-300/60">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.reminders?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Before you go</p>
              <ul className="space-y-1.5 text-sm text-white/70">
                {result.reminders.map((s, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-white/30">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </LifestyleShell>
  );
}

function Field({ icon, children }) {
  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-white/30">
      {icon}
      <div className="flex-1">{children}</div>
    </div>
  );
}