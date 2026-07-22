import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, Bell, Activity, Users, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

const BLACK = "#05060a";
const GREEN = "#22c55e";
const GOLD = "#cca94e";

function shortAddr(addr) {
  if (!addr) return "—";
  const a = String(addr).replace(/^kaspa:/, "");
  return `${a.slice(0, 10)}…${a.slice(-6)}`;
}

export default function BullChartPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BullSentimentEntry
      .list("-created_date", 100)
      .then((data) => {
        setEntries(data || []);
        setLoading(false);
      })
      .catch(() => {
        setEntries([]);
        setLoading(false);
      });
  }, []);

  const totalKas = entries.reduce((s, e) => s + (e.amount_kas || 0), 0);
  const bullCount = entries.length;

  // Cumulative chart data (oldest → newest)
  const chartData = [...entries]
    .reverse()
    .reduce((acc, e, i) => {
      const prev = acc.length ? acc[acc.length - 1].cumulative : 0;
      acc.push({
        idx: i + 1,
        cumulative: prev + (e.amount_kas || 0),
        label: `#${i + 1}`,
      });
      return acc;
    }, []);

  const displayChart =
    chartData.length > 0
      ? chartData
      : [{ idx: 1, cumulative: 0, label: "—" }];

  // Sentiment gauge — scales with bull volume
  const sentiment =
    bullCount > 0
      ? Math.min(99, 55 + Math.log10(totalKas + 1) * 12)
      : 50;
  const gaugeData = [
    { name: "Bullish", value: Math.round(sentiment), fill: GREEN },
  ];

  return (
    <main
      className="min-h-screen relative"
      style={{ background: BLACK, color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Ambient green/gold glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 25% 15%, rgba(34,197,94,0.07) 0%, transparent 45%), radial-gradient(circle at 75% 85%, rgba(204,169,78,0.05) 0%, transparent 45%)",
        }}
      />

      {/* Top nav */}
      <nav
        className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs uppercase tracking-widest px-3 py-1.5 rounded-full transition-colors hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: GREEN, color: BLACK }}
          >
            <span className="font-black text-sm">k</span>
          </div>
          <span className="font-bold text-sm hidden sm:inline" style={{ color: "#fff" }}>
            Kaspa Bull Arena
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {["Analytics", "Signals", "Community"].map((t, i) => (
            <span
              key={t}
              className="px-3 py-1.5 text-xs rounded-full"
              style={{
                background: i === 0 ? "rgba(255,255,255,0.08)" : "transparent",
                color: i === 0 ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <Bell className="w-4 h-4" style={{ color: "rgba(255,255,255,0.5)" }} />
        </button>
      </nav>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-5"
        >
          {/* Left: Bull address feed */}
          <aside
            className="lg:col-span-3 rounded-2xl p-5 order-2 lg:order-1"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4" style={{ color: GREEN }} />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Recent Bull Addresses
              </span>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {loading ? (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Loading…
                </p>
              ) : entries.length === 0 ? (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  No bulls yet. Be the first to self-send.
                </p>
              ) : (
                entries.slice(0, 20).map((e, i) => (
                  <motion.div
                    key={e.id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(34,197,94,0.12)",
                        border: "1px solid rgba(34,197,94,0.2)",
                      }}
                    >
                      <TrendingUp className="w-3.5 h-3.5" style={{ color: GREEN }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-mono truncate"
                        style={{ color: "#fff" }}
                      >
                        {shortAddr(e.wallet_address)}
                      </div>
                      <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {e.created_date
                          ? new Date(e.created_date).toLocaleDateString()
                          : "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold" style={{ color: GREEN }}>
                        +{Number(e.amount_kas || 0).toFixed(2)}
                      </div>
                      <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                        KAS
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </aside>

          {/* Center: Chart */}
          <section
            className="lg:col-span-6 rounded-2xl p-5 order-1 lg:order-2"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#fff" }}>
                  Cumulative Bull KAS Volume
                </h2>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {bullCount} bullish self-send{bullCount !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-1">
                {["1D", "1W", "1M", "All"].map((t, i) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 text-[10px] rounded-md font-bold"
                    style={{
                      background: i === 3 ? "rgba(34,197,94,0.15)" : "transparent",
                      color: i === 3 ? GREEN : "rgba(255,255,255,0.4)",
                      border: `1px solid ${
                        i === 3 ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)"
                      }`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayChart}>
                  <defs>
                    <linearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GREEN} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: BLACK,
                      border: "1px solid rgba(34,197,94,0.3)",
                      borderRadius: "0.75rem",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke={GREEN}
                    strokeWidth={2}
                    fill="url(#bullGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Right: Gauge + metrics */}
          <aside className="lg:col-span-3 space-y-5 order-3">
            {/* Sentiment gauge */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4" style={{ color: GOLD }} />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  Bullish Sentiment
                </span>
              </div>
              <div className="relative h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    data={gaugeData}
                    startAngle={90}
                    endAngle={90 - Math.round(sentiment) * 3.6}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar
                      background={{ fill: "rgba(255,255,255,0.05)" }}
                      dataKey="value"
                      cornerRadius={10}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div
                    className="text-4xl font-black"
                    style={{ color: GREEN, fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    {Math.round(sentiment)}%
                  </div>
                  <div
                    className="text-[10px] uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    Bullish
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div
                className="rounded-xl p-3 text-center"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-xl font-black" style={{ color: "#fff" }}>
                  {bullCount}
                </div>
                <div
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Bulls
                </div>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-xl font-black" style={{ color: GREEN }}>
                  {totalKas.toFixed(2)}
                </div>
                <div
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Total KAS
                </div>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="text-xl font-black" style={{ color: GOLD }}>
                  100%
                </div>
                <div
                  className="text-[9px] uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Bull/Bear
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate("/SentimentTrade")}
              className="w-full py-3 text-sm font-black uppercase tracking-widest transition-all"
              style={{
                background: `linear-gradient(90deg, ${GOLD} 0%, ${GREEN} 100%)`,
                color: BLACK,
                borderRadius: "0.75rem",
                boxShadow: "0 0 20px rgba(34,197,94,0.15)",
              }}
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <Zap className="w-4 h-4" /> New Self-Send
              </span>
            </button>
          </aside>
        </motion.div>
      </div>
    </main>
  );
}