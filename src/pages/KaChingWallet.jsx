import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Download, Loader2, RefreshCw, Shield, Send, ArrowDownToLine, Layers, BookOpen, KeyRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  getKaChingWallet, createKaChingWallet, importKaChingWallet, clearKaChingWallet,
  getAllOwnedAddresses, isValidKaspaAddress,
} from "@/lib/kachingVault";
import KaChingWalletManager from "@/components/kaching/KaChingWalletManager";

const KACHING_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/8aaa56df8_generated_image.png";
import KaChingReceive from "@/components/kaching/KaChingReceive";
import KaChingSend from "@/components/kaching/KaChingSend";
import KaChingMultisig from "@/components/kaching/KaChingMultisig";
import KaChingTutorial from "@/components/kaching/KaChingTutorial";

export default function KaChingWalletPage() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(getKaChingWallet());
  const [tab, setTab] = useState("receive");
  const [balance, setBalance] = useState(null);
  const [loadingBal, setLoadingBal] = useState(false);
  const [importKey, setImportKey] = useState("");
  const [importErr, setImportErr] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showManager, setShowManager] = useState(false);

  // Re-sync active wallet + balances after any manager action (switch / new / import / exit).
  const syncFromManager = () => {
    setWallet(getKaChingWallet());
    setRefreshKey((k) => k + 1);
    loadBalance();
  };

  const loadBalance = useCallback(async () => {
    const addrs = getAllOwnedAddresses();
    if (addrs.length === 0) { setBalance(0); return; }
    setLoadingBal(true);
    try {
      const results = await Promise.all(
        addrs.map((a) => base44.functions.invoke("getKaspaBalance", { address: a.address }).catch(() => null))
      );
      let total = 0;
      for (const r of results) {
        const d = r?.data || r;
        if (d && (d.balanceKAS ?? d.balance) != null) total += Number(d.balanceKAS ?? d.balance) / (d.balanceKAS != null ? 1 : 1e8);
      }
      setBalance(total);
    } catch { setBalance(0); }
    finally { setLoadingBal(false); }
  }, []);

  useEffect(() => { if (wallet) loadBalance(); }, [wallet, refreshKey, loadBalance]);

  const doCreate = () => { setWallet(createKaChingWallet()); setRefreshKey((k) => k + 1); };
  const doImport = () => {
    setImportErr("");
    try { setWallet(importKaChingWallet(importKey)); setImportKey(""); setRefreshKey((k) => k + 1); }
    catch (e) { setImportErr(e.message); }
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header onBack={() => navigate("/AppStoreV2")} onTutorial={() => setShowTutorial(true)} onManager={() => setShowManager(true)} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
          <img src={KACHING_LOGO} alt="KaChing Wallet" className="w-20 h-20 rounded-2xl object-cover mb-5 shadow-[0_0_30px_rgba(34,211,238,0.4)]" />
          <h1 className="text-2xl font-black tracking-tight mb-1">KaChing Wallet</h1>
          <p className="text-sm text-white/50 text-center mb-8 max-w-xs">
            Privacy-first Kaspa wallet — fresh receive addresses, manual UTXO coin control, and m-of-n multisig vaults.
          </p>
          <button onClick={doCreate} className="w-full h-12 rounded-xl bg-cyan-500 text-black font-semibold text-sm flex items-center justify-center gap-2 hover:bg-cyan-400 mb-3">
            <Wallet className="w-4 h-4" /> Create new wallet
          </button>
          <div className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
            <input
              value={importKey}
              onChange={(e) => setImportKey(e.target.value)}
              placeholder="Paste private key (64 hex)"
              className="w-full h-10 px-3 rounded-lg bg-black/40 border border-white/10 text-sm text-white font-mono outline-none focus:border-cyan-400/50"
            />
            <button onClick={doImport} className="w-full h-10 rounded-lg border border-white/15 bg-white/5 text-sm text-white/80 flex items-center justify-center gap-2 hover:bg-white/10">
              <Download className="w-4 h-4" /> Import wallet
            </button>
            {importErr && <div className="text-xs text-red-400">{importErr}</div>}
          </div>
          <p className="text-[10px] text-white/30 text-center mt-6 max-w-xs leading-relaxed">
            Keys are generated + stored on this device only. Nothing is sent to a server. Built on top of TTT's real Kaspa signing.
          </p>
        </div>
        <KaChingTutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
        <KaChingWalletManager open={showManager} onClose={() => setShowManager(false)} onChanged={syncFromManager} />
      </div>
    );
  }

  const tabs = [
    { id: "receive", label: "Receive", icon: ArrowDownToLine },
    { id: "send", label: "Send", icon: Send },
    { id: "multisig", label: "Approve", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header onBack={() => navigate("/AppStoreV2")} balance={balance} loadingBal={loadingBal} onRefresh={() => { setRefreshKey((k) => k + 1); loadBalance(); }} onTutorial={() => setShowTutorial(true)} onManager={() => setShowManager(true)} />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pb-28 pt-4">
        {tab === "receive" && <KaChingReceive refreshKey={refreshKey} onActivity={() => setRefreshKey((k) => k + 1)} />}
        {tab === "send" && <KaChingSend key={refreshKey} onActivity={() => setRefreshKey((k) => k + 1)} />}
        {tab === "multisig" && <KaChingMultisig key={refreshKey} onActivity={() => setRefreshKey((k) => k + 1)} />}
      </div>

      <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-40 bg-black/90 backdrop-blur-xl border-t border-white/10" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex">
          {tabs.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 ${on ? "text-cyan-300" : "text-white/50"}`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-mono uppercase tracking-widest">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <KaChingTutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
      <KaChingWalletManager open={showManager} onClose={() => setShowManager(false)} onChanged={syncFromManager} />
    </div>
  );
}

function Header({ onBack, balance, loadingBal, onRefresh, onTutorial, onManager }) {
  return (
    <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/70 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> <span className="text-sm">Store</span>
        </button>
        <div className="flex items-center gap-2">
          <img src={KACHING_LOGO} alt="KaChing Wallet" className="w-7 h-7 rounded-lg object-cover" />
          <span className="text-sm font-bold">KaChing Wallet</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onManager} title="Keys & Wallets" className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-cyan-300">
            <KeyRound className="w-4 h-4" />
          </button>
          <button onClick={onTutorial} title="Tutorial" className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-cyan-300">
            <BookOpen className="w-4 h-4" />
          </button>
          <button onClick={onRefresh} className="text-white/60 hover:text-white">
            <RefreshCw className={`w-4 h-4 ${loadingBal ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      {balance != null && (
        <div className="max-w-md mx-auto px-4 pb-3 text-center">
          <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">Total balance</div>
          <div className="text-2xl font-black tabular-nums">{Number(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-white/40 text-base">KAS</span></div>
        </div>
      )}
    </div>
  );
}