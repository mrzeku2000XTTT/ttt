import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ArrowRight, ExternalLink, Loader2 } from "lucide-react";

// Live data from Igra's free Blockscout explorer API — no key needed
const NETWORKS = {
  mainnet: { label: "MAINNET", base: "https://explorer.igralabs.com", chainId: 38833 },
  galleon: { label: "GALLEON TESTNET", base: "https://explorer.galleon-testnet.igralabs.com", chainId: 38836 },
};
const POLL_MS = 15000;

const short = (s) => (s ? `${s.slice(0, 8)}…${s.slice(-6)}` : "—");
const fmtIkas = (wei) => {
  const v = Number(wei || 0) / 1e18;
  return v >= 1 ? v.toFixed(2) : v.toFixed(5);
};

export default function IgraLiveFeed() {
  const [network, setNetwork] = useState("mainnet");
  const [stats, setStats] = useState(null);
  const [txs, setTxs] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setStats(null); setTxs([]); setError(false);
    const base = NETWORKS[network].base;
    const load = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          fetch(`${base}/api/v2/stats`),
          fetch(`${base}/api/v2/main-page/transactions`),
        ]);
        const s = await sRes.json();
        const t = await tRes.json();
        if (!alive) return;
        setStats(s);
        setTxs((Array.isArray(t) ? t : t.items || []).slice(0, 8));
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
    <div className="w-full max-w-2xl rounded-3xl overflow-hidden"
      style={{ border: "1px solid rgba(255,140,90,0.18)", background: "rgba(24,10,6,0.55)",
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,140,90,0.14)" }}>
        <div className="flex items-center gap-2 text-[10px] tracking-[0.35em] uppercase"
          style={{ color: "rgba(255,190,150,0.8)", fontFamily: "monospace" }}>
          <Flame className="w-3.5 h-3.5" /> IGRA L2 · LIVE EVM ON KASPA
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center rounded-full overflow-hidden p-0.5"
            style={{ border: "1px solid rgba(255,140,90,0.18)", background: "rgba(255,255,255,0.04)" }}>
            {Object.entries(NETWORKS).map(([key, n]) => (
              <button key={key} onClick={() => setNetwork(key)}
                className="px-2.5 py-1 text-[8px] tracking-[0.2em] uppercase focus:outline-none rounded-full"
                style={{ fontFamily: "monospace",
                  background: network === key ? "rgba(255,140,90,0.18)" : "transparent",
                  color: network === key ? "#fdba74" : "rgba(230,170,130,0.4)" }}>
                {n.label}
              </button>
            ))}
          </div>
          <span className={`w-1.5 h-1.5 rounded-full ${error ? "bg-red-400" : "bg-orange-400 animate-pulse"}`} />
        </div>
      </div>

      {/* Chain stats */}
      {stats && (
        <div className="flex items-center gap-4 px-4 py-2 text-[9px] tracking-[0.2em] uppercase flex-wrap"
          style={{ borderBottom: "1px solid rgba(255,140,90,0.1)", color: "rgba(235,180,140,0.55)", fontFamily: "monospace" }}>
          <span>BLOCKS <b style={{ color: "#fdba74" }}>{Number(stats.total_blocks || 0).toLocaleString()}</b></span>
          <span>TXS <b style={{ color: "#fdba74" }}>{Number(stats.total_transactions || 0).toLocaleString()}</b></span>
          <span className="hidden sm:inline">ADDRESSES <b style={{ color: "#fdba74" }}>{Number(stats.total_addresses || 0).toLocaleString()}</b></span>
          <span className="ml-auto hidden md:inline">CHAIN ID <b style={{ color: "rgba(255,200,160,0.8)" }}>{NETWORKS[network].chainId}</b> · iKAS</span>
        </div>
      )}

      {/* Recent transactions */}
      <div className="overflow-hidden" style={{ height: "352px" }}>
        {txs.length === 0 && error && (
          <div className="h-full flex items-center justify-center text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(235,180,140,0.4)", fontFamily: "monospace" }}>
            NETWORK UNREACHABLE
          </div>
        )}
        {txs.length === 0 && !error && (
          <div className="h-full flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "rgba(255,180,130,0.7)" }} />
            <span className="text-[10px] tracking-[0.3em] uppercase"
              style={{ color: "rgba(255,200,160,0.7)", fontFamily: "monospace" }}>
              READING THE L2…
            </span>
          </div>
        )}
        <AnimatePresence initial={false}>
          {txs.map((tx) => (
            <motion.a key={tx.hash}
              href={`${NETWORKS[network].base}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: -14, backgroundColor: "rgba(255,140,90,0.12)" }}
              animate={{ opacity: 1, y: 0, backgroundColor: "rgba(255,140,90,0)" }}
              exit={{ opacity: 0 }} transition={{ duration: 0.6 }}
              whileHover={{ backgroundColor: "rgba(255,140,90,0.06)" }}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
              style={{ borderBottom: "1px solid rgba(255,140,90,0.07)" }}>
              <div className="flex items-center gap-2 text-[11px] font-bold flex-shrink-0" style={{ fontFamily: "monospace" }}>
                <span style={{ color: "rgba(255,230,210,0.9)" }}>{short(tx.from?.hash)}</span>
                <ArrowRight className="w-3 h-3" style={{ color: "rgba(255,160,110,0.5)" }} />
                <span style={{ color: "rgba(255,210,180,0.7)" }}>{short(tx.to?.hash)}</span>
              </div>
              <div className="flex-1 truncate text-[10px]" style={{ color: "rgba(235,180,140,0.45)", fontFamily: "monospace" }}>
                {tx.method ? `${tx.method} · ` : ""}{fmtIkas(tx.value)} iKAS
              </div>
              <div className="flex-shrink-0 flex items-center gap-1.5">
                <span className="text-[9px]" style={{ color: "rgba(230,160,120,0.4)", fontFamily: "monospace" }}>
                  BLK {tx.block_number ?? tx.block ?? "—"}
                </span>
                <ExternalLink className="w-3 h-3" style={{ color: "rgba(230,170,130,0.35)" }} />
              </div>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}