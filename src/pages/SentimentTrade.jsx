import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Loader2, User as UserIcon } from "lucide-react";
import BullSendKasCard from "@/components/sentiment/BullSendKasCard";

const BULL_VIDEO = "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/549425148_Bull_Background.mp4";
const BEAR_VIDEO = "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/1e3530ccb_Bear_Background.mp4";

const GOLD = "#cca94e";
const BULL_GREEN = "#22c55e";
const BEAR_RED = "#ef4444";
const BULL_BG = "#004d26";
const BEAR_BG = "#5c1313";
const UI_GRAY = "#374151";

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

function shortAddr(addr) {
  if (!addr) return "0x000…000";
  const a = String(addr).replace(/^kaspa:/, "");
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
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
      // "bypass — back to TTT landing"
      setTimeout(() => navigate("/"), 650);
    }
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden text-white"
      style={{ background: "#05060a", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Split-screen video backdrop: bull (left) / bear (right) */}
      <div className="absolute inset-0 z-0 flex">
        {/* BULL SIDE */}
        <div className="relative w-1/2 h-full overflow-hidden">
          <video
            src={BULL_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,77,38,0.55) 0%, rgba(5,6,10,0.78) 55%, rgba(5,6,10,0.92) 100%)",
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-px"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
        </div>
        {/* BEAR SIDE */}
        <div className="relative w-1/2 h-full overflow-hidden">
          <video
            src={BEAR_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(92,19,19,0.55) 0%, rgba(5,6,10,0.78) 55%, rgba(5,6,10,0.92) 100%)",
            }}
          />
        </div>
      </div>

      {/* Center vertical divide glow */}
      <div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px z-10 pointer-events-none"
        style={{ background: "rgba(204,169,78,0.25)" }}
      />

      {/* Top bar: back + identity */}
      <div className="absolute top-5 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase px-3 py-1.5"
          style={{
            border: `1px solid ${UI_GRAY}`,
            color: "rgba(255,255,255,0.7)",
            background: "rgba(0,0,0,0.4)",
            borderRadius: 999,
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-[11px]"
          style={{
            border: `1px solid ${UI_GRAY}`,
            color: "rgba(255,255,255,0.7)",
            background: "rgba(0,0,0,0.4)",
            borderRadius: 999,
          }}
        >
          <UserIcon className="w-3.5 h-3.5" style={{ color: GOLD }} />
          <span className="font-mono">user@{shortAddr(selfAddress)}</span>
        </div>
      </div>

      {/* Centered headline stack */}
      <section className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-2"
        >
          <span
            className="text-[11px] sm:text-xs tracking-[0.45em] uppercase font-bold"
            style={{ color: GOLD }}
          >
            KASPA · NATIVE TRADE
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-4xl sm:text-6xl font-black tracking-tight mb-3"
          style={{ color: "#ffffff" }}
        >
          Market Sentiment
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="text-[12px] sm:text-sm mb-10 max-w-md"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          Pick a side.{" "}
          <span style={{ color: BULL_GREEN }}>Bullish</span> self-sends KAS
          natively — skin in the game.{" "}
          <span style={{ color: BEAR_RED }}>Bearish</span> bypasses and sends you
          back to TTT.
        </motion.p>

        <AnimatePresence mode="wait">
          {/* Sentiment selector — two cinematic widgets */}
          {!sentiment && (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex flex-row gap-2.5 sm:gap-3 w-full max-w-xl px-2"
            >
              <button
                onClick={() => choose("bullish")}
                className="group flex-1 rounded-2xl px-2 py-5 sm:px-4 sm:py-6 flex flex-col items-center gap-2 transition-all active:scale-95 hover:scale-[1.03]"
                style={{
                  border: `1px solid rgba(34,197,94,0.35)`,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,77,38,0.28))",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <div
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(34,197,94,0.14)",
                    border: `1px solid rgba(34,197,94,0.45)`,
                  }}
                >
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#ffffff" }} />
                </div>
                <span
                  className="text-sm sm:text-lg font-semibold tracking-tight"
                  style={{ color: BULL_GREEN }}
                >
                  BULLISH
                </span>
                <span className="text-[9px] sm:text-[11px] leading-tight text-center" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Self-send KAS ↗
                </span>
              </button>

              <button
                onClick={() => choose("bearish")}
                className="group flex-1 rounded-2xl px-2 py-5 sm:px-4 sm:py-6 flex flex-col items-center gap-2 transition-all active:scale-95 hover:scale-[1.03]"
                style={{
                  border: `1px solid rgba(239,68,68,0.35)`,
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.45), rgba(92,19,19,0.28))",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <div
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(239,68,68,0.14)",
                    border: `1px solid rgba(239,68,68,0.45)`,
                  }}
                >
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#ffffff" }} />
                </div>
                <span
                  className="text-sm sm:text-lg font-semibold tracking-tight"
                  style={{ color: BEAR_RED }}
                >
                  BEARISH
                </span>
                <span className="text-[9px] sm:text-[11px] leading-tight text-center" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Bypass → TTT
                </span>
              </button>
            </motion.div>
          )}

          {/* Bullish: native self-send KAS */}
          {sentiment === "bullish" && (
            <motion.div
              key="bullish"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md flex flex-col items-center gap-4 rounded-2xl p-6"
              style={{
                border: `1px solid rgba(34,197,94,0.4)`,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
              }}
            >
              <div
                className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase font-bold"
                style={{ color: BULL_GREEN }}
              >
                <TrendingUp className="w-4 h-4" /> BULLISH · SELF-SEND KAS
              </div>
              <div className="w-full flex justify-center" style={{ opacity: 1 }}>
                <BullSendKasCard
                  onSent={(tx) => {
                    setTxToast(tx);
                    setTimeout(() => navigate("/BullChart"), 1500);
                  }}
                />
              </div>
              <button
                onClick={() => navigate("/")}
                className="mt-2 text-[11px] tracking-widest uppercase px-4 py-2 rounded-lg"
                style={{
                  border: `1px solid ${UI_GRAY}`,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Done
              </button>
            </motion.div>
          )}

          {/* Bearish: redirecting to Terra */}
          {sentiment === "bearish" && (
            <motion.div
              key="bearish"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8 rounded-2xl px-10"
              style={{
                border: `1px solid rgba(239,68,68,0.4)`,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
              }}
            >
              <div
                className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase font-bold"
                style={{ color: BEAR_RED }}
              >
                <TrendingDown className="w-4 h-4" /> BEARISH · BYPASSING
              </div>
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {redirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Back to TTT…
                  </>
                ) : (
                  "Routing to TTT"
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Sent-KAS confirmation toast */}
      <AnimatePresence>
        {txToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl"
            style={{
              background: "rgba(6,20,20,0.95)",
              border: `1px solid rgba(52,211,153,0.4)`,
              color: BULL_GREEN,
            }}
          >
            <span className="text-[12px] font-bold tracking-wide">
              Sent {txToast.amount} KAS ↻ self
            </span>
            <div
              className="text-[9px] mt-0.5 font-mono break-all"
              style={{ color: "rgba(52,211,153,0.5)" }}
            >
              {txToast.txId}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}