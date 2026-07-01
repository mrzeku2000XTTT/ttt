import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Gift, Lock, Coins } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CLAIM_AMOUNT = 2; // KAS per claim
const COOLDOWN_HOURS = 24;
const CHEST_WALLET_KEY = "chest_wallet_address";
const CHEST_CLAIM_KEY = "chest_last_claim";

export default function ChestModal({ onClose, sounds }) {
  const [walletAddress, setWalletAddress] = useState("");
  const [chestBalance, setChestBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | 'claiming' | 'success' | 'error' | 'cooldown'
  const [txHash, setTxHash] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(CHEST_WALLET_KEY);
    if (saved) setWalletAddress(saved);
    checkCooldown();
    loadChestBalance();
  }, []);

  const checkCooldown = () => {
    const last = localStorage.getItem(CHEST_CLAIM_KEY);
    if (last) {
      const elapsed = Date.now() - parseInt(last);
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      if (elapsed < cooldownMs) {
        setCooldownRemaining(Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000)));
        setStatus("cooldown");
        return true;
      }
    }
    return false;
  };

  const loadChestBalance = async () => {
    try {
      const res = await base44.functions.invoke("getKaspaBalance", {});
      setChestBalance(res.data?.balanceKAS || 0);
    } catch {
      setChestBalance(null);
    }
  };

  const claim = async () => {
    if (!walletAddress.trim() || loading) return;
    setLoading(true);
    setStatus("claiming");
    sounds?.playSelect?.();

    try {
      localStorage.setItem(CHEST_WALLET_KEY, walletAddress.trim());
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        recipientAddress: walletAddress.trim(),
        amount: CLAIM_AMOUNT,
        note: "TTT Community Chest"
      });

      if (res.data?.txHash || res.data?.success) {
        setTxHash(res.data?.txHash || res.data?.transaction_id);
        localStorage.setItem(CHEST_CLAIM_KEY, Date.now().toString());
        setStatus("success");
        loadChestBalance();
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const ACCENT = "#c8960c";
  const ACCENT_BRIGHT = "#f5d050";

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md relative"
            style={{
              background: "linear-gradient(180deg, #1a1a14 0%, #0d0d08 100%)",
              border: `2px solid ${ACCENT}`,
              boxShadow: `0 0 80px rgba(200,150,40,0.3), 0 20px 60px rgba(0,0,0,0.8)`,
            }}
          >
            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,150,40,0.3) 2px, rgba(200,150,40,0.3) 3px)" }} />

            {/* Close */}
            <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1.5 transition-colors" style={{ color: "rgba(200,150,40,0.4)" }}>
              <X className="w-4 h-4" />
            </button>

            <div className="relative p-8 text-center">
              {/* Chest icon */}
              <motion.div
                animate={status === "claiming" ? { rotate: [-2, 2, -2] } : { y: [0, -4, 0] }}
                transition={{ duration: status === "claiming" ? 0.2 : 2.5, repeat: Infinity }}
                className="mx-auto mb-4 w-24 h-24 flex items-center justify-center relative"
                style={{
                  background: "linear-gradient(145deg, #2a2210, #1a1408)",
                  border: `2px solid ${ACCENT}`,
                  boxShadow: `0 0 40px rgba(200,150,40,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}
              >
                {status === "success" ? (
                  <Gift className="w-10 h-10" style={{ color: ACCENT_BRIGHT }} />
                ) : status === "cooldown" ? (
                  <Lock className="w-10 h-10" style={{ color: "rgba(200,150,40,0.5)" }} />
                ) : (
                  <Coins className="w-10 h-10" style={{ color: ACCENT }} />
                )}
                <div className="absolute top-1 left-1 w-2 h-2 rounded-full" style={{ background: ACCENT_BRIGHT, boxShadow: `0 0 6px ${ACCENT_BRIGHT}` }} />
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: ACCENT_BRIGHT, boxShadow: `0 0 6px ${ACCENT_BRIGHT}` }} />
              </motion.div>

              {/* Title */}
              <h2 className="text-[20px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: ACCENT_BRIGHT, fontFamily: "monospace", textShadow: "0 0 20px rgba(245,208,80,0.4)" }}>
                COMMUNITY CHEST
              </h2>
              <p className="text-[10px] tracking-[0.25em] uppercase mb-5" style={{ color: "rgba(200,150,40,0.4)", fontFamily: "monospace" }}>
                TAP · TO · CLAIM FREE KAS
              </p>

              {/* Chest balance */}
              {chestBalance !== null && (
                <div className="mb-4 text-[11px] font-bold tracking-wider" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>
                  CHEST FUNDS: {chestBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} KAS
                </div>
              )}

              {/* States */}
              {status === "success" ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4">
                  <div className="text-[28px] font-black mb-2" style={{ color: ACCENT_BRIGHT, fontFamily: "monospace" }}>
                    +{CLAIM_AMOUNT} KAS
                  </div>
                  <p className="text-[11px] tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                    Sent to your wallet!
                  </p>
                  {txHash && (
                    <a href={`https://kaspa.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      className="text-[9px] tracking-wider underline" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>
                      View Transaction ↗
                    </a>
                  )}
                  <button onClick={onClose}
                    className="mt-5 w-full py-3 text-[12px] font-black tracking-[0.3em] uppercase transition-all"
                    style={{ border: `2px solid ${ACCENT}`, color: ACCENT_BRIGHT, background: "rgba(200,150,40,0.08)", fontFamily: "monospace" }}>
                    CLOSE
                  </button>
                </motion.div>
              ) : status === "cooldown" ? (
                <div className="py-4">
                  <p className="text-[13px] font-bold mb-2" style={{ color: "rgba(200,150,40,0.7)", fontFamily: "monospace" }}>
                    CHEST RECHARGING
                  </p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                    Come back in ~{cooldownRemaining}h
                  </p>
                </div>
              ) : status === "error" ? (
                <div className="py-4">
                  <p className="text-[12px] font-bold mb-3" style={{ color: "#ef4444", fontFamily: "monospace" }}>
                    CHEST EMPTY OR OFFLINE
                  </p>
                  <button onClick={() => { setStatus(null); setLoading(false); }}
                    className="w-full py-3 text-[11px] font-black tracking-[0.2em] uppercase transition-all"
                    style={{ border: `2px solid ${ACCENT}`, color: ACCENT_BRIGHT, background: "rgba(200,150,40,0.08)", fontFamily: "monospace" }}>
                    TRY AGAIN
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="PASTE YOUR KASPA ADDRESS..."
                    className="w-full px-4 py-3 text-[11px] outline-none font-bold tracking-wider uppercase"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: `1px solid ${walletAddress.trim() ? ACCENT : "rgba(200,150,40,0.2)"}`,
                      color: ACCENT_BRIGHT, caretColor: ACCENT, fontFamily: "monospace",
                    }}
                  />
                  <button
                    onClick={claim}
                    disabled={!walletAddress.trim() || loading}
                    className="w-full py-3.5 text-[13px] font-black tracking-[0.4em] uppercase flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
                    style={{
                      border: `2px solid ${ACCENT}`, color: "#000",
                      background: walletAddress.trim() ? ACCENT_BRIGHT : "transparent",
                      fontFamily: "monospace",
                      boxShadow: walletAddress.trim() ? "0 0 30px rgba(245,208,80,0.3)" : "none",
                    }}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> CLAIMING...</> : `▶ CLAIM ${CLAIM_AMOUNT} KAS`}
                  </button>
                  <p className="text-[9px] tracking-wider" style={{ color: "rgba(200,150,40,0.25)", fontFamily: "monospace" }}>
                    ONE CLAIM PER {COOLDOWN_HOURS}H · POWERED BY TTT COMMUNITY
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}