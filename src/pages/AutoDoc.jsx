import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/fe796cdc2_generated_image.png";

export default function AutoDoc() {
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
        prompt: `You're a careful mechanic. Look at this car photo (dashboard warning light or visible damage). Driver note: "${note}". Respond as JSON: { "findings": [{ "name": string, "meaning": string, "urgency": "low"|"medium"|"high" }], "likely_cause": string, "estimated_repair_cost": string, "can_drive": string, "what_to_do": string[] }. Be practical and safe. If you can't tell from the photo, say so honestly.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            findings: { type: "array", items: { type: "object", properties: { name: { type: "string" }, meaning: { type: "string" }, urgency: { type: "string" } } } },
            likely_cause: { type: "string" },
            estimated_repair_cost: { type: "string" },
            can_drive: { type: "string" },
            what_to_do: { type: "array", items: { type: "string" } }
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

  const urgencyColor = {
    low: "text-emerald-400 border-emerald-400/30",
    medium: "text-amber-400 border-amber-400/30",
    high: "text-red-400 border-red-400/30"
  };

  return (
    <LifestyleShell
      logo={LOGO}
      name="AutoDoc"
      tagline="Snap a dashboard warning or a dent. Know what it means, what it likely costs, and whether it's safe to drive — before you hand keys to a shop."
      features={["Dashboard lights", "Damage check", "Cost estimate"]}
      steps={["Photograph the warning light or damage up close", "Add any symptoms you've noticed", "Get a read on urgency, likely cause and a rough repair cost"]}
    >
      <label className="block aspect-[4/3] w-full rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden mb-4">
        {preview ? (
          <img src={preview} alt="car" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/40">
            <Upload className="w-8 h-8" />
            <span className="text-xs">Upload car photo</span>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={onPick} />
      </label>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What's happening? (weird noise, when it started, after a bump…)"
        rows={3}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30 resize-none"
      />

      <button
        onClick={run}
        disabled={!file || loading}
        className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Diagnosing…" : "Diagnose my car"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.findings && (
        <div className="mt-8 space-y-5">
          {result.findings.map((f, i) => (
            <div key={i} className="border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{f.name}</h3>
                <span className={`text-[11px] uppercase tracking-wider border rounded-full px-2 py-0.5 ${urgencyColor[f.urgency] || "text-white/40 border-white/15"}`}>
                  {f.urgency}
                </span>
              </div>
              <p className="text-sm text-white/60">{f.meaning}</p>
            </div>
          ))}

          <div className="border border-white/10 rounded-2xl p-4 space-y-3">
            <Row icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} label="Likely cause" value={result.likely_cause} />
            <Row icon={<DollarSign className="w-4 h-4 text-emerald-400" />} label="Est. repair cost" value={result.estimated_repair_cost} />
            <Row icon={<CheckCircle2 className="w-4 h-4 text-white/60" />} label="Safe to drive?" value={result.can_drive} />
          </div>

          {result.what_to_do?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">What to do</p>
              <ol className="space-y-1.5 text-sm text-white/70">
                {result.what_to_do.map((s, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-white/30">{j + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </LifestyleShell>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
        <p className="text-sm text-white/80">{value}</p>
      </div>
    </div>
  );
}