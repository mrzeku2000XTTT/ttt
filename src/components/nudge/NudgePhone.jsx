import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, BellOff } from "lucide-react";
import AppleNotification from "./AppleNotification";
import NudgeHome, { NUDGE_APPS } from "./NudgeHome";
import NudgeAppScreen from "./NudgeAppScreen";
import BookingApp from "./BookingApp";
import CalendarApp from "./CalendarApp";
import ScheduleSheet from "./ScheduleSheet";
import { clockLabel, dayLabel, useLocalNow } from "@/lib/nudge/localTime";
import { bookingsToNotifications, upcomingBookings } from "@/lib/nudge/bookingStore";

// How far the lock screen has to be pulled up before the phone opens.
const UNLOCK_AT = 64;

/**
 * The phone. Two faces of the same template:
 *  · "lock"   — the iOS lock screen with the whole notification stack. Pulling it
 *               up opens the phone onto its home screen, where the apps live.
 *  · "banner" — a single notification dropping in over the home screen.
 */
export default function NudgePhone({
  brief,
  mode,
  expandedId,
  onToggle,
  showDate,
  bookings = [],
  onBook,
  onCancelBooking,
}) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [app, setApp] = useState(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const screenRef = useRef(null);
  const pull = useRef(null);
  const pulled = useRef(0);

  // The brief's own notifications, and then the appointments this person booked
  // or brought in — drawn as the same notification, in the same stack.
  const notes = [...(brief?.notifications || []), ...bookingsToNotifications(bookings)];
  const badges = { calendar: upcomingBookings(bookings).length };
  const appName = NUDGE_APPS.find((a) => a.id === app)?.name || "";

  // A different brief is a different day: the phone closes and starts at the top.
  useEffect(() => {
    setIndex(0);
    setOpen(false);
    setApp(null);
    setOffset(0);
  }, [brief?.id]);

  const startPull = (e) => {
    pull.current = { y: e.clientY };
    pulled.current = 0;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const movePull = (e) => {
    if (!pull.current) return;
    const travel = pull.current.y - e.clientY;
    const max = screenRef.current?.clientHeight || 600;
    pulled.current = Math.max(0, Math.min(travel, max));
    setOffset(pulled.current);
  };

  const endPull = () => {
    if (!pull.current) return;
    pull.current = null;
    setDragging(false);
    const travel = pulled.current;
    pulled.current = 0;
    setOffset(0);
    // A real pull opens the phone — and so does a plain tap on the handle.
    if (travel > UNLOCK_AT || travel < 4) setOpen(true);
  };

  const lock = () => {
    setApp(null);
    setOpen(false);
  };

  return (
    <div className="nudge-phone">
      <div className="nudge-screen" ref={screenRef}>
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
                    key={`${brief?.id}-${index}`}
                    note={notes[index]}
                    showDate={showDate}
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

            {/* Behind the lock screen: the home screen it opens onto. */}
            <NudgeHome open={open} badges={badges} onOpenApp={setApp} onLock={lock} />

            {/* And any app opened from it. */}
            {open && app ? (
              <NudgeAppScreen title={appName} onHome={() => setApp(null)}>
                {app === "booking" ? <BookingApp onBook={onBook} /> : null}
                {app === "calendar" ? <CalendarApp bookings={bookings} onCancel={onCancelBooking} /> : null}
                {app === "schedule" ? <ScheduleSheet brief={brief} /> : null}
              </NudgeAppScreen>
            ) : null}

            <div
              className="nudge-lock"
              style={{
                transform: open ? "translateY(-100%)" : `translateY(${-offset}px)`,
                transition: dragging ? "none" : "transform .44s cubic-bezier(.22, 1, .36, 1)",
              }}
            >
              <LiveClock />

              <div className="nudge-lock-stack">
                {notes.length ? (
                  notes.map((note, i) => (
                    <AppleNotification
                      key={`${brief?.id}-${i}`}
                      note={note}
                      showDate={showDate}
                      expanded={expandedId === i}
                      onToggle={() => onToggle(i)}
                    />
                  ))
                ) : (
                  <EmptyState />
                )}
              </div>

              <button
                type="button"
                className="nudge-lock-grab"
                onPointerDown={startPull}
                onPointerMove={movePull}
                onPointerUp={endPull}
                onPointerCancel={endPull}
                title="Swipe up to open the phone"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Swipe up to unlock</span>
                <span className="nudge-lock-foot" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** The reader's real local time — kept in its own tick so nothing else redraws. */
function LiveClock() {
  const now = useLocalNow();
  return (
    <>
      <p className="nudge-lock-clock">{clockLabel(now)}</p>
      <p className="nudge-lock-date">{dayLabel(now)}</p>
    </>
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