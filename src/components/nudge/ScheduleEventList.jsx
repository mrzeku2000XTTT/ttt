import React from "react";
import { ChevronRight } from "lucide-react";

/** Every moment the agent read out of the schedule, as something you can tap. */
export default function ScheduleEventList({ events, onPick }) {
  if (!events?.length) {
    return (
      <p className="nudge-sched-hint">
        Nothing was read out of this schedule. Make a brief from a schedule first, and every moment will
        show up here to be tapped.
      </p>
    );
  }

  return (
    <div className="nudge-ev-list">
      {events.map((event) => (
        <button key={event.id} type="button" className="nudge-ev" onClick={() => onPick(event)}>
          <span className="nudge-ev-time">{event.timeLabel || "--"}</span>
          <span className="nudge-ev-body">
            <span className="nudge-ev-title">{event.title}</span>
            <span className="nudge-ev-sub">{[event.dateLabel, event.body].filter(Boolean).join(" · ")}</span>
          </span>
          <ChevronRight className="nudge-ev-go" />
        </button>
      ))}
    </div>
  );
}