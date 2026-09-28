import React from "react";
import { History, X } from "lucide-react";

function ago(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** The briefs this browser is holding. Delete is the only thing that removes them. */
export default function NudgeBriefList({ briefs, activeId, onSelect, onDelete }) {
  return (
    <div className="nudge-sec">
      <p className="nudge-sec-title">
        <History className="w-3.5 h-3.5" /> Saved here · {briefs.length}
      </p>

      {briefs.length === 0 ? (
        <p className="nudge-note-line">
          <span>Nothing saved yet. Your first brief stays in this browser after you make it.</span>
        </p>
      ) : (
        <div className="nudge-list">
          {briefs.map((b) => (
            <div key={b.id} className={`nudge-item ${b.id === activeId ? "is-on" : ""}`}>
              <button
                type="button"
                onClick={() => onSelect(b.id)}
                className="nudge-item-body text-left bg-transparent border-0 p-0 cursor-pointer"
                style={{ color: "inherit", font: "inherit" }}
              >
                <span className="nudge-item-title block">{b.headline}</span>
                <span className="nudge-item-sub block">
                  {b.notifications.length} notification{b.notifications.length === 1 ? "" : "s"} · {ago(b.createdAt)}
                </span>
              </button>
              <button type="button" className="nudge-x" onClick={() => onDelete(b.id)} aria-label="Delete brief">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}