import { base44 } from "@/api/base44Client";
import { clockLabel, dayLabel } from "./localTime";
import { makeReminder } from "./reminderStore";

// The assistant that sits at the bottom of the Schedule screen. It answers in the
// plainest words it can, and — when asked — hands back the reminders it thinks the
// person wants, ready to be set on the phone with one tap.

const SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "What to say back, in short plain sentences." },
    reminders: {
      type: "array",
      description: "Reminders worth setting on the phone — only when they were asked for.",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "The moment, in the schedule's own words." },
          time: { type: "string", description: 'The local moment, written "YYYY-MM-DDTHH:MM".' },
          leadMinutes: { type: "number", description: "0, 15, 60 or 1440." },
        },
        required: ["title", "time"],
      },
    },
  },
  required: ["reply"],
};

function scheduleLines(events) {
  if (!events?.length) return "- (nothing was read out of this schedule)";
  return events
    .map((e) => {
      const when = [e.dateLabel, e.timeLabel].filter(Boolean).join(" ") || "no time given";
      return `- ${when} — ${e.title}${e.body ? ` (${e.body})` : ""}`;
    })
    .join("\n");
}

function reminderLines(reminders) {
  if (!reminders?.length) return "- none yet";
  return reminders
    .map((r) => {
      const at = new Date(r.at);
      return `- ${r.title} at ${clockLabel(at)} on ${dayLabel(at)}`;
    })
    .join("\n");
}

/** Only reminders for a real, readable, still-to-come moment are kept. */
function proposalsToReminders(list, now) {
  return (Array.isArray(list) ? list : [])
    .map((proposal) => {
      const at = new Date(String(proposal?.time || "")).getTime();
      if (!proposal?.title || !Number.isFinite(at) || at < now.getTime() - 60000) return null;
      return makeReminder({
        title: proposal.title,
        at,
        leadMinutes: proposal.leadMinutes,
        from: "Asked in the chat",
      });
    })
    .filter(Boolean)
    .slice(0, 3);
}

export async function askScheduleAssistant({ brief, events, reminders, history, question, now = new Date() }) {
  const prompt = `You are NUDGE, sitting at the bottom of someone's phone screen, helping them understand one schedule and put reminders on their phone. They are often older, so be warm, brief and very plain: short sentences, everyday words, no jargon, no lists, no markdown, never more than three sentences.

Today is ${dayLabel(now)} and it is now ${clockLabel(now)}.

The schedule they handed over — already read once by the app, headline "${brief?.headline || ""}":
${scheduleLines(events)}

Reminders already set on their phone:
${reminderLines(reminders)}

What has been said so far:
${history?.length ? history.join("\n") : "(nothing yet)"}

They just said: "${question}"

Answer them in \`reply\`. If they asked for a reminder, or plainly need one for a moment you can see in the schedule, also return up to three in \`reminders\`: a short plain \`title\` in the schedule's own words, \`time\` as the local moment written "YYYY-MM-DDTHH:MM", and \`leadMinutes\` of 0, 15, 60 or 1440. Only ever set a reminder for a moment you can actually see — if a moment has no time on it, say so in \`reply\` and return no reminders.`;

  const result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: SCHEMA });
  const reply = String(result?.reply || "").trim();

  return {
    reply: reply || "I am not sure I read that right. Try asking me in different words.",
    reminders: proposalsToReminders(result?.reminders, now),
  };
}