import { base44 } from "@/api/base44Client";
import invokeProtectedOperation from '@/components/integrations/invokeProtectedOperation';

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


// live KAS price questions are answered by our own price oracle, never by the LLM
const PRICE_Q = /\b(kas|kaspa)\b[^?]*\b(price|worth|cost|trading|value|usd)\b|\b(price|worth|value)\b[^?]*\b(kas|kaspa)\b/i;

async function livePriceAnswer() {
  const res = await base44.functions.invoke("getKaspaPrice", {});
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

  const recent = (history || []).slice(-6).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    text: (m.role === 'user' ? m.text : m.output?.detail || m.output?.title) || '…'
  }));
  const res = await invokeProtectedOperation('answerTTTQuestion', { message: text, history: recent });

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