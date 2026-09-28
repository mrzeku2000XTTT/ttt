import React, { useRef, useState } from "react";
import { FileText, Upload, Sparkles, Lock, X, ShieldCheck, Image as ImageIcon } from "lucide-react";

/**
 * The way in. Type or paste anything, or drop a file: a screenshot of a schedule,
 * a calendar file, a spreadsheet export, or plain notes.
 *
 * A calendar file is read here in the browser and never leaves it. A screenshot
 * stays a file on the device until the button is pressed, and only then is it sent
 * to the agent to be read.
 */
export default function NudgeComposer({
  text,
  onText,
  fileName,
  image,
  onFile,
  onClearFile,
  onAnalyze,
  busy,
  canAnalyze,
  error,
}) {
  const fileRef = useRef(null);
  const [over, setOver] = useState(false);

  return (
    <div className="nudge-sec">
      <p className="nudge-sec-title">
        <FileText className="w-3.5 h-3.5" /> Your schedule
      </p>

      {fileName && (
        <div className="nudge-file">
          {image?.previewUrl ? (
            <img className="nudge-file-thumb" src={image.previewUrl} alt="The screenshot you dropped" />
          ) : (
            <FileText className="w-3.5 h-3.5 shrink-0 text-white/60" />
          )}
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
        placeholder={"Paste anything —\n\nMon 9:30 Design review @ Zoom\nMon 11:00 Dentist, 20 min drive\n\n…a whole roster, a spreadsheet, or your own notes all work too."}
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
        <span className="nudge-drop-line">
          <ImageIcon className="w-3 h-3" />
          Drop a screenshot, .ics, .csv or text file — or click to browse
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.ics,.txt,.csv,.tsv,.md,.json,text/calendar,text/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; onFile(f); }}
      />

      <button type="button" className="nudge-primary mt-3" onClick={onAnalyze} disabled={busy || !canAnalyze}>
        {busy ? <><span className="nudge-spin" /> Reading the day…</> : <><Sparkles className="w-3.5 h-3.5" /> Turn into notifications</>}
      </button>

      {error && <p className="mt-2 text-[11px] leading-relaxed text-red-400">{error}</p>}

      <p className="nudge-note-line mt-3">
        <Lock className="w-3.5 h-3.5" />
        <span>
          Saved in this browser only — no account, no server copy. Pasted text goes to the AI only when
          you press the button above. A screenshot you drop is uploaded privately at that same moment,
          so the AI can read it, and the brief still lives only here.
        </span>
      </p>
      <p className="nudge-note-line mt-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Clearing your browser data clears NUDGE with it.</span>
      </p>
    </div>
  );
}