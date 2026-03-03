import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Plus, Key, Check, AlertTriangle, RefreshCw, Copy, Shield, X,
  ExternalLink, Download, ChevronDown, LogOut, Edit3, Eye, EyeOff
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const GLASS = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};
const ORANGE = "#ff5a14";

const STORAGE_KEY = "kivr_wallets"; // [{address, name, source}]
const ACTIVE_KEY  = "kivr_wallet";

function loadWallets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveWallets(ws) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ws));
}

// ── Modal shell ────────────────────────────────────────────────────────────────
function Modal({ onClose, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-6 space-y-4 overflow-y-auto"
        style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose}><X size={18} color="rgba(255,255,255,0.4)" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── Import wallet modal (mnemonic) ─────────────────────────────────────────────
function ImportModal({ onImported, onClose }) {
  const [mnemonic, setMnemonic] = useState("");
  const [walletName, setWalletName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  const handle = async () => {
    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      setError("Enter a valid 12 or 24-word recovery phrase."); return;
    }
    setLoading(true); setError("");
    try {
      const res = await base44.functions.invoke("createKaspaWallet", {
        mnemonic: mnemonic.trim(),
        wordCount: words.length,
        importMode: true,
      });
      if (res.data?.error) throw new Error(res.data.error);
      const addr = res.data.address.startsWith("kaspa:") ? res.data.address : `kaspa:${res.data.address}`;
      onImported(addr, walletName.trim() || "Imported Wallet");
    } catch (e) {
      setError("Could not derive address from that phrase. Check and try again.");
    }
    setLoading(false);
  };

  return (
    <Modal onClose={onClose} title="Import Wallet">
      <div className="rounded-xl p-3 flex items-start gap-2 text-xs"
        style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
        <AlertTriangle size={12} color="#ff9500" className="flex-shrink-0 mt-0.5" />
        Your phrase never leaves your device. It is used locally to derive your address only.
      </div>
      <div>
        <label className="text-xs mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>Recovery Phrase (12 or 24 words)</label>
        <div className="relative">
          <textarea
            value={mnemonic}
            onChange={e => setMnemonic(e.target.value)}
            rows={3}
            placeholder="word1 word2 word3 ..."
            className="w-full rounded-xl p-3 text-white text-sm font-mono resize-none outline-none pr-10"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <button onClick={() => setShow(s => !s)} className="absolute top-3 right-3" tabIndex={-1}>
            {show ? <EyeOff size={14} color="rgba(255,255,255,0.3)" /> : <Eye size={14} color="rgba(255,255,255,0.3)" />}
          </button>
        </div>
        {!show && mnemonic && (
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
            {mnemonic.trim().split(/\s+/).length} words entered
          </p>
        )}
      </div>
      <div>
        <label className="text-xs mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>Wallet Name (optional)</label>
        <input
          value={walletName}
          onChange={e => setWalletName(e.target.value)}
          placeholder="My Kaspa Wallet"
          className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        />
      </div>
      {error && <p className="text-xs" style={{ color: "#ff3b30" }}>{error}</p>}
      <button onClick={handle} disabled={loading}
        className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
        style={{ background: ORANGE, opacity: loading ? 0.7 : 1 }}>
        {loading ? <><RefreshCw size={14} className="animate-spin" /> Deriving address...</> : "Import Wallet"}
      </button>
    </Modal>
  );
}

// ── Create wallet modal ────────────────────────────────────────────────────────
function CreateModal({ onCreated, onClose }) {
  const [step, setStep] = useState("options");
  const [wordCount, setWordCount] = useState(12);
  const [newWallet, setNewWallet] = useState(null);
  const [walletName, setWalletName] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const createWallet = async () => {
    setStep("loading"); setError("");
    try {
      const res = await base44.functions.invoke("createKaspaWallet", { wordCount });
      if (res.data?.error) throw new Error(res.data.error);
      setNewWallet(res.data);
      setStep("reveal");
    } catch { setStep("error"); }
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(newWallet.mnemonic);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const finish = () => {
    const addr = newWallet.address.startsWith("kaspa:") ? newWallet.address : `kaspa:${newWallet.address}`;
    // Pass private key for mobile signing capability
    onCreated(addr, walletName.trim() || "My KivR Wallet", "create", newWallet.privateKey);
  };

  return (
    <Modal onClose={onClose} title="Create Kaspa Wallet">
      {step === "options" && (
        <>
          <div className="rounded-xl p-3 flex items-start gap-2 text-xs"
            style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            <AlertTriangle size={12} color="#ff9500" className="flex-shrink-0 mt-0.5" />
            Save your recovery phrase. It is shown once. KivR never stores it.
          </div>
          <div>
            <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Wallet Name</p>
            <input value={walletName} onChange={e => setWalletName(e.target.value)}
              placeholder="My KivR Wallet"
              className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
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
                  }}>{n} words</button>
              ))}
            </div>
          </div>
          <button onClick={createWallet}
            className="w-full py-3 rounded-xl text-white font-bold text-sm"
            style={{ background: ORANGE }}>
            Generate Wallet
          </button>
        </>
      )}

      {step === "loading" && (
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <RefreshCw size={36} color={ORANGE} />
          </motion.div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Generating secure wallet…</p>
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>First run may take ~10s</p>
        </div>
      )}

      {step === "error" && (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <AlertTriangle size={36} color="#ff9500" />
          <p className="text-white font-bold">Generation failed</p>
          <button onClick={() => setStep("options")}
            className="w-full py-3 rounded-xl text-white font-bold text-sm"
            style={{ background: ORANGE }}>Try Again</button>
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
          <button onClick={finish} disabled={!confirmed}
            className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all"
            style={{ background: confirmed ? ORANGE : "rgba(255,255,255,0.08)", cursor: confirmed ? "pointer" : "default" }}>
            Connect Wallet
          </button>
        </>
      )}
    </Modal>
  );
}

// ── Manual address modal ───────────────────────────────────────────────────────
function ManualModal({ onConnect, onClose }) {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handle = () => {
    if (!address.trim()) { setError("Enter a Kaspa address."); return; }
    if (!address.startsWith("kaspa:")) { setError("Address must start with kaspa:"); return; }
    onConnect(address.trim(), name.trim() || "Read-only Wallet");
  };

  return (
    <Modal onClose={onClose} title="Enter Kaspa Address">
      <textarea value={address} onChange={e => setAddress(e.target.value)}
        placeholder="kaspa:q..." rows={3}
        className="w-full rounded-xl p-3 text-white text-sm font-mono resize-none outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Wallet name (optional)"
        className="w-full rounded-xl px-3 py-2.5 text-white text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
      {error && <p className="text-xs" style={{ color: "#ff3b30" }}>{error}</p>}
      <button onClick={handle}
        className="w-full py-3 rounded-xl text-white font-bold text-sm"
        style={{ background: ORANGE }}>Connect</button>
    </Modal>
  );
}

// ── Wallet management panel (when connected) ───────────────────────────────────
function WalletManagePanel({ wallets, activeAddress, onSwitch, onDisconnect, onRename, onAdd }) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState("");

  const active = wallets.find(w => w.address === activeAddress);

  return (
    <div className="mx-4 mb-4">
      {/* Active wallet bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-3 flex items-center gap-3"
        style={{ ...GLASS, border: "1px solid rgba(255,90,20,0.35)" }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,90,20,0.15)" }}>
          <Check size={16} color={ORANGE} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-semibold truncate">{active?.name || "Wallet"}</div>
          <div className="text-xs font-mono truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
            {activeAddress?.slice(0, 20)}…{activeAddress?.slice(-6)}
          </div>
        </div>
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors"
          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>
          <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          Manage
        </button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mt-2 rounded-2xl overflow-hidden"
            style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {wallets.map(w => (
              <div key={w.address} className="px-4 py-3 flex items-center gap-3 border-b"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0`}
                  style={{ background: w.address === activeAddress ? ORANGE : "rgba(255,255,255,0.15)" }} />
                <div className="flex-1 min-w-0">
                  {renaming === w.address ? (
                    <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                      onBlur={() => { if (newName.trim()) onRename(w.address, newName.trim()); setRenaming(null); }}
                      onKeyDown={e => { if (e.key === "Enter" && newName.trim()) { onRename(w.address, newName.trim()); setRenaming(null); }}}
                      className="text-xs text-white bg-transparent outline-none border-b w-full"
                      style={{ borderColor: ORANGE }} />
                  ) : (
                    <div className="text-xs text-white font-medium truncate">{w.name}</div>
                  )}
                  <div className="text-xs font-mono truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {w.address?.slice(0, 16)}…
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {w.address !== activeAddress && (
                    <button onClick={() => { onSwitch(w.address); setOpen(false); }}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: "rgba(255,90,20,0.15)", color: ORANGE }}>
                      Use
                    </button>
                  )}
                  <button onClick={() => { setRenaming(w.address); setNewName(w.name); }}>
                    <Edit3 size={12} color="rgba(255,255,255,0.3)" />
                  </button>
                  <button onClick={() => { onDisconnect(w.address); setOpen(false); }}>
                    <LogOut size={12} color="rgba(255,59,48,0.6)" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add wallet options */}
            <div className="px-4 py-3 flex gap-2">
              <button onClick={() => { onAdd("create"); setOpen(false); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                <Plus size={12} /> Create
              </button>
              <button onClick={() => { onAdd("import"); setOpen(false); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                <Download size={12} /> Import
              </button>
              <button onClick={() => { onAdd("manual"); setOpen(false); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                <Key size={12} /> Address
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Balance display ────────────────────────────────────────────────────────────
function WalletBalance({ address, refreshKey }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getKaspaBalance", { address });
      const bal = res.data?.balance ?? res.data?.data?.balance ?? null;
      if (bal !== null) setBalance(parseFloat(bal));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchBalance();
    const iv = setInterval(fetchBalance, 15000);
    return () => clearInterval(iv);
  }, [address, refreshKey]);

  if (balance === null && !loading) return null;

  return (
    <div className="mx-4 mb-3 rounded-2xl px-4 py-3 flex items-center justify-between"
      style={{ background: "rgba(255,90,20,0.08)", border: "1px solid rgba(255,90,20,0.2)" }}>
      <div>
        <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Wallet Balance</p>
        {loading && balance === null ? (
          <p className="text-sm text-white/40">Loading…</p>
        ) : (
          <p className="text-xl font-black" style={{ color: ORANGE }}>
            {balance !== null ? balance.toLocaleString("en-US", { maximumFractionDigits: 4 }) : "—"} <span className="text-sm font-semibold">KAS</span>
          </p>
        )}
      </div>
      <button onClick={fetchBalance} disabled={loading}
        className="p-2 rounded-xl"
        style={{ background: "rgba(255,90,20,0.1)" }}>
        <RefreshCw size={14} color={ORANGE} className={loading ? "animate-spin" : ""} />
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function WalletConnectPanel({ connectedAddress, onConnect, refreshKey }) {
  const props = { refreshKey };
  const [wallets, setWallets] = useState(() => loadWallets());
  const [modal, setModal] = useState(null); // null | 'create' | 'import' | 'manual' | 'kasware'
  const [error, setError] = useState("");

  // Persist wallets
  useEffect(() => { saveWallets(wallets); }, [wallets]);

  const addAndConnect = (address, name, source = "manual", privateKey = null) => {
    setWallets(prev => {
      const exists = prev.find(w => w.address === address);
      if (exists) return prev.map(w => w.address === address ? { ...w, name } : w);
      const newWallet = { address, name, source };
      if (privateKey) newWallet.privateKey = privateKey; // Store encrypted key for mobile signing
      return [...prev, newWallet];
    });
    onConnect(address);
    setModal(null);
    setError("");
  };

  const switchWallet = (address) => {
    onConnect(address);
  };

  const disconnectWallet = (address) => {
    setWallets(prev => prev.filter(w => w.address !== address));
    if (address === connectedAddress) {
      const remaining = wallets.filter(w => w.address !== address);
      onConnect(remaining[0]?.address || null);
    }
  };

  const renameWallet = (address, newName) => {
    setWallets(prev => prev.map(w => w.address === address ? { ...w, name: newName } : w));
  };

  const connectKasware = async () => {
    setError("");
    try {
      if (window.kasware) {
        const accounts = await window.kasware.requestAccounts();
        if (accounts[0]) addAndConnect(accounts[0], "Kasware Wallet", "kasware");
      } else {
        setError("Kasware not detected. Use import or create a wallet.");
      }
    } catch { setError("Could not connect Kasware."); }
  };

  // ── Already have at least one wallet ──────────────────────────────────────
  if (connectedAddress && wallets.length > 0) {
    return (
      <>
        <WalletBalance address={connectedAddress} refreshKey={props.refreshKey} />
        <WalletManagePanel
          wallets={wallets}
          activeAddress={connectedAddress}
          onSwitch={switchWallet}
          onDisconnect={disconnectWallet}
          onRename={renameWallet}
          onAdd={setModal}
        />
        <AnimatePresence>
          {modal === "create" && <CreateModal onCreated={(a, n, s, pk) => addAndConnect(a, n, s, pk)} onClose={() => setModal(null)} />}
          {modal === "import" && <ImportModal onImported={(a, n, s, pk) => addAndConnect(a, n, s, pk)} onClose={() => setModal(null)} />}
          {modal === "manual" && <ManualModal onConnect={(a, n) => addAndConnect(a, n, "manual")} onClose={() => setModal(null)} />}
        </AnimatePresence>
      </>
    );
  }

  // ── No wallet yet ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="mx-4 mb-4 space-y-3">
        <p className="text-xs text-center mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
          Connect your Kaspa wallet to create IVR payment presets
        </p>

        <button onClick={connectKasware}
          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
          style={{ ...GLASS, border: "1px solid rgba(255,90,20,0.3)" }}>
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

        <button onClick={() => setModal("import")}
          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
          style={GLASS}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <Download size={16} color="white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-white text-sm font-semibold">Import Wallet</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>12 or 24-word recovery phrase</div>
          </div>
          <Shield size={14} color="rgba(255,255,255,0.2)" />
        </button>

        <button onClick={() => setModal("create")}
          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
          style={GLASS}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <Plus size={16} color="white" />
          </div>
          <div className="flex-1 text-left">
            <div className="text-white text-sm font-semibold">Create New Wallet</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Via Terra Protocol · Non-custodial</div>
          </div>
        </button>

        <button onClick={() => setModal("manual")}
          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98]"
          style={GLASS}>
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
            <AlertTriangle size={12} />{error}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal === "create" && <CreateModal onCreated={(a, n, s, pk) => addAndConnect(a, n, s, pk)} onClose={() => setModal(null)} />}
        {modal === "import" && <ImportModal onImported={(a, n, s, pk) => addAndConnect(a, n, s, pk)} onClose={() => setModal(null)} />}
        {modal === "manual" && <ManualModal onConnect={(a, n) => addAndConnect(a, n, "manual")} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </>
  );
}