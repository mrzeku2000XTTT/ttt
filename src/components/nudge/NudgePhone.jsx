import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, BellOff } from "lucide-react";
import AppleNotification from "./AppleNotification";

const LOCK_CLOCK = "9:41";

/**
 * The phone. Two faces of the same template:
 *  · "lock"   — the iOS lock screen with the whole notification stack.
 *  · "banner" — a single notification dropping in over the home screen.
 */
export default function NudgePhone({ brief, mode, expandedId, onToggle }) {
  const [index, setIndex] = useState(0);
  const notes = brief?.notifications || [];

  useEffect(() => { setIndex(0); }, [brief?.id]);

  const dateLabel = brief?.dateLabel || new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="nudge-phone">
      <div className="nudge-screen">
        <span className="nudge-island" />

        {mode === "banner" ? (
          <div className="nudge-banner-stage">
            <div className="nudge-banner-bg" />

            {notes.length ? (
              <>
                <div className="nudge-banner-grid">
                  {Array.from({ length: 12 }).map((_, i) => <span key={i} className="nudge-banner-app" />)}
                </div>
                <div className="nudge-banner-top">
                  <AppleNotification
                    key={`${brief.id}-${index}`}
                    note={notes[index]}
                    expanded={expandedId === index}
                    onToggle={() => onToggle(index)}
                  />
                </div>
              </>
            ) : (
              <div className="relative z-[3] flex-1 flex items-center justify-center">
                <EmptyState />
              </div>
            )}

            {notes.length > 1 && (
              <div className="nudge-banner-nav">
                <button
                  type="button"
                  className="nudge-ghost"
                  style={{ height: 28, padding: "0 8px" }}
                  onClick={() => setIndex((i) => (i - 1 + notes.length) % notes.length)}
                  aria-label="Previous notification"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="nudge-dots">
                  {notes.map((n, i) => <span key={i} className={`nudge-dot ${i === index ? "is-on" : ""}`} />)}
                </span>
                <button
                  type="button"
                  className="nudge-ghost"
                  style={{ height: 28, padding: "0 8px" }}
                  onClick={() => setIndex((i) => (i + 1) % notes.length)}
                  aria-label="Next notification"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="nudge-wall" />
            <div className="nudge-lock">
              <p className="nudge-lock-clock">{LOCK_CLOCK}</p>
              <p className="nudge-lock-date">{dateLabel}</p>

              <div className="nudge-lock-stack">
                {notes.length ? (
                  notes.map((note, i) => (
                    <AppleNotification
                      key={`${brief.id}-${i}`}
                      note={note}
                      expanded={expandedId === i}
                      onToggle={() => onToggle(i)}
                    />
                  ))
                ) : (
                  <EmptyState />
                )}
              </div>

              <span className="nudge-lock-foot" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
      <BellOff className="w-5 h-5 text-white/45" />
      <p className="text-[11.5px] leading-relaxed text-white/55">
        No notifications yet.
        <br />
        Add a schedule to see the day arrive.
      </p>
    </div>
  );
}