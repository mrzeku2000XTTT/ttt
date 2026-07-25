import React from "react";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, Copy, Check, ArrowUpRight, ArrowDownLeft, Activity, TrendingUp, TrendingDown, Coins, Globe, ExternalLink } from "lucide-react";
import { IOS_FONT, KRC_LABELS, truncateAddress, timeAgo, normalizeAddress } from "./shared";
import LuxMark from "./LuxMark";

// ── Luxurious palette ──────────────────────────────────────────────
const GOLD = "#d4af37";
const GOLD_BRIGHT = "#e8c87a";
const CARD_BG = "rgba(255,255,255,0.025)";
const CARD_BORDER = "rgba(212,175,55,0.16)";
const CARD_BORDER_SOFT = "rgba(212,175,55,0.10)";

export default function OverviewPanel({ balance, balanceLoading, transactions, txLoading, price, priceChange, address, activeWallet, preferences, onRefreshBalance, onRefreshTx, onCopy, copied, onTabChange, lastUpdated, autoRefreshing, newTxDetected, networkActivity }) {
  const usdValue = balance != null && price != null ? balance * price : null;
  const totalSent = transactions.filter(t => t.type === "send").reduce((s, t) => s + (t.amount || 0), 0);
  const totalReceived = transactions.filter(t => t.type === "receive").reduce((s, t) => s + (t.amount || 0), 0);
  const netFlow = totalReceived - totalSent;
  const lastUpdatedText = lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;
  const krcLabel = KRC_LABELS[preferences?.krcType] || null;
  const siteUrl = preferences?.site || null;
  const siteDisplay = siteUrl ? siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;

  return (
    <div className="px-5 space-y-4 relative" style={{ fontFamily: IOS_FONT }}>
      {/* Ambient gold glow */}
      <div className="absolute inset-x-0 top-0 h-44 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(212,175,55,0.10), transparent 70%)" }} />

      {/* ── Balance Hero ── */}
      <div className="relative rounded-3xl p-5 overflow-hidden"
        style={{ background: "linear-gradient(160deg, rgba(212,175,55,0.07) 0%, rgba(255,255,255,0.02) 55%, rgba(0,0,0,0.2) 100%)", border: `1px solid ${CARD_BORDER}` }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: "rgba(232,200,122,0.6)" }}>Total Balance</div>
            {balanceLoading ? (
              <div className="flex items-center gap-1.5 mt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: GOLD_BRIGHT }} />
                <span className="text-xs text-white/40">Loading…</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tabular-nums"
                    style={{
                      background: "linear-gradient(180deg, #fbf3c4 0%, #e8c87a 40%, #d4af37 75%, #8a6d1f 100%)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>
                    {(balance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-semibold tracking-wide" style={{ color: GOLD_BRIGHT, opacity: 0.7 }}>KAS</span>
                </div>
                {usdValue != null && (
                  <div className="text-xs text-white/40 tabular-nums mt-1">≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</div>
                )}
              </>
            )}
          </div>
          <button onClick={onRefreshBalance} className="transition-colors p-1.5 rounded-full" style={{ color: GOLD, background: "rgba(212,175,55,0.06)" }} title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${balanceLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Refined Send / Receive / Copy */}
        <div className="flex items-center gap-5 mt-4 pt-3" style={{ borderTop: `1px solid ${CARD_BORDER_SOFT}` }}>
          <button onClick={() => onTabChange("send")} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: GOLD_BRIGHT }}>
            <ArrowUpRight className="w-3.5 h-3.5" /> Send
          </button>
          <button onClick={() => onTabChange("receive")} className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: GOLD_BRIGHT }}>
            <ArrowDownLeft className="w-3.5 h-3.5" /> Receive
          </button>
          <button onClick={onCopy} className="flex items-center gap-1.5 text-xs font-medium text-white/45 hover:text-white/80 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-[#5fd0a0]" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Address"}
          </button>
        </div>
      </div>

      {/* ── Kaspa Profile ── */}
      {(krcLabel || siteDisplay) && (
        <div className="relative rounded-3xl p-4" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER_SOFT}` }}>
          <div className="flex items-center gap-2 mb-3">
            <LuxMark size={14} glow={false} />
            <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "rgba(232,200,122,0.55)" }}>Your Kaspa Profile</div>
          </div>
          {krcLabel && (
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,175,55,0.10)", border: `1px solid ${CARD_BORDER_SOFT}` }}>
                <Coins className="w-3.5 h-3.5" style={{ color: GOLD_BRIGHT }} />
              </div>
              <span className="text-[10px] uppercase tracking-wide text-white/40">Standard</span>
              <span className="text-xs font-semibold text-white ml-auto">{krcLabel}</span>
            </div>
          )}
          {siteDisplay && (
            <a href={siteUrl?.startsWith("http") ? siteUrl : `https://${siteUrl}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 active:opacity-70">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(95,208,160,0.10)", border: `1px solid ${CARD_BORDER_SOFT}` }}>
                <Globe className="w-3.5 h-3.5" style={{ color: "#5fd0a0" }} />
              </div>
              <span className="text-xs text-white/55 truncate flex-1">{siteDisplay}</span>
              <ExternalLink className="w-3 h-3 text-white/30" />
            </a>
          )}
        </div>
      )}

      {/* ── Price Ticker ── */}
      {price != null && (
        <div className="relative rounded-3xl p-4 flex items-center justify-between" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER_SOFT}` }}>
          <div className="flex items-center gap-3">
            <LuxMark size={28} />
            <div>
              <div className="text-xs font-semibold text-white tracking-wide">KAS / USD</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(232,200,122,0.45)" }}>Live Price</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-bold text-white tabular-nums">
              ${price < 1 ? price.toFixed(4) : price.toFixed(2)}
            </div>
            {priceChange != null && (
              <div className="text-[10px] font-medium tabular-nums flex items-center justify-end"
                style={{ color: priceChange >= 0 ? "#5fd0a0" : "#e07070" }}>
                {priceChange >= 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Portfolio Summary ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Received", value: `+${totalReceived.toFixed(2)}`, color: "#5fd0a0" },
          { label: "Sent", value: `−${totalSent.toFixed(2)}`, color: "#e07070" },
          { label: "Net Flow", value: `${netFlow >= 0 ? "+" : ""}${netFlow.toFixed(2)}`, color: netFlow >= 0 ? "#5fd0a0" : "#e07070" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl p-3" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER_SOFT}` }}>
            <div className="text-[9px] uppercase tracking-[0.16em] text-white/40 mb-1.5">{card.label}</div>
            <div className="text-sm font-bold tabular-nums" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── Network Pulse ── */}
      <div className="rounded-3xl p-4 flex items-center justify-between" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER_SOFT}` }}>
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(212,175,55,0.10)", border: `1px solid ${CARD_BORDER_SOFT}` }}>
            <Activity className="w-4 h-4" style={{ color: GOLD_BRIGHT }} />
            {autoRefreshing && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#5fd0a0] animate-ping" />}
          </div>
          <div>
            <div className="text-xs font-semibold text-white">Kaspa Network</div>
            <div className="text-[10px] text-white/40">{networkActivity} recent transactions detected</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: "rgba(95,208,160,0.10)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#5fd0a0] animate-pulse" />
          <span className="text-[10px] font-semibold tracking-wide" style={{ color: "#5fd0a0" }}>LIVE</span>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-white/70">Recent Activity</span>
            {newTxDetected && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(95,208,160,0.18)", color: "#5fd0a0" }}>
                New
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {lastUpdatedText && <span className="text-[9px] text-white/25">Updated {lastUpdatedText}</span>}
            <button onClick={() => onRefreshTx()} className="transition-colors" style={{ color: GOLD }}>
              <RefreshCw className={`w-3 h-3 ${txLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="rounded-3xl overflow-hidden" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER_SOFT}` }}>
          {txLoading ? (
            <div className="flex items-center justify-center py-7">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: GOLD_BRIGHT }} />
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((tx, i) => {
              const isReceive = tx.type === "receive";
              return (
                <div key={tx.id || i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "" : ""}`} style={i > 0 ? { borderTop: "1px solid rgba(212,175,55,0.07)" } : undefined}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isReceive ? "rgba(95,208,160,0.10)" : "rgba(224,112,112,0.10)", border: `1px solid ${CARD_BORDER_SOFT}` }}>
                    {isReceive ? <ArrowDownLeft className="w-4 h-4" style={{ color: "#5fd0a0" }} /> : <ArrowUpRight className="w-4 h-4" style={{ color: "#e07070" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white">{isReceive ? "Received" : "Sent"}</div>
                    <div className="text-[10px] text-white/30 font-mono truncate">{tx.id?.slice(0, 16)}…</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-semibold tabular-nums" style={{ color: isReceive ? "#5fd0a0" : "#e07070" }}>
                      {isReceive ? "+" : "−"}{tx.amount?.toFixed(2)} KAS
                    </div>
                    <div className="text-[10px] text-white/30">{timeAgo(tx.timestamp)}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-9">
              <div className="relative mb-3">
                <LuxMark size={26} glow={false} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#5fd0a0] animate-pulse" />
              </div>
              <p className="text-[10px] text-white/35 mb-0.5 tracking-wide">No transactions yet</p>
              <p className="text-[9px] text-white/20">Watching for incoming KAS…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}