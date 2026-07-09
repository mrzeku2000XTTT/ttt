import React from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, Copy, Check, ArrowUpRight, ArrowDownLeft, Activity, TrendingUp, TrendingDown, Coins, Globe, ExternalLink } from "lucide-react";
import { IOS_FONT, KASPA_LOGO, KRC_LABELS, truncateAddress, timeAgo, normalizeAddress } from "./shared";

export default function OverviewPanel({ balance, balanceLoading, transactions, txLoading, price, priceChange, address, activeWallet, preferences, onRefreshBalance, onRefreshTx, onCopy, copied, onTabChange, lastUpdated, autoRefreshing, newTxDetected, networkActivity }) {
  const usdValue = balance != null && price != null ? balance * price : null;
  const totalSent = transactions.filter(t => t.type === "send").reduce((s, t) => s + (t.amount || 0), 0);
  const totalReceived = transactions.filter(t => t.type === "receive").reduce((s, t) => s + (t.amount || 0), 0);
  const netFlow = totalReceived - totalSent;
  const lastUpdatedText = lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;
  const krcLabel = KRC_LABELS[preferences?.krcType] || null;
  const siteUrl = preferences?.site || null;
  const siteDisplay = siteUrl ? siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
  const cleanAddress = normalizeAddress(address);

  return (
    <div className="px-5 space-y-4" style={{ fontFamily: IOS_FONT }}>
      {/* Slim Balance Bar */}
      <div className="flex items-end justify-between py-1">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-white/40">Total Balance</div>
          {balanceLoading ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />
              <span className="text-xs text-white/40">Loading…</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-white tabular-nums">
                  {(balance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-semibold text-white/50">KAS</span>
              </div>
              {usdValue != null && (
                <div className="text-xs text-white/40 tabular-nums">≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</div>
              )}
            </>
          )}
        </div>
        <button onClick={onRefreshBalance} className="text-white/30 hover:text-white/60 transition-colors mb-1">
          <RefreshCw className={`w-3.5 h-3.5 ${balanceLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Subtle Send / Receive Links */}
      <div className="flex items-center gap-4 text-xs">
        <button onClick={() => onTabChange("send")} className="flex items-center gap-1 text-[#0A84FF] hover:text-[#3da5ff] transition-colors">
          <ArrowUpRight className="w-3.5 h-3.5" /> Send
        </button>
        <span className="text-white/10">·</span>
        <button onClick={() => onTabChange("receive")} className="flex items-center gap-1 text-[#0A84FF] hover:text-[#3da5ff] transition-colors">
          <ArrowDownLeft className="w-3.5 h-3.5" /> Receive
        </button>
        <span className="text-white/10">·</span>
        <button onClick={onCopy} className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy Address"}
        </button>
      </div>

      {/* Kaspa Profile */}
      {(krcLabel || siteDisplay) && (
        <div className="rounded-2xl p-3.5" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-[10px] uppercase tracking-wide text-white/40 mb-2.5">Your Kaspa Profile</div>
          {krcLabel && (
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(10,132,255,0.12)" }}>
                <Coins className="w-3.5 h-3.5" style={{ color: "#0A84FF" }} />
              </div>
              <span className="text-[10px] text-white/40">Standard</span>
              <span className="text-xs font-semibold text-white ml-auto">{krcLabel}</span>
            </div>
          )}
          {siteDisplay && (
            <a href={siteUrl?.startsWith("http") ? siteUrl : `https://${siteUrl}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 active:opacity-70">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(48,209,88,0.12)" }}>
                <Globe className="w-3.5 h-3.5" style={{ color: "#30D158" }} />
              </div>
              <span className="text-xs text-white/50 truncate flex-1">{siteDisplay}</span>
              <ExternalLink className="w-3 h-3 text-white/30" />
            </a>
          )}
        </div>
      )}

      {/* Price Ticker */}
      {price != null && (
        <div className="rounded-2xl p-3.5 flex items-center justify-between" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2.5">
            <img src={KASPA_LOGO} alt="Kaspa" className="w-7 h-7 object-contain" />
            <div>
              <div className="text-xs font-semibold text-white">KAS / USD</div>
              <div className="text-[10px] text-white/40">Live Price</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-white tabular-nums">
              ${price < 1 ? price.toFixed(4) : price.toFixed(2)}
            </div>
            {priceChange != null && (
              <div className="text-[10px] font-medium tabular-nums flex items-center justify-end"
                style={{ color: priceChange >= 0 ? "#30D158" : "#FF453A" }}>
                {priceChange >= 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl p-3" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-[9px] uppercase tracking-wide text-white/40 mb-1">Received</div>
          <div className="text-sm font-bold text-[#30D158] tabular-nums">+{totalReceived.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl p-3" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-[9px] uppercase tracking-wide text-white/40 mb-1">Sent</div>
          <div className="text-sm font-bold text-[#FF453A] tabular-nums">−{totalSent.toFixed(2)}</div>
        </div>
        <div className="rounded-2xl p-3" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-[9px] uppercase tracking-wide text-white/40 mb-1">Net Flow</div>
          <div className="text-sm font-bold tabular-nums" style={{ color: netFlow >= 0 ? "#30D158" : "#FF453A" }}>
            {netFlow >= 0 ? "+" : ""}{netFlow.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Network Pulse */}
      <div className="rounded-2xl p-3.5 flex items-center justify-between" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(10,132,255,0.12)" }}>
            <Activity className="w-3.5 h-3.5" style={{ color: "#0A84FF" }} />
            {autoRefreshing && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#30D158] animate-ping" />}
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Kaspa Network</div>
            <div className="text-[10px] text-white/40">{networkActivity} recent transactions detected</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
          <span className="text-[10px] font-medium text-[#30D158]">LIVE</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/70">Recent Activity</span>
            {newTxDetected && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#30D158]/20 text-[#30D158] font-medium">
                New
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastUpdatedText && <span className="text-[9px] text-white/25">Updated {lastUpdatedText}</span>}
            <button onClick={() => onRefreshTx()} className="text-white/30 hover:text-white/60 transition-colors">
              <RefreshCw className={`w-3 h-3 ${txLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {txLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-white/40" />
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((tx, i) => {
              const isReceive = tx.type === "receive";
              return (
                <div key={tx.id || i} className={`flex items-center gap-3 px-3.5 py-2.5 ${i > 0 ? "border-t border-white/5" : ""}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: isReceive ? "rgba(48,209,88,0.12)" : "rgba(255,69,58,0.12)" }}>
                    {isReceive ? <ArrowDownLeft className="w-3.5 h-3.5 text-[#30D158]" /> : <ArrowUpRight className="w-3.5 h-3.5 text-[#FF453A]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white">{isReceive ? "Received" : "Sent"}</div>
                    <div className="text-[10px] text-white/30 font-mono truncate">{tx.id?.slice(0, 16)}…</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-semibold tabular-nums" style={{ color: isReceive ? "#30D158" : "#FF453A" }}>
                      {isReceive ? "+" : "−"}{tx.amount?.toFixed(2)} KAS
                    </div>
                    <div className="text-[10px] text-white/30">{timeAgo(tx.timestamp)}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative mb-2">
                <Activity className="w-5 h-5 text-white/15" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
              </div>
              <p className="text-[10px] text-white/30 mb-0.5">No transactions yet</p>
              <p className="text-[9px] text-white/20">Watching for incoming KAS…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}