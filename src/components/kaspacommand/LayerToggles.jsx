import React from "react";

const TEAL = "#2dd4bf";

// OSIRIS-style layer toggle strip
export default function LayerToggles({ layers, onToggle }) {
  const defs = [
    { key: "nodes", label: "NODES" },
    { key: "earthquakes", label: "EARTHQUAKES" },
    { key: "live_news", label: "LIVE NEWS" },
  ];
  return (
    <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1" style={{ fontFamily: "monospace" }}>
      {defs.map((d) => {
        const on = layers[d.key];
        return (
          <button key={d.key} onClick={() => onToggle(d.key)}
            className="px-2 py-1 text-[8px] font-bold tracking-[0.25em] uppercase text-left transition-opacity"
            style={{
              background: on ? "rgba(45,212,191,0.15)" : "rgba(2,8,10,0.75)",
              border: `1px solid ${on ? "rgba(45,212,191,0.6)" : "rgba(45,212,191,0.2)"}`,
              color: on ? TEAL : "rgba(45,212,191,0.4)",
            }}>
            {on ? "◉" : "○"} {d.label}
          </button>
        );
      })}
    </div>
  );
}