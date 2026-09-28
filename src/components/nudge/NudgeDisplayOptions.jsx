import React from "react";
import { Bell, Trash2, Copy, Check, Smartphone, Rows3, Sun, Moon } from "lucide-react";

/**
 * How the notification is shown — the two real iOS faces — plus the way the
 * brief leaves the app: by the user's own clipboard, never by upload.
 */
export default function NudgeDisplayOptions({ brief, mode, onMode, light, onLight, onCopy, copied }) {
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

      <p className="nudge-note-line mt-3">
        <Trash2 className="w-3.5 h-3.5" />
        <span>Tap any notification on the phone to open its full detail.</span>
      </p>
    </div>
  );
}