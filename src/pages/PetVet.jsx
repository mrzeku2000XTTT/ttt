import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, PawPrint, Stethoscope, Home, AlertTriangle } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/69222f34d_generated_image.png";

export default function PetVet() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pet, setPet] = useState("");
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
        prompt: `You're a calm, careful veterinary triage assistant — NOT a replacement for a vet. Look at the pet photo and read the owner's note. Pet: "${pet}". Symptoms/notes: "${note}". Respond as JSON: { "possible_conditions": [{ "name": string, "likelihood": "low"|"medium"|"high", "severity": "mild"|"moderate"|"serious" }], "home_care": string[], "see_vet": boolean, "urgency": "routine"|"soon"|"urgent", "ask_vet": string[] }. Be conservative — when in doubt, recommend a vet.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            possible_conditions: { type: "array", items: { type: "object", properties: { name: { type: "string" }, likelihood: { type: "string" }, severity: { type: "string" } } } },
            home_care: { type: "array", items: { type: "string" } },
            see_vet: { type: "boolean" },
            urgency: { type: "string" },
            ask_vet: { type: "array", items: { type: "string" } }
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

  const sevColor = { mild: "text-emerald-400", moderate: "text-amber-400", serious: "text-red-400" };
  const urgColor = {
    routine: "text-emerald-400 border-emerald-400/30",
    soon: "text-amber-400 border-amber-400/30",
    urgent: "text-red-400 border-red-400/30"
  };

  return (
    <LifestyleShell
      logo={LOGO}
      name="PetVet"
      tagline="Photo your pet and describe what's off. Get a careful triage — possible causes, home care, and whether it's vet time."
      features={["Triage", "Home care", "Vet questions"]}
      steps={["Upload a clear photo of your pet", "Add pet type/age and what you've noticed", "Get a calm read on urgency and next steps"]}
    >
      <label className="block aspect-[4/3] w-full rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden mb-4">
        {preview ? (
          <img src={preview} alt="pet" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/40">
            <Upload className="w-8 h-8" />
            <span className="text-xs">Upload pet photo</span>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={onPick} />
      </label>

      <input
        value={pet}
        onChange={(e) => setPet(e.target.value)}
        placeholder="Pet & age (e.g. 4yo labrador)"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:border-white/30"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="What's wrong? (not eating, limping, itchy…)"
        rows={3}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30 resize-none"
      />

      <button
        onClick={run}
        disabled={!file || loading}
        className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Checking…" : "Triage my pet"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.possible_conditions && (
        <div className="mt-8 space-y-5">
          <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 ${urgColor[result.urgency] || "text-white/60 border-white/15"}`}>
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-semibold capitalize">
              {result.urgency} — {result.see_vet ? "see a vet" : "monitor at home"}
            </span>
          </div>

          {result.possible_conditions.map((c, i) => (
            <div key={i} className="border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold">{c.name}</h3>
                <span className={`text-xs ${sevColor[c.severity] || "text-white/40"}`}>{c.severity}</span>
              </div>
              <p className="text-xs text-white/40 capitalize">likelihood: {c.likelihood}</p>
            </div>
          ))}

          {result.home_care?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" /> Home care
              </p>
              <ul className="space-y-1.5 text-sm text-white/70">
                {result.home_care.map((s, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-white/30">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.ask_vet?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5" /> Ask your vet
              </p>
              <ul className="space-y-1.5 text-sm text-white/70">
                {result.ask_vet.map((s, j) => (
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