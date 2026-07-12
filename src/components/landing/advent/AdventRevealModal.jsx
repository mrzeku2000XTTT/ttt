import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Gift, Upload, Loader2, Check, X as XIcon, Hourglass } from "lucide-react";
import { base44 } from "@/api/base44Client";

const GOLD = "rgba(200,160,70,0.9)";

export default function AdventRevealModal({ wallet, doorNum, door, onClose, onProgress }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const isChest = door.type === "chest";
  const isTask = door.type === "task";
  const needsProof = (isChest || isTask) && !door.completed && !result;

  const submitProof = async (file) => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke("adventSubmitProof", {
        wallet_address: wallet, door_number: doorNum, proof_url: file_url,
      });
      setResult(res.data);
      if (res.data?.status === "paid" || res.data?.status === "keys_awarded") onProgress?.(res.data, doorNum);
    } catch (err) {
      setResult({ status: "error", reason: err?.response?.data?.reason || err?.response?.data?.error || "Submission failed. Try again." });
    }
    setBusy(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.88)" }} onClick={busy ? undefined : onClose}>
      <motion.div initial={{ scale: 0.7, rotateY: 90 }} animate={{ scale: 1, rotateY: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="w-full max-w-sm p-6 text-center max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0d0a04",
          border: isChest ? "2px solid #f5d050" : "2px solid rgba(200,150,40,0.4)",
          boxShadow: isChest ? "0 0 60px rgba(240,200,60,0.4)" : "0 0 40px rgba(0,0,0,0.8)",
        }}>
        <div className="text-[10px] tracking-[0.4em] uppercase mb-3" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>
          DOOR {doorNum}
        </div>

        {/* FACT */}
        {door.type === "fact" && (
          <>
            <div className="text-[12px] whitespace-pre-line leading-relaxed mb-3" style={{ color: GOLD, fontFamily: "monospace" }}>{door.content}</div>
            <div className="text-[10px] font-black mb-4" style={{ color: "#f5d050", fontFamily: "monospace" }}>+1 ADVENT KEY</div>
          </>
        )}

        {/* CHEST or TASK */}
        {(isChest || isTask) && (
          <>
            {isChest && (
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                <Gift className="w-12 h-12 mx-auto mb-2" style={{ color: "#f5d050" }} />
              </motion.div>
            )}
            <div className="text-[14px] font-black tracking-[0.15em] uppercase mb-2" style={{ color: "#f5d050", fontFamily: "monospace" }}>
              {isChest ? "SPONSOR CHEST FOUND!" : "TASK DOOR"}
            </div>
            {isChest && door.task_title && (
              <div className="text-[11px] font-bold mb-1" style={{ color: GOLD, fontFamily: "monospace" }}>{door.task_title}</div>
            )}
            <div className="text-[10px] leading-relaxed mb-3 whitespace-pre-line" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "monospace" }}>
              {door.task_description || door.content}
            </div>
            <div className="text-[10px] font-black mb-4" style={{ color: "#f5d050", fontFamily: "monospace" }}>
              {isChest ? `REWARD: ${Math.max(0.2, Math.round(((door.reward_kas || 1) - 0.1) * 100) / 100)} KAS + 5 KEYS` : `REWARD: +${door.keys_reward || 3} KEYS`}
            </div>

            {door.completed && !result && (
              <div className="text-[10px] font-bold mb-3" style={{ color: "#22c55e", fontFamily: "monospace" }}>✓ COMPLETED</div>
            )}

            {needsProof && (
              <>
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => submitProof(e.target.files?.[0])} />
                <button onClick={() => fileRef.current?.click()} disabled={busy}
                  className="w-full py-3 mb-2 text-[11px] font-black tracking-[0.25em] uppercase flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
                  style={{ background: "#f5d050", color: "#000", fontFamily: "monospace" }}>
                  {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> AI VERIFYING...</> : <><Upload className="w-4 h-4" /> UPLOAD PROOF</>}
                </button>
                <div className="text-[8px] tracking-wider" style={{ color: "rgba(200,150,40,0.35)", fontFamily: "monospace" }}>
                  SCREENSHOT / PHOTO · AI-VERIFIED{isChest ? " · KAS SENT INSTANTLY ON APPROVAL" : ""}
                </div>
              </>
            )}

            {/* RESULT */}
            {result && (
              <div className="mt-2 p-3 text-left" style={{ border: "1px solid rgba(200,150,40,0.25)", background: "rgba(0,0,0,0.4)" }}>
                {result.status === "paid" && (
                  <div className="text-center">
                    <Check className="w-6 h-6 mx-auto mb-1" style={{ color: "#22c55e" }} />
                    <div className="text-[16px] font-black" style={{ color: "#f5d050", fontFamily: "monospace" }}>+{result.amount_kas} KAS SENT!</div>
                    <div className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>+{result.keys_awarded} keys · check your wallet</div>
                    {result.tx_hash && (
                      <a href={`https://explorer.kaspa.org/txs/${result.tx_hash}`} target="_blank" rel="noopener noreferrer"
                        className="text-[8px] underline block mt-1" style={{ color: "rgba(200,150,40,0.5)", fontFamily: "monospace" }}>View Transaction ↗</a>
                    )}
                    {result.claim_link && (
                      <a href={result.claim_link} target="_blank" rel="noopener noreferrer"
                        className="block mt-2 py-2 text-[10px] font-black tracking-[0.2em] uppercase"
                        style={{ background: "rgba(240,200,60,0.15)", border: "1px solid #f5d050", color: "#f5d050", fontFamily: "monospace" }}>
                        🎁 BONUS: CLAIM YOUR KASPA LINK ↗
                      </a>
                    )}
                  </div>
                )}
                {result.status === "keys_awarded" && (
                  <div className="text-center">
                    <Check className="w-6 h-6 mx-auto mb-1" style={{ color: "#22c55e" }} />
                    <div className="text-[14px] font-black" style={{ color: "#f5d050", fontFamily: "monospace" }}>+{result.keys_awarded} KEYS EARNED</div>
                  </div>
                )}
                {result.status === "pending_review" && (
                  <div className="flex items-start gap-2">
                    <Hourglass className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#f5d050" }} />
                    <div className="text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>{result.reason}</div>
                  </div>
                )}
                {(result.status === "rejected" || result.status === "error" || result.status === "payout_failed") && (
                  <div className="flex items-start gap-2">
                    <XIcon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                    <div className="text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>{result.reason}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <button onClick={onClose} disabled={busy}
          className="w-full mt-4 py-2.5 text-[10px] font-bold tracking-[0.3em] uppercase disabled:opacity-40 touch-manipulation"
          style={{ border: "1px solid rgba(200,150,40,0.4)", color: GOLD, background: "transparent", fontFamily: "monospace" }}>
          CLOSE
        </button>
      </motion.div>
    </motion.div>
  );
}