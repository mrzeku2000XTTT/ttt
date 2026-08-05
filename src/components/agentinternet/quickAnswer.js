import { base44 } from "@/api/base44Client";

/**
 * Fast lane for TTT A.I.
 * One internet-grounded call decides whether the message is a plain question
 * (chat, facts, "what is…", "how do I…", opinions, current events) or a real
 * app task that needs the sub-agent orchestrator.
 *
 * If it's a question we answer it right here — grounded in live web search —
 * so the agent can answer anything without faking an orchestration.
 * Returns null when the message should go through orchestration.
 */
const SCHEMA = {
  type: "object",
  properties: {
    mode: { type: "string", enum: ["question", "task"] },
    title: { type: "string", description: "short 2-4 word label for the answer" },
    answer: { type: "string", description: "the direct answer, 1-4 sentences, factual and conversational" },
    points: {
      type: "array",
      items: { type: "string" },
      description: "optional 2-5 key supporting facts, only when the answer benefits from a breakdown",
    },
  },
  required: ["mode"],
};

// live KAS price questions are answered by our own price oracle, never by the LLM
const PRICE_Q = /\b(kas|kaspa)\b[^?]*\b(price|worth|cost|trading|value|usd)\b|\b(price|worth|value)\b[^?]*\b(kas|kaspa)\b/i;

async function livePriceAnswer() {
  const res = await base44.functions.getKaspaPrice({});
  const d = res?.data || res;
  if (!d?.price) return null;
  const price = Number(d.price);
  const chg = Number(d.change24h || 0);
  const dir = chg > 0 ? "up" : chg < 0 ? "down" : "flat";
  return {
    skill: "Kaspa Oracle · live",
    plan: [],
    output: {
      type: "text",
      title: "KAS Price",
      detail: `Kaspa (KAS) is trading at $${price.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")} right now${chg ? `, ${dir} ${Math.abs(chg).toFixed(2)}% over the last 24 hours` : ""}. Live from ${d.source || "our price oracle"}.`,
    },
  };
}

export async function tryQuickAnswer(text, history) {
  if (PRICE_Q.test(text)) {
    try {
      const p = await livePriceAnswer();
      if (p) return p;
    } catch {}
  }

  const ctx = (history || [])
    .slice(-6)
    .map((m) => (m.role === "user" ? `User: ${m.text}` : `Assistant: ${m.output?.detail || m.output?.title || ""}`))
    .join("\n");

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are TTT A.I. First classify the user's latest message.

mode = "task" ONLY if it asks you to DO something inside an app: send/pay KAS, escrow funds, mint, generate or draw an image, build a site or landing page, make/edit a video, clip a stream, post/broadcast to channels, create a wallet, deploy or run something.

mode = "question" for EVERYTHING else — factual questions, current events, prices, how-tos, definitions, code help, opinions, small talk, follow-ups. Questions about Kaspa, crypto, tech, news, people, anything at all.

If mode is "question": answer it directly and completely using live web knowledge. Be accurate, specific and current — cite concrete numbers, names and dates where relevant. 1-4 sentences. Add "points" only if a short breakdown genuinely helps. Never refuse, never say you need an agent, never invent transactions.
If mode is "task": return only { "mode": "task" } and nothing else.

${ctx ? `Conversation so far:\n${ctx}\n` : ""}Latest message: "${text}"`,
    response_json_schema: SCHEMA,
    add_context_from_internet: true,
    model: "gemini_3_flash",
  });

  const data = typeof res === "string" ? JSON.parse(res) : res;
  if (!data || data.mode !== "question" || !data.answer) return null;

  const points = Array.isArray(data.points) ? data.points.filter(Boolean) : [];
  return {
    skill: "Ying · grounded search",
    plan: [],
    output: points.length
      ? { type: "research", title: data.title || "Answer", detail: data.answer, meta: { points } }
      : { type: "text", title: data.title || "Answer", detail: data.answer },
  };
}