import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import CommandTopBar from "@/components/kaspacommand/CommandTopBar";
import NodeWorldMap from "@/components/kaspacommand/NodeWorldMap";
import NodeStatsPanel from "@/components/kaspacommand/NodeStatsPanel";
import CommandTicker from "@/components/kaspacommand/CommandTicker";
import NodeDetailCard from "@/components/kaspacommand/NodeDetailCard";
import LayerToggles from "@/components/kaspacommand/LayerToggles";
import NewsIntelPanel from "@/components/kaspacommand/NewsIntelPanel";

// KASPA COMMAND — global node intelligence dashboard (Kaspa take on the OSIRIS C2 aesthetic)
export default function KaspaCommand() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [intel, setIntel] = useState(null);
  const [layers, setLayers] = useState({ nodes: true, earthquakes: true, live_news: true });

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await base44.functions.invoke("kaspaCommandData", {});
      if (alive) setData(res.data);
    };
    const loadIntel = async () => {
      const res = await base44.functions.invoke("kaspaCommandIntel", {});
      if (alive) setIntel(res.data);
    };
    load();
    loadIntel();
    const iv = setInterval(load, 60000);
    const iv2 = setInterval(loadIntel, 120000);
    return () => { alive = false; clearInterval(iv); clearInterval(iv2); };
  }, []);

  const total = Object.values(data?.aggs?.countries || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="h-screen flex flex-col overflow-hidden text-white" style={{ background: "#02080a" }}>
      <CommandTopBar totalNodes={total || null} connected={!!data} />

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* World map */}
        <div className="flex-1 min-h-0 relative">
          {data?.nodes?.length ? (
            <NodeWorldMap nodes={data.nodes} onSelect={setSelected}
              earthquakes={intel?.earthquakes} showNodes={layers.nodes} showQuakes={layers.earthquakes} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] tracking-[0.4em] uppercase"
              style={{ color: "rgba(45,212,191,0.6)", fontFamily: "monospace" }}>
              ⟁ ACQUIRING ORBITAL NODE LATTICE…
            </div>
          )}
          {/* Corner HUD overlays */}
          <div className="absolute top-2 left-2 z-[1000] px-2 py-1 text-[8px] tracking-[0.3em] uppercase pointer-events-none"
            style={{ color: "rgba(94,234,212,0.7)", background: "rgba(2,8,10,0.7)", fontFamily: "monospace" }}>
            SAT VIEW · PUBLIC NODE LATTICE · {data?.nodes?.length || 0} NODES PLOTTED · {data?.aggs?.timestamp || ""}
          </div>
          <NodeDetailCard node={selected} onClose={() => setSelected(null)} />
          <LayerToggles layers={layers} onToggle={(k) => setLayers((l) => ({ ...l, [k]: !l[k] }))} />
        </div>

        {/* Intel side panel */}
        <div className="lg:w-72 h-52 lg:h-auto flex-shrink-0 border-t lg:border-t-0 lg:border-l flex flex-col min-h-0"
          style={{ borderColor: "rgba(45,212,191,0.15)", background: "rgba(2,10,12,0.95)" }}>
          <div className={layers.live_news ? "h-1/2 min-h-0 overflow-hidden" : "flex-1 min-h-0 overflow-hidden"}>
            <NodeStatsPanel aggs={data?.aggs} blockdag={data?.blockdag} />
          </div>
          {layers.live_news && (
            <div className="h-1/2 min-h-0 border-t" style={{ borderColor: "rgba(45,212,191,0.15)" }}>
              <NewsIntelPanel news={intel?.news} />
            </div>
          )}
        </div>
      </div>

      <CommandTicker price={data?.price} hashrate={data?.hashrate} aggs={data?.aggs} blockdag={data?.blockdag} intel={intel} />
    </div>
  );
}