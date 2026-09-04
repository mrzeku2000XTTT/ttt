import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Loader2, Copy, Check } from "lucide-react";

export default function ResumeRevive() {
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState("");

  const run = async () => {
    if (!resume || !job) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Tailor this resume to the job description. Highlight relevant experience, reword bullets to match the role, and write a short cover letter. Respond as JSON: { "tailored_resume": string (plain text, ready to paste), "cover_letter": string (3 short paragraphs), "keywords_matched": string[] (5-8 keywords from the JD you addressed) }.\n\nRESUME:\n${resume}\n\nJOB:\n${job}`,
        response_json_schema: {
          type: "object",
          properties: {
            tailored_resume: { type: "string" },
            cover_letter: { type: "string" },
            keywords_matched: { type: "array", items: { type: "string" } }
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

  const copy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-full max-w-md px-5 py-8">
        <div className="flex items-center gap-2 mb-8">
          <FileText className="w-6 h-6" />
          <h1 className="text-2xl font-bold tracking-tight">ResumeRevive</h1>
        </div>
        <p className="text-white/50 text-sm mb-6">Old resume → tailored for the job.</p>

        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="Paste your current resume…"
          rows={5}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:border-white/30 resize-none"
        />
        <textarea
          value={job}
          onChange={(e) => setJob(e.target.value)}
          placeholder="Paste the job description…"
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30 resize-none"
        />

        <button
          onClick={run}
          disabled={!resume || !job || loading}
          className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Tailoring…" : "Tailor my resume"}
        </button>

        {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
        {result?.tailored_resume && (
          <div className="mt-8 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs uppercase tracking-wider text-white/40">Resume</p>
                <button onClick={() => copy("r", result.tailored_resume)} className="text-white/40 hover:text-white">
                  {copied === "r" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-white/80 border border-white/10 rounded-2xl p-4 font-sans leading-relaxed">{result.tailored_resume}</pre>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs uppercase tracking-wider text-white/40">Cover Letter</p>
                <button onClick={() => copy("c", result.cover_letter)} className="text-white/40 hover:text-white">
                  {copied === "c" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-white/80 border border-white/10 rounded-2xl p-4 leading-relaxed">{result.cover_letter}</p>
            </div>
            {result.keywords_matched?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Keywords matched</p>
                <div className="flex flex-wrap gap-2">
                  {result.keywords_matched.map((k, i) => (
                    <span key={i} className="text-xs border border-white/15 rounded-full px-3 py-1">{k}</span>
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