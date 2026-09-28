import React, { useRef, useState } from "react";
import { Upload, Sparkles, Lock, Wand2 } from "lucide-react";
import { SAMPLE_SCHEDULE } from "./nudgeSample";

/**
 * The hero: the copy on the left and the app's real input on the right — a paste
 * box and a drop zone that hand the schedule straight to the studio.
 */
export default function NudgeLandingHero({ onEnter, onPick, connecting, error }) {
  const [text, setText] = useState("");
  const [over, setOver] = useState(false);
  const fileRef = useRef(null);

  const go = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      fileRef.current?.click();
      return;
    }
    onEnter({ text: trimmed });
  };

  return (
    <div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef2ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4b5563]">
        Calendar intelligence / On your device
      </span>

      <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-black sm:text-[52px] sm:leading-[1.04]">
        Your calendar,
        <br />
        read back as{' '}
        <span className="bg-gradient-to-r from-[#0000FF] to-[#A020F0] bg-clip-text text-transparent">
          notifications.
        </span>
      </h1>

      <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-[#666666]">
        Paste a schedule or drop a calendar file and NUDGE writes what is actually happening —
        one Apple-style notification at a time, so the day reads itself.
      </p>

      <div className="mt-6 max-w-xl">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          spellCheck={false}
          placeholder={"Mon 9:30 Design review @ Zoom\nMon 11:00 Dentist, 20 min drive\nMon 14:00 Ship release notes"}
          className="w-full resize-none rounded-2xl border border-[#e4e4e8] bg-white px-4 py-3 text-[13px] leading-relaxed text-black placeholder:text-[#b0b0b0] focus:border-[#c9c9d2] focus:outline-none"
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer?.files?.[0]; if (f) onEnter({ file: f }); }}
          onClick={() => fileRef.current?.click()}
          className={`mt-2 cursor-pointer rounded-2xl border-2 border-dashed px-5 py-4 text-center transition-colors ${
            over ? "border-[#0000FF] bg-[#f7f7ff]" : "border-[#dcdce2] hover:border-[#bcbcc6]"
          }`}
        >
          <Upload className="mx-auto h-4 w-4 text-[#8a8a94]" />
          <span className="mt-1.5 block text-[12px] font-semibold text-black">Drop a calendar file (.ics)</span>
          <span className="mt-0.5 block text-[10.5px] text-[#a3a3a3]">or click to browse · read in your browser</span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".ics,text/calendar"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onEnter({ file: f }); }}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={go}
            disabled={connecting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#0000FF] to-[#A020F0] px-4 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {connecting ? "Connecting your wallet…" : "Turn into notifications"}
          </button>
          <button
            onClick={() => setText(SAMPLE_SCHEDULE)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#e4e4e8] px-3.5 text-[12px] font-medium text-[#666666] transition-colors hover:border-[#c9c9d2] hover:text-black"
          >
            <Wand2 className="h-3.5 w-3.5" /> Use a sample schedule
          </button>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#666666]">
          <Lock className="h-3.5 w-3.5" />
          Stored in this browser only. Nothing is uploaded — no account, no server copy.
        </div>
        {error && <p className="mt-2 text-[11px] text-red-500">{error}</p>}
      </div>
    </div>
  );
}