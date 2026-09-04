import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sofa, Upload, Loader2 } from "lucide-react";
import BackToStore from "@/components/BackToStore";

export default function RoomRater() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
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
        prompt: `Look at this room photo. First ROAST it honestly but fun (2-3 sentences, sharp but not mean). Then give 5 actionable redesign fixes. Respond as JSON: { "roast": string, "score": number (1-10), "fixes": [{ "title": string, "detail": string }] }. Keep detail under 12 words.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            roast: { type: "string" },
            score: { type: "number" },
            fixes: { type: "array", items: { type: "object", properties: { title: { type: "string" }, detail: { type: "string" } } } }
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
          <Sofa className="w-6 h-6" />
          <h1 className="text-2xl font-bold tracking-tight">RoomRater</h1>
        </div>
        <p className="text-white/50 text-sm mb-6">Roast. Then fix.</p>

        <label className="block aspect-[4/3] w-full rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden mb-4">
          {preview ? (
            <img src={preview} alt="room" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/40">
              <Upload className="w-8 h-8" />
              <span className="text-xs">Upload room photo</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onPick} />
        </label>

        <button
          onClick={run}
          disabled={!file || loading}
          className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Judging…" : "Roast my room"}
        </button>

        {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
        {result?.roast && (
          <div className="mt-8">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-5xl font-black">{result.score}</span>
              <span className="text-white/40 text-sm">/ 10</span>
            </div>
            <p className="text-lg leading-relaxed mb-6">{result.roast}</p>
            <p className="text-xs uppercase tracking-wider text-white/40 mb-3">Fixes</p>
            <div className="space-y-3">
              {result.fixes?.map((f, i) => (
                <div key={i} className="border border-white/10 rounded-2xl p-4">
                  <p className="font-semibold mb-1">{f.title}</p>
                  <p className="text-sm text-white/60">{f.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}