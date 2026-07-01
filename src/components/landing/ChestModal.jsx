import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Sparkles, ShieldCheck, Copy, Check, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CLAIM_AMOUNT = 0.01;
const COOLDOWN_HOURS = 24;
const CHEST_LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8497b000a_generated_image.png";
const CHEST_WALLET_KEY = "chest_wallet_address";
const CHEST_CLAIM_KEY = "chest_last_claim";

export default function ChestModal({ onClose, sounds }) {
  const [walletAddress, setWalletAddress] = useState("");
  const [wish, setWish] = useState("");
  const [chestAddress, setChestAddress] = useState(null);
  const [chestBalance, setChestBalance] = useState(null);
  const [chestReady, setChestReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [aiMessage, setAiMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [initializing, setInitializing] = useState(false);

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
        setStatus("cooldown");
        return true;
      }
    }
    return false;
  };

  const loadChestInfo = async () => {
    try {
      const res = await base44.functions.invoke("getChestInfo", {});
      if (res.data?.initialized && res.data?.address) {
        setChestAddress(res.data.address);
        setChestBalance(res.data.balance);
        setChestReady(true);
      } else {
        setChestReady(false);
      }
    } catch {
      setChestReady(false);
    }
  };

  const copyAddress = async () => {
    if (!chestAddress) return;
    try {
      await navigator.clipboard.writeText(chestAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const claim = async () => {
    if (!walletAddress.trim() || !wish.trim() || loading) return;
    setLoading(true);
    sounds?.playSelect?.();

    try {
      localStorage.setItem(CHEST_WALLET_KEY, walletAddress.trim());

      setStatus("moderating");
      setAiMessage("AI is reviewing your wish...");

      const res = await base44.functions.invoke("submitChestWish", {
        kaspa_address: walletAddress.trim(),
        wish: wish.trim(),
      });

      const data = res.data;

      if (data?.success && data?.status === "sent") {
        setTxHash(data.txHash);
        localStorage.setItem(CHEST_CLAIM_KEY, Date.now().toString());
        setStatus("success");
        loadChestInfo();
      } else if (data?.status === "cooldown") {
        setCooldownRemaining(data.hoursLeft || 24);
        setAiMessage(data.message || "Already claimed recently.");
        setStatus("cooldown");
      } else if (data?.status === "flagged") {
        setAiMessage(data.message || "Wish flagged by AI moderation.");
        setStatus("flagged");
      } else if (data?.status === "empty") {
        setAiMessage("The chest is empty — donations needed!");
        setStatus("error");
        if (data.chestAddress) {
          setChestAddress(data.chestAddress);
          setChestReady(true);
        }
      } else {
        setAiMessage(data?.error || data?.message || "Something went wrong.");
        setStatus("error");
      }
    } catch (err) {
      console.error("[ChestModal] Claim error:", err);
      const backendError = err?.response?.data?.error || err?.response?.data?.message;
      const statusText = err?.response?.status ? `(${err.response.status}) ` : "";
      setAiMessage(backendError ? `${statusText}${backendError}` : "Network error. Please try again.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const ACCENT = "#c8960c";
  const ACCENT_BRIGHT = "#f5d050";

  return (
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
          <div className="absolute inset-0 pointer-events-none opacity-10"
            style={{ backgroundImage: "repeating-linear-gradient(0deg,!transparent,!transparent 2px, rgba(200,150,40,0.3) 2px, rgba(200,150,40,0.3) 3px)".replace(/!/g, "") }} />

          <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1.5 transition-colors" style={{ color: "rgba(200,150,40,0.4)" }}>
            <X className="w-4 h-4" />
          </button>

          <div className="relative p-8 text-center">
            {/* Chest logo */}
            <motion.div
              animate={loading ? { rotate: [-1, 1, -1] } : { y: [0, -4, 0] }}
              transition={{ duration: loading ? 0.3 : 2.5, repeat: Infinity }}
              className="mx-auto mb-3 w-20 h-20 flex items-center justify-center relative"
            >
              <img
                src={CHEST_LOGO_URL}
                alt="Community Chest"
                className="w-full h-full object-contain"
                style={{ filter: `drop-shadow(0 0 12px rgba(200,150,40,0.4))` }}
              />
              {status === "moderating" && (
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 animate-pulse" style={{ color: ACCENT_BRIGHT }} />
              )}
            </motion.div>

            <h2 className="text-[20px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: ACCENT_BRIGHT, fontFamily: "monospace", textShadow: "0 0 20px rgba(245,208,80,0.4)" }}>
              COMMUNITY CHEST
            </h2>
            <p className="text-[10px] tracking-[0.25em] uppercase mb-4" style={{ color: "rgba(200,150,40,0.4)", fontFamily: "monospace" }}>
              MAKE A WISH · RECEIVE FREE KAS
            </p>

            {/* Rules */}
            <div className="mb-5 p-3 rounded-lg text-left" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid rgba(200,150,40,0.1)` }}>
              <p className="text-[9px] tracking-[0.2em] uppercase mb-2 text-center" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>
                ◆ RULES OF THE COVENANT ◆
              </p>
              <ul className="space-y-1 text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
                <li>• One wish per {COOLDOWN_HOURS} hours per wallet</li>
                <li>• All wishes are AI-moderated for safety</li>
                <li>• Sensitive info (keys, emails) is auto-stripped</li>
                <li>• Spam, abuse, and scams are rejected</li>
                <li>• {CLAIM_AMOUNT} KAS per approved wish — keep it sustainable</li>
                <li>• Donations refill the chest for everyone</li>
              </ul>
            </div>

            {/* Donation address + balance */}
            {chestReady && chestAddress && (
              <div className="mb-5 p-3 rounded-lg" style={{ background: "rgba(0,0,0,0.4)", border: `1px solid rgba(200,150,40,0.15)` }}>
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <Wallet className="w-3 h-3" style={{ color: ACCENT }} />
                  <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>
                    Donate to the Chest
                  </span>
                </div>
                <button onClick={copyAddress} className="w-full flex items-center justify-center gap-2 group">
                  <span className="text-[10px] font-bold truncate max-w-[200px]" style={{ color: ACCENT_BRIGHT, fontFamily: "monospace" }}>
                    {chestAddress}
                  </span>
                  {copied ? (
                    <Check className="w-3 h-3 flex-shrink-0" style={{ color: "#22c55e" }} />
                  ) : (
                    <Copy className="w-3 h-3 flex-shrink-0 transition-colors" style={{ color: "rgba(200,150,40,0.5)" }} />
                  )}
                </button>
                {chestBalance !== null && (
                  <div className="mt-2 text-[11px] font-bold tracking-wider" style={{ color: chestBalance > CLAIM_AMOUNT ? ACCENT_BRIGHT : "#ef4444", fontFamily: "monospace" }}>
                    {chestBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} KAS AVAILABLE
                  </div>
                )}
              </div>
            )}

            {/* States */}
            {status === "success" ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4">
                <div className="text-[32px] font-black mb-2" style={{ color: ACCENT_BRIGHT, fontFamily: "monospace" }}>
                  +{CLAIM_AMOUNT} KAS
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
            ) : status === "flagged" ? (
              <div className="py-4">
                <p className="text-[12px] font-bold mb-2" style={{ color: "#ef4444", fontFamily: "monospace" }}>
                  WISH NOT APPROVED
                </p>
                <p className="text-[10px] leading-relaxed mb-4 px-2" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                  {aiMessage || "Your wish was flagged. Please revise and try again."}
                </p>
                <button onClick={() => { setStatus(null); setAiMessage(""); }}
                  className="w-full py-3 text-[11px] font-black tracking-[0.2em]!uppercase transition-all"
                  style={{ border: `2px solid ${ACCENT}`, color: ACCENT_BRIGHT, background: "rgba(200,150,40,0.08)", fontFamily: "monospace" }}>
                  REVISE WISH
                </button>
              </div>
            ) : status === "error" ? (
              <div className="py-4">
                <p className="text-[12px] font-bold mb-2" style={{ color: "#ef4444", fontFamily: "monospace" }}>
                  {aiMessage?.includes("empty") ? "CHEST EMPTY" : "ERROR"}
                </p>
                <p className="text-[10px] leading-relaxed mb-4 px-2" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                  {aiMessage || "Something went wrong."}
                </p>
                <button onClick={() => { setStatus(null); setLoading(false); setAiMessage(""); }}
                  className="w-full py-3 text-[11px] font-black tracking-[0.2em] uppercase transition-all"
                  style={{ border: `2px solid ${ACCENT}`, color: ACCENT_BRIGHT, background: "rgba(200,150,40,0.08)", fontFamily: "monospace" }}>
                  TRY AGAIN
                </button>
              </div>
            ) : !chestReady ? (
              <div className="py-4">
                <p className="text-[11px] mb-4" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>
                  The Ark has not been initialized yet.
                </p>
                <button
                  onClick={async () => {
                    try {
                      setInitializing(true);
                      const res = await base44.functions.invoke("initChestWallet", {});
                      if (res.data?.success) {
                        await loadChestInfo();
                      } else {
                        setAiMessage(res.data?.error || "Admin access required.");
                        setStatus("error");
                      }
                    } catch {
                      setAiMessage("Admin access required to initialize.");
                      setStatus("error");
                    } finally {
                      setInitializing(false);
                    }
                  }}
                  disabled={initializing}
                  className="w-full py-3 text-[11px] font-black tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all"
                  style={{
                    border: `2px solid ${ACCENT}`, color: ACCENT_BRIGHT,
                    background: "rgba(200,150,40,0.08)", fontFamily: "monospace",
                  }}
                >
                  {initializing ? <><Loader2 className="w-4 h-4 animate-spin" /> INITIALIZING...</> : "▶ INITIALIZE CHEST (ADMIN)"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {loading && aiMessage && (
                  <div className="text-[10px] tracking-wider animate-pulse py-1" style={{ color: ACCENT_BRIGHT, fontFamily: "monospace" }}>
                    ◆ {aiMessage}
                  </div>
                )}

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

                <textarea
                  value={wish}
                  onChange={(e) => setWish(e.target.value)}
                  placeholder="MAKE A WISH... (what would you do with KAS?)"
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-3 text-[11px] outline-none resize-none font-bold tracking-wider"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: `1px solid ${wish.trim() ? ACCENT : "rgba(200,150,40,0.2)"}`,
                    color: "rgba(255,255,255,0.85)", caretColor: ACCENT, fontFamily: "monospace",
                  }}
                />
                <div className="text-right text-[9px] tracking-wider" style={{ color: "rgba(200,150,40,0.3)", fontFamily: "monospace" }}>
                  {wish.length}/300
                </div>

                <button
                  onClick={claim}
                  disabled={!walletAddress.trim() || !wish.trim() || loading}
                  className="w-full py-3.5 text-[13px] font-black tracking-[0.4em] uppercase flex items-center justify-center gap-2 disabled:opacity-30 transition-all"
                  style={{
                    border: `2px solid ${ACCENT}`, color: "#000",
                    background: (walletAddress.trim() && wish.trim()) ? ACCENT_BRIGHT : "transparent",
                    fontFamily: "monospace",
                    boxShadow: (walletAddress.trim() && wish.trim()) ? "0 0 30px rgba(245,208,80,0.3)" : "none",
                  }}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...</> : `▶ CLAIM ${CLAIM_AMOUNT} KAS`}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}