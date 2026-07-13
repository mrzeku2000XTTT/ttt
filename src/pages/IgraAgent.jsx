import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AgentWalletCard from "@/components/igra/agent/AgentWalletCard";
import IgraAgentConsole from "@/components/igra/agent/IgraAgentConsole";
import { listLocalAgents } from "@/components/igra/agent/localAgentWallet";
import AutoTransactToggle, { AUTO_MODE_KEY } from "@/components/igra/agent/AutoTransactToggle";
import KaspaAddressCard from "@/components/igra/agent/KaspaAddressCard";
import DeskFundingCard from "@/components/igra/agent/DeskFundingCard";
import { IGRA_AGENT_LOGO } from "@/components/igra/agent/igraAgentLogo";

// IGRA AGENT — AI agents holding wallets on Igra mainnet, transacting iKAS agent-to-agent via Igra nodes
export default function IgraAgent() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("chat");
  const [autoMode, setAutoMode] = useState(() => {
    try { return localStorage.getItem(AUTO_MODE_KEY) === "on"; } catch { return false; }
  });
  const prevRef = useRef(null);
  const autoRef = useRef(autoMode);
  const forwardingRef = useRef(false);

  const pushEvent = (ev) => setEvents((prev) => [{ id: Date.now() + Math.random(), ...ev }, ...prev].slice(0, 5));

  // Auto-transact: alpha autonomously forwards 10% of a detected deposit to beta (native signer, no Kasware)
  const autoForward = async (diff) => {
    if (forwardingRef.current) return;
    forwardingRef.current = true;
    const amount = Number(Math.max(diff * 0.1, 0.0001).toFixed(6));
    try {
      const res = await base44.functions.invoke("igraAgent", { action: "send", from: "alpha", to: "beta", amount });
      pushEvent({ text: `⚡ AUTO-TX SIGNED · ALPHA → BETA · ${amount} iKAS`, url: res.data.explorer_url });
    } catch (err) {
      pushEvent({ text: `AUTO-TX FAILED · ${err?.response?.data?.error || err.message}`, error: true });
    }
    forwardingRef.current = false;
  };

  const loadStatus = async (manual = false) => {
    if (manual) setLoading(true);
    try {
      const res = await base44.functions.invoke("igraAgent", {
        action: "status",
        extra: listLocalAgents().map((a) => ({ name: a.name, address: a.address })),
      });
      // Detect incoming transactions by balance delta, then refresh
      const agents = res.data.agents;
      if (prevRef.current) {
        for (const [name, a] of Object.entries(agents)) {
          const prev = prevRef.current[name];
          if (!prev) continue;
          const diff = Number(a.balance_ikas) - Number(prev.balance_ikas);
          if (diff > 0.0000001) {
            pushEvent({ text: `TX DETECTED · +${diff.toFixed(6)} iKAS → AGENT ${name.toUpperCase()}` });
            if (name === "alpha" && autoRef.current) autoForward(diff);
          }
        }
      }
      prevRef.current = agents;
      setStatus(res.data);
    } catch {
      if (manual) setStatus(null);
    }
    if (manual) setLoading(false);
  };

  useEffect(() => {
    loadStatus(true);
    const interval = setInterval(() => loadStatus(false), 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen overflow-hidden text-white relative"
      style={{ background: "#000000" }}>
      <div className="max-w-3xl mx-auto px-4 py-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <Link to="/IgraHorizon"
            className="flex items-center gap-2 px-4 py-2 text-[9px] tracking-[0.3em] uppercase rounded-full"
            style={{ border: "1px solid rgba(201,162,75,0.3)", background: "rgba(12,10,6,0.6)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              color: "rgba(201,162,75,0.9)", fontFamily: "monospace" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> IGRA HORIZON
          </Link>
          <button onClick={() => loadStatus(true)} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-[9px] tracking-[0.3em] uppercase rounded-full focus:outline-none"
            style={{ border: "1px solid rgba(201,162,75,0.3)", color: "rgba(201,162,75,0.9)",
              fontFamily: "monospace", opacity: loading ? 0.5 : 1 }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> SYNC
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center justify-center gap-3 flex-shrink-0">
          <img src={IGRA_AGENT_LOGO} alt="Igra Agent"
            className="w-10 h-10 rounded-full object-cover"
            style={{ boxShadow: "0 0 30px rgba(201,162,75,0.25)", border: "1px solid rgba(201,162,75,0.3)" }} />
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none"
              style={{ fontFamily: "'Georgia', serif",
                background: "linear-gradient(180deg, #ffffff 0%, #f0e6cf 55%, #C9A24B 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              IGRA AGENT
            </h1>
            <p className="mt-1 text-[7px] tracking-[0.25em] uppercase"
              style={{ color: "rgba(201,162,75,0.65)", fontFamily: "monospace" }}>
              iKAS TRANSACTIONS · IGRA MAINNET · CHAIN 38833
            </p>
          </div>
        </motion.div>

        {/* Split-screen toggle: CHAT | WALLETS */}
        <div className="flex gap-1.5 mb-3 p-1 rounded-full flex-shrink-0"
          style={{ border: "1px solid rgba(201,162,75,0.25)", background: "rgba(12,10,6,0.6)" }}>
          {[["chat", "AGENT CHAT"], ["wallets", "WALLETS & DESK"]].map(([key, label]) => (
            <button key={key} onClick={() => setView(key)}
              className="flex-1 py-2 rounded-full text-[9px] font-black tracking-[0.25em] uppercase focus:outline-none transition-colors"
              style={{ fontFamily: "monospace",
                background: view === key ? "rgba(201,162,75,0.18)" : "transparent",
                border: `1px solid ${view === key ? "rgba(201,162,75,0.5)" : "transparent"}`,
                color: view === key ? "#C9A24B" : "rgba(201,162,75,0.45)" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Live transaction detections */}
        {events.length > 0 && (
          <div className="mb-2 space-y-1.5 flex-shrink-0 max-h-24 overflow-y-auto">
            {events.map((ev) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="px-3 py-2 rounded-xl text-[9px] tracking-[0.15em] uppercase flex items-center gap-2"
                style={{
                  border: `1px solid ${ev.error ? "rgba(248,113,113,0.35)" : "rgba(110,231,183,0.3)"}`,
                  background: ev.error ? "rgba(60,15,10,0.4)" : "rgba(6,24,17,0.5)",
                  color: ev.error ? "#fca5a5" : "#6EE7B7", fontFamily: "monospace",
                }}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${ev.error ? "bg-red-400" : "bg-emerald-300"}`} />
                <span className="flex-1 break-all">{ev.text}</span>
                {ev.url && (
                  <a href={ev.url} target="_blank" rel="noopener noreferrer" className="underline flex-shrink-0">VIEW</a>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Split-screen content — fills the rest of the viewport, no page scroll */}
        <div className="flex-1 min-h-0">
          {view === "chat" ? (
            <div className="h-full flex flex-col">
              {status?.agents && (
                <div className="flex flex-wrap gap-1.5 mb-2 flex-shrink-0">
                  {Object.entries(status.agents).map(([name, a]) => (
                    <div key={name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px]"
                      style={{ border: "1px solid rgba(201,162,75,0.3)", background: "rgba(12,10,6,0.7)", fontFamily: "monospace" }}>
                      <span className="font-black tracking-[0.15em] uppercase" style={{ color: "rgba(201,162,75,0.7)" }}>{name}</span>
                      <span className="font-black" style={{ color: "#f5efe0" }}>
                        {a.balance_ikas != null ? Number(a.balance_ikas).toFixed(4) : "—"}
                      </span>
                      <span style={{ color: "#C9A24B" }}>iKAS</span>
                      {a.local && <span className="tracking-widest" style={{ color: "#6EE7B7" }}>LOCAL</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex-1 min-h-0">
                <IgraAgentConsole agents={status?.agents} fullHeight
                  onTxComplete={() => loadStatus(false)} onForged={() => loadStatus(false)} />
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto pb-4">
              {/* Agent wallets — server agents + browser-local agents */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {status?.agents
                  ? Object.entries(status.agents).map(([name, a]) => (
                      <AgentWalletCard key={name} name={name} address={a.address}
                        balance={a.balance_ikas} local={a.local} onTxComplete={() => loadStatus(false)} />
                    ))
                  : ["alpha", "beta"].map((n) => (
                      <AgentWalletCard key={n} name={n} address={null} balance={null} />
                    ))}
              </div>

              <AutoTransactToggle enabled={autoMode}
                onChange={(v) => { setAutoMode(v); autoRef.current = v; }} />

              <KaspaAddressCard />

              <DeskFundingCard />

              <p className="mt-4 text-center text-[8px] tracking-[0.2em] uppercase leading-relaxed"
                style={{ color: "rgba(201,162,75,0.4)", fontFamily: "monospace" }}>
                FUND AGENT ALPHA WITH iKAS TO ACTIVATE TRANSACTIONS · SIGNED SERVER-SIDE · BROADCAST THROUGH IGRA RPC NODES
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}