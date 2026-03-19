import React, { useState, useEffect, useRef, useCallback } from "react";
import DAGCanvas from "@/components/dag/DAGCanvas";
import DAGCanvas3D from "@/components/dag/DAGCanvas3D";
import DAGStatsBar from "@/components/dag/DAGStatsBar";
import { Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, RefreshCw, Box, Layers } from "lucide-react";
import { createPageUrl } from "@/utils";

const KASPA_API = "https://api.kaspa.org";

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
  const [seenHashes] = useState(() => new Set());
  const [blockCount, setBlockCount] = useState(0);
  const [tps, setTps] = useState(null);
  const [is3D, setIs3D] = useState(false);

  const lastFetchTimeRef = useRef(null);
  const lastBlockCountRef = useRef(0);
  const tipHashRef = useRef(null);

  // Step 1: fetch DAG info to get live tip hashes + stats
  const fetchDAGInfo = useCallback(async () => {
    const res = await fetch(`${KASPA_API}/info/blockdag`);
    const data = await res.json();
    return data;
  }, []);

  // Step 2: given a tipHash, get a list of recent blockHashes
  const fetchBlockHashes = useCallback(async (tipHash, limit = 20) => {
    const res = await fetch(
      `${KASPA_API}/blocks?lowHash=${tipHash}&includeTransactions=false&limit=${limit}`
    );
    const data = await res.json();
    return data.blockHashes || [];
  }, []);

  // Step 3: fetch individual block header (lightweight, no transactions)
  const fetchBlockHeader = useCallback(async (hash) => {
    const res = await fetch(`${KASPA_API}/blocks/${hash}`);
    const data = await res.json();
    return data;
  }, []);

  const lastDaaScoreRef = useRef(null);
  const lastDaaTimeRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const [dagData, hashrateRes, priceRes, mempoolRes] = await Promise.all([
        fetch(`${KASPA_API}/info/blockdag`).then((r) => r.json()),
        fetch(`${KASPA_API}/info/hashrate?stringOnly=false`).then((r) => r.json()),
        fetch(`${KASPA_API}/info/price`).then((r) => r.json()),
        fetch(`${KASPA_API}/info/mempool-size`).then((r) => r.json()).catch(() => null),
      ]);

      // Hashrate: API returns { hashrate: <H/s as number> }
      const rawHashrate = typeof hashrateRes === "object"
        ? (hashrateRes.hashrate ?? hashrateRes.networkHashesPerSecond ?? null)
        : (typeof hashrateRes === "number" ? hashrateRes : null);

      // Real BPS from DAG: measure daaScore delta over time
      const currentDaa = parseInt(dagData.virtualDaaScore);
      const now = Date.now();
      let networkTps = null;
      if (lastDaaScoreRef.current && lastDaaTimeRef.current) {
        const daaElapsed = (now - lastDaaTimeRef.current) / 1000;
        const daaDelta = currentDaa - lastDaaScoreRef.current;
        if (daaElapsed > 0 && daaDelta > 0) {
          networkTps = parseFloat((daaDelta / daaElapsed).toFixed(2));
        }
      }
      lastDaaScoreRef.current = currentDaa;
      lastDaaTimeRef.current = now;

      setStats((prev) => ({
        blockCount: parseInt(dagData.blockCount),
        blueScore: currentDaa,
        hashrate: rawHashrate,
        price: priceRes.price,
        tipCount: dagData.tipHashes?.length || 0,
        networkTps: networkTps ?? prev.networkTps ?? null,
        mempoolSize: mempoolRes?.mempoolSize ?? mempoolRes?.size ?? null,
      }));
    } catch (err) {
      console.error("Stats error:", err);
    }
  }, []);

  const fetchBlocks = useCallback(async () => {
    if (paused) return;

    try {
      // Get current DAG tips
      const dagData = await fetchDAGInfo();
      const tipHashes = dagData.tipHashes || dagData.virtualParentHashes || [];
      if (!tipHashes.length) return;

      // Use the first tip as our lowHash anchor
      const anchorHash = tipHashes[0];
      tipHashRef.current = anchorHash;

      // Get recent block hashes (fewer on mobile)
      const limit = isMobile ? 15 : 40;
      const hashes = await fetchBlockHashes(anchorHash, limit);

      // Only fetch blocks we haven't seen yet
      const newHashes = hashes.filter((h) => !seenHashes.has(h));
      if (!newHashes.length) {
        setIsLive(true);
        return;
      }

      // Fetch up to N individual block headers (API rate limiting friendly)
      const toFetch = newHashes.slice(0, isMobile ? 5 : 12);
      const blockResults = await Promise.allSettled(
        toFetch.map((h) => fetchBlockHeader(h))
      );

      const fetchedBlocks = blockResults
        .filter((r) => r.status === "fulfilled" && r.value?.header)
        .map((r) => r.value);

      // Mark all as seen
      hashes.forEach((h) => seenHashes.add(h));
      // Keep set size bounded
      if (seenHashes.size > 2000) {
        const arr = Array.from(seenHashes);
        arr.slice(0, 500).forEach((h) => seenHashes.delete(h));
      }

      // TPS calculation
      const now = Date.now();
      if (lastFetchTimeRef.current && fetchedBlocks.length > 0) {
        const elapsed = (now - lastFetchTimeRef.current) / 1000;
        const rawTps = fetchedBlocks.length / elapsed;
        setTps((prev) => {
          if (prev === null) return Math.round(rawTps);
          return Math.round(prev * 0.7 + rawTps * 0.3); // smoothed
        });
      }
      lastFetchTimeRef.current = now;
      lastBlockCountRef.current += fetchedBlocks.length;
      setBlockCount(lastBlockCountRef.current);

      if (fetchedBlocks.length > 0) {
        setBlocks(fetchedBlocks);
        setIsLive(true);
      }
    } catch (err) {
      console.error("Block fetch error:", err);
      setIsLive(false);
    }
  }, [paused, isMobile, fetchDAGInfo, fetchBlockHashes, fetchBlockHeader, seenHashes]);

  useEffect(() => {
    fetchStats();
    fetchBlocks();

    const POLL = isMobile ? 3000 : 1800;
    const blockInterval = setInterval(fetchBlocks, POLL);
    const statsInterval = setInterval(fetchStats, 6000);

    return () => {
      clearInterval(blockInterval);
      clearInterval(statsInterval);
    };
  }, [fetchBlocks, fetchStats, isMobile]);

  const combinedStats = { ...stats, tps };

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ fontFamily: "monospace" }}>
      {/* Top nav */}
      <div className="flex items-center justify-between px-3 py-2 bg-black border-b border-teal-500/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Link to={createPageUrl("AppStore")} className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="text-teal-400 text-base">⬡</span>
            <span className="text-teal-400 font-bold text-sm tracking-widest">DAG VISUALIZER</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIs3D((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 border rounded text-xs font-bold transition-colors min-w-[48px] justify-center ${
              is3D
                ? "bg-teal-500/20 border-teal-500/60 text-teal-300"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            }`}
            style={{ touchAction: "manipulation" }}
          >
            {is3D ? <Layers className="w-3 h-3 mr-1" /> : <Box className="w-3 h-3 mr-1" />}
            {is3D ? "2D" : "3D"}
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center justify-center w-8 h-8 bg-white/5 border border-white/10 rounded text-white/60 hover:text-white transition-colors"
            style={{ touchAction: "manipulation" }}
          >
            {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
          <button
            onClick={() => { fetchBlocks(); fetchStats(); }}
            className="flex items-center justify-center w-8 h-8 bg-white/5 border border-white/10 rounded text-white/60 hover:text-white transition-colors"
            style={{ touchAction: "manipulation" }}
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <div className="hidden sm:flex items-center gap-1 text-xs">
            <span className="text-white/20">SEEN:</span>
            <span className="text-teal-400 font-bold">{blockCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <DAGStatsBar stats={combinedStats} isLive={isLive} />

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {is3D
          ? <DAGCanvas3D blocks={blocks} isMobile={isMobile} />
          : <DAGCanvas blocks={blocks} isMobile={isMobile} />
        }

        {/* Legend - hidden on small mobile */}
        <div className="absolute bottom-4 left-3 bg-black/70 backdrop-blur border border-white/10 rounded-lg p-2.5 text-xs font-mono space-y-1.5 hidden sm:block">
          <div className="text-white/30 text-[9px] mb-1.5 uppercase tracking-widest">Legend</div>
          <LegendItem color="bg-teal-400" glow label="Chain Block" />
          <LegendItem color="bg-sky-500" label="Block" />
          <LegendItem isLine label="Parent Link" />
        </div>

        {paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-teal-400 font-mono text-xl font-bold tracking-widest animate-pulse">⏸ PAUSED</div>
          </div>
        )}

        {!isLive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-teal-400 font-mono text-sm animate-pulse mb-2">Connecting to Kaspa network...</div>
              <div className="text-white/20 font-mono text-xs">api.kaspa.org</div>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 right-3 text-white/15 text-[9px] font-mono">
          DATA: api.kaspa.org
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, glow, label, isLine }) {
  return (
    <div className="flex items-center gap-2">
      {isLine ? (
        <div className="w-5 h-px bg-teal-500/40" />
      ) : (
        <div className={`w-2.5 h-2.5 rounded-full ${color} ${glow ? "shadow-[0_0_5px_#00d4aa]" : ""}`} />
      )}
      <span className={isLine ? "text-white/30" : glow ? "text-teal-400" : "text-white/50"}>{label}</span>
    </div>
  );
}