import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Check, Lock, Zap } from "lucide-react";
import { AGENT_TOOLS, isKaspaAddress, WALLET_1 } from "./agentTools";

const GLASS = "rgba(255,255,255,0.05)";
const BORDER = "rgba(255,255,255,0.08)";
const BLUE = "#4d6bfe";

export default function AgentSettings({ open, onClose, settings, onChange, isAdmin }) {
  const [addrInput, setAddrInput] = useState("");
  const [error, setError] = useState("");
  const walletConnected = !!settings.wallet;
  const unlocked = isAdmin || walletConnected;

  const connectKasware = async () => {
    setError("");
    try {
      if (!window.kasware) { setError("Kasware not detected — paste your address below instead."); return; }
      const accounts = await window.kasware.requestAccounts();
      if (accounts?.[0]) onChange({ ...settings, wallet: accounts[0] });
    } catch {
      setError("Connection cancelled.");
    }
  };

  const saveManual = () => {
    setError("");
    if (!isKaspaAddress(addrInput)) { setError("That doesn't look like a valid kaspa: address."); return; }
    onChange({ ...settings, wallet: addrInput.trim() });
    setAddrInput("");
  };

  const toggleTool = (id) => {
    if (!unlocked) return;
    onChange({ ...settings, enabled: { ...settings.enabled, [id]: settings.enabled[id] === false ? true : false } });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onClose}>
          <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl overflow-hidden flex flex-col"
            style={{ background: "#121214", border: `1px solid ${BORDER}`, maxHeight: "85vh" }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span className="text-[15px] font-extrabold text-white tracking-tight flex-1">Settings</span>
              <button onClick={onClose} className="p-2 rounded-xl text-white/50 hover:text-white" style={{ background: GLASS, border: `1px solid ${BORDER}` }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Wallet */}
              <div>
                <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Kaspa Wallet</div>
                {walletConnected ? (
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                    style={{ background: "rgba(48,209,88,0.08)", border: "1px solid rgba(48,209,88,0.3)" }}>
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#30D158" }} />
                    <div className="flex-1 min-w-0">
                      {settings.wallet === WALLET_1 && (
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8fa3ff" }}>Wallet 1 · Default</div>
                      )}
                      <span className="text-xs text-white/80 truncate block font-mono">{settings.wallet.slice(0, 18)}…{settings.wallet.slice(-6)}</span>
                    </div>
                    <button onClick={() => onChange({ ...settings, wallet: WALLET_1 })} className="text-[11px] text-white/40 hover:text-red-400 font-semibold flex-shrink-0">Reset to Wallet 1</button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {(() => {
                      let detected = null;
                      try { detected = localStorage.getItem("ttt_wallet_address"); } catch {}
                      if (!detected) return null;
                      return (
                        <button onClick={() => onChange({ ...settings, wallet: detected })}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white active:scale-[0.98] transition-transform"
                          style={{ background: "rgba(48,209,88,0.12)", border: "1px solid rgba(48,209,88,0.35)" }}>
                          <Check className="w-4 h-4" style={{ color: "#30D158" }} />
                          Use my TTT Wallet — {detected.slice(0, 14)}…{detected.slice(-4)}
                        </button>
                      );
                    })()}
                    <button onClick={connectKasware}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-white active:scale-[0.98] transition-transform"
                      style={{ background: BLUE, boxShadow: "0 4px 20px rgba(77,107,254,0.35)" }}>
                      <Wallet className="w-4 h-4" /> Connect Kasware — one click
                    </button>
                    <div className="flex gap-2">
                      <input value={addrInput} onChange={e => setAddrInput(e.target.value)}
                        placeholder="or paste kaspa:qq… address"
                        className="flex-1 px-3.5 py-2.5 rounded-xl text-xs text-white placeholder:text-white/25 outline-none bg-transparent"
                        style={{ border: `1px solid ${BORDER}`, background: GLASS }} />
                      <button onClick={saveManual} className="px-4 rounded-xl text-xs font-bold text-white" style={{ background: GLASS, border: `1px solid ${BORDER}` }}>Save</button>
                    </div>
                    {error && <div className="text-[11px]" style={{ color: "#FF453A" }}>{error}</div>}
                  </div>
                )}
              </div>

              {/* Tools */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider flex-1">Agent Tools</div>
                  {!unlocked && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#f0d060" }}>
                      <Lock className="w-3 h-3" /> Connect wallet to unlock
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-white/35 mb-3 leading-relaxed">
                  One-click integrations — no API keys needed, all tools run on TTT's own infrastructure. Each call costs K-CREDITS{isAdmin ? " (you're admin — unlimited)" : ""}.
                </div>
                <div className="space-y-2">
                  {AGENT_TOOLS.map(t => {
                    const on = unlocked && settings.enabled[t.id] !== false;
                    return (
                      <button key={t.id} onClick={() => toggleTool(t.id)} disabled={!unlocked}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors"
                        style={{ background: GLASS, border: `1px solid ${on ? "rgba(77,107,254,0.35)" : BORDER}`, opacity: unlocked ? 1 : 0.45 }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: on ? "rgba(77,107,254,0.15)" : "rgba(255,255,255,0.04)" }}>
                          {unlocked ? <Zap className="w-4 h-4" style={{ color: on ? "#8fa3ff" : "rgba(255,255,255,0.3)" }} /> : <Lock className="w-4 h-4 text-white/30" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-white">{t.name}</div>
                          <div className="text-[10.5px] text-white/35 truncate">{t.desc}</div>
                        </div>
                        <span className="text-[10px] text-white/30 tabular-nums flex-shrink-0">{isAdmin ? "free" : `${t.cost} KC`}</span>
                        <div className="w-9 h-5 rounded-full flex-shrink-0 relative transition-colors"
                          style={{ background: on ? BLUE : "rgba(255,255,255,0.12)" }}>
                          <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: on ? 18 : 2 }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}