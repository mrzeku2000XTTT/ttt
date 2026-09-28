import React, { useRef, useState } from "react";
import { FileText, Upload, Sparkles, Lock, X, ShieldCheck } from "lucide-react";

/**
 * The way in: paste a schedule or drop a calendar file. The .ics is read here in
 * the browser — the file itself never leaves the device.
 */
export default function NudgeComposer({ text, onText, fileName, onFile, onClearFile, onAnalyze, busy, error }) {
  const fileRef = useRef(null);
  const [over, setOver] = useState(false);

  return (
    <div className="nudge-sec">
      <p className="nudge-sec-title">
        <FileText className="w-3.5 h-3.5" /> Your schedule
      </p>

      {fileName && (
        <div className="nudge-file">
          <FileText className="w-3.5 h-3.5 shrink-0 text-white/60" />
          <span>{fileName}</span>
          <button type="button" className="nudge-x ml-auto" onClick={onClearFile} aria-label="Clear file">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <textarea
        className="nudge-input"
        value={text}
        onChange={(e) => onText(e.target.value)}
        placeholder={"Paste anything —\n\nMon 9:30 Design review @ Zoom\nMon 11:00 Dentist, 20 min drive\nMon 14:00 Ship the release notes"}
        spellCheck={false}
      />

      <div
        className={`nudge-drop mt-2 ${over ? "is-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer?.files?.[0]); }}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-3.5 h-3.5 mx-auto mb-1" />
        Drop a calendar file (.ics) or click to browse
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".ics,text/calendar"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; onFile(f); }}
      />

      <button type="button" className="nudge-primary mt-3" onClick={onAnalyze} disabled={busy || !text.trim()}>
        {busy ? <><span className="nudge-spin" /> Reading the day…</> : <><Sparkles className="w-3.5 h-3.5" /> Turn into notifications</>}
      </button>

      {error && <p className="mt-2 text-[11px] leading-relaxed text-red-400">{error}</p>}

      <p className="nudge-note-line mt-3">
        <Lock className="w-3.5 h-3.5" />
        <span>
          Saved in this browser only — no account, no server copy, no upload. The schedule text is sent
          to the AI only when you press the button above.
        </span>
      </p>
      <p className="nudge-note-line mt-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Clearing your browser data clears NUDGE with it.</span>
      </p>
    </div>
  );
}