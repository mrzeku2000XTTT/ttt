import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertTriangle, RefreshCw, Zap, ScanLine } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";
const ACCENT = "#1a73e8";

const getTokenLogo = (tick) =>
  `https://kasplex-indexer.s3.us-east-1.amazonaws.com/icon/${tick?.toUpperCase()}`;

const KNOWN_LOGOS = {
  PACMAN: 'https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8b3362e0b_image.png',
};

const getEffectiveLogo = (tick) => KNOWN_LOGOS[tick?.toUpperCase()] || getTokenLogo(tick);

export default function KRC20SendSheet({ onClose, activeWallet, token, onBalanceUpdate }) {
  const [step, setStep] = useState("input"); // input | confirm | sending | done | error
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [txResult, setTxResult] = useState(null);

  const tick = token?.tick || "TOKEN";
  const dec = parseInt(token?.dec) || 8;
  const rawBal = parseInt(token?.balance) || 0;
  const humanBal = rawBal / Math.pow(10, dec);
  const hasMnemonic = activeWallet?.mnemonic;

  const handleKey = (k) => {
    if (k === "⌫") setAmount((a) => a.slice(0, -1));
    else if (k === "." && amount.includes(".")) return;
    else if (amount.length < 12) setAmount((a) => a + k);
  };

  const handleMax = () => setAmount(humanBal.toString());

  const canContinue =
    recipient.startsWith("kaspa:") && parseFloat(amount) > 0 && parseFloat(amount) <= humanBal;

  const handleSend = async () => {
    setStep("sending");
    setErrorMsg("");
    try {
      if (!hasMnemonic) throw new Error("No seed phrase stored. Import wallet with seed phrase to send KRC-20 tokens.");

      const res = await base44.functions.invoke("krc20Transfer", {
        action: "transfer",
        mnemonic: activeWallet.mnemonic,
        fromAddress: activeWallet.address,
        toAddress: recipient.trim(),
        amount: amount,
        ticker: tick,
        decimals: dec,
      });

      if (res.data?.error) throw new Error(res.data.error);

      setTxResult(res.data);
      setStep("done");
      if (onBalanceUpdate) setTimeout(() => onBalanceUpdate(), 3000);
    } catch (err) {
      setErrorMsg(err.message || "KRC-20 transfer failed");
      setStep("error");
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{
        position: "fixed", inset: 0, background: "#0a0a0a", zIndex: 200,
        display: "flex", flexDirection: "column", fontFamily: SF,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
          <X size={20} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src={getEffectiveLogo(tick)}
            alt={tick}
            style={{ width: 22, height: 22, borderRadius: 11 }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <span style={{ color: "white", fontWeight: 600, fontSize: 16 }}>Send {tick}</span>
        </div>
        <div style={{ width: 20 }} />
      </div>

      <AnimatePresence mode="wait">
        {/* ── INPUT STEP ── */}
        {step === "input" && (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px" }}>

            {/* Token info banner */}
            <div style={{ background: "#1c1c1e", borderRadius: 14, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
              <img src={getEffectiveLogo(tick)} alt={tick} style={{ width: 32, height: 32, borderRadius: 16 }} onError={(e) => { e.target.style.display = "none"; }} />
              <div>
                <div style={{ color: "white", fontSize: 14, fontWeight: 600 }}>{tick}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Balance: {humanBal.toLocaleString("en-US", { maximumFractionDigits: 4 })}</div>
              </div>
            </div>

            {/* Recipient */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, background: "#1c1c1e", border: `1px solid ${recipient.startsWith("kaspa:") ? "rgba(52,199,89,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "13px 14px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "monospace", flexShrink: 0 }}>kaspa:</span>
                <input
                  placeholder="q... recipient address"
                  value={recipient.startsWith("kaspa:") ? recipient.slice(6) : recipient}
                  onChange={(e) => setRecipient(e.target.value ? "kaspa:" + e.target.value : "")}
                  style={{ flex: 1, background: "transparent", border: "none", color: "white", fontSize: 13, outline: "none", fontFamily: "monospace", padding: 0 }}
                />
              </div>
            </div>

            {/* Amount */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Amount ({tick})</span>
                <button onClick={handleMax} style={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: SF }}>Max</button>
              </div>
              <span style={{ color: "white", fontSize: 48, fontWeight: 700, letterSpacing: -2 }}>{amount || "0"}</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>{tick}</span>
            </div>

            {/* Numpad */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, marginBottom: 14 }}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((k) => (
                <button key={k} onClick={() => handleKey(k)}
                  style={{ background: k === "⌫" ? "#2c2c2e" : "#1c1c1e", border: "none", color: "white", fontSize: 22, fontWeight: 500, padding: "17px 0", cursor: "pointer", borderRadius: 10, fontFamily: SF }}>
                  {k}
                </button>
              ))}
            </div>

            {!hasMnemonic && (
              <div style={{ background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <AlertTriangle size={15} color="#ff9500" />
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>No seed phrase stored. Import wallet to send tokens.</span>
              </div>
            )}

            {/* Note about KRC-20 protocol */}
            <div style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
              <Zap size={15} color="#a855f7" />
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
                KRC-20 transfers use the Kasplex commit-reveal protocol. Commit phase locks 0.3 KAS.
              </span>
            </div>

            <button onClick={() => canContinue && setStep("confirm")}
              style={{ background: canContinue ? ACCENT : "#2c2c2e", color: "white", border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 600, cursor: canContinue ? "pointer" : "default", fontFamily: SF }}>
              Continue
            </button>
          </motion.div>
        )}

        {/* ── CONFIRM STEP ── */}
        {step === "confirm" && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px 24px", gap: 20, alignItems: "center" }}>
            <img src={getEffectiveLogo(tick)} alt={tick} style={{ width: 56, height: 56, borderRadius: 28 }} onError={(e) => { e.target.style.display = "none"; }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 4 }}>You're sending</div>
              <div style={{ color: "white", fontSize: 36, fontWeight: 700 }}>{amount} {tick}</div>
            </div>
            <div style={{ background: "#1c1c1e", borderRadius: 14, padding: "16px", width: "100%", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 6 }}>To</div>
              <div style={{ color: "white", fontSize: 12, fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.6 }}>{recipient}</div>
            </div>
            <div style={{ background: "#1c1c1e", borderRadius: 14, padding: "14px 16px", width: "100%", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Commit deposit</span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>0.3 KAS</span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>Required by Kasplex protocol (returned after reveal)</div>
            </div>
            <div style={{ marginTop: "auto", width: "100%", display: "flex", gap: 12 }}>
              <button onClick={() => setStep("input")}
                style={{ flex: 1, background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", borderRadius: 14, padding: "16px", fontSize: 16, cursor: "pointer", fontFamily: SF }}>
                Back
              </button>
              <button onClick={handleSend}
                style={{ flex: 2, background: "#a855f7", border: "none", color: "white", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: SF }}>
                Confirm & Send
              </button>
            </div>
          </motion.div>
        )}

        {/* ── SENDING ── */}
        {step === "sending" && (
          <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <RefreshCw size={40} color="#a855f7" />
            </motion.div>
            <div style={{ color: "white", fontSize: 17, fontWeight: 600 }}>Sending {tick}...</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Executing Kasplex commit-reveal protocol</div>
          </motion.div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "24px" }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
              style={{ width: 80, height: 80, borderRadius: 40, background: txResult?.phase === 'complete' ? '#1a4a1a' : '#3a3a1a', display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={36} color={txResult?.phase === 'complete' ? '#34c759' : '#f59e0b'} strokeWidth={3} />
            </motion.div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "white", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                {txResult?.phase === 'complete' ? 'Transfer Complete!' : 'Commit Sent'}
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
                {txResult?.phase === 'complete'
                  ? `${amount} ${tick} sent successfully`
                  : `${amount} ${tick} — commit sent, reveal pending`}
              </div>
            </div>
            {txResult?.commitTxId && (
              <div style={{ background: "#1c1c1e", borderRadius: 12, padding: "12px 14px", width: "100%", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginBottom: 4 }}>Commit TX</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>{txResult.commitTxId}</div>
              </div>
            )}
            {txResult?.revealTxId && (
              <div style={{ background: "#1c1c1e", borderRadius: 12, padding: "12px 14px", width: "100%", border: "1px solid rgba(52,199,89,0.2)" }}>
                <div style={{ color: "rgba(52,199,89,0.6)", fontSize: 10, marginBottom: 4 }}>Reveal TX ✓</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>{txResult.revealTxId}</div>
              </div>
            )}
            {txResult?.error && (
              <div style={{ background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.2)", borderRadius: 12, padding: "10px 14px", width: "100%" }}>
                <div style={{ color: "#ff9500", fontSize: 11, lineHeight: 1.5 }}>{txResult.error}</div>
              </div>
            )}
            <button onClick={onClose}
              style={{ background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", borderRadius: 14, padding: "14px 32px", fontSize: 16, cursor: "pointer", fontFamily: SF, marginTop: 12 }}>
              Done
            </button>
          </motion.div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "24px" }}>
            <AlertTriangle size={48} color="#ff9500" />
            <div style={{ color: "white", fontSize: 18, fontWeight: 700 }}>Transfer Failed</div>
            <div style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.2)", borderRadius: 12, padding: "14px", width: "100%", color: "#ff6b6b", fontSize: 13, lineHeight: 1.5, textAlign: "center" }}>
              {errorMsg}
            </div>
            <button onClick={() => setStep("input")}
              style={{ background: "#a855f7", color: "white", border: "none", borderRadius: 14, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: SF }}>
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}