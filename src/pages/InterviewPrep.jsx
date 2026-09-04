import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MessageCircle, HelpCircle } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/486efa748_generated_image.png";

export default function InterviewPrep() {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [level, setLevel] = useState("mid");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!role.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Prepare someone for a job interview. Role: ${role}. Company: ${company || "unspecified"}. Seniority: ${level}. Respond as JSON: { "questions": [{ "q": string, "guide": string }], "ask_them": string[], "tips": string[] }. Give 6 likely interview questions (mix of behavioral and role-specific) with a strong answer guide (STAR-ish, 2 sentences). Ask_them is 4 smart questions to ask the interviewer. Tips are 3-4 prep notes specific to this role.`,
        response_json_schema: {
          type: "object",
          properties: {
            questions: { type: "array", items: { type: "object", properties: { q: { type: "string" }, guide: { type: "string" } } } },
            ask_them: { type: "array", items: { type: "string" } },
            tips: { type: "array", items: { type: "string" } }
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

  const levels = [["junior", "Junior"], ["mid", "Mid"], ["senior", "Senior"]];

  return (
    <LifestyleShell
      logo={LOGO}
      name="InterviewPrep"
      tagline="Type the role and company. Get the questions you'll probably be asked, how to answer them well, and smart things to ask back."
      features={["Likely questions", "Answer guides", "Ask-backs"]}
      steps={["Enter the role you're interviewing for", "Add the company and your level", "Rehearse the answers and steal the ask-backs"]}
    >
      <div className="space-y-3 mb-4">
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. product designer)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />
        <div className="flex flex-wrap gap-2">
          {levels.map(([v, l]) => (
            <button key={v} onClick={() => setLevel(v)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${level === v ? "bg-white text-black border-white" : "text-white/60 border-white/15 hover:border-white/40"}`}>{l}</button>
          ))}
        </div>
      </div>

      <button onClick={run} disabled={!role.trim() || loading} className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Preparing…" : "Prep me"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.questions && (
        <div className="mt-8 space-y-5">
          {result.questions.map((q, i) => (
            <div key={i} className="border border-white/10 rounded-2xl p-4">
              <p className="font-semibold flex items-start gap-2 mb-2">
                <MessageCircle className="w-3.5 h-3.5 text-white/40 mt-1 flex-shrink-0" />
                {q.q}
              </p>
              <p className="text-sm text-white/60 leading-relaxed pl-6">{q.guide}</p>
            </div>
          ))}

          {result.ask_them?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Ask them</p>
              <ul className="space-y-1.5 text-sm text-white/70">
                {result.ask_them.map((a, i) => (
                  <li key={i} className="flex gap-2"><span className="text-white/30">•</span><span>{a}</span></li>
                ))}
              </ul>
            </div>
          )}

          {result.tips?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Prep notes</p>
              <ul className="space-y-1.5 text-sm text-white/70">
                {result.tips.map((t, i) => (
                  <li key={i} className="flex gap-2"><span className="text-white/30">•</span><span>{t}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </LifestyleShell>
  );
}