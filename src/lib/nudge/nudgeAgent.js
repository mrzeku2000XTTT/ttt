import { base44 } from "@/api/base44Client";

// The agent only ever sees the schedule text the user pasted or dropped, and only
// at the moment they press Analyze. Nothing it returns is stored anywhere but the
// browser — NUDGE has no entity and no backend function.

const SCHEMA = {
  type: "object",
  properties: {
    headline: {
      type: "string",
      description: "One-line summary at the top of the notification list, max 46 characters.",
    },
    notifications: {
      type: "array",
      description: "4 to 8 notifications, ordered the way the day happens.",
      items: {
        type: "object",
        properties: {
          app: { type: "string", description: "Which app the notification comes from — Calendar, Maps, Reminders, Mail, Clock, Messages, Weather, Fitness, Notes." },
          time: { type: "string", description: "Short timestamp shown top-right, e.g. '9:30 AM', 'in 20 min', 'now', 'later'." },
          title: { type: "string", description: "Bold headline, max 42 characters." },
          body: { type: "string", description: "One plain sentence of what is happening, max 130 characters." },
          detail: { type: "string", description: "Optional extra line for the expanded state, max 200 characters. Empty string when there is nothing genuinely useful to add." },
          tone: { type: "string", enum: ["now", "next", "later", "heads-up", "conflict"] },
        },
        required: ["app", "time", "title", "body", "tone"],
      },
    },
  },
  required: ["headline", "notifications"],
};

function clip(value, max) {
  const s = String(value ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function normalise(raw) {
  const list = Array.isArray(raw?.notifications) ? raw.notifications : [];
  const notifications = list
    .map((n) => ({
      app: clip(n?.app || "Calendar", 24),
      time: clip(n?.time || "later", 16),
      title: clip(n?.title || "Untitled", 42),
      body: clip(n?.body || "", 130),
      detail: clip(n?.detail || "", 200),
      tone: ["now", "next", "later", "heads-up", "conflict"].includes(n?.tone) ? n.tone : "later",
    }))
    .filter((n) => n.title && n.title !== "Untitled")
    .slice(0, 10);

  return {
    headline: clip(raw?.headline || "Your schedule at a glance", 46),
    notifications,
  };
}

export async function analyzeSchedule({ scheduleText, sourceLabel }) {
  const now = new Date();
  const nowString = now.toLocaleString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  const prompt = `You turn a person's raw calendar into the notifications their phone would show them.

RIGHT NOW IT IS: ${nowString}

THE SCHEDULE${sourceLabel ? ` (from ${sourceLabel})` : ""} — this is the only source of truth. Never invent an event, a person, a place or a time that is not in it:
---
${scheduleText}
---

Write the notifications a phone would have shown this person about this schedule. Each one must read exactly like a real iOS notification: a short bold headline, then ONE plain sentence of what is happening. State the fact. No greetings, no encouragement, no "don't forget", no exclamation marks, no emoji.

Rules:
- Between 4 and 8 notifications, ordered the way the day actually happens.
- "time" is the short timestamp shown top-right: "9:30 AM", "in 20 min", "now", or "later". Use the real times from the schedule.
- "app" is the app the notification would come from. Use Calendar for events. Use Maps when the person has to travel somewhere. Use Reminders for something they must bring or do. Use Mail when a document or a reply is involved. Use Clock for an unusually early start. Only use Weather if the schedule itself mentions weather.
- "title" is at most 42 characters. "body" is at most 130 characters. "detail" is at most 200 characters and only when there is genuinely useful extra context — what to bring, who else is there, how long the walk is. Otherwise return an empty string for "detail".
- "tone" is exactly one of: "now" (happening this moment), "next" (the very next thing), "later" (anything after), "heads-up" (prep or travel), "conflict" (two things genuinely overlap or the gaps are impossible).
- Include exactly one "heads-up" notification about the tightest moment of the day.
- Include a "conflict" notification ONLY if the schedule really contains an overlap or an impossible gap. Never invent one.
- If the schedule is empty, vague or has no times, say so plainly in "headline" and write notifications that describe what IS there.
- "headline" is the one-line summary at the top of the list, at most 46 characters, e.g. "Tuesday — 5 things, first at 9:30".

Return JSON only.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: SCHEMA,
  });

  return normalise(result);
}