import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Lock, Copy, Check, Shield, Eye, EyeOff, Zap, AlertTriangle, Loader2, Coins } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function KaChingSettings({ show, onClose, walletAddress, onConnectWallet, onDisconnectWallet, walletBalance, onAutoSignChange }) {
  const [manualAddr, setManualAddr] = useState("");
  const [pin, setPin] = useState("");
  const [storedPin, setStoredPin] = useState("");
  const [pinVisible, setPinVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verified, setVerified] = useState(false);
  const [autoSign, setAutoSign] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('kaching_pin');
    if (saved) setStoredPin(saved);
    const savedVerified = localStorage.getItem('kaching_verified');
    if (savedVerified === 'true') setVerified(true);
    const savedAutoSign = localStorage.getItem('kaching_autosign');
    if (savedAutoSign === 'true') setAutoSign(true);
    loadLinkedWallet();
  }, []);

  const loadLinkedWallet = () => {
    // Check Terra wallets in localStorage
    try {
      const terraWallets = JSON.parse(localStorage.getItem('terra_wallets') || '[]');
      const linked = localStorage.getItem('kaching_linked_wallet');
      if (linked) {
        const wallet = terraWallets.find(w => w.address === linked);
        if (wallet && wallet.mnemonic) {
          setLinkedWallet(wallet);
          return;
        }
      }
      // Auto-link first wallet with mnemonic
      const withMnemonic = terraWallets.find(w => w.mnemonic);
      if (withMnemonic) {
        setLinkedWallet(withMnemonic);
        localStorage.setItem('kaching_linked_wallet', withMnemonic.address);
      }
    } catch {}
  };

  const savePin = () => {
    if (pin.length < 4) { toast.error('PIN must be at least 4 digits'); return; }
    localStorage.setItem('kaching_pin', pin);
    setStoredPin(pin);
    toast.success('PIN saved');
  };

  const verifyAndJoin = () => {
    if (!storedPin) { toast.error('Set your PIN first'); return; }
    if (pin !== storedPin) { toast.error('Wrong PIN'); return; }
    if (!walletAddress) { toast.error('Connect wallet first'); return; }
    setVerified(true);
    localStorage.setItem('kaching_verified', 'true');
    toast.success('Verified! Betting enabled.');
    onClose();
  };

  const toggleAutoSign = () => {
    if (!linkedWallet?.mnemonic) {
      toast.error('No Terra wallet with seed phrase found. Import one in Terra first.');
      return;
    }
    if (!verified) {
      toast.error('Verify your PIN first');
      return;
    }
    const newVal = !autoSign;
    setAutoSign(newVal);
    localStorage.setItem('kaching_autosign', newVal ? 'true' : 'false');
    if (newVal) {
      // Connect the linked wallet address too
      if (linkedWallet.address && !walletAddress) {
        const clean = linkedWallet.address.startsWith('kaspa:') ? linkedWallet.address.slice(6) : linkedWallet.address;
        onConnectWallet(clean);
      }
      toast.success('Auto-Sign ON — bets send real KAS instantly');
    } else {
      toast.success('Auto-Sign OFF');
    }
    onAutoSignChange?.(newVal);
  };

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(`kaspa:${walletAddress}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied');
  };

  if (!show) return null;

  const terraWallets = (() => {
    try { return JSON.parse(localStorage.getItem('terra_wallets') || '[]'); } catch { return []; }
  })();
  const walletsWithMnemonic = terraWallets.filter(w => w.mnemonic);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[95] flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-bold">KaChing Settings</h3>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          {/* Wallet Connection */}
          <div className="mb-5">
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2">Wallet</p>
            {walletAddress ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <code className="text-emerald-300 text-xs flex-1 truncate">kaspa:{walletAddress}</code>
                  <button onClick={copyAddress} className="text-white/30 hover:text-emerald-400">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-emerald-400/70 text-xs font-bold">{walletBalance?.toFixed(4)} KAS</p>
                <button
                  onClick={onDisconnectWallet}
                  className="w-full py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {window.kasware && (
                  <button
                    onClick={async () => {
                      try {
                        const accounts = await window.kasware.requestAccounts();
                        if (accounts?.[0]) {
                          const addr = accounts[0].startsWith('kaspa:') ? accounts[0].slice(6) : accounts[0];
                          onConnectWallet(addr);
                        }
                      } catch { toast.error('Connection failed'); }
                    }}
                    className="w-full p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 text-left"
                  >
                    <p className="text-white font-semibold text-sm">Kasware</p>
                    <p className="text-white/40 text-[10px]">Browser extension</p>
                  </button>
                )}
                <div className="flex gap-2">
                  <input
                    value={manualAddr}
                    onChange={e => setManualAddr(e.target.value)}
                    placeholder="kaspa:..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    onClick={() => { if (manualAddr.trim()) { const a = manualAddr.trim().startsWith('kaspa:') ? manualAddr.trim().slice(6) : manualAddr.trim(); onConnectWallet(a); setManualAddr(''); } }}
                    className="px-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-sm font-semibold"
                  >
                    Connect
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PIN Setup */}
          <div className="mb-5">
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2">Security PIN</p>
            <p className="text-white/25 text-[10px] mb-2">{!storedPin ? 'Create a PIN to enable betting' : verified ? 'PIN verified' : 'Enter your PIN to verify session'}</p>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  type={pinVisible ? 'text' : 'password'}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={!storedPin ? 'Create 4-6 digit PIN' : 'Enter your PIN'}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 pr-10"
                  maxLength={6}
                />
                <button onClick={() => setPinVisible(!pinVisible)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30">
                  {pinVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!storedPin ? (
                <button
                  onClick={savePin}
                  disabled={pin.length < 4}
                  className="px-4 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-sm font-semibold disabled:opacity-30"
                >
                  Save
                </button>
              ) : !verified ? (
                <button
                  onClick={verifyAndJoin}
                  disabled={!pin}
                  className="px-4 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-sm font-semibold disabled:opacity-30"
                >
                  Verify
                </button>
              ) : null}
            </div>
            {storedPin && (
              <div className="flex items-center gap-2 mt-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400/60 text-[10px]">PIN set {verified && '· Verified ✓'}</span>
                <button onClick={() => { setStoredPin(''); setPin(''); localStorage.removeItem('kaching_pin'); setVerified(false); setAutoSign(false); localStorage.removeItem('kaching_verified'); localStorage.removeItem('kaching_autosign'); toast.success('PIN cleared'); }} className="text-red-400/50 text-[10px] hover:text-red-400 ml-auto">
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Auto-Sign Toggle */}
          <div className="mb-5">
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2">Auto-Sign (Instant Bets)</p>
            <p className="text-white/25 text-[10px] mb-3">
              When ON, clicking YES/NO sends real KAS instantly from your linked Terra wallet to the game escrow. No extra confirmation needed.
            </p>

            <button
              onClick={toggleAutoSign}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                autoSign
                  ? 'bg-emerald-500/15 border-emerald-500/40'
                  : 'bg-white/[0.03] border-white/[0.08] hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-3">
                <Zap className={`w-5 h-5 ${autoSign ? 'text-emerald-400' : 'text-white/30'}`} />
                <div className="text-left">
                  <p className={`text-sm font-bold ${autoSign ? 'text-emerald-400' : 'text-white/60'}`}>
                    Auto-Sign {autoSign ? 'ON' : 'OFF'}
                  </p>
                  <p className="text-white/25 text-[9px]">
                    {autoSign ? 'Real KAS transactions on every bet' : 'Enable to send KAS instantly'}
                  </p>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full flex items-center transition-all ${autoSign ? 'bg-emerald-500 justify-end' : 'bg-white/10 justify-start'}`}>
                <div className={`w-5 h-5 rounded-full mx-0.5 transition-all ${autoSign ? 'bg-white' : 'bg-white/40'}`} />
              </div>
            </button>

            {/* Linked wallet info */}
            {linkedWallet && (
              <div className="mt-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                <p className="text-white/30 text-[9px] mb-1">Linked Terra Wallet</p>
                <p className="text-white/50 text-[10px] font-mono truncate">{linkedWallet.address}</p>
                <p className="text-white/20 text-[9px] mt-0.5">{linkedWallet.label || 'Default wallet'}</p>
              </div>
            )}

            {!linkedWallet && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-500/8 border border-amber-500/15 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70" />
                <span className="text-amber-300/60 text-[10px]">No Terra wallet with seed phrase found. Import one in the Terra app first.</span>
              </div>
            )}

            {walletsWithMnemonic.length > 1 && (
              <div className="mt-2 space-y-1">
                <p className="text-white/30 text-[9px]">Select wallet:</p>
                {walletsWithMnemonic.map(w => (
                  <button
                    key={w.address}
                    onClick={() => {
                      setLinkedWallet(w);
                      localStorage.setItem('kaching_linked_wallet', w.address);
                      const clean = w.address.startsWith('kaspa:') ? w.address.slice(6) : w.address;
                      onConnectWallet(clean);
                      toast.success(`Linked: ${w.label || w.address.slice(0, 12)}...`);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-[10px] font-mono transition-all ${
                      linkedWallet?.address === w.address
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:border-white/15'
                    }`}
                  >
                    {w.label || w.address.slice(0, 20)}...
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PACMAN Reward Wallet Section — admin only */}
          <RewardWalletSection linkedWallet={linkedWallet} />

          {verified && autoSign && linkedWallet && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-xs font-bold">Ready — bets send real KAS instantly</span>
            </div>
          )}

          {verified && !autoSign && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-white/50 text-xs">Session verified — enable Auto-Sign for instant bets</span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RewardWalletSection({ linkedWallet }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [existingWallet, setExistingWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { checkStatus(); }, []);

  const checkStatus = async () => {
    try {
      const user = await base44.auth.me();
      if (user?.role !== 'admin') { setLoading(false); return; }
      setIsAdmin(true);
      const wallets = await base44.entities.PacmanRewardWallet.filter({ is_active: true });
      if (wallets.length > 0) setExistingWallet(wallets[0]);
    } catch {}
    setLoading(false);
  };

  const setAsRewardWallet = async () => {
    if (!linkedWallet?.mnemonic || !linkedWallet?.address) {
      toast.error('No Terra wallet with seed phrase linked');
      return;
    }
    setSaving(true);
    try {
      // Deactivate any existing reward wallet
      if (existingWallet) {
        await base44.entities.PacmanRewardWallet.update(existingWallet.id, { is_active: false });
      }
      const addr = linkedWallet.address.startsWith('kaspa:') ? linkedWallet.address : `kaspa:${linkedWallet.address}`;
      const created = await base44.entities.PacmanRewardWallet.create({
        wallet_name: linkedWallet.label || 'Terra Reward Wallet',
        kaspa_address: addr,
        encrypted_mnemonic: linkedWallet.mnemonic,
        is_active: true,
      });
      setExistingWallet(created);
      toast.success('PACMAN reward wallet set! Settlement bot will use this for KRC-20 bonuses.');
    } catch (err) {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  if (!isAdmin || loading) return null;

  return (
    <div className="mb-5">
      <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2">PACMAN Reward Wallet</p>
      {existingWallet ? (
        <div className="p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold">Active</span>
          </div>
          <p className="text-white/40 text-[9px] font-mono truncate">{existingWallet.kaspa_address}</p>
          <p className="text-white/20 text-[9px]">Settlement bot sends PACMAN bonuses from this wallet</p>
          {linkedWallet?.address && linkedWallet.address !== existingWallet.kaspa_address && linkedWallet.address !== existingWallet.kaspa_address?.replace('kaspa:', '') && (
            <button
              onClick={setAsRewardWallet}
              disabled={saving}
              className="mt-1 w-full py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/25 rounded-lg text-yellow-400 text-[10px] font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wallet className="w-3 h-3" />}
              Switch to current Terra wallet
            </button>
          )}
        </div>
      ) : linkedWallet?.mnemonic ? (
        <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl space-y-2">
          <p className="text-white/30 text-[10px]">Use your linked Terra wallet to distribute PACMAN KRC-20 bonuses to winners.</p>
          <button
            onClick={setAsRewardWallet}
            disabled={saving}
            className="w-full py-2 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 rounded-lg text-yellow-400 text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Coins className="w-3.5 h-3.5" />}
            Set as PACMAN Reward Wallet
          </button>
        </div>
      ) : (
        <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <p className="text-white/20 text-[10px]">Link a Terra wallet with seed phrase above to enable PACMAN rewards.</p>
        </div>
      )}
    </div>
  );
}