import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bot, Zap, ExternalLink, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { IGRA_AGENT_LOGO } from "@/components/igra/agent/igraAgentLogo";

const NETWORKS = {
  "testnet-10": { label: "TESTNET-10" },
  mainnet: { label: "MAINNET" },
};
const IGRA_EXPLORER = "https://explorer.igralabs.com";
const POLL_MS = 20000;

// Deterministic agent-style codename from a covenant id hash
const SYL_A = ["OR", "VE", "KI", "NO", "AT", "EC", "SA", "QU", "LU", "RA", "ZE", "XA", "MY", "TH", "OB", "CY"];
const SYL_B = ["ION", "X", "RA", "MAD", "LAS", "HO", "BLE", "ARK", "MEN", "VEN", "KU", "RIS", "DON", "ORN", "IX", "REN"];
function codename(id) {
  const a = parseInt(id.slice(0, 2), 16) % SYL_A.length;
  const b = parseInt(id.slice(2, 4), 16) % SYL_B.length;
  const n = parseInt(id.slice(4, 6), 16) % 10;
  return `${SYL_A[a]}${SYL_B[b]}-${n}`;
}

const KIND_STYLE = {
  genesis: { label: "GENESIS", color: "#4ade80" },
  transition: { label: "TRANSITION", color: "#67e8f9" },
  burn: { label: "BURN", color: "#f87171" },
};

const short = (s) => `${s.slice(0, 6)}…${s.slice(-4)}`;

// Animated placeholder row shown while the DAG is being scanned
function SkeletonRow({ i }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.25, 0.6, 0.25] }}
      transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
      className="flex items-center gap-3 px-4 py-2.5"
      style={{ borderBottom: "1px solid rgba(120,220,255,0.07)" }}>
      <Bot className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(140,220,255,0.35)" }} />
      <div className="h-3 w-16 flex-shrink-0" style={{ background: "rgba(120,220,255,0.15)" }} />
      <div className="h-3 w-12 flex-shrink-0" style={{ background: "rgba(120,220,255,0.1)" }} />
      <div className="h-3 flex-1" style={{ background: "rgba(120,220,255,0.06)" }} />
      <div className="h-3 w-14 flex-shrink-0" style={{ background: "rgba(120,220,255,0.08)" }} />
    </motion.div>
  );
}

export default function AgentTransactionsFeed() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);
  const [processedDaa, setProcessedDaa] = useState(null);
  const [igraTxs, setIgraTxs] = useState([]);
  const [network, setNetwork] = useState("testnet-10");

  useEffect(() => {
    let alive = true;
    setEvents([]);
    setStats(null);
    setError(false);
    const load = async () => {
      try {
        // Kascov covenant feed via backend proxy (kascov.io blocks browser CORS)
        // + live Igra agent-to-agent iKAS transfers, merged into one feed
        const [kascovRes, igraRes] = await Promise.allSettled([
          base44.functions.invoke("kascovLive", { network }),
          base44.functions.invoke("igraExplorer", { network: "mainnet" }),
        ]);
        if (!alive) return;
        if (kascovRes.status === "fulfilled") {
          const data = kascovRes.value.data;
          setStats(data.stats || null);
          setProcessedDaa(data.processed_daa || null);
          setEvents((data.recent_events || []).slice(0, 5));
          setError(false);
        } else {
          setError(true);
        }
        if (igraRes.status === "fulfilled") {
          setIgraTxs((igraRes.value.data.txs || []).slice(0, 3));
        }
      } catch {
        if (alive) setError(true);
      }
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, [network]);

  return (
    <div className="w-full max-w-2xl rounded-3xl overflow-hidden"
      style={{ border: "1px solid rgba(120,220,255,0.18)", background: "rgba(6,16,24,0.55)",
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(120,220,255,0.15)" }}>
        <div className="flex items-center gap-2 text-[10px] tracking-[0.35em] uppercase"
          style={{ color: "rgba(150,225,255,0.75)", fontFamily: "monospace" }}>
          <Zap className="w-3.5 h-3.5" /> AGENT ⇄ AGENT TRANSACTIONS
        </div>
        <div className="flex items-center gap-2.5">
          {/* Network toggle */}
          <div className="flex items-center rounded-full overflow-hidden p-0.5" style={{ border: "1px solid rgba(120,220,255,0.18)", background: "rgba(255,255,255,0.04)" }}>
            {Object.entries(NETWORKS).map(([key, n]) => (
              <button key={key} onClick={() => setNetwork(key)}
                className="px-2.5 py-1 text-[8px] tracking-[0.2em] uppercase focus:outline-none rounded-full"
                style={{ fontFamily: "monospace",
                  background: network === key ? "rgba(120,220,255,0.15)" : "transparent",
                  color: network === key ? "#67e8f9" : "rgba(120,200,230,0.4)" }}>
                {n.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${error ? "bg-red-400" : "bg-cyan-400 animate-pulse"}`} />
            <span className="text-[9px] tracking-[0.3em] uppercase hidden sm:inline" style={{ color: "rgba(120,200,230,0.5)", fontFamily: "monospace" }}>
              {error ? "OFFLINE" : "LIVE"}
            </span>
          </div>
        </div>
      </div>

      {/* Real network stats */}
      {stats && (
        <div className="flex items-center gap-4 px-4 py-2 text-[9px] tracking-[0.2em] uppercase"
          style={{ borderBottom: "1px solid rgba(120,220,255,0.1)", color: "rgba(140,200,230,0.55)", fontFamily: "monospace" }}>
          <span>ACTIVE AGENTS <b style={{ color: "#67e8f9" }}>{stats.active}</b></span>
          <span>COVENANTS <b style={{ color: "#67e8f9" }}>{stats.covenants}</b></span>
          <span className="hidden sm:inline">LIVE VALUE <b style={{ color: "#67e8f9" }}>{(stats.live_value / 1e8).toFixed(2)} KAS</b></span>
          {processedDaa && (
            <span className="ml-auto hidden md:inline" style={{ color: "rgba(120,200,230,0.4)" }}>
              SCANNED TO DAA <b style={{ color: "rgba(150,225,255,0.7)" }}>{processedDaa.toLocaleString()}</b>
            </span>
          )}
        </div>
      )}

      <div className="overflow-hidden" style={{ height: "352px" }}>
        {events.length === 0 && error && (
          <div className="h-full flex items-center justify-center text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(140,200,230,0.4)", fontFamily: "monospace" }}>
            NETWORK UNREACHABLE
          </div>
        )}
        {events.length === 0 && !error && (
          <div className="relative h-full">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} i={i} />)}
            <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "rgba(140,220,255,0.7)" }} />
              <span className="text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "rgba(160,225,255,0.7)", fontFamily: "monospace", textShadow: "0 0 12px rgba(0,0,0,0.9)" }}>
                SCANNING THE DAG…
              </span>
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {/* Igra agent-to-agent iKAS transactions — branded with the Igra Agent emblem */}
          {events.length > 0 && igraTxs.map((tx) => (
            <motion.a key={tx.hash}
              href={`${IGRA_EXPLORER}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: -14, backgroundColor: "rgba(201,162,75,0.12)" }}
              animate={{ opacity: 1, y: 0, backgroundColor: "rgba(201,162,75,0)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              whileHover={{ backgroundColor: "rgba(201,162,75,0.07)" }}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
              style={{ borderBottom: "1px solid rgba(201,162,75,0.12)" }}>
              <img src={IGRA_AGENT_LOGO} alt="Igra Agent"
                className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                style={{ border: "1px solid rgba(201,162,75,0.4)" }} />
              <div className="flex items-center gap-2 text-[11px] font-bold flex-shrink-0" style={{ fontFamily: "monospace" }}>
                <span style={{ color: "rgba(245,239,224,0.9)" }}>{short(tx.from)}</span>
                <ArrowRight className="w-3 h-3" style={{ color: "rgba(201,162,75,0.6)" }} />
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: "#C9A24B", border: "1px solid rgba(201,162,75,0.35)", background: "rgba(201,162,75,0.1)" }}>
                  IGRA A2A
                </span>
              </div>
              <div className="flex-1 truncate text-[10px] tracking-wide" style={{ color: "rgba(201,162,75,0.55)", fontFamily: "monospace" }}>
                {(Number(tx.value) / 1e18).toFixed(4)} iKAS → {short(tx.to)}
              </div>
              <div className="flex-shrink-0 flex items-center gap-1.5 text-right">
                <span className="text-[9px]" style={{ color: "rgba(201,162,75,0.4)", fontFamily: "monospace" }}>BLK {tx.block}</span>
                <ExternalLink className="w-3 h-3" style={{ color: "rgba(201,162,75,0.35)" }} />
              </div>
            </motion.a>
          ))}
          {events.map((ev) => {
            const k = KIND_STYLE[ev.kind] || { label: ev.kind?.toUpperCase() || "EVENT", color: "#93c5fd" };
            return (
              <motion.a key={`${ev.txid}-${ev.seq}`}
                href={`https://kascov.io/#/${network}/c/${ev.covenant_id}`} target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0, y: -14, backgroundColor: "rgba(120,220,255,0.12)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(120,220,255,0)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                whileHover={{ backgroundColor: "rgba(120,220,255,0.06)" }}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
                style={{ borderBottom: "1px solid rgba(120,220,255,0.07)" }}>
                <Bot className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(140,220,255,0.6)" }} />
                <div className="flex items-center gap-2 text-[11px] font-bold flex-shrink-0" style={{ fontFamily: "monospace" }}>
                  <span style={{ color: "rgba(210,240,255,0.9)" }}>{codename(ev.covenant_id)}</span>
                  <ArrowRight className="w-3 h-3" style={{ color: "rgba(120,220,255,0.5)" }} />
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: k.color, border: `1px solid ${k.color}44`, background: `${k.color}12` }}>{k.label}</span>
                </div>
                <div className="flex-1 truncate text-[10px] tracking-wide" style={{ color: "rgba(140,200,230,0.45)", fontFamily: "monospace" }}>
                  tx {short(ev.txid)} · seq {ev.seq}
                </div>
                <div className="flex-shrink-0 flex items-center gap-1.5 text-right">
                  <span className="text-[9px]" style={{ color: "rgba(120,190,220,0.4)", fontFamily: "monospace" }}>DAA {ev.accepting_daa}</span>
                  <ExternalLink className="w-3 h-3" style={{ color: "rgba(120,200,230,0.35)" }} />
                </div>
              </motion.a>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}