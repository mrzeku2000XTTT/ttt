import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Leaf, Upload, Loader2 } from "lucide-react";
import BackToStore from "@/components/BackToStore";

export default function PlantDoc() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [note, setNote] = useState("");
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
        prompt: `Look at this plant photo. Diagnose what's wrong (or confirm it's healthy). Note from owner: ${note || "none"}. Respond as JSON: { "plant": string, "diagnosis": string, "severity": "healthy"|"mild"|"serious", "treatment": string[], "watering": string, "light": string }. Treatment max 4 short steps.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            plant: { type: "string" },
            diagnosis: { type: "string" },
            severity: { type: "string", enum: ["healthy", "mild", "serious"] },
            treatment: { type: "array", items: { type: "string" } },
            watering: { type: "string" },
            light: { type: "string" }
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

  const tone = result?.severity === "healthy" ? "text-emerald-400" : result?.severity === "serious" ? "text-red-400" : "text-yellow-400";

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <BackToStore />
      <div className="w-full max-w-md px-5 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Leaf className="w-6 h-6" />
          <h1 className="text-2xl font-bold tracking-tight">PlantDoc</h1>
        </div>
        <p className="text-white/50 text-sm mb-6">What's wrong with your plant?</p>

        <label className="block aspect-square w-full rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden mb-4">
          {preview ? (
            <img src={preview} alt="plant" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/40">
              <Upload className="w-8 h-8" />
              <span className="text-xs">Upload plant photo</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={onPick} />
        </label>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Symptoms? (yellow leaves, drooping…)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30"
        />

        <button
          onClick={run}
          disabled={!file || loading}
          className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Diagnosing…" : "Diagnose"}
        </button>

        {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
        {result?.diagnosis && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white/50 text-sm">{result.plant}</span>
              <span className={`text-xs uppercase tracking-wider font-semibold ${tone}`}>{result.severity}</span>
            </div>
            <p className="text-lg mb-6">{result.diagnosis}</p>
            {result.treatment?.length > 0 && (
              <>
                <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Treatment</p>
                <ol className="space-y-1.5 text-sm text-white/70 mb-5">
                  {result.treatment.map((t, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-white/30">{i + 1}.</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="border border-white/10 rounded-xl p-3">
                <p className="text-white/40 text-xs mb-1">Water</p>
                <p>{result.watering}</p>
              </div>
              <div className="border border-white/10 rounded-xl p-3">
                <p className="text-white/40 text-xs mb-1">Light</p>
                <p>{result.light}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}