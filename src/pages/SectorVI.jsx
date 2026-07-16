import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { ArrowLeft, Ghost, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectorScene from "@/components/sectorvi/SectorScene";
import AgentDetailsPanel from "@/components/sectorvi/AgentDetailsPanel";
import { NPC_AGENTS } from "@/components/sectorvi/sectorAgents";

export default function SectorVI() {
  const navigate = useNavigate();
  const positionsRef = useRef({});
  const overlayRef = useRef(null);
  const [mode, setMode] = useState("free"); // free | agent
  const [userName, setUserName] = useState("Guest");
  const [selectedId, setSelectedId] = useState("you");

  useEffect(() => {
    base44.auth.me()
      .then(u => setUserName(u.username || u.full_name || "You"))
      .catch(() => setUserName("Guest"));
  }, []);

  const agents = useMemo(() => [
    { id: "you", name: userName, role: "User Agent", color: "#06b6d4", pants: "#164e63", kas: 0, status: "Exploring Sector VI", speed: 2.0 },
    ...NPC_AGENTS,
  ], [userName]);

  const selectedAgent = agents.find(a => a.id === selectedId);
  const selectedIndex = agents.findIndex(a => a.id === selectedId);

  const cycleAgent = (dir) => {
    const next = (selectedIndex + dir + agents.length) % agents.length;
    setSelectedId(agents[next].id);
  };

  return (
    <div className="fixed inset-0 bg-white">
      <Canvas shadows camera={{ position: [14, 12, 14], fov: 50 }}>
        <SectorScene
          agents={agents}
          positionsRef={positionsRef}
          mode={mode}
          followId={selectedId}
          selectedId={selectedId}
          onSelect={setSelectedId}
          overlayRef={overlayRef}
        />
      </Canvas>

      {/* DOM overlay for agent name tags (populated by NameTagLayer inside Canvas) */}
      <div ref={overlayRef} className="absolute inset-0 z-[5] pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="w-10 h-10 rounded-xl bg-black/80 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-black"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="px-4 py-2 rounded-xl bg-black/80 backdrop-blur border border-white/10">
            <span className="text-white font-black text-sm tracking-widest">SECTOR VI</span>
            <span className="text-white/40 text-xs ml-2">TapToTip Playground</span>
          </div>
        </div>

        {/* Camera toggle */}
        <div className="flex rounded-xl bg-black/80 backdrop-blur border border-white/10 overflow-hidden">
          <button
            onClick={() => setMode("free")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors ${mode === "free" ? "bg-cyan-500 text-black" : "text-white/60 hover:text-white"}`}
          >
            <Ghost className="w-4 h-4" /> GHOST
          </button>
          <button
            onClick={() => setMode("agent")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors ${mode === "agent" ? "bg-cyan-500 text-black" : "text-white/60 hover:text-white"}`}
          >
            <Video className="w-4 h-4" /> AGENT CAM
          </button>
        </div>
      </div>

      {/* Agent switcher (agent cam mode) */}
      {mode === "agent" && (
        <div className="absolute top-20 right-4 z-10 flex items-center gap-2 rounded-xl bg-black/80 backdrop-blur border border-white/10 px-2 py-2">
          <button onClick={() => cycleAgent(-1)} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white text-xs font-bold min-w-[90px] text-center">{selectedAgent?.name}</span>
          <button onClick={() => cycleAgent(1)} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <AgentDetailsPanel agent={selectedAgent} isUser={selectedId === "you"} />

      <div className="absolute bottom-4 right-4 z-10 rounded-xl bg-black/60 backdrop-blur border border-white/10 px-3 py-2 text-[10px] text-white/50">
        Click an agent to view · Drag to orbit · Scroll to zoom
      </div>
    </div>
  );
}