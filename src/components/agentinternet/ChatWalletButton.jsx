import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Eye, EyeOff, Copy, Trash2, Plus, Download, X } from "lucide-react";
import OrganicOrb from "@/components/agentinternet/OrganicOrb";
import { getWallet, generateWallet, clearWallet } from "@/lib/localKaspaWallet";
import AgentWalletLinkButton from "@/components/agentinternet/AgentWalletLinkButton";

export default function ChatWalletButton() {
  const [wallet, setWallet] = useState(() => getWallet());
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState("");

  const copy = (k, v) => {
    try { navigator.clipboard?.writeText(v); } catch {}
    setCopied(k);
    setTimeout(() => setCopied(""), 1500);
  };

  const gen = () => { setWallet(generateWallet()); setRevealed(false); };
  const clear = () => { clearWallet(); setWallet(null); setRevealed(false); };

  const exportJson = () => {
    if (!wallet) return;
    const blob = new Blob([JSON.stringify(wallet, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ttt-kaspa-wallet.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        title="Local wallet"
      >
        <OrganicOrb size={18} colors={["#67e8f9", "#22d3ee", "#10b981"]} glow={false} />
        {wallet && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-black" />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[110]"
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="fixed top-14 right-3 z-[111] w-[calc(100vw-1.5rem)] max-w-[280px] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
                <Wallet className="w-3.5 h-3.5 text-cyan-300" />
                <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-200/80">Local Wallet</span>
                <span className="ml-auto text-[8px] font-mono uppercase text-white/30">on-device</span>
                <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {wallet ? (
                <div className="p-3 space-y-3">
                  <div className="text-[10px] font-mono">
                    <div className="text-white/40 mb-0.5">address</div>
                    <button onClick={() => copy("address", wallet.address)} className="text-cyan-300 break-all text-left hover:underline">
                      {wallet.address}
                    </button>
                  </div>
                  <div className="text-[10px] font-mono">
                    <div className="text-white/40 mb-0.5 flex items-center justify-between">
                      <span>private key</span>
                      <button onClick={() => setRevealed((v) => !v)} className="text-cyan-300/80 hover:text-cyan-200 flex items-center gap-1">
                        {revealed ? <><EyeOff className="w-3 h-3" /> hide</> : <><Eye className="w-3 h-3" /> reveal</>}
                      </button>
                    </div>
                    <button onClick={() => copy("key", wallet.privateKey)} className="text-white/80 break-all text-left hover:underline block">
                      {revealed ? wallet.privateKey : "•".repeat(52)}
                    </button>
                  </div>
                  {copied && <div className="text-emerald-300 text-[9px] font-mono">copied {copied}</div>}

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button onClick={exportJson} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-white/5 border border-white/10 text-[9px] font-mono uppercase text-white/70 hover:bg-white/10">
                      <Download className="w-3.5 h-3.5" /> export
                    </button>
                    <button onClick={gen} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-[9px] font-mono uppercase text-cyan-300 hover:bg-cyan-400/20">
                      <Plus className="w-3.5 h-3.5" /> new
                    </button>
                    <button onClick={clear} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[9px] font-mono uppercase text-red-300 hover:bg-red-500/20">
                      <Trash2 className="w-3.5 h-3.5" /> clear
                    </button>
                  </div>
                  <div className="pt-1 border-t border-white/10">
                    <AgentWalletLinkButton compact />
                  </div>
                  <p className="text-[8px] text-white/30 leading-snug font-mono">
                    Generated entirely on this device. Private key never touched the server. Export before clearing browser data.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  <p className="text-[10px] text-white/40 font-mono leading-snug">No local wallet yet. Generate one on-device — your keys never leave the browser.</p>
                  <button onClick={gen} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-cyan-400 text-black text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-300">
                    <Plus className="w-3.5 h-3.5" /> generate wallet
                  </button>
                  <p className="text-[9px] text-white/30 font-mono leading-snug pt-1">After generating, tap <b className="text-cyan-300">Link to AgentInternet</b> so the agent can read this wallet.</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}