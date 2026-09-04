import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, ChefHat, Loader2 } from "lucide-react";
import BackToStore from "@/components/BackToStore";

export default function PlatePal() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prefs, setPrefs] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const run = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Look at this fridge/pantry photo. Identify the ingredients visible. Then suggest 3 realistic recipes the person can cook RIGHT NOW with what's visible, and a short shopping list of 2-4 missing items that would unlock more meals. Dietary preferences: ${prefs || "none"}. Respond as JSON: { "can_cook": [{ "name": string, "time": string, "steps": string[] }], "missing": string[] }. Keep recipe names short. Steps max 5 each, one sentence.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            can_cook: { type: "array", items: { type: "object", properties: { name: { type: "string" }, time: { type: "string" }, steps: { type: "array", items: { type: "string" } } } } },
            missing: { type: "array", items: { type: "string" } }
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
    <div className="min-h-screen bg-black text-white flex justify-center">
      <BackToStore />
      <div className="w-full max-w-md px-5 py-8">
        <div className="flex items-center gap-2 mb-8">
          <ChefHat className="w-6 h-6" />
          <h1 className="text-2xl font-bold tracking-tight">PlatePal</h1>
        </div>
        <p className="text-white/50 text-sm mb-6">Snap your fridge. Cook tonight.</p>

        <label className="block aspect-square w-full rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden mb-4">
          {preview ? (
            <img src={preview} alt="fridge" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/40">
              <Upload className="w-8 h-8" />
              <span className="text-xs">Upload fridge photo</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onPick} />
        </label>

        <input
          value={prefs}
          onChange={(e) => setPrefs(e.target.value)}
          placeholder="Diet? (vegan, gluten-free…)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30"
        />

        <button
          onClick={run}
          disabled={!file || loading}
          className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Cooking ideas…" : "What can I cook?"}
        </button>

        {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
        {result?.can_cook && (
          <div className="mt-8 space-y-5">
            {result.can_cook.map((r, i) => (
              <div key={i} className="border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold">{r.name}</h3>
                  <span className="text-xs text-white/40">{r.time}</span>
                </div>
                <ol className="space-y-1.5 text-sm text-white/70">
                  {r.steps?.map((s, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="text-white/30">{j + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            {result.missing?.length > 0 && (
              <div className="mt-2">
                <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Missing</p>
                <div className="flex flex-wrap gap-2">
                  {result.missing.map((m, i) => (
                    <span key={i} className="text-xs border border-white/15 rounded-full px-3 py-1">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}