import React, { useState, useEffect, useRef, useCallback } from "react";
import DAGCanvas from "@/components/dag/DAGCanvas";
import DAGCanvas3D from "@/components/dag/DAGCanvas3D";
import DAGStatsBar from "@/components/dag/DAGStatsBar";
import DAGFuelPanel from "@/components/dag/DAGFuelPanel";
import { Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, RefreshCw, Box, Layers, Lock } from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const KASPA_API = "https://api.kaspa.org";

function formatHalving(ts) {
  const ms = ts * 1000 - Date.now();
  if (ms <= 0) return "Soon";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${d}d ${h}h ${m}m`;
}

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const lastFetchTimeRef = useRef(null);
  const lastBlockCountRef = useRef(0);
  const tipHashRef = useRef(null);
  const lastDaaScoreRef = useRef(null);
  const lastDaaTimeRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setLoading(false);
    } catch (err) {
      setUser(null);
      setLoading(false);
    }
  };

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

  const fetchStats = useCallback(async () => {
    try {
      const [dagData, hashrateRes, priceRes, coinSupplyRes, blockRewardRes] = await Promise.all([
        fetch(`${KASPA_API}/info/blockdag`).then((r) => r.json()),
        fetch(`${KASPA_API}/info/hashrate?stringOnly=false`).then((r) => r.json()).catch(() => null),
        fetch(`${KASPA_API}/info/price`).then((r) => r.json()),
        fetch(`${KASPA_API}/info/coinsupply`).then((r) => r.json()).catch(() => null),
        fetch(`${KASPA_API}/info/blockreward`).then((r) => r.json()).catch(() => null),
      ]);

      // API returns { hashrate: number } when stringOnly=false
      const rawHashrate = hashrateRes
        ? parseFloat(hashrateRes.hashrate ?? hashrateRes.networkHashesPerSecond ?? hashrateRes) || null
        : null;

      // BPS from daaScore delta
      const currentDaa = parseInt(dagData.virtualDaaScore);
      const now = Date.now();
      let bps = null;
      if (lastDaaScoreRef.current && lastDaaTimeRef.current) {
        const elapsed = (now - lastDaaTimeRef.current) / 1000;
        const delta = currentDaa - lastDaaScoreRef.current;
        if (elapsed > 0 && delta > 0) {
          bps = parseFloat((delta / elapsed).toFixed(1));
        }
      }
      lastDaaScoreRef.current = currentDaa;
      lastDaaTimeRef.current = now;

      // Circulating supply in KAS (API returns sompi: 1 KAS = 1e8 sompi)
      const circulatingRaw = coinSupplyRes?.circulatingSupply ?? coinSupplyRes?.circulatingsupply ?? null;
      const circulating = circulatingRaw ? circulatingRaw / 1e8 : null;

      // Block reward in KAS
      const blockReward = blockRewardRes?.blockreward ?? blockRewardRes?.blockReward ?? null;

      // Next halving countdown
      const halvingInfo = dagData.nextHalvingTimestamp
        ? formatHalving(dagData.nextHalvingTimestamp)
        : null;

      setStats((prev) => ({
        blockCount: parseInt(dagData.blockCount),
        blueScore: currentDaa,
        hashrate: rawHashrate,
        price: priceRes.price,
        tipCount: dagData.tipHashes?.length || 0,
        bps: bps ?? prev.bps ?? null,
        circulating,
        blockReward,
        nextHalving: halvingInfo,
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

  const combinedStats = { ...stats, tps: tps ?? stats.tps };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-teal-400 font-mono text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
          <p className="text-white/60 mb-6">This page is restricted to administrators only.</p>
          <Link
            to={createPageUrl("AppStore")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-black font-bold rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ fontFamily: "monospace" }}>
      {/* Top nav */}
      <div className="flex items-center justify-between px-2 py-2 bg-black border-b border-teal-500/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Link
            to={createPageUrl("AppStore")}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white active:bg-white/10 transition-colors"
            style={{ touchAction: "manipulation", minWidth: 40, minHeight: 40 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-1.5">
            <span className="text-teal-400 text-base">⬡</span>
            <div>
              <div className="text-teal-400 font-bold text-sm tracking-widest leading-none">DAG VISUALIZER</div>
              <div className="text-white/30 text-[9px] font-mono">Kaspa Network • Live</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIs3D((v) => !v)}
            className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-xs font-bold transition-colors min-w-[52px] justify-center ${
              is3D
                ? "bg-teal-500/20 border-teal-500/60 text-teal-300"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
            }`}
            style={{ touchAction: "manipulation", minHeight: 40 }}
          >
            {is3D ? <Layers className="w-3.5 h-3.5 mr-1" /> : <Box className="w-3.5 h-3.5 mr-1" />}
            {is3D ? "2D" : "3D"}
          </button>
          <button
            onClick={() => setPaused((p) => !p)}
            className="flex items-center justify-center w-10 h-10 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
            style={{ touchAction: "manipulation" }}
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { fetchBlocks(); fetchStats(); }}
            className="flex items-center justify-center w-10 h-10 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
            style={{ touchAction: "manipulation" }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex items-center gap-1 text-xs">
            <span className="text-white/20">SEEN:</span>
            <span className="text-teal-400 font-bold">{blockCount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <DAGStatsBar stats={combinedStats} isLive={isLive} />

      {/* Fuel Panel */}
      <div className="px-3 py-2 bg-black/60 border-b border-white/10">
        <DAGFuelPanel stats={combinedStats} />
      </div>

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