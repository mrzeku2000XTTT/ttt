import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { base44 } from "@/api/base44Client";

function generateSessionToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

// Derive IMP-XXXX from the first 8 chars of kaspa address (after "kaspa:")
function deriveImposterID(address) {
  const raw = address.replace(/^kaspa:/i, "").slice(0, 8).toUpperCase();
  return `IMP-${raw}`;
}

async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin + "imposter_salt_kai"));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="ml-1.5 flex-shrink-0 text-white/30 hover:text-white/70 transition-colors">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function ImposterGate({ onIdentityReady }) {
  const [step, setStep] = useState("idle"); // idle | import | generating | name | pin | done | error
  const [walletData, setWalletData] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [subagentName, setSubagentName] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [importMnemonic, setImportMnemonic] = useState("");

  const generateWallet = async () => {
    setStep("generating");
    setErrorMsg("");
    try {
      const res = await base44.functions.invoke('createKaspaWallet', {});
      const data = res.data;
      if (!data?.address) throw new Error("Wallet generation failed");
      setWalletData(data);
      setStep("name");
    } catch (err) {
      setErrorMsg(err.message || "Something broke. Try again.");
      setStep("error");
    }
  };

  const importWallet = async () => {
    const words = importMnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setErrorMsg("Seed phrase must be 12 or 24 words");
      return;
    }
    setStep("generating");
    setErrorMsg("");
    try {
      const res = await base44.functions.invoke('createKaspaWallet', { mnemonic: importMnemonic.trim() });
      const data = res.data;
      if (!data?.address) throw new Error("Import failed — invalid seed phrase");
      setWalletData(data);
      setStep("name");
    } catch (err) {
      setErrorMsg(err.message || "Import failed. Check your seed phrase.");
      setStep("import");
    }
  };

  const proceedToPin = () => {
    const name = subagentName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!name) return;
    setSubagentName(name);
    setStep("pin");
  };

  const finalizeIdentity = async () => {
    if (pin.length < 4) { setErrorMsg("PIN must be at least 4 digits"); return; }
    if (pin !== pinConfirm) { setErrorMsg("PINs don't match"); return; }
    setSaving(true);
    setErrorMsg("");
    try {
      const pinHash = await hashPin(pin);
      const imposter_id = deriveImposterID(walletData.address);
      const session_token = generateSessionToken();

      await base44.entities.ImposterIdentity.create({
        imposter_id,
        kaspa_address: walletData.address,
        subagent_name: subagentName,
        session_token,
        message_count: 0,
        last_seen: new Date().toISOString(),
      });

      const identityObj = {
        imposter_id,
        kaspa_address: walletData.address,
        subagent_name: subagentName,
        session_token,
        mnemonic: walletData.mnemonic,
        pin_hash: pinHash,
      };
      localStorage.setItem("imposter_identity", JSON.stringify(identityObj));
      setIdentity(identityObj);
      setStep("done");
    } catch (err) {
      setErrorMsg(err.message || "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const proceed = () => { if (identity) onIdentityReady(identity); };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 text-center overflow-y-auto">
      <AnimatePresence mode="wait">

        {/* IDLE */}
        {step === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 w-full">
            <div>
              <div className="text-2xl mb-1">👾</div>
              <div className="text-white font-bold text-sm tracking-widest uppercase">Imposter Mode</div>
              <div className="text-white/35 text-[11px] mt-1 leading-relaxed">
                No account. No trace.<br />You need a wallet identity to enter.
              </div>
            </div>
            <div className="px-3 py-2.5 rounded-xl text-left space-y-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">What gets created</div>
              <div className="text-[11px] text-white/55 space-y-0.5">
                <div>· Kaspa wallet (your address = your ID)</div>
                <div>· Custom subagent codename</div>
                <div>· PIN for transaction signing</div>
                <div>· Seed phrase (save it — yours forever)</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={generateWallet}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95"
                style={{ background: "rgba(255,50,50,0.15)", border: "1px solid rgba(255,50,50,0.3)", color: "rgba(255,120,120,0.95)" }}>
                Generate
              </button>
              <button onClick={() => { setStep("import"); setErrorMsg(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}>
                Import
              </button>
            </div>
          </motion.div>
        )}

        {/* GENERATING */}
        {step === "generating" && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="text-2xl animate-pulse">⚙️</div>
            <div className="text-white/60 text-xs tracking-widest uppercase animate-pulse">Generating wallet…</div>
            <div className="flex gap-1 justify-center">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-red-400/60"
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* IMPORT */}
        {step === "import" && (
          <motion.div key="import" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 w-full">
            <div>
              <div className="text-xl mb-1">📥</div>
              <div className="text-white font-bold text-sm tracking-widest uppercase">Import Wallet</div>
              <div className="text-white/35 text-[10px] mt-1">Paste your 12 or 24 word seed phrase.</div>
            </div>
            <textarea
              value={importMnemonic}
              onChange={e => { setImportMnemonic(e.target.value); setErrorMsg(""); }}
              placeholder="word1 word2 word3 …"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl font-mono text-[11px] outline-none resize-none transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,50,50,0.25)", color: "rgba(255,255,255,0.7)" }}
            />
            {errorMsg && <div className="text-[10px] text-red-400/80">{errorMsg}</div>}
            <div className="flex gap-2">
              <button onClick={() => { setStep("idle"); setErrorMsg(""); }}
                className="flex-1 py-2 rounded-xl text-[11px] text-white/35 hover:text-white/60 transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                Back
              </button>
              <button onClick={importWallet} disabled={!importMnemonic.trim()}
                className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 disabled:opacity-30"
                style={{ background: "rgba(255,50,50,0.15)", border: "1px solid rgba(255,50,50,0.3)", color: "rgba(255,120,120,0.95)" }}>
                Import →
              </button>
            </div>
          </motion.div>
        )}

        {/* NAME */}
        {step === "name" && (
          <motion.div key="name" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 w-full">
            <div>
              <div className="text-xl mb-1">🕵️</div>
              <div className="text-white font-bold text-sm tracking-widest uppercase">Choose Your Codename</div>
              <div className="text-white/35 text-[10px] mt-1">This is your subagent identity. Make it yours.</div>
            </div>
            <input
              type="text"
              value={subagentName}
              onChange={e => setSubagentName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 20))}
              placeholder="e.g. GHOST_WALKER"
              maxLength={20}
              className="w-full px-3 py-2.5 rounded-xl text-center font-mono text-sm font-bold tracking-widest outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,50,50,0.3)", color: "rgba(255,120,120,0.95)", caretColor: "rgba(255,120,120,0.8)" }}
              onKeyDown={e => e.key === "Enter" && proceedToPin()}
            />
            <div className="text-[9px] text-white/25">Letters, numbers, underscores only. Max 20 chars.</div>
            <button onClick={proceedToPin} disabled={!subagentName.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95 disabled:opacity-30"
              style={{ background: "rgba(255,50,50,0.15)", border: "1px solid rgba(255,50,50,0.3)", color: "rgba(255,120,120,0.95)" }}>
              Set Codename →
            </button>
          </motion.div>
        )}

        {/* PIN */}
        {step === "pin" && (
          <motion.div key="pin" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 w-full">
            <div>
              <div className="text-xl mb-1">🔐</div>
              <div className="text-white font-bold text-sm tracking-widest uppercase">Create Transaction PIN</div>
              <div className="text-white/35 text-[10px] mt-1 leading-relaxed">
                This PIN lets IMPOSTER sign transactions for you<br />without you needing to confirm every time.
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={e => { setPin(e.target.value); setErrorMsg(""); }}
                  placeholder="Enter PIN (min 4 digits)"
                  className="w-full px-3 py-2.5 pr-9 rounded-xl text-center font-mono text-sm outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,50,50,0.25)", color: "rgba(255,255,255,0.85)" }}
                />
                <button onClick={() => setShowPin(!showPin)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input
                type={showPin ? "text" : "password"}
                value={pinConfirm}
                onChange={e => { setPinConfirm(e.target.value); setErrorMsg(""); }}
                placeholder="Confirm PIN"
                className="w-full px-3 py-2.5 rounded-xl text-center font-mono text-sm outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,50,50,0.25)", color: "rgba(255,255,255,0.85)" }}
                onKeyDown={e => e.key === "Enter" && finalizeIdentity()}
              />
            </div>
            {errorMsg && <div className="text-[10px] text-red-400/80">{errorMsg}</div>}
            <button onClick={finalizeIdentity} disabled={saving || !pin || !pinConfirm}
              className="w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95 disabled:opacity-30"
              style={{ background: "rgba(255,50,50,0.15)", border: "1px solid rgba(255,50,50,0.3)", color: "rgba(255,120,120,0.95)" }}>
              {saving ? "Saving…" : "Create Identity →"}
            </button>
          </motion.div>
        )}

        {/* DONE */}
        {step === "done" && identity && (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 w-full">
            <div className="text-xl">✅</div>
            <div className="space-y-2 text-left">
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Your Identity</div>
              <div className="px-3 py-2.5 rounded-xl space-y-2.5" style={{ background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.2)" }}>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/40">ID</span>
                  <div className="flex items-center">
                    <span className="text-[11px] text-red-300/90 font-mono font-bold">{identity.imposter_id}</span>
                    <CopyButton text={identity.imposter_id} />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/40">Subagent</span>
                  <div className="flex items-center">
                    <span className="text-[11px] text-white/80 font-mono font-bold">{identity.subagent_name}</span>
                    <CopyButton text={identity.subagent_name} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40">Kaspa Address</span>
                    <CopyButton text={identity.kaspa_address} />
                  </div>
                  <span className="text-[9px] text-white/45 font-mono break-all">{identity.kaspa_address}</span>
                </div>
              </div>

              {/* Seed phrase */}
              <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.15)" }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] text-yellow-400/70 font-semibold">⚠️ Seed Phrase</div>
                  <div className="flex items-center gap-1">
                    <CopyButton text={identity.mnemonic} />
                    <button onClick={() => setShowMnemonic(!showMnemonic)} className="text-white/30 hover:text-white/60">
                      {showMnemonic ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {showMnemonic
                  ? <div className="text-[10px] text-white/40 font-mono break-all leading-relaxed">{identity.mnemonic}</div>
                  : <div className="text-[10px] text-white/25 italic">Hidden — tap eye to reveal</div>
                }
              </div>

              <div className="text-[9px] text-white/25 px-1">🔐 PIN saved. IMPOSTER can now sign transactions without prompting you.</div>
            </div>
            <button onClick={proceed}
              className="w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all active:scale-95"
              style={{ background: "rgba(255,50,50,0.2)", border: "1px solid rgba(255,50,50,0.4)", color: "rgba(255,120,120,1)" }}>
              Enter as {identity.subagent_name}
            </button>
          </motion.div>
        )}

        {/* ERROR */}
        {step === "error" && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="text-white/50 text-[11px]">{errorMsg}</div>
            <button onClick={() => setStep("idle")}
              className="px-4 py-2 rounded-lg text-xs text-red-400/80 border border-red-500/20 hover:bg-red-500/10 transition-all">
              Try Again
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}