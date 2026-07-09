import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  Loader2, RefreshCw, Copy, Check, ArrowUpRight, ArrowDownLeft,
  ExternalLink, ArrowRight, Globe, Coins, Activity, TrendingUp, TrendingDown, Wallet
} from "lucide-react";

const IOS_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const KASPA_LOGO = "https://cryptologos.cc/logos/kaspa-kas-logo.png";

const KRC_LABELS = {
  krc20: "KRC-20 Token",
  krc721: "KRC-721 NFT",
  kcc: "KCC Canonical",
  dapp: "DApp / Builder",
  explorer: "Just Exploring",
};

function truncateAddress(addr) {
  if (!addr) return "";
  const clean = addr.startsWith("kaspa:") ? addr : `kaspa:${addr}`;
  return `${clean.slice(0, 10)}…${clean.slice(-6)}`;
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function KaspaDashboard({ address, source, price, priceChange, preferences, onClose, navigate }) {
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const cleanAddress = address ? (address.startsWith("kaspa:") ? address : `kaspa:${address}`) : "";

  useEffect(() => {
    if (!cleanAddress) return;
    fetchBalance();
    fetchTransactions();
  }, [cleanAddress]);

  const fetchBalance = async () => {
    setBalanceLoading(true);
    try {
      const res = await base44.functions.invoke("getKaspaBalance", { address: cleanAddress });
      const data = res?.data || res;
      setBalance(typeof data?.balanceKAS === "number" ? data.balanceKAS : 0);
    } catch {
      setBalance(0);
    }
    setBalanceLoading(false);
  };

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const res = await base44.functions.invoke("getKaspaTransactionHistory", { address: cleanAddress });
      const data = res?.data || res;
      setTransactions(Array.isArray(data?.transactions) ? data.transactions.slice(0, 6) : []);
    } catch {
      setTransactions([]);
    }
    setTxLoading(false);
  };

  const copyAddress = () => {
    if (!cleanAddress) return;
    navigator.clipboard?.writeText(cleanAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const usdValue = balance != null && price != null ? balance * price : null;
  const krcLabel = KRC_LABELS[preferences?.krcType] || null;
  const siteUrl = preferences?.site || null;
  const siteDisplay = siteUrl ? siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-8" style={{ fontFamily: IOS_FONT }}>
      {/* ===== Balance Card ===== */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0A84FF 0%, #0050B3 100%)", boxShadow: "0 8px 32px rgba(10,132,255,0.3)" }}>
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="absolute -left-6 -bottom-8 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-white/70">Total Balance</span>
            <button onClick={fetchBalance} className="text-white/60 hover:text-white transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${balanceLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {balanceLoading ? (
            <div className="flex items-center gap-2 py-1">
              <Loader2 className="w-5 h-5 animate-spin text-white/70" />
              <span className="text-sm text-white/70">Fetching balance…</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tabular-nums">
                  {(balance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-semibold text-white/70">KAS</span>
              </div>
              {usdValue != null && (
                <div className="text-sm text-white/60 tabular-nums mt-0.5">
                  ≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                </div>
              )}
            </>
          )}
          {cleanAddress && (
            <button onClick={copyAddress}
              className="mt-3 flex items-center gap-1.5 text-xs text-white/60 hover:text-white/80 transition-colors">
              <span className="font-mono">{truncateAddress(cleanAddress)}</span>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </motion.div>

      {/* ===== Quick Actions ===== */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: "Send", icon: ArrowUpRight, path: "/Bridge" },
          { label: "Receive", icon: ArrowDownLeft, path: "/Receive" },
          { label: "History", icon: Activity, path: "/History" },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.label}
              onClick={() => { onClose?.(); navigate(action.path); }}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl active:scale-95 transition-transform"
              style={{ background: "rgba(28,28,30,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: "rgba(10,132,255,0.15)" }}>
                <Icon className="w-4 h-4" style={{ color: "#0A84FF" }} />
              </div>
              <span className="text-xs font-medium text-white/70">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===== Your Kaspa Profile (preferences) ===== */}
      {(krcLabel || siteDisplay) && (
        <div className="mt-4 rounded-2xl p-4"
          style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-[10px] uppercase tracking-wide text-white/40 mb-3">Your Kaspa Profile</div>
          {krcLabel && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(10,132,255,0.12)" }}>
                <Coins className="w-4 h-4" style={{ color: "#0A84FF" }} />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-white/40">Standard</div>
                <div className="text-sm font-semibold text-white">{krcLabel}</div>
              </div>
            </div>
          )}
          {siteDisplay && (
            <a href={siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 active:opacity-70 transition-opacity">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(48,209,88,0.12)" }}>
                <Globe className="w-4 h-4" style={{ color: "#30D158" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-white/40">Website</div>
                <div className="text-sm font-medium text-white truncate">{siteDisplay}</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            </a>
          )}
        </div>
      )}

      {/* ===== Price Ticker ===== */}
      {price != null && (
        <div className="mt-4 rounded-2xl p-4 flex items-center justify-between"
          style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <img src={KASPA_LOGO} alt="Kaspa" className="w-8 h-8 object-contain" />
            <div>
              <div className="text-sm font-semibold text-white">KAS / USD</div>
              <div className="text-[10px] text-white/40">Live Price</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white tabular-nums">
              ${price < 1 ? price.toFixed(4) : price.toFixed(2)}
            </div>
            {priceChange != null && (
              <div className="text-xs font-medium tabular-nums flex items-center justify-end"
                style={{ color: priceChange >= 0 ? "#30D158" : "#FF453A" }}>
                {priceChange >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Recent Activity ===== */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">Recent Activity</span>
          <button onClick={fetchTransactions} className="text-white/40 hover:text-white/70 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${txLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {txLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-white/40" />
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((tx, i) => {
              const isReceive = tx.type === "receive";
              return (
                <div key={tx.id || i}
                  className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-white/5" : ""}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: isReceive ? "rgba(48,209,88,0.12)" : "rgba(255,69,58,0.12)" }}>
                    {isReceive
                      ? <ArrowDownLeft className="w-4 h-4 text-[#30D158]" />
                      : <ArrowUpRight className="w-4 h-4 text-[#FF453A]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{isReceive ? "Received" : "Sent"}</div>
                    <div className="text-[10px] text-white/30 font-mono truncate">{tx.id?.slice(0, 16)}…</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold tabular-nums"
                      style={{ color: isReceive ? "#30D158" : "#FF453A" }}>
                      {isReceive ? "+" : "−"}{tx.amount?.toFixed(2)} KAS
                    </div>
                    <div className="text-[10px] text-white/30">{timeAgo(tx.timestamp)}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Activity className="w-6 h-6 text-white/20 mb-2" />
              <p className="text-xs text-white/40">No transactions yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== Open TTT Platform ===== */}
      <button onClick={() => { onClose?.(); navigate("/Home"); }}
        className="w-full mt-5 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        style={{ background: "#0A84FF", color: "#fff", boxShadow: "0 4px 24px rgba(10,132,255,0.35)" }}>
        Open TTT Platform <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}