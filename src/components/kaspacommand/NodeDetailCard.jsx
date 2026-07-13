import React from "react";
import { X } from "lucide-react";

const TEAL = "#2dd4bf";

// OSIRIS-style node dossier shown when a node is clicked
export default function NodeDetailCard({ node, onClose }) {
  if (!node) return null;
  const rows = [
    ["DESIGNATION", `NODE-${String(node.index).padStart(4, "0")}`],
    ["COUNTRY", node.country || "UNKNOWN"],
    ["CITY", node.city || "UNKNOWN"],
    ["SOFTWARE", node.version || "UNKNOWN"],
    ["COORD", `${node.lat.toFixed(4)}, ${node.lon.toFixed(4)}`],
    ["NETWORK", "KASPA MAINNET"],
    ["STATUS", "ONLINE · PUBLIC P2P"],
  ];
  return (
    <div className="absolute bottom-3 left-3 z-[1000] w-72 max-w-[calc(100%-1.5rem)] rounded-sm overflow-hidden"
      style={{ background: "rgba(2,10,12,0.92)", border: "1px solid rgba(45,212,191,0.4)",
        boxShadow: "0 0 30px rgba(45,212,191,0.15)", backdropFilter: "blur(12px)", fontFamily: "monospace" }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "rgba(45,212,191,0.2)" }}>
        <span className="text-[9px] font-black tracking-[0.3em] uppercase" style={{ color: TEAL }}>▚ NODE DOSSIER</span>
        <button onClick={onClose} className="p-0.5 hover:opacity-70"><X className="w-3.5 h-3.5" style={{ color: TEAL }} /></button>
      </div>
      <div className="p-3 space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 text-[10px]">
            <span className="tracking-[0.2em]" style={{ color: "rgba(45,212,191,0.55)" }}>{k}</span>
            <span className="text-right truncate" style={{ color: "#eafaf7" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}