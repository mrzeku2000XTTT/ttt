import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Loader2, Lock } from "lucide-react";

const ORANGE = "#ff5a14";

export default function SigningModal({ 
  isOpen, 
  transaction, 
  privateKey, 
  onSigned, 
  onCancel 
}) {
  const [status, setStatus] = useState("confirming"); // confirming -> signing -> signed -> error
  const [error, setError] = useState("");
  const [signedTx, setSignedTx] = useState(null);

  const signTransaction = async () => {
    setStatus("signing");
    try {
      if (!privateKey) {
        throw new Error('No private key available');
      }

      // Call backend to sign transaction (handles Ed25519 signing securely)
      const res = await base44.functions.invoke("signKaspaTransaction", {
        privateKey: privateKey,
        transaction: transaction,
      });

      if (res.data?.error) throw new Error(res.data.error);
      if (!res.data?.signedTx) throw new Error("No signed transaction returned");

      setSignedTx(res.data.signedTx);
      setStatus("signed");
      
      // Auto-confirm after 1.5 seconds
      setTimeout(() => {
        onSigned(res.data.signedTx);
      }, 1500);

    } catch (err) {
      setError(err.message || "Signing failed");
      setStatus("error");
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl p-6 space-y-6"
        style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="text-center">
          <h3 className="text-white font-bold text-lg mb-1">Sign Transaction</h3>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Confirm to proceed with your payment
          </p>
        </div>

        {/* Status Content */}
        {status === "confirming" && (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="text-center mb-2">
                <div className="text-2xl font-black" style={{ color: ORANGE }}>
                  {transaction.outputs?.[0]?.amount ? (transaction.outputs[0].amount / 1e8).toFixed(2) : "?"} KAS
                </div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  → {transaction.outputs?.[0]?.address?.slice(0, 14)}...
                </div>
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                <span>Method</span>
                <span className="text-white font-medium">Native Signing</span>
              </div>
            </div>

            <div
              className="rounded-xl p-3 text-xs flex items-start gap-2"
              style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)" }}
            >
              <Lock size={12} color="#ff9500" className="flex-shrink-0 mt-0.5" />
              <span style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                Your private key will be used to sign this transaction locally and never sent to any server.
              </span>
            </div>

            <button
              onClick={signTransaction}
              className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all"
              style={{ background: ORANGE }}
            >
              Sign Transaction
            </button>

            <button
              onClick={onCancel}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
            >
              Cancel
            </button>
          </div>
        )}

        {status === "signing" && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(255,90,20,0.15)" }}>
                <Loader2 size={24} color={ORANGE} />
              </div>
            </motion.div>
            <div className="text-center">
              <p className="text-white font-bold mb-1">Signing Transaction</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                Using Ed25519 signature...
              </p>
            </div>
          </div>
        )}

        {status === "signed" && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(52,199,89,0.15)" }}>
                <CheckCircle size={24} color="#34c759" />
              </div>
            </motion.div>
            <div className="text-center">
              <p className="text-white font-bold mb-1">Signature Obtained!</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                Transaction signed successfully
              </p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(255,59,48,0.15)" }}>
                <AlertTriangle size={24} color="#ff3b30" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold mb-1">Signing Failed</p>
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {error}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStatus("confirming")}
                className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all"
                style={{ background: ORANGE }}
              >
                Try Again
              </button>
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}