import React from "react";

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}M AGO`;
  if (s < 86400) return `${Math.floor(s / 3600)}H AGO`;
  return `${Math.floor(s / 86400)}D AGO`;
};

// OSIRIS-style live news intel feed
export default function NewsIntelPanel({ news }) {
  return (
    <div className="h-full flex flex-col" style={{ fontFamily: "monospace" }}>
      <div className="px-3 py-2 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: "rgba(45,212,191,0.2)" }}>
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#f87171" }} />
        <span className="text-[9px] font-black tracking-[0.3em] uppercase" style={{ color: "#2dd4bf" }}>LIVE NEWS INTEL</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {(news || []).map((n, i) => (
          <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
            className="block px-3 py-2 border-b hover:bg-white/5 transition-colors"
            style={{ borderColor: "rgba(45,212,191,0.08)" }}>
            <div className="flex justify-between gap-2 text-[8px] tracking-[0.2em] mb-0.5">
              <span style={{ color: n.source === "KASPA INTEL" ? "#5eead4" : "rgba(45,212,191,0.5)" }}>{n.source}</span>
              <span style={{ color: "rgba(45,212,191,0.4)" }}>{n.pub_date ? timeAgo(n.pub_date) : ""}</span>
            </div>
            <div className="text-[10px] leading-snug" style={{ color: "#d9f7f1" }}>{n.title}</div>
          </a>
        ))}
        {!news?.length && (
          <div className="p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: "rgba(45,212,191,0.5)" }}>
            ⟁ ACQUIRING NEWS FEED…
          </div>
        )}
      </div>
    </div>
  );
}