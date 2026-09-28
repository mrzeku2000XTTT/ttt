import { base44 } from "@/api/base44Client";

// The agent only ever sees the schedule the user pasted, dropped or photographed,
// and only at the moment they press Analyze — a dropped screenshot is uploaded at
// that moment and nowhere else. Nothing it returns is stored anywhere but the
// browser: NUDGE has no entity and no backend function.

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

export async function analyzeSchedule({ scheduleText, imageUrl, sourceLabel }) {
  const now = new Date();
  const nowString = now.toLocaleString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });

  const text = String(scheduleText || "").trim();
  const fromImage = Boolean(imageUrl);

  const prompt = `You turn whatever a person gives you about their day into the notifications their phone would show them.

RIGHT NOW IT IS: ${nowString}

THE SOURCE${sourceLabel ? ` (${sourceLabel})` : ""} — this is the only source of truth.${fromImage ? " The schedule is in the attached image: read what it actually shows, and never guess at a value you cannot read." : ""}
---
${text || "(nothing typed — the schedule is the attached image)"}
---

The source can arrive in any shape, and none of them are wrong: a tidy list, a spreadsheet or staff roster pasted as columns and rows, a week grid of people against days, a screenshot of a scheduling app, or half-finished notes. Work out the shape first, then take from it whatever is genuinely an event or a shift — a day or a date, a time or a range such as "9am - 5pm", "7:30am - 5:30pm" or "12:00-12:30", a title, and a place when one is given. Let go of everything that is not one: column headings, day totals, hours-worked sums, dollar amounts, week numbers. If it lists several people, keep the rows of the one whose schedule it is when the source makes that clear; when it does not say whose it is, keep the shifts as written. Never invent an event, a person, a place or a time that is not in the source.

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

  if (!text && !fromImage) return { headline: "", notifications: [] };

  // A picture only reads if the model can actually see it.
  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: SCHEMA,
    ...(fromImage ? { file_urls: [imageUrl], model: "gemini_3_flash" } : {}),
  });

  return normalise(result);
}