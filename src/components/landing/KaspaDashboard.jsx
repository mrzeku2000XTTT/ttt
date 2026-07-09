import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Copy, Check } from "lucide-react";
import { IOS_FONT, KASPA_LOGO, PREFS_KEY, truncateAddress, isDesktop, normalizeAddress } from "./kaspa-dashboard/shared";
import TabNav from "./kaspa-dashboard/TabNav";
import WalletSwitcher from "./kaspa-dashboard/WalletSwitcher";
import OverviewPanel from "./kaspa-dashboard/OverviewPanel";
import SendPanel from "./kaspa-dashboard/SendPanel";
import ReceivePanel from "./kaspa-dashboard/ReceivePanel";
import StatsPanel from "./kaspa-dashboard/StatsPanel";
import AIPanel from "./kaspa-dashboard/AIPanel";
import SettingsPanel from "./kaspa-dashboard/SettingsPanel";

export default function KaspaDashboard({ address: initialAddress, source, price, priceChange, preferences: initialPrefs, onClose, navigate }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [wallets, setWallets] = useState({ kasware: null, ttt: null });
  const [activeWallet, setActiveWallet] = useState("ttt");
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [localPrefs, setLocalPrefs] = useState(initialPrefs || { krcType: null, site: "" });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [newTxDetected, setNewTxDetected] = useState(false);
  const [networkActivity, setNetworkActivity] = useState(0);
  const prevTxRef = useRef([]);
  const desktop = isDesktop();

  // Detect both wallets on mount
  useEffect(() => {
    detectWallets();
    // Load preferences from localStorage (in case updated in Settings)
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
      if (saved) setLocalPrefs(saved);
    } catch {}
  }, []);

  const detectWallets = async () => {
    let kaswareAddr = null;
    let tttAddr = null;

    // Kasware wallet
    if (typeof window.kasware !== "undefined") {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts?.length > 0) kaswareAddr = accounts[0];
      } catch {}
    }

    // TTT wallet (from user profile)
    try {
      const me = await base44.auth.me();
      tttAddr = me?.created_wallet_address || me?.kasware_address || null;
    } catch {}

    // Fallback to initial address if nothing detected
    if (!tttAddr && initialAddress) tttAddr = initialAddress;

    setWallets({ kasware: kaswareAddr, ttt: tttAddr });

    // Set active wallet: desktop can choose, mobile defaults to TTT
    if (!desktop) {
      setActiveWallet("ttt");
    } else {
      // On desktop, default to whatever was detected as source
      if (source === "kasware" && kaswareAddr) setActiveWallet("kasware");
      else setActiveWallet("ttt");
    }
  };

  // Get active wallet address
  const activeAddress = activeWallet === "kasware" ? wallets.kasware : wallets.ttt;
  const cleanAddress = normalizeAddress(activeAddress || initialAddress);

  // Fetch balance + transactions when active wallet changes
  useEffect(() => {
    if (!cleanAddress) return;
    fetchBalance();
    fetchTransactions();
  }, [cleanAddress]);

  const fetchBalance = async (silent = false) => {
    if (!silent) setBalanceLoading(true);
    try {
      const res = await base44.functions.invoke("getKaspaBalance", { address: cleanAddress });
      const data = res?.data || res;
      setBalance(typeof data?.balanceKAS === "number" ? data.balanceKAS : 0);
    } catch { if (!silent) setBalance(0); }
    if (!silent) setBalanceLoading(false);
    setLastUpdated(Date.now());
  };

  const fetchTransactions = async (silent = false) => {
    if (!silent) setTxLoading(true);
    try {
      const res = await base44.functions.invoke("getKaspaTransactionHistory", { address: cleanAddress });
      const data = res?.data || res;
      const newTxs = Array.isArray(data?.transactions) ? data.transactions.slice(0, 6) : [];
      if (silent && prevTxRef.current.length > 0 && newTxs.length > 0 && newTxs[0]?.id !== prevTxRef.current[0]?.id) {
        setNewTxDetected(true);
        setTimeout(() => setNewTxDetected(false), 3000);
      }
      prevTxRef.current = newTxs;
      setTransactions(newTxs);
    } catch { if (!silent) setTransactions([]); }
    if (!silent) setTxLoading(false);
    setLastUpdated(Date.now());
  };

  const fetchNetworkActivity = async () => {
    try {
      const res = await base44.functions.invoke("getLiveKaspaTransactions", {});
      const data = res?.data || res;
      setNetworkActivity(Array.isArray(data?.transactions) ? data.transactions.length : 0);
    } catch {}
  };

  // Auto-poll for live transaction + balance updates every 15s
  useEffect(() => {
    if (!cleanAddress) return;
    fetchNetworkActivity();
    const interval = setInterval(() => {
      setAutoRefreshing(true);
      Promise.all([fetchBalance(true), fetchTransactions(true), fetchNetworkActivity()]).finally(() => {
        setTimeout(() => setAutoRefreshing(false), 500);
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [cleanAddress]);

  const copyAddress = () => {
    if (!cleanAddress) return;
    navigator.clipboard?.writeText(cleanAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePrefsUpdate = (prefs) => {
    setLocalPrefs(prefs);
  };

  const renderPanel = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewPanel balance={balance} balanceLoading={balanceLoading} transactions={transactions} txLoading={txLoading}
          price={price} priceChange={priceChange} address={cleanAddress} activeWallet={activeWallet}
          preferences={localPrefs} onRefreshBalance={fetchBalance} onRefreshTx={fetchTransactions}
          onCopy={copyAddress} copied={copied} onTabChange={setActiveTab}
          lastUpdated={lastUpdated} autoRefreshing={autoRefreshing} newTxDetected={newTxDetected} networkActivity={networkActivity} />;
      case "send":
        return <SendPanel address={cleanAddress} activeWallet={activeWallet} balance={balance} price={price}
          onSwitchToReceive={() => setActiveTab("receive")} />;
      case "receive":
        return <ReceivePanel address={cleanAddress} activeWallet={activeWallet} />;
      case "stats":
        return <StatsPanel preferences={localPrefs} />;
      case "ai":
        return <AIPanel balance={balance} address={cleanAddress} activeWallet={activeWallet} price={price}
          preferences={localPrefs} activeTab={activeTab} />;
      case "settings":
        return <SettingsPanel preferences={localPrefs} onUpdate={handlePrefsUpdate} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col" style={{ fontFamily: IOS_FONT }}>
      {/* Wallet Switcher (desktop only) */}
      {desktop && (wallets.kasware || wallets.ttt) && (
        <div className="flex justify-center px-5 pb-2">
          <WalletSwitcher activeWallet={activeWallet} onChange={setActiveWallet}
            kaswareAddress={wallets.kasware} tttAddress={wallets.ttt} />
        </div>
      )}

      {/* Active wallet address display (mobile shows TTT wallet info) */}
      {cleanAddress && (
        <div className="flex items-center justify-center gap-1.5 px-5 pb-1">
          <span className="text-[10px] text-white/30">
            {activeWallet === "kasware" ? "Kasware" : "TTT Wallet"}:
          </span>
          <button onClick={copyAddress} className="text-[10px] font-mono text-white/50 hover:text-white/80 transition-colors flex items-center gap-1">
            {truncateAddress(cleanAddress)}
            {copied ? <Check className="w-2.5 h-2.5 text-[#30D158]" /> : <Copy className="w-2.5 h-2.5" />}
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto pb-4">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="pt-3">
            {renderPanel()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <div className="px-5 pb-4 pt-2">
        <button onClick={() => { onClose?.(); navigate("/Home"); }}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ background: "#0A84FF", color: "#fff", boxShadow: "0 2px 12px rgba(10,132,255,0.2)" }}>
          Open TTT Platform <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}