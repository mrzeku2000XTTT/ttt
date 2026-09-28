import React, { useState } from "react";
import { BellRing, CalendarPlus, Check, Share } from "lucide-react";
import AppleNotification from "./AppleNotification";
import { LEAD_OPTIONS, makeReminder, reminderToNotification } from "@/lib/nudge/reminderStore";
import { downloadRemindersIcs } from "@/lib/nudge/reminderIcs";
import { momentLabel } from "@/lib/nudge/localTime";

/**
 * One moment, and the one question that matters: how far ahead should the phone
 * buzz? One tap sets it here, and a second hands the same reminder to a real phone
 * as a calendar file it can open.
 */
export default function ReminderSheet({ event, onAdd, onClose }) {
  const [leadMinutes, setLeadMinutes] = useState(15);
  const [sent, setSent] = useState(false);

  if (!event) return null;

  const ready = Boolean(event.moment);
  const reminder = ready
    ? makeReminder({ title: event.title, at: event.moment, leadMinutes, from: event.app })
    : null;

  const sendToPhone = () => {
    downloadRemindersIcs([reminder], "nudge-reminder");
    setSent(true);
  };

  return (
    <>
      <div className="nudge-scrim--phone" onClick={onClose} />
      <div className="nudge-sheet--phone">
        <div className="nudge-sheet-head">
          <span className="nudge-sheet-grab" />
          <span className="nudge-app-title">Remind me</span>
          <button type="button" className="nudge-ghost ml-auto" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="nudge-sheet-phone-body">
          <p className="nudge-ev-title">{event.title}</p>
          <p className="nudge-when">
            {[event.dateLabel, event.timeLabel].filter(Boolean).join(" · ") || "No time written on this one"}
          </p>

          {ready ? (
            <>
              <p className="nudge-book-label">When should I remind you?</p>
              {LEAD_OPTIONS.map((option) => (
                <button
                  key={option.minutes}
                  type="button"
                  className={`nudge-opt ${leadMinutes === option.minutes ? "is-on" : ""}`}
                  onClick={() => {
                    setLeadMinutes(option.minutes);
                    setSent(false);
                  }}
                >
                  <span className="nudge-opt-dot" />
                  {option.label}
                </button>
              ))}

              <p className="nudge-book-label">This is what your phone will show</p>
              <div className="nudge-book-cards">
                <AppleNotification note={reminderToNotification(reminder)} animate={false} showDate />
              </div>

              <button type="button" className="nudge-go" onClick={() => onAdd(reminder)}>
                <BellRing className="w-4 h-4" /> Remind me on this phone
              </button>

              <button type="button" className="nudge-go-ghost" onClick={sendToPhone}>
                {sent ? <Check className="w-4 h-4" /> : <Share className="w-4 h-4" />}
                {sent ? "Saved — open it on your phone" : "Send it to my real phone"}
              </button>
              <p className="nudge-sched-hint">
                That saves {momentLabel(event.moment)} as a calendar file with its own alarm. Open it on your
                phone and the phone's own reminders app buzzes you.
              </p>
            </>
          ) : (
            <>
              <p className="nudge-when">
                I could not read a time on this one, so there is nothing to buzz you about yet.
              </p>
              <p className="nudge-sched-hint">
                You can add the time when you book it, or ask me in the chat below and I will set the reminder
                for you.
              </p>
              <button type="button" className="nudge-go-ghost" onClick={onClose}>
                <CalendarPlus className="w-4 h-4" /> Back to the schedule
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}