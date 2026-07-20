import React from "react";
import { Gauge, Database, ShieldCheck, History } from "lucide-react";

function Score({ label, value }) {
  const c = value == null ? "#8B84A3" : value >= 80 ? "#5CE1A4" : value >= 50 ? "#FFC24B" : "#FF7A7A";
  return (
    <div className="bg-[#EDE8F9] rounded-2xl p-3 text-center">
      <div className="font-display font-black text-lg" style={{ color: c }}>{value ?? "—"}</div>
      <div className="text-[8px] font-bold uppercase tracking-wider text-[#8B84A3]">{label}</div>
    </div>
  );
}

export default function SiteHealthPanel({ external, sources }) {
  if (!external && !sources) return null;
  const lh = external?.lighthouse;
  return (
    <div className="bg-[#FDFBF7] rounded-3xl p-5 shadow-[0_10px_30px_rgba(124,92,252,0.12)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#7C5CFC] flex items-center justify-center">
          <Gauge className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-extrabold text-sm text-[#4A2FA8] uppercase tracking-wide">Real Measurements</span>
        {sources?.checksRun && (
          <span className="ml-auto px-2.5 py-1 rounded-full bg-[#5CE1A4]/20 text-[10px] font-extrabold text-[#1C7A4E]">
            {sources.checksRun} checks · {sources.count} sources
          </span>
        )}
      </div>
      {lh ? (
        <>
          <div className="text-[10px] font-bold text-[#8B84A3] uppercase tracking-wider mb-2">Google Lighthouse (live)</div>
          <div className="grid grid-cols-4 gap-2">
            <Score label="Performance" value={lh.performance} />
            <Score label="SEO" value={lh.seo} />
            <Score label="Accessibility" value={lh.accessibility} />
            <Score label="Best Practices" value={lh.bestPractices} />
          </div>
          {(lh.lcp || lh.fcp) && (
            <div className="text-[10px] text-[#5A4B8A] mt-2">
              {lh.fcp && <>First paint: <b>{lh.fcp}</b> · </>}{lh.lcp && <>Largest paint: <b>{lh.lcp}</b></>}{lh.cls && <> · Layout shift: <b>{lh.cls}</b></>}
            </div>
          )}
        </>
      ) : (
        <p className="text-[10px] text-[#8B84A3]">Google Lighthouse didn't respond for this site — rescan to retry.</p>
      )}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="bg-[#EDE8F9] rounded-2xl p-3 text-center">
          <History className="w-4 h-4 mx-auto text-[#7C5CFC]" />
          <div className="font-display font-black text-xs text-[#4A2FA8] mt-1">{external?.firstSeen || "—"}</div>
          <div className="text-[8px] font-bold uppercase tracking-wider text-[#8B84A3]">First archived</div>
        </div>
        <div className="bg-[#EDE8F9] rounded-2xl p-3 text-center">
          <ShieldCheck className="w-4 h-4 mx-auto text-[#7C5CFC]" />
          <div className="font-display font-black text-xs text-[#4A2FA8] mt-1">{external?.securityScore ?? "—"}/5</div>
          <div className="text-[8px] font-bold uppercase tracking-wider text-[#8B84A3]">Security headers</div>
        </div>
        <div className="bg-[#EDE8F9] rounded-2xl p-3 text-center">
          <Database className="w-4 h-4 mx-auto text-[#7C5CFC]" />
          <div className="font-display font-black text-xs text-[#4A2FA8] mt-1 truncate">{external?.dns?.aRecords?.[0] || "—"}</div>
          <div className="text-[8px] font-bold uppercase tracking-wider text-[#8B84A3]">Server IP (DNS)</div>
        </div>
      </div>
    </div>
  );
}