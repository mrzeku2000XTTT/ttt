import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Live data from Igra's free Blockscout explorer API — no key needed
const NETWORKS = {
  mainnet: { label: "MAINNET", base: "https://explorer.igralabs.com", chainId: 38833 },
  galleon: { label: "GALLEON TESTNET", base: "https://explorer.galleon-testnet.igralabs.com", chainId: 38836 },
};
const POLL_MS = 15000;

const GOLD = "#C9A24B";
const MINT = "#6EE7B7";

const short = (s) => (s ? `${s.slice(0, 8)}…${s.slice(-6)}` : "—");
const fmtIkas = (wei) => {
  const v = Number(wei || 0) / 1e18;
  return v >= 1 ? v.toFixed(2) : v.toFixed(5);
};

export default function IgraLiveFeed({ ledgerHeight = "320px" }) {
  const [network, setNetwork] = useState("mainnet");
  const [stats, setStats] = useState(null);
  const [txs, setTxs] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setStats(null); setTxs([]); setError(false);
    const load = async () => {
      try {
        const res = await base44.functions.invoke("igraExplorer", { network });
        if (!alive) return;
        setStats(res.data.stats);
        setTxs(res.data.txs || []);
        setError(false);
      } catch {
        if (alive) setError(true);
      }
    };
    load();
    const iv = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(iv); };
  }, [network]);

  return (
    <div className="w-full max-w-2xl space-y-4">
      {/* Header + stats panel */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(201,162,75,0.4)", background: "rgba(8,7,4,0.8)",
          backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)" }}>
        <div className="flex items-center justify-between px-4 py-3 gap-2 flex-wrap"
          style={{ borderBottom: "1px solid rgba(201,162,75,0.2)" }}>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase"
            style={{ color: GOLD, fontFamily: "monospace" }}>
            <Flame className="w-3.5 h-3.5" /> IGRA L2 · LIVE EVM ON KASPA
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center rounded-lg overflow-hidden p-0.5"
              style={{ border: "1px solid rgba(201,162,75,0.25)", background: "rgba(255,255,255,0.03)" }}>
              {Object.entries(NETWORKS).map(([key, n]) => (
                <button key={key} onClick={() => setNetwork(key)}
                  className="px-2.5 py-1 text-[8px] tracking-[0.2em] uppercase focus:outline-none rounded-md"
                  style={{ fontFamily: "monospace",
                    background: network === key ? "rgba(110,231,183,0.1)" : "transparent",
                    borderBottom: network === key ? `1px solid ${MINT}` : "1px solid transparent",
                    color: network === key ? "#fff" : "rgba(201,162,75,0.55)" }}>
                  {n.label}
                </button>
              ))}
            </div>
            <span className={`w-1.5 h-1.5 rounded-full ${error ? "bg-red-400" : "animate-pulse"}`}
              style={!error ? { background: "#E5C567" } : {}} />
          </div>
        </div>

        {/* Chain stats */}
        {stats && (
          <div className="flex items-center gap-4 px-4 py-2.5 text-[9px] tracking-[0.2em] uppercase flex-wrap"
            style={{ color: "rgba(201,162,75,0.7)", fontFamily: "monospace" }}>
            <span>BLOCKS <b className="text-white">{Number(stats.total_blocks || 0).toLocaleString()}</b></span>
            <span>TXS <b className="text-white">{Number(stats.total_transactions || 0).toLocaleString()}</b></span>
            <span className="hidden sm:inline">ADDRESSES <b className="text-white">{Number(stats.total_addresses || 0).toLocaleString()}</b></span>
            <span className="ml-auto hidden md:inline">CHAIN ID <b className="text-white">{NETWORKS[network].chainId}</b> · iKAS</span>
          </div>
        )}
      </div>

      {/* Transactions ledger */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(201,162,75,0.4)", background: "rgba(8,7,4,0.8)",
          backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)" }}>
        {/* Column headers */}
        <div className="flex items-center gap-3 px-4 py-2.5 text-[8px] tracking-[0.25em] uppercase"
          style={{ borderBottom: "1px solid rgba(201,162,75,0.2)", color: "rgba(201,162,75,0.6)", fontFamily: "monospace" }}>
          <span className="w-[130px] flex-shrink-0 hidden sm:block">HASH</span>
          <span className="flex-shrink-0">FROM → TO</span>
          <span className="flex-1">ACTION</span>
          <span className="flex-shrink-0">BLOCK</span>
        </div>

        <div className="overflow-hidden" style={{ height: ledgerHeight }}>
          {txs.length === 0 && error && (
            <div className="h-full flex items-center justify-center text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "rgba(201,162,75,0.5)", fontFamily: "monospace" }}>
              NETWORK UNREACHABLE
            </div>
          )}
          {txs.length === 0 && !error && (
            <div className="h-full flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: GOLD }} />
              <span className="text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "rgba(201,162,75,0.7)", fontFamily: "monospace" }}>
                READING THE L2…
              </span>
            </div>
          )}
          <AnimatePresence initial={false}>
            {txs.map((tx) => (
              <motion.a key={tx.hash}
                href={`${NETWORKS[network].base}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0, y: -14, backgroundColor: "rgba(201,162,75,0.12)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(201,162,75,0)" }}
                exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
                whileHover={{ backgroundColor: "rgba(201,162,75,0.06)" }}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                style={{ borderBottom: "1px solid rgba(201,162,75,0.12)" }}>
                <span className="w-[130px] flex-shrink-0 truncate text-[10px] text-white hidden sm:block"
                  style={{ fontFamily: "monospace" }}>
                  {short(tx.hash)}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] flex-shrink-0" style={{ fontFamily: "monospace" }}>
                  <span style={{ color: "rgba(255,255,255,0.85)" }}>{short(tx.from)}</span>
                  <ArrowRight className="w-3 h-3" style={{ color: "rgba(201,162,75,0.6)" }} />
                  <span className="hidden md:inline" style={{ color: "rgba(255,255,255,0.6)" }}>{short(tx.to)}</span>
                </div>
                <div className="flex-1 truncate text-[10px]" style={{ color: "#D9C9A3", fontFamily: "monospace" }}>
                  {tx.method ? `${tx.method} · ` : ""}{fmtIkas(tx.value)} iKAS
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  <span className="text-[9px] font-bold" style={{ color: MINT, fontFamily: "monospace" }}>
                    BLK {tx.block ?? "—"}
                  </span>
                  <ExternalLink className="w-3 h-3" style={{ color: MINT, opacity: 0.7 }} />
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}