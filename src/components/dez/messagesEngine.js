import { base44 } from '@/api/base44Client';

// Dez · Messages — planning + deterministic timing engine.
// The same timeline drives the on-screen preview and the MP4 export,
// so what you preview is exactly what you get.

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    messages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          side: { type: 'string', enum: ['incoming', 'outgoing'] },
          text: { type: 'string' },
          pause: { type: 'number' }
        },
        required: ['side', 'text']
      }
    }
  },
  required: ['title', 'messages']
};

export async function planConversation(brief) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You plan realistic iPhone texting conversations for short videos.
"incoming" = received messages (left, gray bubble — the other person). "outgoing" = sent by the phone owner (right, blue bubble — being typed live on this phone).
Make it feel REAL: casual texting language — lowercase, abbreviations, ALL CAPS when someone shouts or gets excited, an occasional typo, short 1-2 line bubbles, emoji sparingly. Vary "pause" (seconds before each message happens, 0.4-3.5) — a longer pause reads as hesitation or being left on read.
Write 4-12 messages that tell a tiny story with a punchy or funny ending.

USER BRIEF: """${brief}"""`,
    response_json_schema: PLAN_SCHEMA
  });
  const messages = (res.messages || []).slice(0, 30).map((m, i) => ({
    id: 'm' + Date.now().toString(36) + i,
    side: m.side === 'outgoing' ? 'outgoing' : 'incoming',
    text: String(m.text || '').slice(0, 300),
    pause: typeof m.pause === 'number' ? Math.max(0.2, Math.min(6, m.pause)) : undefined
  })).filter((m) => m.text.trim());
  if (!messages.length) throw new Error('Try describing the conversation a bit more.');
  return { title: res.title || 'Untitled chat', messages };
}

// Apple-style easings — smooth, springy, no bounce unless asked.
export const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
export const easeOutBack = (p) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

// Deterministic timeline: every bubble's appearance is precomputed, so the
// preview and the export render identically frame for frame.
export function buildTimeline(messages) {
  let t = 0.3;
  const items = [];
  (messages || []).forEach((m, i) => {
    const text = (m.text || '').trim();
    if (!text) return;
    t += typeof m.pause === 'number' ? m.pause : i === 0 ? 0.3 : 0.7;
    const item = { side: m.side, text };
    if (m.side === 'incoming') {
      item.dotsStart = t;
      item.dotsDur = Math.min(3, Math.max(0.7, 0.6 + text.length * 0.045));
      t += item.dotsDur;
      item.show = t;
    } else {
      item.typeStart = t;
      const charTimes = [];
      for (let k = 0; k < text.length; k++) {
        charTimes.push(t);
        t += 0.038 + 0.03 * Math.abs(Math.sin(k * 2.7 + text.length));
      }
      item.charTimes = charTimes;
      t += 0.15;
      item.show = t;
    }
    item.pop = 0.3;
    t += 0.25;
    items.push(item);
  });
  return { items, total: t + 1.2 };
}

export function buildSoundEvents(timeline) {
  const ev = [];
  (timeline.items || []).forEach((it) => {
    if (it.side === 'incoming') {
      ev.push({ type: 'receive', t: it.show });
    } else {
      (it.charTimes || []).forEach((ct, k) => {
        if (k % 3 === 0) ev.push({ type: 'tick', t: ct + 0.01 });
      });
      ev.push({ type: 'send', t: it.show });
    }
  });
  return ev;
}