import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MoreHorizontal, Shield, Trash2, Download, Upload,
  Copy, Check, Eye, EyeOff, AlertTriangle, ChevronRight, RefreshCw, Plus
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif";
const ACCENT = "#1a73e8";

const CARD_COLORS = [
  "linear-gradient(135deg, #1a2a4a 0%, #0d1a2e 100%)",
  "linear-gradient(135deg, #1a3a2a 0%, #0d2015 100%)",
  "linear-gradient(135deg, #2a1a3a 0%, #1a0d2e 100%)",
  "linear-gradient(135deg, #3a2a1a 0%, #2e1a0d 100%)",
];

// ── Backup Seed Sheet ────────────────────────────────────────────────────────
function BackupSeedSheet({ wallet, onClose }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(wallet.mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 300, display: 'flex', flexDirection: 'column', fontFamily: SF }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Backup Seed Phrase</span>
        <div style={{ width: 20 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ background: '#1c1c1e', borderRadius: 16, padding: '16px', border: '1px solid rgba(255,165,0,0.2)', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={18} color="#ff9500" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6 }}>
              Never share your recovery phrase. Anyone with these words can access your funds permanently.
            </div>
          </div>
        </div>

        {!revealed ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: '#1a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Shield size={28} color={ACCENT} />
            </div>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Seed phrase is hidden</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>Tap below to reveal your recovery phrase</div>
            <button onClick={() => setRevealed(true)}
              style={{ background: ACCENT, color: 'white', border: 'none', borderRadius: 14, padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: SF }}>
              Reveal Seed Phrase
            </button>
          </div>
        ) : (
          <>
            <div style={{ background: '#1c1c1e', borderRadius: 16, padding: '20px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {wallet.mnemonic.split(' ').map((word, i) => (
                  <div key={i} style={{ background: '#2c2c2e', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, minWidth: 14 }}>{i + 1}</span>
                    <span style={{ color: 'white', fontSize: 13, fontWeight: 500 }}>{word}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={copy}
              style={{ width: '100%', background: '#2c2c2e', color: copied ? '#34c759' : 'rgba(255,255,255,0.8)', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: SF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Copy size={16} />
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Import Wallet Sheet ──────────────────────────────────────────────────────
function ImportWalletSheet({ onClose, onImported, onBalanceUpdate }) {
  const [mnemonic, setMnemonic] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const wordCount = mnemonic.trim().split(/\s+/).filter(Boolean).length;
  const valid = wordCount === 12 || wordCount === 24;

  const handleImport = async () => {
    setError("");
    if (!valid) return setError("Please enter a valid 12 or 24 word seed phrase.");
    setLoading(true);
    try {
      // Scan first 5 address indices and pick the one with balance (or default to index 0)
      let bestAddress = null;
      let bestBalance = -1;
      let bestIndex = 0;

      for (let i = 0; i < 5; i++) {
        const res = await base44.functions.invoke('deriveKaspaAddress', { mnemonic: mnemonic.trim(), addressIndex: i });
        if (res.data?.error) throw new Error(res.data.error);
        const addr = res.data.address;

        const balRes = await base44.functions.invoke('getKaspaBalance', { address: addr });
        const bal = balRes?.data?.balanceKAS ?? 0;

        console.log(`[ImportWallet] Index ${i}: ${addr.slice(0,10)}... balance: ${bal} KAS`);

        if (bestAddress === null) { bestAddress = addr; bestIndex = i; }
        if (bal > bestBalance) { bestBalance = bal; bestAddress = addr; bestIndex = i; }
        if (bal > 0) break; // found a funded address, stop scanning
      }

      console.log(`[ImportWallet] Selected address: ${bestAddress.slice(0,10)}... at index ${bestIndex}`);
      onImported({ address: bestAddress, mnemonic: mnemonic.trim(), label: label || `Wallet ${Date.now()}`, addressIndex: bestIndex });
      // Refresh balance after import
      if (onBalanceUpdate) {
        setTimeout(() => onBalanceUpdate(), 1000);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to import wallet.");
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 300, display: 'flex', flexDirection: 'column', fontFamily: SF }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>Import Wallet</span>
        <div style={{ width: 20 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8, paddingLeft: 4 }}>Wallet Label (optional)</div>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Savings Wallet"
            style={{ width: '100%', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none', fontFamily: SF, boxSizing: 'border-box' }} />
        </div>

        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8, paddingLeft: 4 }}>
            Seed Phrase <span style={{ color: wordCount === 12 || wordCount === 24 ? '#34c759' : 'rgba(255,255,255,0.25)' }}>({wordCount}/12 or 24 words)</span>
          </div>
          <textarea value={mnemonic} onChange={e => setMnemonic(e.target.value)} placeholder="Enter your 12 or 24 word recovery phrase..."
            style={{ width: '100%', background: '#1c1c1e', border: `1px solid ${valid ? 'rgba(52,199,89,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 14, outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', resize: 'none', height: 120, lineHeight: 1.6 }} />
        </div>

        {error && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,59,48,0.1)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,59,48,0.2)' }}>
            <AlertTriangle size={16} color="#ff3b30" />
            <span style={{ color: '#ff3b30', fontSize: 13 }}>{error}</span>
          </div>
        )}

        <button onClick={handleImport} disabled={!valid || loading}
          style={{ background: valid && !loading ? ACCENT : '#2c2c2e', color: 'white', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 600, cursor: valid && !loading ? 'pointer' : 'default', fontFamily: SF, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: 'inline-flex' }}><RefreshCw size={18} /></motion.span> Importing...</> : "Import Wallet"}
        </button>
      </div>
    </motion.div>
  );
}

// ── Delete Confirm Sheet ─────────────────────────────────────────────────────
function DeleteConfirmSheet({ wallet, onClose, onDeleted }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 300, display: 'flex', flexDirection: 'column', fontFamily: SF }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        <span style={{ color: '#ff3b30', fontWeight: 600, fontSize: 16 }}>Delete Wallet</span>
        <div style={{ width: 20 }} />
      </div>
      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, background: 'rgba(255,59,48,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={32} color="#ff3b30" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Delete this wallet?</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.6 }}>
            This will remove the wallet from Terra. Make sure you have backed up your seed phrase before deleting.
          </div>
        </div>
        <div style={{ background: '#1c1c1e', borderRadius: 12, padding: '14px 16px', width: '100%', wordBreak: 'break-all', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
          {wallet.address}
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', width: '100%' }}>
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
            style={{ marginTop: 2, width: 18, height: 18, accentColor: '#ff3b30' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.5 }}>
            I have backed up my seed phrase and understand this action cannot be undone.
          </span>
        </label>
        <button onClick={() => { onDeleted(); onClose(); }} disabled={!confirmed}
          style={{ width: '100%', background: confirmed ? '#ff3b30' : '#2c2c2e', color: 'white', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 600, cursor: confirmed ? 'pointer' : 'default', fontFamily: SF, marginTop: 'auto' }}>
          Delete Wallet
        </button>
      </div>
    </motion.div>
  );
}

// ── Wallet Menu Sheet ────────────────────────────────────────────────────────
function WalletMenuSheet({ wallet, onClose, onBackup, onDelete, onImport }) {
  const items = [
    { icon: <Download size={20} color="#34c759" />, label: "Backup Seed Phrase", sub: "View & copy your recovery words", action: onBackup, color: 'rgba(52,199,89,0.1)' },
    { icon: <Upload size={20} color={ACCENT} />, label: "Import Another Wallet", sub: "Add a wallet using seed phrase", action: onImport, color: 'rgba(26,115,232,0.1)' },
    { icon: <Trash2 size={20} color="#ff3b30" />, label: "Delete Wallet", sub: "Remove this wallet from Terra", action: onDelete, color: 'rgba(255,59,48,0.1)' },
  ];

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      style={{ position: 'fixed', inset: 0, zIndex: 250, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', fontFamily: SF }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <motion.div style={{ position: 'relative', background: '#111', borderRadius: '24px 24px 0 0', padding: '24px 20px 32px' }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 24px' }} />
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, paddingLeft: 4, marginBottom: 12, fontFamily: 'monospace' }}>
          {wallet?.address?.slice(0, 16)}...{wallet?.address?.slice(-8)}
        </div>
        {items.map(item => (
          <button key={item.label} onClick={() => { onClose(); item.action(); }}
            style={{ width: '100%', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>{item.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>{item.sub}</div>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,0.2)" style={{ marginLeft: 'auto' }} />
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ── Swipeable Wallet Cards ───────────────────────────────────────────────────
function WalletCards({ wallets, activeIdx, onChangeIdx, balances, prices, loading, balanceHidden }) {
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50 && activeIdx < wallets.length - 1) onChangeIdx(activeIdx + 1);
    if (dx > 50 && activeIdx > 0) onChangeIdx(activeIdx - 1);
    touchStartX.current = null;
  };

  const wallet = wallets[activeIdx];
  if (!wallet) return null;

  const kasBalanceNum = parseFloat(balances[wallet.address]) || 0;
  const kasPriceNum = parseFloat(prices) || 0;
  const usdValue = kasBalanceNum * kasPriceNum;

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ userSelect: 'none' }}>
      <AnimatePresence mode="wait">
        <motion.div key={activeIdx}
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.2 }}
          style={{ background: CARD_COLORS[activeIdx % CARD_COLORS.length], borderRadius: 22, padding: '28px 24px', border: '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden', minHeight: 160 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 16 }}>
            {wallet.label || `Wallet ${activeIdx + 1}`}
          </div>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 26, fontWeight: 600 }}>...</div>
          ) : (
            <>
              <div style={{ color: 'white', fontSize: 30, fontWeight: 700, letterSpacing: -1, marginBottom: 4 }}>
                {balanceHidden ? "•••• KAS" : `${kasBalanceNum.toLocaleString("en-US", { maximumFractionDigits: 2 })} KAS`}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                {balanceHidden ? "••••••" : `≈ $${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </div>
            </>
          )}
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 14, fontFamily: 'monospace' }}>
            {wallet.address ? `${wallet.address.slice(0, 10)}...${wallet.address.slice(-6)}` : ""}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      {wallets.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          {wallets.map((_, i) => (
            <button key={i} onClick={() => onChangeIdx(i)}
              style={{ width: i === activeIdx ? 20 : 6, height: 6, borderRadius: 3, background: i === activeIdx ? ACCENT : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.2s, background 0.2s' }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main WalletManager ───────────────────────────────────────────────────────
export default function WalletManager({ wallets, activeIdx, onChangeIdx, balances, kasPrice, loading, balanceHidden, onMenuOpen }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>My Wallets</span>
        <button onClick={onMenuOpen}
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '6px 12px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <MoreHorizontal size={16} />
          Manage
        </button>
      </div>
      <WalletCards
        wallets={wallets}
        activeIdx={activeIdx}
        onChangeIdx={onChangeIdx}
        balances={balances}
        prices={kasPrice}
        loading={loading}
        balanceHidden={balanceHidden}
      />
    </div>
  );
}

export { WalletMenuSheet, BackupSeedSheet, ImportWalletSheet, DeleteConfirmSheet };