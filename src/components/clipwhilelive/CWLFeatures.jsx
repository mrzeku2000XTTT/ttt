import React from "react";

const STEPS = [
  { n: "01", t: "PASTE A LINK", d: "YouTube or Twitch" },
  { n: "02", t: "WE FIND THE MOMENT", d: "Live transcript analysis" },
  { n: "03", t: "CLIPS APPEAR", d: "Ready in 3–5 minutes" },
];

const FEATURES = [
  { icon: "⌁", t: "FINDS THE PAYOFF", d: "Not just loud moments. It reads the transcript and identifies complete, standalone stories." },
  { icon: "◫", t: "OPEN SOURCE & LOCAL", d: "Run it on your Mac today. Local transcription, local media — your footage stays in your control." },
  { icon: "↺", t: "YOU KEEP THE CUT", d: "Adjust boundaries by transcript, preview, rerender, accept — or throw it away." },
];

export default function CWLFeatures() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10" style={{ fontFamily: "monospace" }}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
        {STEPS.map((s) => (
          <div key={s.n} className="border border-zinc-800 p-5 text-center">
            <p className="text-red-500 text-xs mb-2">{s.n}</p>
            <p className="text-white font-bold text-sm tracking-wider">{s.t}</p>
            <p className="text-zinc-500 text-[11px] mt-1">{s.d}</p>
          </div>
        ))}
      </div>

      <div className="text-center mb-10">
        <p className="text-[10px] tracking-[0.3em] text-red-400 mb-3">THE OLD WAY IS TOO LATE</p>
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          THE MOMENT DOESN'T WAIT FOR THE EDIT.
        </h2>
        <p className="max-w-lg mx-auto mt-4 text-xs text-zinc-500 leading-relaxed">
          By the time the stream ends, the energy is gone. Hours of footage pile up.
          ClipWhileLive gives you the head start.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div key={f.t} className="border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-red-500 text-2xl mb-3">{f.icon}</p>
            <p className="text-white font-bold text-xs tracking-wider mb-2">{f.t}</p>
            <p className="text-zinc-500 text-[11px] leading-relaxed">{f.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}