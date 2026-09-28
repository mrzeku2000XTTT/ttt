import React, { useState } from "react";
import ScheduleSheet from "./ScheduleSheet";
import ScheduleViewer from "./ScheduleViewer";
import ScheduleEventList from "./ScheduleEventList";
import ReminderSheet from "./ReminderSheet";
import { clockLabel, shortDayLabel } from "@/lib/nudge/localTime";
import { leadLabel, upcomingReminders } from "@/lib/nudge/reminderStore";

/**
 * The Schedule screen: the schedule as it was given, every moment in it tappable,
 * and the assistant in the dock below. Tapping a moment sets a reminder this phone
 * will buzz with.
 */
export default function ScheduleApp({ brief, events, reminders, onRemind }) {
  const [viewer, setViewer] = useState(false);
  const [picked, setPicked] = useState(null);
  const [note, setNote] = useState("");

  const set = upcomingReminders(reminders);

  const addReminder = (reminder) => {
    onRemind([reminder]);
    setPicked(null);
    setNote(
      `Reminder set for ${clockLabel(new Date(reminder.at))} — ${leadLabel(reminder.leadMinutes).toLowerCase()}. ` +
        "This phone will buzz you, and it is in Reminders now.",
    );
  };

  return (
    <div className="nudge-sched">
      <ScheduleSheet brief={brief} onOpen={() => setViewer(true)} />

      <div>
        <p className="nudge-book-label">Tap a moment to be reminded</p>
        <ScheduleEventList
          events={events}
          onPick={(event) => {
            setNote("");
            setPicked(event);
          }}
        />
      </div>

      {set.length ? (
        <div>
          <p className="nudge-book-label">Reminders set</p>
          <div className="nudge-sched-set">
            {set.map((reminder) => (
              <p key={reminder.id} className="nudge-when">
                {shortDayLabel(new Date(reminder.at))} · {clockLabel(new Date(reminder.at))} — {reminder.title}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {note ? <p className="nudge-book-note">{note}</p> : null}

      <ScheduleViewer open={viewer} brief={brief} onClose={() => setViewer(false)} />
      {picked ? (
        <ReminderSheet event={picked} onAdd={addReminder} onClose={() => setPicked(null)} />
      ) : null}
    </div>
  );
}