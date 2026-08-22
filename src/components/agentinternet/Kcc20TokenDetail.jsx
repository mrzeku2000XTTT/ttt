import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ExternalLink, Trophy, Flame, Bot, Copy, Crown } from "lucide-react";

const IDX = "https://idx.kron.technology/v1/kcc20";
const KRON_URL = (covenantId, tick) =>
  covenantId ? `https://kron.technology/token/${covenantId}` : `https://kron.technology/?tick=${tick}`;

async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return body?.result ?? body;
}

function fmtKas(n) {
  if (n == null || !isFinite(n)) return "—";
  if (n === 0) return "0";
  if (n >= 1000) return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} KAS`;
  if (n >= 1) return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} KAS`;
  return `${n.toPrecision(3)} KAS`;
}
function fmtUsd(kas, kasPrice) {
  if (kas == null || !kasPrice) return null;
  const usd = kas * kasPrice;
  return `$${usd >= 1 ? usd.toLocaleString(undefined, { maximumFractionDigits: 0 }) : usd.toPrecision(2)}`;
}
function fmtPriceKas(p) {
  if (p == null || !isFinite(p)) return "—";
  if (p >= 1) return `${p.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS`;
  if (p >= 0.0001) return `${p.toPrecision(4)} KAS`;
  return `${p.toExponential(2)} KAS`;
}
function fmtTokens(raw, decimals) {
  const d = Math.max(0, Number(decimals) || 0);
  const n = Number(raw || 0) / 10 ** d;
  if (!Number.isFinite(n) || n === 0) return "0";
  if (n >= 1_000_000) return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1000) return `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })}`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: Math.min(d, 2) })}`;
}
function shortAddr(a) {
  if (!a) return "—";
  const s = String(a).replace(/^kaspa:/, "");
  if (s.length <= 14) return s;
  return `${s.slice(0, 6)}…${s.slice(-6)}`;
}

export default function Kcc20TokenDetail({ token, kasPrice, onClose, onAskAI }) {
  const [detail, setDetail] = useState(null);
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    setLoading(true);
    setError(null);
    setDetail(null);
    setHolders([]);
    const tick = token.tick;
    Promise.all([
      fetchJson(`${IDX}/token/${tick}`).catch(() => null),
      fetchJson(`${IDX}/token/${tick}/holders`).catch(() => null),
    ])
      .then(([d, h]) => {
        if (!alive) return;
        setDetail(Array.isArray(d) ? d[0] || {} : d || {});
        setHolders(Array.isArray(h) ? h : (h?.result) || []);
      })
      .catch((e) => alive && setError(e?.message || "Failed to load token"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [token]);

  if (!token) return null;

  const dec = Number(detail?.dec ?? token.decimals ?? 0);
  const price = Number(detail?.price ?? token.price ?? 0);
  const change = Number(detail?.change24h ?? token.change24h ?? 0);
  const volume24h = Number(detail?.volume24h ?? token.volume24h ?? 0);
  const tvl = Number(detail?.tvl ?? token.tvl ?? 0);
  const trades24h = Number(detail?.trades24h ?? 0);
  const tradesTotal = Number(detail?.tradesTotal ?? 0);
  const holderTotal = Number(detail?.holderTotal ?? 0);
  const circulating = Number(detail?.circulating ?? 0);
  const minted = Number(detail?.minted ?? 0);
  const graduated = !!(detail?.graduated ?? token.graduated);
  const covenantId = detail?.covenantId || token.covenantId;

  const priceThen = change ? price / (1 + change / 100) : price;
  const profitOn1000Kas = (1000 * change) / 100;
  const profitUsd = kasPrice ? profitOn1000Kas * kasPrice : null;
  const up = change >= 0;

  const askAI = () => {
    const whaleText = (holders || [])
      .slice(0, 8)
      .map((h, i) => `${i + 1}. ${shortAddr(h.address)} — ${fmtTokens(h.balance, dec)} (${Number(h.pct).toFixed(2)}%)${h.covenant ? " [covenant/curve]" : ""}`)
      .join("\n");
    const ctx = [
      `KCC20 token ${token.tick} (${token.name}) on the Kaspa KRON covenant market.`,
      `Price: ${fmtPriceKas(price)}${fmtUsd(price, kasPrice) ? ` (${fmtUsd(price, kasPrice)})` : ""}.`,
      `24h change: ${change >= 0 ? "+" : ""}${change.toFixed(2)}%.`,
      `Volume 24h: ${fmtKas(volume24h)}. TVL: ${fmtKas(tvl)}. Trades 24h: ${trades24h} / total ${tradesTotal}.`,
      `Holders: ${holderTotal}. Circulating: ${fmtTokens(circulating, dec)} / minted ${fmtTokens(minted, dec)}.`,
      graduated ? "Status: GRADUATED to Kaspa DEX." : "Status: live on the KRON bonding curve (not yet graduated).",
      whaleText ? `Top holders / whales:\n${whaleText}` : "",
      "Analyze this token: market structure, whale concentration risk, liquidity depth, recent price action, the graduation curve vs DEX dynamics, and a risk-adjusted read on whether the 24h move looks organic or wash. Be direct and specific.",
    ].filter(Boolean).join("\n");
    onAskAI?.(token, ctx);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[210] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0.4 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0.4 }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-md max-h-[88vh] overflow-y-auto scrollbar-hide bg-zinc-950 border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl"
        >
          <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-zinc-950/95 backdrop-blur-xl">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
              {token.logo ? (
                <img src={token.logo} alt="" className="w-9 h-9 object-contain" />
              ) : (
                <span className="text-[10px] font-mono text-white/50">{token.tick.slice(0, 3)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold truncate">{token.tick}</span>
                {graduated ? (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-mono uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-1">
                    <Trophy className="w-2 h-2" /> Graduated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-mono uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-1">
                    <Flame className="w-2 h-2" /> On Curve
                  </span>
                )}
              </div>
              <div className="text-white/40 text-[11px] truncate">{token.name}</div>
            </div>
            <a
              href={KRON_URL(covenantId, token.tick)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.06] border border-white/10 text-white/60 hover:text-white"
              title="Open on kron.technology"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin mb-3" />
              <span className="text-white/40 text-xs font-mono">Loading on-chain data…</span>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-white/60 text-sm mb-1">Couldn't load token detail</p>
              <p className="text-white/30 text-xs font-mono">{error}</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/40 text-[10px] font-mono uppercase tracking-widest">24h Profit</span>
                  <span className="text-white/30 text-[10px] font-mono">{token.tick}</span>
                </div>
                <div className={`text-3xl font-black font-mono ${up ? "text-emerald-400" : "text-red-400"}`}>
                  {up ? "+" : ""}{change.toFixed(2)}%
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="text-white/30 font-mono">Price now</div>
                    <div className="text-white font-mono">{fmtPriceKas(price)}</div>
                    {fmtUsd(price, kasPrice) && <div className="text-white/30 font-mono text-[10px]">{fmtUsd(price, kasPrice)}</div>}
                  </div>
                  <div>
                    <div className="text-white/30 font-mono">24h ago</div>
                    <div className="text-white font-mono">{fmtPriceKas(priceThen)}</div>
                    {fmtUsd(priceThen, kasPrice) && <div className="text-white/30 font-mono text-[10px]">{fmtUsd(priceThen, kasPrice)}</div>}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-white/40 font-mono">Profit on 1,000 KAS held</span>
                  <span className={`font-mono font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {up ? "+" : ""}{profitOn1000Kas.toFixed(2)} KAS
                    {profitUsd != null && <span className="text-white/30 ml-1.5">({up ? "+" : ""}${Math.abs(profitUsd).toFixed(2)})</span>}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Stat label="Volume 24h" value={fmtKas(volume24h)} sub={fmtUsd(volume24h, kasPrice)} />
                <Stat label="TVL (curve)" value={fmtKas(tvl)} sub={fmtUsd(tvl, kasPrice)} />
                <Stat label="Trades 24h" value={`${trades24h}`} sub={`${tradesTotal} total`} />
                <Stat label="Holders" value={`${holderTotal}`} sub={`${fmtTokens(circulating, dec)} circ.`} />
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span className="text-white/60 text-[10px] font-mono uppercase tracking-widest">
                    Top holders · {holders.length} of {holderTotal}
                  </span>
                </div>
                {holders.length === 0 ? (
                  <p className="text-white/30 text-xs">No holder data available.</p>
                ) : (
                  <div className="space-y-1">
                    {holders.map((h, i) => {
                      const addr = String(h.address || "").replace(/^kaspa:/, "");
                      const isCov = !!h.covenant;
                      return (
                        <div key={addr + i} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                          <span className="text-white/30 text-[10px] font-mono w-5 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-white/70 text-[11px] font-mono truncate">{shortAddr(h.address)}</span>
                              {isCov && (
                                <span className="text-[7px] font-mono uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded px-1">curve</span>
                              )}
                            </div>
                            <div className="text-white/30 text-[9px] font-mono">
                              {fmtTokens(h.balance, dec)} {token.tick} · {Number(h.pct).toFixed(2)}%
                            </div>
                          </div>
                          <button
                            onClick={() => navigator.clipboard?.writeText(h.address)}
                            className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white"
                            title="Copy address"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={askAI}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 hover:bg-amber-500/25 transition-colors font-semibold text-sm"
              >
                <Bot className="w-4 h-4" /> Ask AI to analyze {token.tick}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/10 p-2.5">
      <div className="text-white/30 text-[9px] font-mono uppercase tracking-widest">{label}</div>
      <div className="text-white text-sm font-mono font-semibold">{value}</div>
      {sub && <div className="text-white/30 text-[10px] font-mono">{sub}</div>}
    </div>
  );
}