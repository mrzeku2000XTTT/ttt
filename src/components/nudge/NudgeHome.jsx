import React from "react";
import { CalendarPlus, CalendarDays, FileText, Lock, ListChecks } from "lucide-react";

/**
 * The apps on this phone. Every one of them opens something that works — nothing
 * here is a placeholder.
 */
export const NUDGE_APPS = [
  { id: "booking", name: "Booking", Icon: CalendarPlus, bg: "linear-gradient(#5ce07a, #34c759)", fg: "#ffffff" },
  { id: "calendar", name: "Calendar", Icon: CalendarDays, bg: "linear-gradient(#ffffff, #f1f1f4)", fg: "#ff3b30" },
  { id: "schedule", name: "Schedule", Icon: FileText, bg: "linear-gradient(#54b7ff, #1c6ef2)", fg: "#ffffff" },
  { id: "reminders", name: "Reminders", Icon: ListChecks, bg: "linear-gradient(#ffffff, #f1f1f4)", fg: "#ff9500" },
];

/** The home screen, reached by unlocking. */
export default function NudgeHome({ open, badges = {}, onOpenApp, onLock }) {
  return (
    <div className={`nudge-home ${open ? "is-open" : ""}`}>
      <div className="nudge-home-grid">
        {NUDGE_APPS.map(({ id, name, Icon, bg, fg }) => (
          <button key={id} type="button" className="nudge-app-icon" onClick={() => onOpenApp(id)}>
            <span className="nudge-app-tile" style={{ background: bg, color: fg }}>
              <Icon className="w-6 h-6" strokeWidth={2} />
              {badges[id] > 0 && <span className="nudge-app-badge">{badges[id]}</span>}
            </span>
            <span className="nudge-app-name">{name}</span>
          </button>
        ))}
      </div>

      <div className="nudge-home-foot">
        <span className="nudge-home-dots">
          <i className="is-on" />
          <i />
        </span>
        <button type="button" className="nudge-home-lock" onClick={onLock}>
          <Lock className="w-3 h-3" /> Lock screen
        </button>
      </div>
    </div>
  );
}