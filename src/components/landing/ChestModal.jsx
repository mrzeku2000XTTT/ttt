import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Gift, Lock, Coins, Sparkles, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CLAIM_AMOUNT = 2; // KAS per claim
const COOLDOWN_HOURS = 24;
const CHEST_WALLET_KEY = "chest_wallet_address";
const CHEST_CLAIM_KEY = "chest_last_claim";

export default function ChestModal({ onClose, sounds }) {
  const [walletAddress, setWalletAddress] = useState("");
  const [wish, setWish] = useState("");
  const [chestBalance, setChestBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // null | 'moderating' | 'claiming' | 'success' | 'error' | 'cooldown' | 'flagged'
  const [txHash, setTxHash] = useState(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [aiMessage, setAiMessage] = useState("");

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

  const moderateWish = async (wishText) => {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a content moderator for a crypto community chest. A user is making a wish to receive free KAS.

Check the wish for:
1. SENSITIVE INFO: Private keys, seed phrases, mnemonics, passwords, API keys, email addresses, phone numbers, physical addresses — these MUST be stripped from the stored wish.
2. SPAM: Pure promotional content, repeated characters, links to scams.
3. ABUSE: Hate speech, threats, illegal requests.

If the wish contains sensitive info, REMOVE it and return the cleaned version in sanitized_wish.
If the wish is pure spam or abuse, set approved=false.

Return JSON:
{
  "approved": boolean,
  "sanitized_wish": "cleaned version with sensitive info removed",
  "flags": ["list of any issues found"],
  "reason": "brief explanation"
}

The user's wish:
"${wishText}"`,
      response_json_schema: {
        type: "object",
        properties: {
          approved: { type: "boolean" },
          sanitized_wish: { type: "string" },
          flags: { type: "array", items: { type: "string" } },
          reason: { type: "string" },
        },
        required: ["approved", "sanitized_wish"],
      },
    });
    return res;
  };

  const claim = async () => {
    if (!walletAddress.trim() || !wish.trim() || loading) return;
    setLoading(true);
    sounds?.playSelect?.();

    try {
      localStorage.setItem(CHEST_WALLET_KEY, walletAddress.trim());

      // Step 1: AI moderation
      setStatus("moderating");
      setAiMessage("AI is reviewing your wish...");
      const moderation = await moderateWish(wish.trim());

      const approved = moderation?.approved !== false;
      const sanitized = moderation?.sanitized_wish || wish.trim();
      const flags = moderation?.flags || [];
      const reason = moderation?.reason || "";

      if (!approved) {
        setAiMessage(reason || "Wish flagged by AI moderation.");
        setStatus("flagged");

        // Store the flagged wish (admin only can see)
        await base44.entities.ChestWish.create({
          kaspa_address: walletAddress.trim(),
          wish: wish.trim(),
          sanitized_wish: sanitized,
          ai_approved: false,
          ai_flags: flags,
          status: "flagged",
        });
        setLoading(false);
        return;
      }

      // Step 2: Store the approved wish
      await base44.entities.ChestWish.create({
        kaspa_address: walletAddress.trim(),
        wish: wish.trim(),
        sanitized_wish: sanitized,
        ai_approved: true,
        ai_flags: flags,
        amount_kas: CLAIM_AMOUNT,
        status: "approved",
      });

      // Step 3: Send KAS
      setStatus("claiming");
      setAiMessage("Sending KAS to your wallet...");
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        recipientAddress: walletAddress.trim(),
        amount: CLAIM_AMOUNT,
        note: "TTT Community Chest Wish",
      });

      if (res.data?.txHash || res.data?.success) {
        const hash = res.data?.txHash || res.data?.transaction_id;
        setTxHash(hash);
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
              animate={loading ? { rotate: [-2, 2, -2] } : { y: [0, -4, 0] }}
              transition={{ duration: loading ? 0.2 : 2.5, repeat: Infinity }}
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
              ) : status === "flagged" ? (
                <ShieldCheck className="w-10 h-10" style={{ color: "#ef4444" }} />
              ) : status === "moderating" ? (
                <Sparkles className="w-10 h-10 animate-pulse" style={{ color: ACCENT_BRIGHT }} />
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
              MAKE A WISH · RECEIVE FREE KAS
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
                  className="w-full py-3 text-[11px] font-black tracking-[0.2em] uppercase transition-all"
                  style={{ border: `2px solid ${ACCENT}`, color: ACCENT_BRIGHT, background: "rgba(200,150,40,0.08)", fontFamily: "monospace" }}>
                  REVISE WISH
                </button>
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
                {/* AI status message */}
                {loading && aiMessage && (
                  <div className="text-[10px] tracking-wider animate-pulse py-1" style={{ color: ACCENT_BRIGHT, fontFamily: "monospace" }}>
                    ◆ {aiMessage}
                  </div>
                )}

                {/* Wallet input */}
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

                {/* Wish textarea */}
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

                <p className="text-[9px] tracking-wider flex items-center justify-center gap-1" style={{ color: "rgba(200,150,40,0.25)", fontFamily: "monospace" }}>
                  <ShieldCheck className="w-2.5 h-2.5" /> AI-PROTECTED · ONE WISH PER {COOLDOWN_HOURS}H
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}