import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Plus, Key, Check, AlertTriangle, RefreshCw, Copy, Shield, X, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const GLASS = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};

const ORANGE = "#ff5a14";

export default function WalletConnectPanel({ connectedAddress, onConnect }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | 'manual' | 'create'
  const [address, setAddress] = useState("");
  const [newWallet, setNewWallet] = useState(null);
  const [step, setStep] = useState("options"); // options | loading | reveal | error
  const [copied, setCopied] = useState(false);
  const [wordCount, setWordCount] = useState(12);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const connectKasware = async () => {
    setError("");
    try {
      if (window.kasware) {
        const accounts = await window.kasware.requestAccounts();
        if (accounts[0]) onConnect(accounts[0]);
      } else {
        setError("Kasware not detected. Use manual entry or create a wallet.");
      }
    } catch (err) {
      setError("Could not connect Kasware.");
    }
  };

  const createWallet = async () => {
    setStep("loading");
    setError("");
    try {
      const res = await base44.functions.invoke("createKaspaWallet", { wordCount });
      if (res.data?.error) throw new Error(res.data.error);
      setNewWallet(res.data);
      setStep("reveal");
    } catch (err) {
      setStep("error");
      setError("Failed to generate wallet. Try again.");
    }
  };

  const finishCreate = () => {
    const addr = `kaspa:${newWallet.address}`;
    onConnect(addr.startsWith("kaspa:") ? addr : `kaspa:${addr}`);
    setMode(null);
    setStep("options");
    setNewWallet(null);
    setConfirmed(false);
  };

  const connectManual = () => {
    if (!address.trim()) { setError("Enter a Kaspa address."); return; }
    if (!address.startsWith("kaspa:")) { setError("Address must start with kaspa:"); return; }
    onConnect(address.trim());
    setMode(null);
    setAddress("");
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(newWallet.mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (connectedAddress) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4 flex items-center gap-3 mx-4 mb-4"
        style={{ ...GLASS, border: "1px solid rgba(255,90,20,0.3)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,90,20,0.15)" }}>
          <Check size={18} color={ORANGE} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Connected Wallet</div>
          <div className="text-white text-xs font-mono truncate">{connectedAddress}</div>
        </div>
        <button
          onClick={() => onConnect(null)}
          className="text-xs px-2 py-1 rounded-lg transition-colors"
          style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)" }}
        >
          Change
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="mx-4 mb-4 space-y-3">
        <p className="text-xs text-center mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          Connect your Kaspa wallet to create IVR payment presets
        </p>

        {/* Kasware (Desktop) */}
        <button
          onClick={connectKasware}
          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
          style={{ ...GLASS, border: "1px solid rgba(255,90,20,0.3)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,90,20,0.15)" }}>
            <Wallet size={16} color={ORANGE} />
          </div>
          <div className="flex-1 text-left">
            <div className="text-white text-sm font-semibold">Connect Kasware</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Desktop browser extension</div>
          </div>
          <ExternalLink size={14} color="rgba(255,255,255,0.2)" />
        </button>

        {/* Create new wallet via Terra protocol */}
        <button
          onClick={() => { setMode("create"); setStep("options"); setNewWallet(null); setError(""); }}
          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
          style={GLASS}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <Plus size={16} color="white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-white text-sm font-semibold">Create New Wallet</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Via Terra Protocol · Non-custodial</div>
          </div>
          <Shield size={14} color="rgba(255,255,255,0.2)" />
        </button>

        {/* Manual address */}
        <button
          onClick={() => { setMode("manual"); setError(""); }}
          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
          style={GLASS}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <Key size={16} color="white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-white text-sm font-semibold">Enter Address</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Paste your kaspa: address</div>
          </div>
        </button>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.25)", color: "#ff3b30" }}>
            <AlertTriangle size={12} />
            {error}
          </div>
        )}
      </div>

      {/* Manual modal */}
      <AnimatePresence>
        {mode === "manual" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            onClick={() => setMode(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl p-6 space-y-4"
              style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Enter Kaspa Address</h3>
                <button onClick={() => setMode(null)}><X size={18} color="rgba(255,255,255,0.4)" /></button>
              </div>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="kaspa:qr..."
                rows={3}
                className="w-full rounded-xl p-3 text-white text-sm font-mono resize-none outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              {error && <p className="text-xs" style={{ color: "#ff3b30" }}>{error}</p>}
              <button
                onClick={connectManual}
                className="w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity"
                style={{ background: ORANGE }}
              >
                Connect
              </button>
            </motion.div>
          </motion.div>
        )}

        {mode === "create" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl p-6 space-y-4 overflow-y-auto"
              style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-lg">Create Kaspa Wallet</h3>
                <button onClick={() => setMode(null)}><X size={18} color="rgba(255,255,255,0.4)" /></button>
              </div>

              {step === "options" && (
                <>
                  <div className="flex items-start gap-3 rounded-xl p-3"
                    style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)" }}>
                    <AlertTriangle size={14} color="#ff9500" className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                      Save your recovery phrase. Terra never stores it — only you hold your keys.
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Recovery phrase length</p>
                    <div className="flex gap-2">
                      {[12, 24].map(n => (
                        <button key={n} onClick={() => setWordCount(n)}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{
                            border: `1px solid ${wordCount === n ? ORANGE : "rgba(255,255,255,0.1)"}`,
                            background: wordCount === n ? "rgba(255,90,20,0.15)" : "transparent",
                            color: wordCount === n ? ORANGE : "rgba(255,255,255,0.4)"
                          }}>
                          {n} words
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={createWallet}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                    style={{ background: ORANGE }}
                  >
                    Generate Wallet
                  </button>
                </>
              )}

              {step === "loading" && (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <RefreshCw size={36} color={ORANGE} />
                  </motion.div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Generating secure wallet...</p>
                </div>
              )}

              {step === "error" && (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <AlertTriangle size={36} color="#ff9500" />
                  <p className="text-white font-bold">Generation failed</p>
                  <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.4)" }}>Could not create wallet. Please try again.</p>
                  <button onClick={() => { setStep("options"); setError(""); }}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm"
                    style={{ background: ORANGE }}>
                    Try Again
                  </button>
                </div>
              )}

              {step === "reveal" && newWallet && (
                <>
                  <p className="text-sm font-semibold text-white text-center">Your Recovery Phrase</p>
                  <div className="grid grid-cols-3 gap-2">
                    {newWallet.mnemonic.split(" ").map((word, i) => (
                      <div key={i} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)", minWidth: 14 }}>{i + 1}</span>
                        <span className="text-white text-xs font-medium">{word}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={copyMnemonic}
                    className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: copied ? "#34c759" : "rgba(255,255,255,0.7)" }}>
                    <Copy size={14} />{copied ? "Copied!" : "Copy phrase"}
                  </button>
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Your Kaspa Address</p>
                    <p className="text-xs font-mono text-white break-all">kaspa:{newWallet.address}</p>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                      className="mt-0.5 w-4 h-4" style={{ accentColor: ORANGE }} />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                      I've written down my recovery phrase and stored it safely.
                    </span>
                  </label>
                  <button onClick={finishCreate} disabled={!confirmed}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all"
                    style={{ background: confirmed ? ORANGE : "rgba(255,255,255,0.08)", cursor: confirmed ? "pointer" : "default" }}>
                    Connect Wallet
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}