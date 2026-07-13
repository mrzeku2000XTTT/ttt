import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import CommandTopBar from "@/components/kaspacommand/CommandTopBar";
import NodeWorldMap from "@/components/kaspacommand/NodeWorldMap";
import NodeStatsPanel from "@/components/kaspacommand/NodeStatsPanel";
import CommandTicker from "@/components/kaspacommand/CommandTicker";

// KASPA COMMAND — global node intelligence dashboard (Kaspa take on the OSIRIS C2 aesthetic)
export default function KaspaCommand() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await base44.functions.invoke("kaspaCommandData", {});
      if (alive) setData(res.data);
    };
    load();
    const iv = setInterval(load, 60000);
    return () => { alive = false; clearInterval(iv); };
  }, []);

  const total = Object.values(data?.aggs?.countries || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="h-screen flex flex-col overflow-hidden text-white" style={{ background: "#02080a" }}>
      <CommandTopBar totalNodes={total || null} connected={!!data} />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* World map */}
        <div className="flex-1 min-h-0 relative">
          {data?.aggs ? (
            <NodeWorldMap countries={data.aggs.countries} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] tracking-[0.4em] uppercase"
              style={{ color: "rgba(45,212,191,0.6)", fontFamily: "monospace" }}>
              ⟁ ACQUIRING ORBITAL NODE LATTICE…
            </div>
          )}
          {/* Corner HUD overlays */}
          <div className="absolute top-2 left-2 z-[1000] px-2 py-1 text-[8px] tracking-[0.3em] uppercase pointer-events-none"
            style={{ color: "rgba(94,234,212,0.7)", background: "rgba(2,8,10,0.7)", fontFamily: "monospace" }}>
            SAT VIEW · PUBLIC NODE LATTICE · {data?.aggs?.timestamp || ""}
          </div>
        </div>

        {/* Intel side panel */}
        <div className="lg:w-72 h-52 lg:h-auto flex-shrink-0 border-t lg:border-t-0 lg:border-l"
          style={{ borderColor: "rgba(45,212,191,0.15)", background: "rgba(2,10,12,0.95)" }}>
          <NodeStatsPanel aggs={data?.aggs} blockdag={data?.blockdag} />
        </div>
      </div>

      <CommandTicker price={data?.price} hashrate={data?.hashrate} aggs={data?.aggs} blockdag={data?.blockdag} />
    </div>
  );
}