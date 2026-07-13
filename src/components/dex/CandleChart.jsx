import React, { useEffect, useState } from "react";

// Real KAS/USD candles from CoinGecko OHLC (no key required)
export default function CandleChart() {
  const [candles, setCandles] = useState(null);
  const [days, setDays] = useState(1);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/kaspa/ohlc?vs_currency=usd&days=${days}`);
        const data = await res.json();
        if (alive && Array.isArray(data)) setCandles(data.slice(-64));
      } catch { /* keep previous */ }
    })();
    return () => { alive = false; };
  }, [days]);

  const W = 800, H = 320, PAD = 8, AXIS = 56;
  let body = null;
  if (candles?.length) {
    const highs = candles.map(c => c[2]), lows = candles.map(c => c[3]);
    const max = Math.max(...highs), min = Math.min(...lows), range = max - min || 1;
    const cw = (W - AXIS - PAD * 2) / candles.length;
    const y = (v) => PAD + ((max - v) / range) * (H - PAD * 2 - 40);
    const last = candles[candles.length - 1][4];
    body = (
      <>
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const v = max - t * range, yy = y(v);
          return (
            <g key={t}>
              <line x1={PAD} x2={W - AXIS} y1={yy} y2={yy} stroke="rgba(255,255,255,0.04)" />
              <text x={W - AXIS + 6} y={yy + 3} fill="rgba(255,255,255,0.35)" fontSize="9" fontFamily="monospace">{v.toFixed(4)}</text>
            </g>
          );
        })}
        {candles.map((c, i) => {
          const [, o, h, l, cl] = c;
          const up = cl >= o;
          const x = PAD + i * cw + cw / 2;
          const color = up ? "#22c55e" : "#ef4444";
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={y(h)} y2={y(l)} stroke={color} strokeWidth="1" />
              <rect x={x - cw * 0.32} width={cw * 0.64} y={y(Math.max(o, cl))}
                height={Math.max(1, Math.abs(y(o) - y(cl)))} fill={color} rx="0.5" />
            </g>
          );
        })}
        <line x1={PAD} x2={W - AXIS} y1={y(last)} y2={y(last)} stroke="#22d3ee" strokeWidth="0.75" strokeDasharray="4 3" />
        <rect x={W - AXIS} y={y(last) - 8} width={AXIS - 2} height={16} rx="3" fill="#0e7490" />
        <text x={W - AXIS + 6} y={y(last) + 3.5} fill="#fff" fontSize="9" fontFamily="monospace">{last.toFixed(4)}</text>
      </>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1 px-4 pt-3">
        {[{ l: "1D", d: 1 }, { l: "7D", d: 7 }, { l: "30D", d: 30 }].map(t => (
          <button key={t.d} onClick={() => setDays(t.d)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${days === t.d ? "bg-white/10 text-cyan-400" : "text-white/40 hover:text-white/70"}`}>
            {t.l}
          </button>
        ))}
        <span className="ml-2 text-[10px] text-white/25 font-mono">KAS/USDC · CoinGecko live</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "min(46vh, 380px)" }}>
        {body || <text x={W / 2} y={H / 2} fill="rgba(255,255,255,0.3)" fontSize="12" textAnchor="middle">Loading live candles…</text>}
      </svg>
    </div>
  );
}