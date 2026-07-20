import React from "react";
import { Zap, FileText, Link2, Image, Shield, Smartphone } from "lucide-react";

export default function SiteScoreCard({ site }) {
  const s = site?.stats || {};
  const score = site?.seo_score ?? s.seoScore ?? 0;
  const ring = score >= 70 ? "#5CE1A4" : score >= 40 ? "#FFC24B" : "#FF7A7A";

  const items = [
    { icon: Zap, label: "Load time", value: s.loadTime != null ? `${(s.loadTime / 1000).toFixed(1)}s` : "—" },
    { icon: FileText, label: "Words", value: s.wordCount ?? "—" },
    { icon: Link2, label: "Links", value: s.links ?? "—" },
    { icon: Image, label: "Images", value: s.images ?? "—" },
    { icon: Shield, label: "SSL", value: s.hasSSL ? "Yes" : "No" },
    { icon: Smartphone, label: "Mobile-ready", value: s.hasViewport ? "Yes" : "No" },
  ];

  return (
    <div className="bg-[#FDFBF7] rounded-3xl p-6 shadow-[0_10px_30px_rgba(124,92,252,0.15)]">
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#EDE8F9" strokeWidth="10" />
            <circle cx="50" cy="50" r="42" fill="none" stroke={ring} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 264} 264`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-black text-2xl text-[#4A2FA8]">{score}</span>
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#8B84A3]">SEO Score</span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-display font-extrabold text-lg text-[#1F1B2E] truncate">{site?.title || site?.domain}</div>
          <div className="text-xs text-[#7C5CFC] font-bold truncate">{site?.domain}</div>
          {site?.analysis?.summary && (
            <p className="text-xs text-[#5A4B8A] mt-2 line-clamp-3">{site.analysis.summary}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-5">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[#EDE8F9] rounded-2xl p-3 text-center">
            <Icon className="w-4 h-4 mx-auto text-[#7C5CFC]" />
            <div className="font-display font-black text-sm text-[#4A2FA8] mt-1">{value}</div>
            <div className="text-[8px] font-bold uppercase tracking-wider text-[#8B84A3]">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}