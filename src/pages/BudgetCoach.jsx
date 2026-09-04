import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Scissors } from "lucide-react";
import LifestyleShell from "@/components/lifestyle/LifestyleShell";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/37aec0b29_generated_image.png";

export default function BudgetCoach() {
  const [finances, setFinances] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!finances.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You're a practical budget coach. Parse this freeform income & expense info: "${finances}". Savings goal: ${goal || "general savings"}. Respond as JSON: { "summary": string, "cuts": [{ "what": string, "save": string, "how": string }], "plan": string[] }. Summary is 2 sentences on the overall state. Cuts are 3-5 specific, realistic savings moves with amounts. Plan is a 4-step monthly routine. Numbers as strings like "$40/mo".`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            cuts: { type: "array", items: { type: "object", properties: { what: { type: "string" }, save: { type: "string" }, how: { type: "string" } } } },
            plan: { type: "array", items: { type: "string" } }
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
      name="BudgetCoach"
      tagline="Dump your income and expenses in plain words. Get an honest read, smart cuts with dollar amounts, and a simple monthly routine."
      features={["Freeform input", "Dollar-amount cuts", "Monthly routine"]}
      steps={["Type your money situation however it comes out", "Add a savings goal if you have one", "Follow the cuts and the monthly plan"]}
    >
      <textarea
        value={finances}
        onChange={(e) => setFinances(e.target.value)}
        placeholder="Freeform: make 3800/mo, rent 1200, groceries 450, car 320, eating out 300…"
        rows={5}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-3 outline-none focus:border-white/30 resize-none"
      />
      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Savings goal? (e.g. $5k emergency fund)"
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30"
      />

      <button onClick={run} disabled={!finances.trim() || loading} className="w-full bg-white text-black font-semibold py-3.5 rounded-xl disabled:opacity-30 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Crunching…" : "Coach my budget"}
      </button>

      {result?.error && <p className="text-red-400 text-sm mt-4">{result.error}</p>}
      {result?.summary && (
        <div className="mt-8 space-y-5">
          <div className="border border-white/10 rounded-2xl p-4">
            <p className="text-sm text-white/80 leading-relaxed">{result.summary}</p>
          </div>

          {result.cuts?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5" /> Smart cuts</p>
              <div className="space-y-2">
                {result.cuts.map((c, i) => (
                  <div key={i} className="border border-white/10 rounded-xl p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{c.what}</p>
                      <p className="text-xs text-white/50 mt-0.5">{c.how}</p>
                    </div>
                    <span className="text-sm text-emerald-400 whitespace-nowrap">{c.save}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.plan?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Monthly routine</p>
              <ol className="space-y-1.5 text-sm text-white/70">
                {result.plan.map((p, i) => (
                  <li key={i} className="flex gap-2"><span className="text-white/30">{i + 1}.</span><span>{p}</span></li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </LifestyleShell>
  );
}