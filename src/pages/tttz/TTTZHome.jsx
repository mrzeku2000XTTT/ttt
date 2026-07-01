import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Zap, Activity, Lock, TrendingUp, Bot, Sparkles } from "lucide-react";
import { ZK_AGENT_URL, SUPERZK_NAME } from "@/components/tttz/ZKChatWidget";

const AGENT_ADDRESS = "kaspa:qpkn4aczvuqpmhvzv2lunjudfnda6wlk258w90yptjxv6v2q7dlkq2cm8e58e";
const KASPA_API = "https://api.kaspa.org";

function Spinner() {
  return <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "#1a1a1a", borderTopColor: "#00ffcc" }} />;
}

function AddressLink({ address, label }) {
  const short = address.length > 20 ? `${address.slice(0, 12)}...${address.slice(-8)}` : address;
  return (
    <a href={`https://kaspa.stream/addresses/${address}`} target="_blank" rel="noopener noreferrer"
      className="font-mono text-xs hover:underline inline-flex items-center gap-1" style={{ color: "#00ffcc" }}>
      {label || short}
      <ExternalLink className="w-3 h-3 opacity-50" />
    </a>
  );
}

export default function TTTZHome() {
  const [balance, setBalance] = useState(null);
  const [price, setPrice] = useState(null);
  const [txs, setTxs] = useState(null);
  const [error, setError] = useState({});

  useEffect(() => {
    fetch(`${KASPA_API}/addresses/${AGENT_ADDRESS}/balance`)
      .then(r => r.json())
      .then(data => {
        const total = typeof data === "number" ? data : (data?.balance || 0);
        setBalance(total / 1e8);
      })
      .catch(e => setError(p => ({ ...p, balance: e.message })));

    fetch(`${KASPA_API}/info/price?stringOnly=false`)
      .then(r => r.json())
      .then(data => setPrice(typeof data === "number" ? data : data?.price || data?.result))
      .catch(e => setError(p => ({ ...p, price: e.message })));

    fetch(`${KASPA_API}/addresses/${AGENT_ADDRESS}/full-transactions?limit=5`)
      .then(r => r.json())
      .then(data => setTxs(data?.transactions || data || []))
      .catch(e => setError(p => ({ ...p, txs: e.message })));
  }, []);

  return (
    <div className="space-y-6 pt-6">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-6xl sm:text-7xl font-black tracking-tighter" style={{ color: "#00ffcc", textShadow: "0 0 40px rgba(0,255,204,0.15)" }}>
          TTTZ
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#555" }}>
          The First Covenant Launchpad on Kaspa Toccata
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono"
          style={{ background: "#111", border: "1px solid #1a1a1a", color: "#00ffcc" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00ffcc" }} />
          TOCCATA MAINNET · LIVE
        </div>

        {/* SUPERZK Badge */}
        <a href={ZK_AGENT_URL} target="_blank" rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all hover:scale-105 group"
          style={{ background: "linear-gradient(135deg, rgba(0,255,204,0.12), rgba(0,255,204,0.04))", border: "1px solid rgba(0,255,204,0.3)", color: "#00ffcc" }}
          title="SUPERZK — Covenant creation agent">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(0,255,204,0.15)", border: "1px solid rgba(0,255,204,0.3)" }}>
            <Bot className="w-3 h-3" style={{ color: "#00ffcc" }} />
          </div>
          <span className="tracking-wide">{SUPERZK_NAME}</span>
          <span className="text-[9px] font-mono opacity-60">· Covenant Agent</span>
          <Sparkles className="w-3 h-3 opacity-50 group-hover:opacity-100" />
        </a>
      </div>

      {/* Balance Card */}
      <div className="rounded-xl p-5" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4" style={{ color: "#00ffcc" }} />
          <span className="text-xs font-medium" style={{ color: "#888" }}>Agent Wallet</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            {balance === null ? <Spinner /> : (
              <span className="text-3xl font-black font-mono" style={{ color: "#e0e0e0" }}>
                {balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
            )}
            <span className="text-sm font-mono" style={{ color: "#666" }}>KAS</span>
          </div>
          <AddressLink address={AGENT_ADDRESS} label={AGENT_ADDRESS} />
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between rounded-xl p-4" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: "#00ffcc" }} />
          <span className="text-xs" style={{ color: "#888" }}>KAS Price</span>
        </div>
        {price === null ? <Spinner /> : (
          <span className="font-mono text-sm font-bold" style={{ color: "#00ffcc" }}>${Number(price).toFixed(4)}</span>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Zap} label="Covenants" value="5" />
        <StatCard icon={Lock} label="KAS Locked" value={balance ? balance.toFixed(2) : "—"} />
        <StatCard icon={Activity} label="Network" value="Toccata" small />
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl p-5" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4" style={{ color: "#00ffcc" }} />
          <span className="text-xs font-medium" style={{ color: "#888" }}>Recent Activity</span>
        </div>
        {!txs ? (
          error.txs ? <p className="text-xs font-mono" style={{ color: "#444" }}>Failed to load</p> : <Spinner />
        ) : txs.length === 0 ? (
          <p className="text-xs font-mono" style={{ color: "#444" }}>No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {txs.slice(0, 5).map((tx, i) => {
              const txid = tx.transaction_id || tx.txid || "";
              const isOutgoing = (tx.outputs || []).some(o => o.address !== AGENT_ADDRESS.replace("kaspa:", ""));
              return (
                <a key={i} href={`https://kaspa.stream/txs/${txid}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between py-2 border-b last:border-0 group" style={{ borderColor: "#1a1a1a" }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: isOutgoing ? "#1a0d0d" : "#0d1a14", color: isOutgoing ? "#ff6666" : "#00ffcc" }}>
                      {isOutgoing ? "OUT" : "IN"}
                    </span>
                    <span className="font-mono text-xs truncate group-hover:underline" style={{ color: "#888" }}>
                      {txid.slice(0, 16)}...
                    </span>
                  </div>
                  <ExternalLink className="w-3 h-3 opacity-30 group-hover:opacity-100" style={{ color: "#00ffcc" }} />
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center pb-4">
        <Link to="/TTTZLaunch" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
          style={{ background: "#00ffcc", color: "#0a0a0a" }}>
          <Zap className="w-4 h-4" /> Deploy Covenant →
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, small }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
      <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: "#00ffcc" }} />
      <div className={`font-mono font-bold ${small ? "text-xs" : "text-lg"}`} style={{ color: "#e0e0e0" }}>{value}</div>
      <div className="text-[9px] mt-0.5" style={{ color: "#444" }}>{label}</div>
    </div>
  );
}