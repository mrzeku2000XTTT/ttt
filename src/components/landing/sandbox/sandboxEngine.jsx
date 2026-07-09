import { base44 } from "@/api/base44Client";

// Run one model on the task prompt, measuring real latency
export async function runModel(model, prompt) {
  const start = performance.now();
  const reply = await base44.integrations.Core.InvokeLLM({
    model: model.backend,
    prompt: `${prompt}\n\n(Answer directly and completely in Markdown.)`,
  });
  const ms = Math.round(performance.now() - start);
  return { reply: typeof reply === "string" ? reply : JSON.stringify(reply), ms };
}

// Blind judge — responses are anonymized (A/B/C…) so the judge can't favor a brand
export async function judgeResponses(prompt, results) {
  const anon = results.map((r, i) => ({ key: String.fromCharCode(65 + i), response: (r.reply || "").slice(0, 4000) }));
  const judged = await base44.integrations.Core.InvokeLLM({
    model: "gemini_3_1_pro",
    prompt: `You are an impartial AI benchmark judge. The task given to every model was:\n\n"${prompt}"\n\nHere are the anonymized responses:\n${anon.map(a => `\n### Response ${a.key}\n${a.response}`).join("\n")}\n\nScore EACH response 0-100 on: accuracy (factually/logically correct), completeness (fully addresses the task), clarity (well structured, easy to follow), reasoning (depth & quality of thinking). Be strict and differentiate — do not give everyone the same score. Also write a one-sentence verdict per response and a short overall analysis comparing them, and pick the winner key.`,
    response_json_schema: {
      type: "object",
      properties: {
        scores: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: { type: "string" },
              accuracy: { type: "number" },
              completeness: { type: "number" },
              clarity: { type: "number" },
              reasoning: { type: "number" },
              verdict: { type: "string" },
            },
            required: ["key", "accuracy", "completeness", "clarity", "reasoning"],
          },
        },
        winner: { type: "string" },
        analysis: { type: "string" },
      },
      required: ["scores", "winner"],
    },
  });
  return judged;
}

// Real speed score: fastest = 100, others scaled against it
export function speedScore(ms, allMs) {
  const fastest = Math.min(...allMs.filter(m => m > 0));
  if (!ms || !isFinite(fastest)) return 0;
  return Math.round(Math.max(20, (fastest / ms) * 100));
}

// Composite benchmark: 85% judged quality + 15% measured speed
export function overallScore(s, speed) {
  const quality = (s.accuracy + s.completeness + s.clarity + s.reasoning) / 4;
  return Math.round(quality * 0.85 + speed * 0.15);
}