import React, { useState, useEffect, useRef, useCallback } from "react";
import DAGCanvas from "@/components/dag/DAGCanvas";
import DAGStatsBar from "@/components/dag/DAGStatsBar";
import { Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, RefreshCw } from "lucide-react";
import { createPageUrl } from "@/utils";

const KASPA_API = "https://api.kaspa.org";
const POLL_INTERVAL_MS = 1500; // 1.5s desktop
const MOBILE_POLL_MS = 3000;

const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1) ||
  window.innerWidth < 768;

export default function DAGVisualizerPage() {
  const [blocks, setBlocks] = useState([]);
  const [stats, setStats] = useState({});
  const [isLive, setIsLive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [isMobile] = useState(isMobileDevice);
  const [blockCount, setBlockCount] = useState(0);

  const lastBlueScoreRef = useRef(null);
  const pollRef = useRef(null);
  const tpsHistoryRef = useRef([]);

  const fetchStats = useCallback(async () => {
    try {
      const [dagRes, hashrateRes, priceRes] = await Promise.all([
        fetch(`${KASPA_API}/info/blockdag`).then((r) => r.json()),
        fetch(`${KASPA_API}/info/hashrate`).then((r) => r.json()),
        fetch(`${KASPA_API}/info/price`).then((r) => r.json()),
      ]);

      setStats((prev) => ({
        ...prev,
        blockCount: dagRes.blockCount,
        blueScore: dagRes.virtualDaaScore,
        networkTps: dagRes.networkTPS ? Math.round(dagRes.networkTPS) : prev.networkTps,
        hashrate: hashrateRes.hashrate,
        price: priceRes.price,
        mempoolSize: dagRes.mempoolSize,
      }));
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  }, []);

  const fetchBlocks = useCallback(async () => {
    if (paused) return;
    try {
      const limit = isMobile ? 5 : 20;
      const res = await fetch(`${KASPA_API}/blocks?lowHash=&includeTransactions=false&limit=${limit}`);
      const data = await res.json();

      if (!data || !Array.isArray(data.blocks)) return;

      const newBlocks = data.blocks;

      // TPS estimation from block timestamps
      if (newBlocks.length >= 2) {
        const now = Date.now();
        tpsHistoryRef.current.push({ time: now, count: newBlocks.length });
        // Keep last 10 samples
        if (tpsHistoryRef.current.length > 10) tpsHistoryRef.current.shift();

        if (tpsHistoryRef.current.length >= 2) {
          const oldest = tpsHistoryRef.current[0];
          const newest = tpsHistoryRef.current[tpsHistoryRef.current.length - 1];
          const elapsed = (newest.time - oldest.time) / 1000;
          const totalTx = tpsHistoryRef.current.reduce((a, b) => a + b.count, 0);
          const tps = elapsed > 0 ? Math.round(totalTx / elapsed) : 0;
          setStats((prev) => ({ ...prev, tps }));
        }
      }

      setBlocks(newBlocks);
      setBlockCount((c) => c + newBlocks.length);
      setIsLive(true);
    } catch (err) {
      console.error("Block fetch error:", err);
      setIsLive(false);
    }
  }, [paused, isMobile]);

  useEffect(() => {
    fetchStats();
    fetchBlocks();

    const interval = isMobile ? MOBILE_POLL_MS : POLL_INTERVAL_MS;
    const blockPoll = setInterval(fetchBlocks, interval);
    const statsPoll = setInterval(fetchStats, 5000);

    pollRef.current = { blockPoll, statsPoll };

    return () => {
      clearInterval(blockPoll);
      clearInterval(statsPoll);
    };
  }, [fetchBlocks, fetchStats, isMobile]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ fontFamily: "monospace" }}>
      {/* Top nav */}
      <div className="flex items-center justify-between px-4 py-2 bg-black border-b border-teal-500/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl("AppStore")} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-teal-500/50 rounded flex items-center justify-center">
              <span className="text-teal-400 text-xs">⬡</span>
            </div>
            <span className="text-teal-400 font-bold text-sm tracking-widest uppercase">DAG Visualizer</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded text-white/60 hover:text-white text-xs transition-colors"
          >
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => { fetchBlocks(); fetchStats(); }}
            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded text-white/60 hover:text-white text-xs transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-white/30 text-xs">
            <span className="text-white/20">BLOCKS SEEN:</span>
            <span className="text-teal-400 font-bold">{blockCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <DAGStatsBar stats={stats} isLive={isLive} />

      {/* Canvas area */}
      <div className="flex-1 relative overflow-hidden">
        <DAGCanvas blocks={blocks} isMobile={isMobile} />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur border border-white/10 rounded-lg p-3 text-xs font-mono space-y-1.5">
          <div className="text-white/40 text-[10px] mb-2 uppercase tracking-widest">Legend</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-400 shadow-[0_0_6px_#00d4aa]" />
            <span className="text-teal-400">Chain Block</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sky-500" />
            <span className="text-white/60">Normal Block</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-700" />
            <span className="text-white/30">Orphan Block</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-teal-500/40" />
            <span className="text-white/40">Parent Link</span>
          </div>
        </div>

        {/* Paused overlay */}
        {paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-teal-400 font-mono text-2xl font-bold tracking-widest animate-pulse">
              ⏸ PAUSED
            </div>
          </div>
        )}

        {/* Kaspa attribution */}
        <div className="absolute bottom-4 right-4 text-white/20 text-[10px] font-mono">
          DATA: api.kaspa.org
        </div>
      </div>
    </div>
  );
}