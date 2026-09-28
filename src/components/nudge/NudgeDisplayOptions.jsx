import React from "react";
import { Bell, Trash2, Copy, Check, Smartphone, Rows3, Sun, Moon, Calendar, Clock } from "lucide-react";
import { zoneLabel } from "@/lib/nudge/localTime";

/**
 * How the notification is shown — the two real iOS faces, whether the day is put
 * on the card, and the way the brief leaves the app: by the user's own clipboard,
 * never by upload.
 */
export default function NudgeDisplayOptions({
  brief,
  mode,
  onMode,
  light,
  onLight,
  showDate,
  onShowDate,
  onCopy,
  copied,
}) {
  const zone = zoneLabel();

  return (
    <div className="nudge-sec">
      <p className="nudge-sec-title">
        <Smartphone className="w-3.5 h-3.5" /> How it shows
      </p>

      <div className="nudge-row">
        <button
          type="button"
          className={`nudge-ghost flex-1 justify-center ${mode === "lock" ? "is-on" : ""}`}
          onClick={() => onMode("lock")}
        >
          <Rows3 className="w-3.5 h-3.5" /> Lock screen
        </button>
        <button
          type="button"
          className={`nudge-ghost flex-1 justify-center ${mode === "banner" ? "is-on" : ""}`}
          onClick={() => onMode("banner")}
        >
          <Bell className="w-3.5 h-3.5" /> Banner
        </button>
      </div>

      <div className="nudge-row mt-2">
        <button
          type="button"
          className={`nudge-ghost flex-1 justify-center ${light ? "is-on" : ""}`}
          onClick={() => onLight(!light)}
        >
          {light ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {light ? "Light" : "Dark"}
        </button>
        <button
          type="button"
          className="nudge-ghost flex-1 justify-center"
          onClick={onCopy}
          disabled={!brief}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy brief"}
        </button>
      </div>

      {/* The date and time a notification carries are the schedule's own. */}
      <button
        type="button"
        className={`nudge-ghost w-full justify-center mt-2 ${showDate ? "is-on" : ""}`}
        onClick={() => onShowDate(!showDate)}
        aria-pressed={showDate}
      >
        <Calendar className="w-3.5 h-3.5" />
        {showDate ? "Date and time on the card" : "Date hidden"}
      </button>

      <p className="nudge-note-line mt-3">
        <Clock className="w-3.5 h-3.5" />
        <span>
          The phone keeps your own clock{zone ? ` — ${zone}` : ""}, and every notification is read in
          that local time.
        </span>
      </p>
      <p className="nudge-note-line mt-1.5">
        <Trash2 className="w-3.5 h-3.5" />
        <span>Tap any notification on the phone to open its full detail.</span>
      </p>
    </div>
  );
}