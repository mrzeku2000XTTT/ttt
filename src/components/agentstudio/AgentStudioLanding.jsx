import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Box } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getAgentWallet } from "@/lib/agentInternetWallet";

function shortAddr(a) {
  if (!a) return "";
  return a.length > 14 ? `${a.slice(0, 8)}…${a.slice(-4)}` : a;
}
function fmtKas(n) {
  return (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 4 });
}

/** AgentStudio Landing — clean entry; opens the 3D AGENTINTERNETSTUDIO index. */
export default function AgentStudioLanding({ onEnter, onNew }) {
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [visible, setVisible] = useState(0);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const wallet = getAgentWallet();
      let email = null, agents = [], authOk = false;
      try { const user = await base44.auth.me(); email = user?.email || null; authOk = !!email; }
      catch { authOk = false; }
      if (authOk) {
        try { agents = await base44.entities.AgentInternetAgent.filter({ user_email: email }); }
        catch { agents = []; }
      }
      let balance = null, balanceErr = false;
      if (wallet?.address) {
        try {
          const res = await base44.functions.invoke("getKaspaBalance", { address: wallet.address });
          const data = res?.data || res;
          if (data?.success === false) { balance = 0; balanceErr = true; }
          else { balance = data?.balanceKAS ?? data?.balance ?? data?.available ?? 0; }
        } catch { balance = null; balanceErr = true; }
      }
      const trained = agents.filter((a) => a.is_trained).length;
      const epochs = agents.reduce((s, a) => s + (Number(a.epochs) || 0), 0);
      const built = [
        "spawning agent runtime · v3",
        wallet ? `identity wallet · linked ${shortAddr(wallet.address)}` : "identity wallet · not provisioned",
        wallet
          ? (balanceErr ? "wallet balance · network unreachable"
              : Number(balance) > 0 ? `wallet balance · ${fmtKas(balance)} KAS` : "wallet balance · 0 KAS · fund to train")
          : "wallet balance · n/a · no wallet",
        authOk ? `agent registry · ${agents.length} agent${agents.length === 1 ? "" : "s"}` : "agent registry · login required",
        authOk ? `trained agents · ${trained}` : "trained agents · login required",
        authOk ? `on-chain epochs · ${epochs}` : "on-chain epochs · login required",
        "kaspa mainnet · ghostdag consensus",
        "consensus relay online · wss://tttz.xyz",
      ];
      if (!cancelled) setLines(built);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (lines.length === 0) return;
    if (visible >= lines.length) {
      const t = setTimeout(() => setBootDone(true), 1100);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible((v) => v + 1), 420);
    return () => clearTimeout(t);
  }, [lines, visible]);

  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-black flex flex-col font-sans selection:bg-cyan-400/30 selection:text-white">
      <video
        autoPlay loop muted playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
        src="https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/0a2c28484_Cosmic_Terminal_BG.mp4"
      />
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/45 to-black/80" />

      {/* Header — TTT back to previous page */}
      <header className="relative z-10 px-6 sm:px-10 py-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-white text-2xl sm:text-3xl font-bold tracking-tight hover:text-cyan-300 transition-colors"
          title="Back"
        >
          TTT
        </button>
        <button
          onClick={() => navigate("/AgentInternetStudio")}
          className="flex items-center gap-1.5 text-white/80 text-xs font-medium rounded-full px-3 py-1.5 bg-white/5 border border-white/15 hover:bg-white/10 transition-colors"
          title="Open 3D Studio"
        >
          <Box className="w-3.5 h-3.5 text-cyan-300" /> 3D Studio
        </button>
      </header>

      {/* Compact real-facts terminal — fades after boot */}
      <motion.div
        className="relative z-10 flex justify-center px-6 mt-1"
        animate={{ opacity: bootDone ? 0 : 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <div
          className="w-full max-w-sm rounded-xl px-4 py-3 font-mono text-[10px] sm:text-[11px] leading-relaxed text-[#00FF41]"
          style={{ background: "rgba(0,0,0,0.5)", textShadow: "0 0 8px rgba(0,255,65,0.55)" }}
        >
          {lines.length === 0 && <div><span className="opacity-70">&gt;&gt; </span>establishing relay…</div>}
          {lines.slice(0, visible).map((line, i) => (
            <div key={i} className="whitespace-nowrap"><span className="opacity-70">&gt;&gt; </span>{line}</div>
          ))}
          {lines.length > 0 && visible < lines.length && (
            <span className="inline-block w-2 h-3 align-middle bg-[#00FF41] animate-pulse" />
          )}
        </div>
      </motion.div>

      {/* Hero + CTA */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="w-full max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-white/5 border border-white/15 text-white/80 text-[11px] font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> ALPHA STUDIO
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-white leading-[1.05] mb-4">
            Agent Studio
          </h1>
          <p className="text-white/80 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed mb-9">
            Create and train your own AI agent on Kaspa — provable, non-custodial, yours to export.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onEnter}
              className="w-full sm:w-auto rounded-full px-7 py-3.5 text-sm font-medium text-black bg-white hover:bg-white/90 transition-colors"
            >
              Enter Studio
            </button>
            <button
              onClick={onNew}
              className="w-full sm:w-auto rounded-full px-7 py-3.5 text-sm font-medium text-white border border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-colors"
            >
              Create New Agent
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}