import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Rocket, Loader2 } from "lucide-react";
import ZKSendKasCard from "@/components/tttv3/ZKSendKasCard";
import { base44 } from "@/api/base44Client";

// Replicate the main-wallet loader used by ZKSendKasCard so we can prefill a
// self-send (user sends KAS to their own main wallet address).
function loadMainWallet() {
  try {
    const wallets = JSON.parse(localStorage.getItem("terra_wallets") || "[]");
    if (!wallets.length) return null;
    return wallets.find((w) => w.mnemonic) || wallets[0];
  } catch {
    return null;
  }
}

export default function SentimentTradePage() {
  const navigate = useNavigate();
  const [sentiment, setSentiment] = useState(null); // null | 'bullish' | 'bearish'
  const [selfAddress, setSelfAddress] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [txToast, setTxToast] = useState(null);

  useEffect(() => {
    const w = loadMainWallet();
    if (w?.address) setSelfAddress(w.address);
  }, []);

  const choose = (s) => {
    setSentiment(s);
    if (s === "bearish") {
      setRedirecting(true);
      // "bypass and lands on Terra"
      setTimeout(() => navigate("/Terra"), 650);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white" style={{ background: "#05060a", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(99,102,241,0.12), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 90%, rgba(6,182,212,0.08), transparent 65%)" }} />

      {/* back */}
      <button onClick={() => navigate("/")}
        className="absolute left-4 top-5 z-20 flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase px-3 py-1.5"
        style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.4)", borderRadius: 999 }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* rocket header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-3">
          <Rocket className="w-5 h-5" style={{ color: "#22d3ee" }} />
          <span className="text-[10px] tracking-[0.5em] uppercase" style={{ color: "rgba(34,211,238,0.7)" }}>KASPA · NATIVE TRADE</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
          className="text-3xl sm:text-5xl font-black tracking-tight mb-2"
          style={{ background: "linear-gradient(180deg,#ffffff,#9bb4d6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Market Sentiment
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.6 }}
          className="text-[12px] sm:text-sm mb-10 max-w-md" style={{ color: "rgba(255,255,255,0.55)" }}>
          Pick a side. <span style={{ color: "#34d399" }}>Bullish</span> self-sends KAS natively to your wallet — skin in the game.
          <span style={{ color: "#f87171" }}> Bearish</span> bypasses the trade and lands you on Terra.
        </motion.p>

        <AnimatePresence mode="wait">
          {/* Sentiment selector */}
          {!sentiment && (
            <motion.div key="selector" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
              <button onClick={() => choose("bullish")}
                className="flex-1 group rounded-2xl px-6 py-10 flex flex-col items-center gap-3 transition-all"
                style={{ border: "1px solid rgba(52,211,153,0.3)", background: "linear-gradient(180deg, rgba(16,185,129,0.08), rgba(5,6,10,0.6))" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.4)" }}>
                  <TrendingUp className="w-7 h-7" style={{ color: "#34d399" }} />
                </div>
                <span className="text-xl font-black tracking-wide" style={{ color: "#34d399" }}>BULLISH</span>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Self-send KAS natively ↗</span>
              </button>

              <button onClick={() => choose("bearish")}
                className="flex-1 group rounded-2xl px-6 py-10 flex flex-col items-center gap-3 transition-all"
                style={{ border: "1px solid rgba(248,113,113,0.3)", background: "linear-gradient(180deg, rgba(239,68,68,0.08), rgba(5,6,10,0.6))" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.4)" }}>
                  <TrendingDown className="w-7 h-7" style={{ color: "#f87171" }} />
                </div>
                <span className="text-xl font-black tracking-wide" style={{ color: "#f87171" }}>BEARISH</span>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Bypass → land on Terra</span>
              </button>
            </motion.div>
          )}

          {/* Bullish: native self-send KAS */}
          {sentiment === "bullish" && (
            <motion.div key="bullish" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="w-full max-w-md flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase" style={{ color: "#34d399" }}>
                <TrendingUp className="w-4 h-4" /> BULLISH · SELF-SEND KAS
              </div>
              <div className="w-full flex justify-start" style={{ opacity: 1 }}>
                <ZKSendKasCard
                  prefillTo={selfAddress}
                  prefillAmount=""
                  onSent={(tx) => setTxToast(tx)}
                />
              </div>
              <button onClick={() => navigate("/")} className="mt-2 text-[11px] tracking-widest uppercase px-4 py-2 rounded-lg"
                style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
                Done
              </button>
            </motion.div>
          )}

          {/* Bearish: redirecting to Terra */}
          {sentiment === "bearish" && (
            <motion.div key="bearish" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8">
              <div className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase" style={{ color: "#f87171" }}>
                <TrendingDown className="w-4 h-4" /> BEARISH · BYPASSING
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                {redirecting ? <><Loader2 className="w-4 h-4 animate-spin" /> Landing on Terra…</> : "Routing to Terra"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Sent-KAS confirmation toast */}
      <AnimatePresence>
        {txToast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl"
            style={{ background: "rgba(6,20,20,0.95)", border: "1px solid rgba(52,211,153,0.4)", color: "#34d399" }}>
            <span className="text-[12px] font-bold tracking-wide">Sent {txToast.amount} KAS ↻ self</span>
            <div className="text-[9px] mt-0.5 font-mono break-all" style={{ color: "rgba(52,211,153,0.5)" }}>{txToast.txId}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}