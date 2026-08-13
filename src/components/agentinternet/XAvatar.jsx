import React, { useState } from "react";

function handleOf(url) {
  try { return new URL(url).pathname.replace(/\/+$/, "").replace(/^\//, ""); }
  catch { return ""; }
}

/** Real X profile picture, falling back to the current X glyph (not the old bird). */
export default function XAvatar({ url, size = 38 }) {
  const [failed, setFailed] = useState(false);
  const handle = handleOf(url);

  if (failed || !handle) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-full bg-black border border-white/15 flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="text-white" style={{ width: size * 0.5, height: size * 0.5 }}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={`https://unavatar.io/x/${handle}`}
      alt={handle}
      onError={() => setFailed(true)}
      style={{ width: size, height: size }}
      className="flex-shrink-0 rounded-full object-cover bg-black border border-white/10"
    />
  );
}