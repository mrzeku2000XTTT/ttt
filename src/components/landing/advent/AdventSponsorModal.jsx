import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Megaphone, Copy, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const GOLD = "rgba(200,160,70,0.9)";

export default function AdventSponsorModal({ wallet, onClose }) {
  const [step, setStep] = useState("describe"); // describe | pay | done
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [digest, setDigest] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const runDigest = async () => {
    if (!message.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("adventSponsor", { action: "digest", sponsor_wallet: wallet, message: message.trim() });
      if (res.data?.status === "digested") { setDigest(res.data); setStep("pay"); }
      else setError(res.data?.reply || res.data?.error || "Could not create your task.");
    } catch (err) {
      setError(err?.response?.data?.error || "Something went wrong.");
    }
    setBusy(false);
  };

  const verify = async () => {
    if (!txHash.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("adventSponsor", { action: "verify", task_id: digest.task_id, tx_hash: txHash.trim() });
      if (res.data?.status === "active") setStep("done");
      else setError(res.data?.error || "Verification failed.");
    } catch (err) {
      setError(err?.response?.data?.error || "Verification failed.");
    }
    setBusy(false);
  };

  const copyAddr = async () => {
    try { await navigator.clipboard.writeText(digest.chest_address); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.88)" }}>
      <div className="relative w-full max-w-sm p-6 max-h-[85vh] overflow-y-auto"
        style={{ background: "#0d0a04", border: "2px solid rgba(200,150,40,0.5)" }}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1" style={{ color: GOLD }}><X className="w-4 h-4" /></button>

        <div className="text-center mb-4">
          <Megaphone className="w-8 h-8 mx-auto mb-2" style={{ color: "#f5d050" }} />
          <div className="text-[14px] font-black tracking-[0.25em] uppercase" style={{ color: "#f5d050", fontFamily: "monospace" }}>ADVENT AGENT</div>
          <div className="text-[8px] tracking-[0.3em] uppercase mt-1" style={{ color: "rgba(200,150,40,0.45)", fontFamily: "monospace" }}>
            DONATE 1 KAS · ADVERTISE YOUR PRODUCT
          </div>
        </div>

        {step === "describe" && (
          <>
            <div className="text-[9px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
              Tell the Advent Agent what you want to advertise. It will turn it into a mini-task hidden inside the calendar — whoever finds and completes it gets your 1 KAS.
            </div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={400}
              placeholder="WHAT DO YOU WANT TO ADVERTISE? (product, link, socials...)"
              className="w-full px-3 py-2.5 text-[10px] outline-none resize-none font-bold mb-3"
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(200,150,40,0.3)", color: "rgba(255,255,255,0.85)", caretColor: GOLD, fontFamily: "monospace" }} />
            <button onClick={runDigest} disabled={!message.trim() || !wallet || busy}
              className="w-full py-3 text-[11px] font-black tracking-[0.25em] uppercase flex items-center justify-center gap-2 disabled:opacity-40 touch-manipulation"
              style={{ background: "#f5d050", color: "#000", fontFamily: "monospace" }}>
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> AGENT THINKING...</> : "▶ CREATE MY AD TASK"}
            </button>
            {!wallet && <div className="text-[8px] mt-2 text-center" style={{ color: "#ef4444", fontFamily: "monospace" }}>SET YOUR WALLET ADDRESS FIRST</div>}
          </>
        )}

        {step === "pay" && digest && (
          <>
            <div className="p-3 mb-3 text-left" style={{ border: "1px solid rgba(200,150,40,0.25)", background: "rgba(0,0,0,0.4)" }}>
              <div className="text-[10px] font-bold mb-1" style={{ color: "#f5d050", fontFamily: "monospace" }}>{digest.task_title}</div>
              <div className="text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>{digest.task_description}</div>
            </div>
            <div className="text-[9px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{digest.reply}</div>
            <div className="text-[8px] tracking-[0.25em] uppercase mb-1" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>SEND 1 KAS TO:</div>
            <button onClick={copyAddr} className="w-full flex items-center gap-2 px-3 py-2 mb-3" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(200,150,40,0.3)" }}>
              <span className="flex-1 truncate text-[9px] font-bold text-left" style={{ color: "#f5d050", fontFamily: "monospace" }}>{digest.chest_address}</span>
              {copied ? <Check className="w-3 h-3 flex-shrink-0" style={{ color: "#22c55e" }} /> : <Copy className="w-3 h-3 flex-shrink-0" style={{ color: GOLD }} />}
            </button>
            <input value={txHash} onChange={(e) => setTxHash(e.target.value)}
              placeholder="PASTE YOUR TRANSACTION HASH..."
              className="w-full px-3 py-2.5 text-[10px] outline-none font-bold mb-3"
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(200,150,40,0.3)", color: "rgba(255,255,255,0.85)", caretColor: GOLD, fontFamily: "monospace" }} />
            <button onClick={verify} disabled={!txHash.trim() || busy}
              className="w-full py-3 text-[11px] font-black tracking-[0.25em] uppercase flex items-center justify-center gap-2 disabled:opacity-40 touch-manipulation"
              style={{ background: "#f5d050", color: "#000", fontFamily: "monospace" }}>
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> VERIFYING ON-CHAIN...</> : "▶ VERIFY DONATION"}
            </button>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <Check className="w-10 h-10 mx-auto mb-2" style={{ color: "#22c55e" }} />
            <div className="text-[12px] font-black tracking-[0.2em] uppercase mb-2" style={{ color: "#f5d050", fontFamily: "monospace" }}>TASK IS LIVE!</div>
            <div className="text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>
              Your ad-task is now hidden inside the advent calendar. A community member with enough keys will find the chest, complete your task, and receive your 1 KAS automatically.
            </div>
            <button onClick={onClose} className="w-full mt-4 py-2.5 text-[10px] font-bold tracking-[0.3em] uppercase touch-manipulation"
              style={{ border: "1px solid rgba(200,150,40,0.4)", color: GOLD, fontFamily: "monospace" }}>CLOSE</button>
          </div>
        )}

        {error && <div className="text-[9px] mt-3 text-center leading-relaxed" style={{ color: "#ef4444", fontFamily: "monospace" }}>{error}</div>}
      </div>
    </motion.div>
  );
}