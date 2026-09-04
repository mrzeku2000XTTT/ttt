import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FileText, AlertOctagon, BookOpen } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/38f59e3f7_generated_image.png";

export default function PlainSpeak() {
  const [docType, setDocType] = useState("contract");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Explain this ${docType} in plain English. Text: """${text}""". Respond as JSON: { "summary": string, "key_points": string[], "red_flags": string[], "jargon": [{ "term": string, "meaning": string }] }. Summary is 3 sentences max. Key points are 4-6 bullets of what actually matters. Red flags are anything unusual, one-sided or risky (empty array if none). Jargon explains up to 6 confusing terms simply. You are not a lawyer — keep explanations neutral and factual.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            red_flags: { type: "array", items: { type: "string" } },
            jargon: { type: "array", items: { type: "object", properties: { term: { type: "string" }, meaning: { type: "string" } } } }
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

  const types = [["contract", "Contract"], ["policy", "Policy"], ["medical", "Medical"], ["lease", "Lease"], ["other", "Other"]];

  return (
    <LifestyleShell
      logo={LOGO}
      name="PlainSpeak"
      tagline="Paste any dense document — contract, policy, lease, medical letter. Get a plain-English summary, what actually matters, and any red flags."
      features={["Plain-English", "Red flags", "Jargon buster"]}
      steps={["Paste the confusing text", "Pick what kind of document it is", "Read the summary, points and red flags"]}
    >
      <div className="flex flex-wrap gap-2 mb-3">
        {types.map(([v, l]) => (
          <button key={v} onClick={() => setDocType(v)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${docType === v ? "bg-white text-black border-white" : "text-white/60 border-white/15 hover:border-white/40"}`}>{l}</button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the document text here…"
        rows={8}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30 resize-none"
      />

      <button onClick={run} disabled={!text.trim() || loading} className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Decoding…" : "Explain it simply"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.summary && (
        <div className="mt-8 space-y-5">
          <div className="border border-white/10 rounded-2xl p-4">
            <p className="text-sm text-white/80 leading-relaxed">{result.summary}</p>
          </div>

          {result.key_points?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> What matters</p>
              <ul className="space-y-1.5 text-sm text-white/70">
                {result.key_points.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="text-white/30">•</span><span>{p}</span></li>
                ))}
              </ul>
            </div>
          )}

          {result.red_flags?.length > 0 && (
            <div className="border border-red-400/20 bg-red-400/5 rounded-2xl p-4">
              <p className="text-xs uppercase tracking-wider text-red-300/80 mb-2 flex items-center gap-1.5"><AlertOctagon className="w-3.5 h-3.5" /> Red flags</p>
              <ul className="space-y-1.5 text-sm text-white/80">
                {result.red_flags.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="text-red-300/60">•</span><span>{p}</span></li>
                ))}
              </ul>
            </div>
          )}

          {result.jargon?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Jargon buster</p>
              <div className="space-y-2">
                {result.jargon.map((j, i) => (
                  <div key={i} className="border border-white/10 rounded-xl p-3">
                    <p className="text-sm font-semibold">{j.term}</p>
                    <p className="text-xs text-white/50 mt-0.5">{j.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </LifestyleShell>
  );
}