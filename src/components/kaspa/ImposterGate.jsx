import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const SUBAGENT_NAMES = [
  "GHOST_WALKER", "NULL_AGENT", "PHANTOM_IX", "ZERO_FACE",
  "SHADOW_CODEC", "VOIDRUNNER", "CIPHER_NULL", "DAEMON_X",
  "ECHO_BREACH", "SIGNAL_LOST", "ROGUE_NODE", "DARK_VECTOR",
  "FRAGMENT_7", "STATIC_SOUL", "BLEED_EDGE", "UNKNOWN_ORIGIN"
];

function generateImposterID() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "IMP-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function generateSessionToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function ImposterGate({ onIdentityReady }) {
  const [status, setStatus] = useState("idle"); // idle | generating | done | error
  const [identity, setIdentity] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const generateIdentity = async () => {
    setStatus("generating");
    setErrorMsg("");
    try {
      // 1. Generate Kaspa wallet via backend
      const res = await base44.functions.invoke('createKaspaWallet', {});
      const walletData = res.data;
      if (!walletData?.address) throw new Error("Wallet generation failed");

      // 2. Build identity
      const imposter_id = generateImposterID();
      const subagent_name = SUBAGENT_NAMES[Math.floor(Math.random() * SUBAGENT_NAMES.length)];
      const session_token = generateSessionToken();

      // 3. Store in entity (no auth needed - public RLS)
      await base44.entities.ImposterIdentity.create({
        imposter_id,
        kaspa_address: walletData.address,
        subagent_name,
        session_token,
        message_count: 0,
        last_seen: new Date().toISOString(),
      });

      // 4. Persist session locally
      const identityObj = {
        imposter_id,
        kaspa_address: walletData.address,
        subagent_name,
        session_token,
        mnemonic: walletData.mnemonic,
      };
      localStorage.setItem("imposter_identity", JSON.stringify(identityObj));

      setIdentity(identityObj);
      setStatus("done");
    } catch (err) {
      console.error("ImposterGate error:", err);
      setErrorMsg(err.message || "Something broke. Try again.");
      setStatus("error");
    }
  };

  const proceed = () => {
    if (identity) onIdentityReady(identity);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 text-center">
      {status === "idle" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 w-full">
          <div>
            <div className="text-2xl mb-1">👾</div>
            <div className="text-white font-bold text-sm tracking-widest uppercase">Imposter Mode</div>
            <div className="text-white/35 text-[11px] mt-1 leading-relaxed">
              No account. No trace.<br />
              You need a wallet identity to enter.
            </div>
          </div>
          <div className="px-3 py-2.5 rounded-xl text-left space-y-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">What gets created</div>
            <div className="text-[11px] text-white/60 space-y-0.5">
              <div>· Kaspa wallet address (Terra Protocol)</div>
              <div>· Unique Imposter ID</div>
              <div>· Subagent codename</div>
              <div>· Seed phrase (save it — it's yours)</div>
            </div>
          </div>
          <button
            onClick={generateIdentity}
            className="w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95"
            style={{ background: "rgba(255,50,50,0.15)", border: "1px solid rgba(255,50,50,0.3)", color: "rgba(255,120,120,0.95)" }}>
            Generate Wallet
          </button>
        </motion.div>
      )}

      {status === "generating" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="text-2xl animate-pulse">⚙️</div>
          <div className="text-white/60 text-xs tracking-widest uppercase animate-pulse">Generating identity…</div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-red-400/60"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        </motion.div>
      )}

      {status === "error" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="text-white/50 text-[11px]">{errorMsg}</div>
          <button onClick={generateIdentity} className="px-4 py-2 rounded-lg text-xs text-red-400/80 border border-red-500/20 hover:bg-red-500/10 transition-all">
            Try Again
          </button>
        </motion.div>
      )}

      {status === "done" && identity && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 w-full">
          <div className="text-xl">✅</div>
          <div className="space-y-2 text-left">
            <div className="text-[11px] text-white/40 uppercase tracking-wider font-semibold">Your Identity</div>
            <div className="px-3 py-2.5 rounded-xl space-y-2" style={{ background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.2)" }}>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/40">ID</span>
                <span className="text-[11px] text-red-300/90 font-mono font-bold">{identity.imposter_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-white/40">Subagent</span>
                <span className="text-[11px] text-white/70 font-mono">{identity.subagent_name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/40">Kaspa Address</span>
                <span className="text-[10px] text-white/50 font-mono break-all">{identity.kaspa_address}</span>
              </div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.15)" }}>
              <div className="text-[10px] text-yellow-400/70 font-semibold mb-1">⚠️ Save your seed phrase</div>
              <div className="text-[10px] text-white/40 font-mono break-all leading-relaxed">{identity.mnemonic}</div>
            </div>
          </div>
          <button onClick={proceed} className="w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95"
            style={{ background: "rgba(255,50,50,0.2)", border: "1px solid rgba(255,50,50,0.4)", color: "rgba(255,120,120,1)" }}>
            Enter as {identity.subagent_name}
          </button>
        </motion.div>
      )}
    </div>
  );
}