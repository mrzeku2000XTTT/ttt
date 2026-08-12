import React, { useState } from "react";

// Deterministic "AI-analysed" mark for a site: derives a unique gradient +
// glyph from the domain, so no result ever falls back to a generic logo.
const PALETTES = [
  ["#22d3ee", "#3b82f6"],
  ["#a78bfa", "#6366f1"],
  ["#34d399", "#059669"],
  ["#f472b6", "#c026d3"],
  ["#fbbf24", "#f97316"],
  ["#38bdf8", "#0ea5e9"],
];

function hostOf(url) {
  try { return new URL(url).host.replace(/^www\./, ""); } catch { return url || ""; }
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function SiteLogo({ app, size = 36 }) {
  const [step, setStep] = useState(0); // 0 = provided logo, 1 = site favicon, 2 = glyph
  const host = hostOf(app?.url);
  const h = hash(host || app?.name || "ttt");
  const [from, to] = PALETTES[h % PALETTES.length];
  const glyph = (app?.name || host || "?").trim().charAt(0).toUpperCase();

  const sources = [
    app?.logo,
    host ? `https://www.google.com/s2/favicons?sz=128&domain=${host}` : null,
  ].filter(Boolean);
  const src = sources[step];
  const showImg = !!src;

  return (
    <div
      className="relative rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10"
      style={{
        width: size,
        height: size,
        background: showImg ? "rgba(255,255,255,0.04)" : `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {showImg ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setStep(s => s + 1)}
        />
      ) : (
        <>
          <span
            className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.9), transparent 60%)" }}
          />
          <span className="relative text-white font-black" style={{ fontSize: size * 0.42 }}>{glyph}</span>
        </>
      )}
    </div>
  );
}