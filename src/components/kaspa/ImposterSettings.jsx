import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Eye, EyeOff, LogOut, Download, KeyRound } from "lucide-react";

async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin + "imposter_salt_kai"));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1 flex-shrink-0 text-white/30 hover:text-white/70 transition-colors">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function ImposterSettings({ identity, onLogout }) {
  const [panel, setPanel] = useState(null); // null | "export" | "confirm_logout"
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  const verifyPin = async () => {
    const h = await hashPin(pin);
    if (h === identity.pin_hash) {
      setVerified(true);
      setError("");
    } else {
      setError("Wrong PIN");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("imposter_identity");
    onLogout();
  };

  const reset = () => { setPanel(null); setPin(""); setVerified(false); setError(""); setShowMnemonic(false); };

  return (
    <div className="px-4 py-3 space-y-2" style={{ borderBottom: "1px solid rgba(255,50,50,0.15)" }}>
      {/* Identity summary */}
      {!panel && (
        <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-[10px] text-red-400/60 uppercase tracking-wider font-semibold mb-2">👾 Imposter Identity</div>
          <div className="px-3 py-2 rounded-xl space-y-1.5 mb-3" style={{ background: "rgba(255,50,50,0.07)", border: "1px solid rgba(255,50,50,0.18)" }}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/35">ID</span>
              <div className="flex items-center">
                <span className="text-[10px] text-red-300/80 font-mono font-bold">{identity.imposter_id}</span>
                <CopyButton text={identity.imposter_id} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/35">Subagent</span>
              <div className="flex items-center">
                <span className="text-[10px] text-white/70 font-mono font-bold">{identity.subagent_name}</span>
                <CopyButton text={identity.subagent_name} />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/35">Address</span>
                <CopyButton text={identity.kaspa_address} />
              </div>
              <span className="text-[9px] text-white/30 font-mono break-all">{identity.kaspa_address}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setPanel("export")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all hover:bg-yellow-500/10"
              style={{ background: "rgba(255,200,0,0.07)", border: "1px solid rgba(255,200,0,0.2)", color: "rgba(255,200,0,0.8)" }}>
              <Download className="w-3 h-3" /> Export Seed
            </button>
            <button onClick={() => setPanel("confirm_logout")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all hover:bg-red-500/10"
              style={{ background: "rgba(255,50,50,0.07)", border: "1px solid rgba(255,50,50,0.2)", color: "rgba(255,100,100,0.8)" }}>
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </motion.div>
      )}

      {/* Export seed — PIN required */}
      {panel === "export" && (
        <motion.div key="export" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="text-[11px] text-yellow-400/80 font-bold flex items-center gap-1.5">
            <Download className="w-3 h-3" /> Export Seed Phrase
          </div>

          {!verified ? (
            <>
              <div className="text-[10px] text-white/35">Enter your PIN to reveal the seed phrase.</div>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={e => { setPin(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && verifyPin()}
                  placeholder="Enter PIN"
                  className="w-full px-3 py-2 pr-9 rounded-xl text-center font-mono text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,200,0,0.25)", color: "rgba(255,255,255,0.85)" }}
                  autoFocus
                />
                <button onClick={() => setShowPin(!showPin)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {error && <div className="text-[10px] text-red-400/80">{error}</div>}
              <div className="flex gap-2">
                <button onClick={reset} className="flex-1 py-1.5 rounded-lg text-[11px] text-white/35 hover:text-white/60 transition-all" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>Cancel</button>
                <button onClick={verifyPin} disabled={!pin}
                  className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-30"
                  style={{ background: "rgba(255,200,0,0.15)", border: "1px solid rgba(255,200,0,0.3)", color: "rgba(255,200,0,0.9)" }}>
                  Verify PIN
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.2)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-yellow-400/70 font-semibold">⚠️ Seed Phrase</span>
                  <div className="flex items-center gap-1">
                    <CopyButton text={identity.mnemonic} />
                    <button onClick={() => setShowMnemonic(!showMnemonic)} className="text-white/30 hover:text-white/60">
                      {showMnemonic ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {showMnemonic
                  ? <div className="text-[10px] text-white/55 font-mono leading-relaxed break-all">{identity.mnemonic}</div>
                  : <div className="text-[10px] text-white/25 italic">Tap eye to reveal</div>
                }
              </div>
              <div className="text-[9px] text-white/25">Never share this with anyone. Store it offline.</div>
              <button onClick={reset} className="w-full py-1.5 rounded-lg text-[11px] text-white/35 hover:text-white/60 transition-all" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>Done</button>
            </>
          )}
        </motion.div>
      )}

      {/* Confirm logout */}
      {panel === "confirm_logout" && (
        <motion.div key="logout" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="text-[11px] text-red-400/80 font-bold flex items-center gap-1.5">
            <LogOut className="w-3 h-3" /> Log out of Imposter?
          </div>
          <div className="text-[10px] text-white/35 leading-relaxed">
            Your wallet identity will be removed from this device.<br />
            <span className="text-yellow-400/60">Make sure you've saved your seed phrase first.</span>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 rounded-lg text-[11px] text-white/40 hover:text-white/70 transition-all" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>Cancel</button>
            <button onClick={handleLogout}
              className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all"
              style={{ background: "rgba(255,50,50,0.15)", border: "1px solid rgba(255,50,50,0.3)", color: "rgba(255,100,100,1)" }}>
              Yes, Logout
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}