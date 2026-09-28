import React from "react";
import { appIdentity } from "./appIdentity";

/**
 * An iOS notification, rebuilt in HTML — the template the whole app is built on.
 * Frosted card, app tile top-left, uppercase app name, timestamp on the right,
 * then the bold headline and one line of body. Tapping reveals the extra detail.
 */
export default function AppleNotification({ note, expanded, onToggle, animate = true }) {
  const { Icon, bg, fg } = appIdentity(note.app);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`nudge-note ${animate ? "" : "is-static"}`}
      aria-expanded={expanded ? "true" : "false"}
    >
      <span className="nudge-note-top">
        <span className="nudge-note-icon" style={{ background: bg, color: fg }}>
          <Icon className="nudge-note-icon-glyph" strokeWidth={2.1} />
        </span>
        <span className="nudge-note-app">{note.app}</span>
        <span className="nudge-note-time">{note.time}</span>
      </span>
      <span className="nudge-note-title">{note.title}</span>
      <span className="nudge-note-body">{note.body}</span>
      {expanded && note.detail ? (
        <span className="nudge-note-detail">{note.detail}</span>
      ) : null}
    </button>
  );
}