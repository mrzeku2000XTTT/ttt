import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TEAL = "#2dd4bf";

// OSIRIS-style top status bar — Kaspa edition
export default function CommandTopBar({ totalNodes, connected }) {
  const navigate = useNavigate();
  const [zulu, setZulu] = useState("");
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const d = new Date();
      setZulu(`${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")}Z`);
      setUptime(Math.floor((Date.now() - start) / 1000));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const up = `${String(Math.floor(uptime / 3600)).padStart(2, "0")}:${String(Math.floor((uptime % 3600) / 60)).padStart(2, "0")}:${String(uptime % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b flex-shrink-0"
      style={{ borderColor: "rgba(45,212,191,0.15)", background: "rgba(2,8,10,0.95)", fontFamily: "monospace" }}>
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => navigate("/AgenticWorld")} className="p-1 hover:opacity-70" title="Back to Agentic World">
          <ArrowLeft className="w-4 h-4" style={{ color: TEAL }} />
        </button>
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-black tracking-[0.35em]" style={{ color: TEAL }}>K A S P A &nbsp;C O M M A N D</div>
          <div className="hidden sm:block text-[8px] tracking-[0.25em] uppercase truncate" style={{ color: "rgba(45,212,191,0.5)" }}>
            GLOBAL NODE INTELLIGENCE · C2 ENGINE: BLOCKDAG CORE · SENSORS: PUBLIC NODE LATTICE · NET: KASPA MAINNET
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[9px] sm:text-[10px] tracking-widest uppercase whitespace-nowrap">
        <span style={{ color: "#facc15" }}>ZULU {zulu}</span>
        <span className="hidden sm:inline" style={{ color: connected ? "#4ade80" : "#f87171" }}>
          SYS: {connected ? "CONNECTED" : "LINKING…"}
        </span>
        <span className="hidden md:inline" style={{ color: TEAL }}>{totalNodes ?? "—"} NODES</span>
        <span className="hidden lg:inline" style={{ color: "rgba(255,255,255,0.4)" }}>UPTIME: {up}</span>
        <span className="hidden lg:inline" style={{ color: "rgba(255,255,255,0.25)" }}>V.1.0</span>
      </div>
    </div>
  );
}