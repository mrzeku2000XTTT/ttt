import React from "react";
import { AlarmClock, Trash2 } from "lucide-react";
import { clockLabel, shortDayLabel } from "@/lib/nudge/localTime";
import { leadLabel, upcomingReminders, waitLabel } from "@/lib/nudge/reminderStore";

/**
 * The reminders app on this phone. Everything set from the Schedule screen lands
 * here, and "Show me" buzzes the phone with it the way the real hour would.
 */
export default function RemindersApp({ reminders, onRemove, onBuzz }) {
  const soon = upcomingReminders(reminders);

  if (!soon.length) {
    return (
      <div className="nudge-cal-empty">
        <AlarmClock className="w-5 h-5" />
        <p>
          No reminders yet.
          <br />
          Open Schedule and tap the moment you want to be reminded about.
        </p>
      </div>
    );
  }

  return (
    <div className="nudge-rem">
      <p className="nudge-book-label">Set on this phone</p>

      {soon.map((reminder) => {
        const at = new Date(reminder.at);
        return (
          <div key={reminder.id} className="nudge-rem-item">
            <span className="nudge-rem-when">
              {shortDayLabel(at)}
              <br />
              {clockLabel(at)}
            </span>
            <span className="nudge-rem-body">
              <span className="nudge-rem-title">{reminder.title}</span>
              <span className="nudge-rem-sub">
                {leadLabel(reminder.leadMinutes)} · buzzes {waitLabel(reminder)}
              </span>
            </span>
            <button type="button" className="nudge-rem-go" onClick={() => onBuzz(reminder)}>
              Show me
            </button>
            <button
              type="button"
              className="nudge-cal-x"
              onClick={() => onRemove(reminder.id)}
              aria-label={`Remove the reminder for ${reminder.title}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      <p className="nudge-sched-hint">
        "Show me" buzzes the phone with it now. On its own, each one buzzes when its moment comes — and the
        Schedule screen can send any of them to your real phone.
      </p>
    </div>
  );
}