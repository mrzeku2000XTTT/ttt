import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Zap, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AgentWalletCard from "@/components/igra/agent/AgentWalletCard";
import IgraAgentConsole from "@/components/igra/agent/IgraAgentConsole";
import { listLocalAgents } from "@/components/igra/agent/localAgentWallet";

// IGRA AGENT — AI agents holding wallets on Igra mainnet, transacting iKAS agent-to-agent via Igra nodes
export default function IgraAgent() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("igraAgent", {
        action: "status",
        extra: listLocalAgents().map((a) => ({ name: a.name, address: a.address })),
      });
      setStatus(res.data);
    } catch {
      setStatus(null);
    }
    setLoading(false);
  };

  useEffect(() => { loadStatus(); }, []);

  return (
    <div className="min-h-screen text-white relative"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #2a0f03 0%, #0a0302 55%, #050100 100%)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/IgraHorizon"
            className="flex items-center gap-2 px-4 py-2 text-[9px] tracking-[0.3em] uppercase rounded-full"
            style={{ border: "1px solid rgba(255,170,110,0.25)", background: "rgba(28,14,6,0.55)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              color: "rgba(255,200,160,0.85)", fontFamily: "monospace" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> IGRA HORIZON
          </Link>
          <button onClick={loadStatus} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-[9px] tracking-[0.3em] uppercase rounded-full focus:outline-none"
            style={{ border: "1px solid rgba(255,170,110,0.25)", color: "rgba(255,200,160,0.85)",
              fontFamily: "monospace", opacity: loading ? 0.5 : 1 }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> SYNC
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Zap className="w-6 h-6" style={{ color: "#fb923c" }} />
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight"
              style={{ fontFamily: "'Georgia', serif",
                background: "linear-gradient(180deg, #fff7ed 0%, #fdba74 50%, #9a3412 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              IGRA AGENT
            </h1>
          </div>
          <p className="mt-2 text-[9px] tracking-[0.3em] uppercase"
            style={{ color: "rgba(255,215,180,0.55)", fontFamily: "monospace" }}>
            AGENT-TO-AGENT iKAS TRANSACTIONS · IGRA MAINNET · CHAIN 38833
          </p>
        </motion.div>

        {/* Agent wallets — server agents + browser-local agents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {status?.agents
            ? Object.entries(status.agents).map(([name, a]) => (
                <AgentWalletCard key={name} name={name} address={a.address}
                  balance={a.balance_ikas} local={a.local} />
              ))
            : ["alpha", "beta"].map((n) => (
                <AgentWalletCard key={n} name={n} address={null} balance={null} />
              ))}
        </div>

        <IgraAgentConsole agents={status?.agents} onTxComplete={loadStatus} onForged={loadStatus} />

        <p className="mt-4 text-center text-[8px] tracking-[0.2em] uppercase leading-relaxed"
          style={{ color: "rgba(255,190,150,0.35)", fontFamily: "monospace" }}>
          FUND AGENT ALPHA WITH iKAS TO ACTIVATE TRANSACTIONS · SIGNED SERVER-SIDE · BROADCAST THROUGH IGRA RPC NODES
        </p>
      </div>
    </div>
  );
}