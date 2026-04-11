import React, { useState, useEffect } from "react";
import { Copy, Check, Loader2, Wallet, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function PacmanRewardPanel({ isAdmin }) {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  // One-time mnemonic shown only during creation session
  const [backupMnemonic, setBackupMnemonic] = useState(null);
  const [mnemonicAcknowledged, setMnemonicAcknowledged] = useState(false);

  useEffect(() => { fetchBalance(); }, []);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getPacmanRewardBalance', {});
      setWalletData(res.data);
    } catch (err) {
      console.error('Failed to fetch PACMAN balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async () => {
    setCreating(true);
    try {
      const res = await base44.functions.invoke('createPacmanRewardWallet', {});
      if (res.data?.success) {
        // Show mnemonic ONCE — user must acknowledge before it disappears
        setBackupMnemonic(res.data.mnemonic_backup);
        toast.success('Reward wallet created!');
        fetchBalance();
      } else {
        toast.error(res.data?.error || 'Failed to create wallet');
      }
    } catch (err) {
      toast.error('Failed to create wallet');
    } finally {
      setCreating(false);
    }
  };

  const copyAddress = () => {
    if (!walletData?.address) return;
    navigator.clipboard.writeText(walletData.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied');
  };

  // One-time mnemonic backup modal — never persisted in frontend
  if (backupMnemonic && !mnemonicAcknowledged) {
    return (
      <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400 font-black text-sm">BACKUP YOUR SEED PHRASE NOW</span>
        </div>
        <p className="text-red-300/60 text-[10px]">
          This is the ONLY time this mnemonic will be shown. The settlement bot stores it securely in the admin-only database.
          Write it down or save it somewhere safe.
        </p>
        <div className="p-3 bg-black/50 border border-red-500/20 rounded-xl">
          <p className="text-white font-mono text-xs leading-relaxed break-all select-all">{backupMnemonic}</p>
        </div>
        <button
          onClick={() => {
            setMnemonicAcknowledged(true);
            setBackupMnemonic(null);
          }}
          className="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black hover:bg-red-500/30 transition-all"
        >
          I HAVE SAVED MY SEED PHRASE
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
        <span className="text-white/30 text-xs">Loading PACMAN wallet...</span>
      </div>
    );
  }

  // No wallet exists yet — admin can create
  if (!walletData?.exists) {
    if (!isAdmin) return null;
    return (
      <div className="p-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/15 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🟡</span>
          <span className="text-yellow-400 text-xs font-black">PACMAN Reward Wallet</span>
        </div>
        <p className="text-white/30 text-[10px]">
          Create a dedicated wallet for PACMAN KRC-20 rewards. The bot will use this wallet to send bonus tokens to winners.
        </p>
        <button
          onClick={createWallet}
          disabled={creating}
          className="px-4 py-2 rounded-xl bg-yellow-500/15 border border-yellow-500/25 text-yellow-400 text-xs font-bold hover:bg-yellow-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
          {creating ? 'Creating...' : 'Create PACMAN Reward Wallet'}
        </button>
      </div>
    );
  }

  // Wallet exists — show balance
  return (
    <div className="p-3.5 rounded-2xl bg-yellow-500/5 border border-yellow-500/15">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🟡</span>
          <span className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">PACMAN Rewards</span>
        </div>
        <a
          href={`https://explorer.kaspa.org/addresses/${walletData.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/20 hover:text-yellow-400 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <div className="flex items-center gap-3">
        <div>
          <p className="text-yellow-400 text-lg font-black">{walletData.pacman_balance.toLocaleString()} PACMAN</p>
          <p className="text-white/20 text-[9px]">{walletData.kas_balance.toFixed(4)} KAS (gas)</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={copyAddress}
            className="flex items-center gap-1 px-2 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-md transition-all"
          >
            <span className="text-white/30 text-[8px] font-mono">{walletData.address?.slice(0, 16)}...</span>
            {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-white/20" />}
          </button>
        </div>
      </div>
    </div>
  );
}