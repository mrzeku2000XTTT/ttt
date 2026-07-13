import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DexHeader from "@/components/dex/DexHeader";
import CandleChart from "@/components/dex/CandleChart";
import OrderBook from "@/components/dex/OrderBook";
import TradePanel from "@/components/dex/TradePanel";
import TradeHistory from "@/components/dex/TradeHistory";

const F = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

export default function AporiaDEX() {
  const [stats, setStats] = useState(null);
  const [poolAddress, setPoolAddress] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=kaspa");
        const [d] = await res.json();
        if (alive && d) setStats({ price: d.current_price, changePct: d.price_change_percentage_24h, volume: d.total_volume, mcap: d.market_cap });
      } catch { /* retry on next tick */ }
    };
    load();
    const iv = setInterval(load, 30000);
    base44.functions.invoke("igraBridge", { action: "info" })
      .then(res => { if (alive) setPoolAddress(res.data.ikas_deposit_address); })
      .catch(() => {});
    return () => { alive = false; clearInterval(iv); };
  }, []);

  return (
    <div className="min-h-screen text-white" style={{ background: "#0a0d13", fontFamily: F }}>
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-6">
          <Link to="/IgraAgent" className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/5" title="Back to Igra Agent">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-xl font-black tracking-tight">Agent Igra <span className="text-cyan-400">DEX</span></span>
          <nav className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-white border-b-2 border-cyan-400 pb-0.5">Trade</span>
            <Link to="/IgraAgent" className="text-white/40 hover:text-white">Agent Desk</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400">ONLINE</span>
          <span className="text-white/25">· POWERED BY KASPA + IGRA</span>
        </div>
      </header>

      <DexHeader stats={stats} />

      <div className="flex flex-col lg:flex-row">
        <CandleChart />
        <OrderBook price={stats?.price} />
        <TradePanel price={stats?.price} poolAddress={poolAddress} onTrade={() => setRefreshKey(k => k + 1)} />
      </div>

      <TradeHistory refreshKey={refreshKey} />

      <footer className="px-5 py-3 border-t border-white/[0.06] text-[9px] text-white/25 font-mono flex justify-between">
        <span>© AGENT IGRA DEX · REAL ON-CHAIN SETTLEMENT</span>
        <span>MEV RESISTANT · FULLY ON-CHAIN · CROSS-CHAIN LIQUIDITY</span>
      </footer>
    </div>
  );
}