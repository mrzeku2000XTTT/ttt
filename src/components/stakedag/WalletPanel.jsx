import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, X, Lock, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function WalletPanel({ walletAddress, walletBalance, onConnect, onDisconnect, show, onClose }) {
  const [manualAddr, setManualAddr] = useState("");
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Address copied");
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-5 w-full max-w-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-bold">Wallet</h3>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          {walletAddress ? (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Connected</p>
                <div className="flex items-center gap-2">
                  <code className="text-emerald-300 text-xs flex-1 truncate">{walletAddress}</code>
                  <button onClick={copyAddress} className="text-white/30 hover:text-emerald-400 transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Balance</p>
                <p className="text-white text-2xl font-black">{walletBalance.toFixed(2)} <span className="text-sm text-white/40">KAS</span></p>
              </div>

              <button
                onClick={() => { onDisconnect(); onClose(); }}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium transition-all"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Kasware */}
              {typeof window !== 'undefined' && window.kasware && (
                <button
                  onClick={async () => {
                    try {
                      const accounts = await window.kasware.requestAccounts();
                      if (accounts?.[0]) { onConnect(accounts[0]); onClose(); }
                    } catch { toast.error('Kasware connection failed'); }
                  }}
                  className="w-full p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-all text-left"
                >
                  <p className="text-white font-semibold text-sm">Kasware</p>
                  <p className="text-white/40 text-[10px]">Browser extension</p>
                </button>
              )}

              {/* Manual entry */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-white/40" />
                  <span className="text-white/70 text-sm font-medium">Enter Address</span>
                </div>
                <input
                  value={manualAddr}
                  onChange={e => setManualAddr(e.target.value)}
                  placeholder="kaspa:..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  onClick={() => {
                    if (!manualAddr.trim()) return;
                    onConnect(manualAddr.trim());
                    setManualAddr('');
                    onClose();
                  }}
                  disabled={!manualAddr.trim()}
                  className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-emerald-300 text-sm font-semibold disabled:opacity-40 transition-all"
                >
                  Connect
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}