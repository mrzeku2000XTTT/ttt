import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Gift, Lock, Coins, Sparkles, ShieldCheck, Heart, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const COOLDOWN_HOURS = 24;
const CHEST_WALLET_KEY = "chest_wallet_address";
const CHEST_CLAIM_KEY = "chest_last_claim";

export default function ChestModal({ onClose, sounds }) {
  const [tab, setTab] = useState("wish"); // wish | donate
  const [walletAddress, setWalletAddress] = useState("");
  const [wish, setWish] = useState("");
  const [chestInfo, setChestInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [resultMsg, setResultMsg] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [sentAmount, setSentAmount] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CHEST_WALLET_KEY);
    if (saved) setWalletAddress(saved);
    checkCooldown();
    loadChestInfo();
  }, []);

  const checkCooldown = () => {
    const last = localStorage.getItem(CHEST_CLAIM_KEY);
    if (last) {
      const elapsed = Date.now() - parseInt(last);
      const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
      if (elapsed < cooldownMs) {
        setCooldownRemaining(Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000)));
      }
    }
  };

  const loadChestInfo = async () => {
    try {
      const res = await base44.functions.invoke("getChestInfo", {});
      setChestInfo(res.data);
    } catch {}
  };

  const copyAddress = () => {
    if (chestInfo?.address) {
      navigator.clipboard.writeText(chestInfo.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const submitWish = async () => {
    if (!walletAddress.trim() || !wish.trim() || loading) return;
    setLoading(true);
    sounds?.playSelect?.();

    try {
      localStorage.setItem(CHEST_WALLET_KEY, walletAddress.trim());
      const res = await base44.functions.invoke("submitChestWish", {
        kaspa_address: walletAddress.trim(),
        wish: wish.trim(),
      });
      const data = res.data;

      if (!data.success && data.approved === false) {
        setResultMsg(data.reason || "Wish not approved by AI moderation.");
        setStatus("flagged");
      } else if (data.sent) {
        setTxHash(data.txHash);
        setSentAmount(data.amount || 2);
        localStorage.setItem(CHEST_CLAIM_KEY, Date.now().toString());
        setStatus("success");
        loadChestInfo();
      } else {
        setResultMsg(data.message || "Wish approved! KAS will be sent soon.");
        setStatus("pending");
        loadChestInfo();
      }
    } catch (err) {
      setResultMsg("Something went wrong. Try again.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const ACCENT = "#c8960c";
  const ACCENT_BRIGHT = "#f5d050";
  const onCooldown = cooldownRemaining > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
          <div className="absolute inset-0 pointer-events-none opacity-10"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,150,40,0.3) 2px, rgba(200,150,40,0.3) 3px)" }} />

          <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1.5" style={{ color: "rgba(200,150,40,0.4)" }}>
            <X className="w-4 h-4" />
          </button>

          <div className="relative p-8 text-center">
            {/* Chest icon */}
            <motion.div
              animate={loading ? { rotate: [-2, 2, -2] } : { y: [0, -4, 0] }}
              transition={{ duration: loading ? 0.2 : 2.5, repeat: Infinity }}
              className="mx-auto mb-4 w-24 h-24 flex items-center justify-center relative"
              style={{
                background: "linear-gradient(145deg, #2a2210, #1a1408)",
                border: `2px solid ${ACCENT}`,
                boxShadow: `0 0 40px rgba(200,150,40,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
              }}
            >
              {status === "success" ? <Gift className="w-10 h-10" style={{ color: ACCENT_BRIGHT }} />
                : status === "flagged" ? <ShieldCheck className="w-10 h-10" style={{ color: "#ef4444" }} />
                : tab === "donate" ? <Heart className="w-10 h-10" style={{ color: ACCENT }} />
                : loading ? <Sparkles className="w-10 h-10 animate-pulse" style={{ color: ACCENT_BRIGHT }} />
                : <Coins className="w-10 h-10" style={{ color: ACCENT }} />}
              <div className="absolute top-1 left-1 w-2 h-2 rounded-full" style={{ background: ACCENT_BRIGHT, boxShadow: `0 0 6px ${ACCENT_BRIGHT}` }} />
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: ACCENT_BRIGHT, boxShadow: `0 0 6px ${ACCENT_BRIGHT}` }} />
            </motion.div>

            <h2 className="text-[20px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: ACCENT_BRIGHT, fontFamily: "monospace", textShadow: "0 0 20px rgba(245,208,80,0.4)" }}>
              COMMUNITY CHEST
            </h2>

            {/* Tabs */}
            {!status && (
              <div className="flex gap-1 justify-center mb-5">
                <button onClick={() => setTab("wish")} className="px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all"
                  style={{ border: `1px solid ${tab === "wish" ? ACCENT : "rgba(200,150,40,0.2)"}`, color: tab === "wish" ? ACCENT_BRIGHT : "rgba(200,150,40,0.4)", background: tab === "wish" ? "rgba(200,150,40,0.08)" : "transparent", fontFamily: "monospace" }}>
                  WISH
                </button>
                <button onClick={() => setTab("donate")} className="px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all"
                  style={{ border: `1px solid ${tab === "donate" ? ACCENT : "rgba(200,150,40,0.2)"}`, color: tab === "donate" ? ACCENT_BRIGHT : "rgba(200,150,40,0.4)", background: tab === "donate" ? "rgba(200,150,40,0.08)" : "transparent", fontFamily: "monospace" }}>
                  DONATE
                </button>
              </div>
            )}

            {/* Chest balance */}
            {chestInfo?.initialized && (
              <div className="mb-4 text-[11px] font-bold tracking-wider" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>
                CHEST: {chestInfo.balance?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 0} KAS
              </div>
            )}

            {/* === SUCCESS STATE === */}
            {status === "success" ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4">
                <div className="text-[28px] font-black mb-2" style={{ color: ACCENT_BRIGHT, fontFamily: "monospace" }}>
                  +{sentAmount} KAS
                </div>
                <p className="text-[11px] tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                  Wish granted! Check your wallet.
                </p>
                {txHash && (
                  <a href={`https://kaspa.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className="text-[9px] tracking-wider underline" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>
                    View Transaction ↗
                  </a>
                )}
                <button onClick={onClose} className="mt-5 w-full py-3 text-[12px] font-black tracking-[0.3em] uppercase transition-all"
                  style={{ border: `2px solid ${ACCENT}`, color: ACCENT_BRIGHT, background: "rgba(200,150,40,0.08)", fontFamily: "monospace" }}>
                  CLOSE
                </button>
              </motion.div>
            ) : status === "pending" ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4">
                <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: ACCENT_BRIGHT }} />
                <p className="text-[12px] font-bold mb-2" style={{ color: ACCENT_BRIGHT, fontFamily: "monospace" }}>
                  WISH RECEIVED!
                </p>
                <p className="text-[10px] leading-relaxed mb-4 px-2" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                  {resultMsg}
                </p>
                <button onClick={onClose} className="w-full py-3 text-[12px] font-black tracking-[0.3em] uppercase"
                  style={{ border: `2px solid ${ACCENT}`, color: ACCENT_BRIGHT, background: "rgba(200,150,40,0.08)", fontFamily: "monospace" }}>
                  CLOSE
                </button>
              </motion.div>
            ) : status === "flagged" ? (
              <div className="py-4">
                <p className="text-[12px] font-bold mb-2" style={{ color: "#ef4444", fontFamily: "monospace" }}>WISH NOT APPROVED</p>
                <p className="text-[10px] leading-relaxed mb-4 px-2" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                  {resultMsg || "Your wish was flagged. Please revise and try again."}
                </p>
                <button onClick={() => { setStatus(null); setResultMsg(""); }}
                  className="w-full py-3 text-[11px] font-black tracking-[0.2em] uppercase"
                  style={{ border: `2px solid ${ACCENT}`, color: ACCENT_BRIGHT, background: "rgba(200,150,40,0.08)", fontFamily: "monospace" }}>
                  REVISE WISH
                </button>
              </div>
            ) : status === "error" ? (
              <div className="py-4">
                <p className="text-[12px] font-bold mb-3" style={{ color: "#ef4444", fontFamily: "monospace" }}>
                  {resultMsg || "CHEST ERROR"}
                </p>
                <button onClick={() => { setStatus(null); setResultMsg(""); }}
                  className="w-full py-3 text-[11px] font-black tracking-[0.2em] uppercase"
                  style={{ border: `2px solid ${ACCENT}`, color: ACCENT_BRIGHT, background: "rgba(200,150,40,0.08)", fontFamily: "monospace" }}>
                  TRY AGAIN
                </button>
              </div>
            ) : tab === "donate" ? (
              /* === DONATE TAB === */
              <div className="space-y-4">
                <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>
                  SEND KAS TO FILL THE CHEST
                </p>
                {chestInfo?.initialized ? (
                  <>
                    {/* QR code */}
                    <div className="bg-white p-3 mx-auto w-fit">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${chestInfo.address}`} alt="Chest QR" className="w-40 h-40" />
                    </div>
                    {/* Address */}
                    <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${ACCENT}` }}>
                      <span className="flex-1 text-[9px] font-mono truncate text-left" style={{ color: ACCENT_BRIGHT }}>
                        {chestInfo.address}
                      </span>
                      <button onClick={copyAddress} className="flex-shrink-0 p-1" style={{ color: ACCENT }}>
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[9px] leading-relaxed" style={{ color: "rgba(200,150,40,0.3)", fontFamily: "monospace" }}>
                      Your donation funds wishes. Every donation triggers the chest to send KAS to random wishers.
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] py-4" style={{ color: "rgba(200,150,40,0.4)", fontFamily: "monospace" }}>
                    Chest wallet not yet initialized.<br/>Admin must activate it first.
                  </p>
                )}
              </div>
            ) : (
              /* === WISH TAB === */
              <div className="space-y-3">
                {onCooldown && (
                  <div className="py-2 px-3 text-[10px] tracking-wider" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace", border: "1px solid rgba(200,150,40,0.2)", background: "rgba(0,0,0,0.3)" }}>
                    ⏳ Chest recharging — come back in ~{cooldownRemaining}h
                  </div>
                )}
                <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="PASTE YOUR KASPA ADDRESS..."
                  className="w-full px-4 py-3 text-[11px] outline-none font-bold tracking-wider uppercase"
                  style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${walletAddress.trim() ? ACCENT : "rgba(200,150,40,0.2)"}`, color: ACCENT_BRIGHT, caretColor: ACCENT, fontFamily: "monospace" }} />
                <textarea value={wish} onChange={(e) => setWish(e.target.value)}
                  placeholder="MAKE A WISH... (what would you do with KAS?)"
                  rows={3} maxLength={300}
                  className="w-full px-4 py-3 text-[11px] outline-none resize-none font-bold tracking-wider"
                  style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${wish.trim() ? ACCENT : "rgba(200,150,40,0.2)"}`, color: "rgba(255,255,255,0.85)", caretColor: ACCENT, fontFamily: "monospace" }} />
                <div className="text-right text-[9px] tracking-wider" style={{ color: "rgba(200,150,40,0.3)", fontFamily: "monospace" }}>
                  {wish.length}/300
                </div>
                <button onClick={submitWish}
                  disabled={!walletAddress.trim() || !wish.trim() || loading || onCooldown}
                  className="w-full py-3.5 text-[13px] font-black tracking-[0.4em] uppercase flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
                  style={{ border: `2px solid ${ACCENT}`, color: "#000", background: (walletAddress.trim() && wish.trim() && !onCooldown) ? ACCENT_BRIGHT : "transparent", fontFamily: "monospace", boxShadow: (walletAddress.trim() && wish.trim() && !onCooldown) ? "0 0 30px rgba(245,208,80,0.3)" : "none" }}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...</> : "▶ SUBMIT WISH"}
                </button>
                <p className="text-[9px] tracking-wider flex items-center justify-center gap-1" style={{ color: "rgba(200,150,40,0.25)", fontFamily: "monospace" }}>
                  <ShieldCheck className="w-2.5 h-2.5" /> AI-PROTECTED · POWERED BY COMMUNITY DONATIONS
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}