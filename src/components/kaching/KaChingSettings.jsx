import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Lock, Copy, Check, Shield, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function KaChingSettings({ show, onClose, walletAddress, onConnectWallet, onDisconnectWallet, walletBalance }) {
  const [manualAddr, setManualAddr] = useState("");
  const [pin, setPin] = useState("");
  const [storedPin, setStoredPin] = useState("");
  const [pinVisible, setPinVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gameAddress, setGameAddress] = useState("");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kaching_pin');
    if (saved) setStoredPin(saved);
    const savedVerified = localStorage.getItem('kaching_verified');
    if (savedVerified === 'true') setVerified(true);
  }, []);

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
    toast.success('Verified! You can now bet seamlessly.');
    onClose();
  };

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(`kaspa:${walletAddress}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied');
  };

  if (!show) return null;

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
          className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-5 w-full max-w-sm max-h-[80vh] overflow-y-auto"
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
            <p className="text-white/25 text-[10px] mb-2">Set a PIN to verify bets without signing every time</p>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <input
                  type={pinVisible ? 'text' : 'password'}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={storedPin ? '••••' : 'Enter 4-6 digit PIN'}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 pr-10"
                  maxLength={6}
                />
                <button onClick={() => setPinVisible(!pinVisible)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30">
                  {pinVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!storedPin && (
                <button onClick={savePin} className="px-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 text-sm font-semibold">
                  Save
                </button>
              )}
            </div>
            {storedPin && (
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400/60 text-[10px]">PIN set</span>
                <button onClick={() => { setStoredPin(''); localStorage.removeItem('kaching_pin'); setVerified(false); localStorage.removeItem('kaching_verified'); toast.success('PIN cleared'); }} className="text-red-400/50 text-[10px] hover:text-red-400 ml-auto">
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Verify & Join */}
          {storedPin && walletAddress && !verified && (
            <div className="mb-5">
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2">Verify Session</p>
              <p className="text-white/25 text-[10px] mb-2">Enter your PIN to enable seamless betting</p>
              <button
                onClick={verifyAndJoin}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl text-black font-black text-sm shadow-lg shadow-emerald-500/20"
              >
                Verify & Join Games
              </button>
            </div>
          )}

          {verified && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-xs font-bold">Session verified — seamless betting active</span>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}