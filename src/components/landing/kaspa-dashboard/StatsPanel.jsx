import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Loader2, Globe, Sparkles, AlertCircle, BarChart3, FileText, Link as LinkIcon, Image, HardDrive, Search, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { IOS_FONT, KASPA_LOGO } from "./shared";

export default function StatsPanel({ preferences }) {
  const [url, setUrl] = useState(preferences?.site || "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (preferences?.site) {
      setUrl(preferences.site);
      analyzeSite(preferences.site);
    }
  }, [preferences?.site]);

  const analyzeSite = async (siteUrl) => {
    if (!siteUrl) { setError("Enter a website URL first"); return; }
    setLoading(true); setError(null); setData(null);
    try {
      const res = await base44.functions.invoke("scrapeWebsiteStats", { url: siteUrl });
      const d = res?.data || res;
      if (d?.error) throw new Error(d.error);
      setData(d);
    } catch (err) {
      setError(err?.message || "Failed to analyze website");
    }
    setLoading(false);
  };

  const stats = data?.stats;
  const analysis = data?.analysis;

  const statCards = stats ? [
    { label: "Word Count", value: stats.wordCount, icon: FileText, color: "#0A84FF" },
    { label: "Headings", value: stats.headings, icon: BarChart3, color: "#30D158" },
    { label: "Links", value: stats.links, icon: LinkIcon, color: "#FF9F0A" },
    { label: "Images", value: stats.images, icon: Image, color: "#BF5AF2" },
    { label: "Page Size", value: `${stats.pageSizeKB}KB`, icon: HardDrive, color: "#64D2FF" },
    { label: "SEO Score", value: `${stats.seoScore}/100`, icon: Search, color: stats.seoScore >= 70 ? "#30D158" : stats.seoScore >= 40 ? "#FF9F0A" : "#FF453A" },
  ] : [];

  const chartData = stats ? [
    { name: "Words", value: Math.min(stats.wordCount, 5000), fill: "#0A84FF" },
    { name: "Headings", value: stats.headings * 100, fill: "#30D158" },
    { name: "Links", value: stats.links * 50, fill: "#FF9F0A" },
    { name: "Images", value: stats.images * 50, fill: "#BF5AF2" },
  ] : [];

  const seoData = stats ? [{ name: "SEO", value: stats.seoScore, fill: stats.seoScore >= 70 ? "#30D158" : stats.seoScore >= 40 ? "#FF9F0A" : "#FF453A" }] : [];

  return (
    <div className="px-5 space-y-4" style={{ fontFamily: IOS_FONT }}>
      {/* URL input */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5">Website to Analyze</div>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Globe className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yoursite.com"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none" />
          </div>
          <button onClick={() => analyzeSite(url)} disabled={loading}
            className="px-4 rounded-xl text-sm font-semibold flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
            style={{ background: "#0A84FF", color: "#fff" }}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Analyze
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(255,69,58,0.1)" }}>
          <AlertCircle className="w-3.5 h-3.5 text-[#FF453A] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#FF453A]">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#0A84FF] mb-2" />
          <p className="text-xs text-white/40">Scraping & analyzing website…</p>
        </div>
      )}

      {stats && (
        <>
          {/* Stat cards grid */}
          <div className="grid grid-cols-3 gap-2">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-3" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Icon className="w-3.5 h-3.5 mb-1.5" style={{ color: card.color }} />
                  <div className="text-sm font-bold text-white tabular-nums">{card.value}</div>
                  <div className="text-[9px] text-white/40">{card.label}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Bar chart */}
            <div className="rounded-2xl p-3" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[10px] uppercase tracking-wide text-white/40 mb-2">Content Metrics</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 10 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* SEO Score gauge */}
            <div className="rounded-2xl p-3 flex flex-col items-center justify-center" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1">SEO Score</div>
              <ResponsiveContainer width="100%" height={100}>
                <RadialBarChart innerRadius="70%" outerRadius="100%" data={seoData} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-lg font-bold text-white -mt-[60px] mb-[40px]">{stats.seoScore}</div>
            </div>
          </div>

          {/* AI Suggestions */}
          {analysis && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4" style={{ background: "rgba(10,132,255,0.06)", border: "1px solid rgba(10,132,255,0.15)" }}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(10,132,255,0.15)" }}>
                  <img src={KASPA_LOGO} alt="" className="w-3.5 h-3.5 object-contain" />
                </div>
                <span className="text-xs font-semibold text-white">AI Analysis</span>
              </div>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">{analysis.summary}</p>

              {analysis.priorityActions?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-wide text-[#0A84FF] mb-1.5">Priority Actions</div>
                  <div className="space-y-1">
                    {analysis.priorityActions.map((action, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                        <span className="text-[#0A84FF] font-bold flex-shrink-0">{i + 1}.</span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.strengths?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-wide text-[#30D158] mb-1.5">Strengths</div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.strengths.map((s, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(48,209,88,0.1)", color: "#30D158" }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {analysis.improvements?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-[#FF9F0A] mb-1.5">Areas to Improve</div>
                  <div className="space-y-1">
                    {analysis.improvements.map((imp, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                        <span className="text-[#FF9F0A] flex-shrink-0">→</span>
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}

      {!loading && !data && !error && (
        <div className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="w-8 h-8 text-white/15 mb-2" />
          <p className="text-xs text-white/30 text-center">Enter your website URL to see<br/>real-time stats and AI suggestions</p>
        </div>
      )}
    </div>
  );
}