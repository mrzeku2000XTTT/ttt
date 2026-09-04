import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shirt, Upload, Loader2 } from "lucide-react";
import BackToStore from "@/components/BackToStore";

export default function OutfitAI() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [occasion, setOccasion] = useState("");
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
        prompt: `Look at this closet/outfit photo. Identify the visible clothing pieces. Then suggest ONE complete outfit to wear. Occasion/weather: ${occasion || "everyday casual"}. Respond as JSON: { "vibe": string (one short line), "pieces": [{ "item": string, "why": string }], "tip": string }. Keep "why" under 8 words.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            vibe: { type: "string" },
            pieces: { type: "array", items: { type: "object", properties: { item: { type: "string" }, why: { type: "string" } } } },
            tip: { type: "string" }
          }
        }
      });
      setResult(res);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <BackToStore />
      <div className="w-full max-w-md px-5 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Shirt className="w-6 h-6" />
          <h1 className="text-2xl font-bold tracking-tight">OutfitAI</h1>
        </div>
        <p className="text-white/50 text-sm mb-6">Your closet, decoded.</p>

        <label className="block aspect-[4/5] w-full rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden mb-4">
          {preview ? (
            <img src={preview} alt="closet" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/40">
              <Upload className="w-8 h-8" />
              <span className="text-xs">Upload closet photo</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onPick} />
        </label>

        <input
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          placeholder="Occasion or weather (date night, rainy…)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30"
        />

        <button
          onClick={run}
          disabled={!file || loading}
          className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Styling…" : "Pick my outfit"}
        </button>

        {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
        {result?.pieces && (
          <div className="mt-8">
            <p className="text-lg font-semibold mb-4">{result.vibe}</p>
            <div className="space-y-3">
              {result.pieces.map((p, i) => (
                <div key={i} className="flex justify-between items-start border-b border-white/10 pb-3">
                  <span className="font-medium">{p.item}</span>
                  <span className="text-xs text-white/40 text-right max-w-[50%]">{p.why}</span>
                </div>
              ))}
            </div>
            {result.tip && <p className="text-sm text-white/60 mt-5 italic">{result.tip}</p>}
          </div>
        )}
      </div>
    </div>
  );
}