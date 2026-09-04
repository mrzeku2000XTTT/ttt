import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ef1cad7cc_generated_image.png";

export default function MsgCraft() {
  const [gist, setGist] = useState("");
  const [to, setTo] = useState("");
  const [tone, setTone] = useState("friendly");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!gist.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Write this message 3 ways. The gist: "${gist}". Recipient: ${to || "general"}. Primary tone: ${tone}. Respond as JSON: { "versions": [{ "tone": string, "subject": string, "message": string }] }. First version uses the primary tone; the other two use different sensible tones. Messages are short, natural and ready to send — email-style with a subject. No placeholders.`,
        response_json_schema: {
          type: "object",
          properties: {
            versions: { type: "array", items: { type: "object", properties: { tone: { type: "string" }, subject: { type: "string" }, message: { type: "string" } } } }
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

  const tones = [["friendly", "Friendly"], ["formal", "Formal"], ["firm", "Firm"], ["apologetic", "Apologetic"]];

  return (
    <LifestyleShell
      logo={LOGO}
      name="MsgCraft"
      tagline="Say the gist in your own words. Get it written properly — three ready-to-send versions in different tones."
      features={["3 tone versions", "Ready to send", "Subject included"]}
      steps={["Type what you need to say, roughly", "Say who it's for and pick a tone", "Copy the version that sounds like you"]}
    >
      <div className="space-y-3 mb-4">
        <textarea
          value={gist}
          onChange={(e) => setGist(e.target.value)}
          placeholder="The gist (e.g. can't make Friday, want to move the meeting…)"
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 resize-none"
        />
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To whom? (boss, landlord, friend…)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30" />
        <div className="flex flex-wrap gap-2">
          {tones.map(([v, l]) => (
            <button key={v} onClick={() => setTone(v)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${tone === v ? "bg-white text-black border-white" : "text-white/60 border-white/15 hover:border-white/40"}`}>{l}</button>
          ))}
        </div>
      </div>

      <button onClick={run} disabled={!gist.trim() || loading} className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Writing…" : "Write it for me"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.versions && (
        <div className="mt-8 space-y-4">
          {result.versions.map((v, i) => (
            <div key={i} className="border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-3.5 h-3.5 text-white/40" />
                <span className="text-[11px] uppercase tracking-wider text-white/50 border border-white/15 rounded-full px-2.5 py-0.5">{v.tone}</span>
              </div>
              <p className="text-sm font-semibold mb-2">{v.subject}</p>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{v.message}</p>
            </div>
          ))}
        </div>
      )}
    </LifestyleShell>
  );
}