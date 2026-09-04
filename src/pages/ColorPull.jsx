import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, Droplets } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/7d3d0590d_generated_image.png";

export default function ColorPull() {
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
        prompt: `Extract the color palette from this image. Respond as JSON: { "palette": [{ "hex": string, "name": string, "use": string }], "mood": string, "pairings": string[] }. 6 colors ordered from most to least dominant. Hex codes must look like "#RRGGBB" based on what you see. Names are short and evocative. Use is where that color would work (walls, accent, text…). Mood is one sentence. Pairings are 2-3 ideas for using the palette together.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            palette: { type: "array", items: { type: "object", properties: { hex: { type: "string" }, name: { type: "string" }, use: { type: "string" } } } },
            mood: { type: "string" },
            pairings: { type: "array", items: { type: "string" } }
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
      name="ColorPull"
      tagline="Upload any photo — a room, an outfit, a landscape. Pull its exact color palette with hex codes, and how to use it."
      features={["Hex codes", "Mood read", "Pairing ideas"]}
      steps={["Upload the photo with the colors you love", "Get the palette ordered by dominance", "Copy the hex codes and use them anywhere"]}
    >
      <label className="block aspect-[4/3] w-full rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden mb-4">
        {preview ? (
          <img src={preview} alt="reference" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/40">
            <Upload className="w-8 h-8" />
            <span className="text-xs">Upload any photo</span>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={onPick} />
      </label>

      <button onClick={run} disabled={!file || loading} className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Pulling colors…" : "Pull the palette"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.palette && (
        <div className="mt-8 space-y-5">
          <div className="rounded-2xl overflow-hidden border border-white/10">
            {result.palette.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border-b border-white/5 last:border-0">
                <div className="w-10 h-10 rounded-xl border border-white/10 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-white/40 truncate">{c.use}</p>
                </div>
                <span className="text-xs font-mono text-white/60">{c.hex}</span>
              </div>
            ))}
          </div>

          <div className="border border-white/10 rounded-2xl p-4">
            <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5" /> Mood</p>
            <p className="text-sm text-white/70">{result.mood}</p>
          </div>

          {result.pairings?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Use it together</p>
              <ul className="space-y-1.5 text-sm text-white/70">
                {result.pairings.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="text-white/30">•</span><span>{p}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </LifestyleShell>
  );
}