import React from "react";
import { TrendingUp, Search, Swords, Target, Lightbulb } from "lucide-react";

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-[#FDFBF7] rounded-3xl p-5 shadow-[0_10px_30px_rgba(124,92,252,0.12)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-[#7C5CFC] flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="font-display font-extrabold text-sm text-[#4A2FA8] uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function SiteIntelPanel({ intel, analysis }) {
  if (!intel && !analysis) return null;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {intel?.traffic_estimate && (
        <Section icon={TrendingUp} title="Traffic Estimate">
          <div className="font-display font-black text-xl text-[#1F1B2E]">{intel.traffic_estimate}</div>
          {intel.audience && <p className="text-xs text-[#5A4B8A] mt-2">{intel.audience}</p>}
        </Section>
      )}
      {intel?.top_keywords?.length > 0 && (
        <Section icon={Search} title="Top Keywords">
          <div className="flex flex-wrap gap-1.5">
            {intel.top_keywords.map((k, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-[#EDE8F9] text-[11px] font-bold text-[#4A2FA8]">{k}</span>
            ))}
          </div>
        </Section>
      )}
      {intel?.competitors?.length > 0 && (
        <Section icon={Swords} title="Competitors">
          <div className="space-y-2">
            {intel.competitors.map((c, i) => (
              <div key={i} className="bg-[#EDE8F9] rounded-2xl px-3 py-2">
                <div className="text-xs font-extrabold text-[#1F1B2E]">{c.name} <span className="text-[#7C5CFC] font-bold">· {c.domain}</span></div>
                {c.reason && <div className="text-[10px] text-[#5A4B8A] mt-0.5">{c.reason}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}
      {intel?.opportunities?.length > 0 && (
        <Section icon={Lightbulb} title="Opportunities to Win">
          <ul className="space-y-1.5">
            {intel.opportunities.map((o, i) => (
              <li key={i} className="text-xs text-[#5A4B8A] flex gap-2"><span className="text-[#5CE1A4] font-black">→</span>{o}</li>
            ))}
          </ul>
        </Section>
      )}
      {analysis?.priorityActions?.length > 0 && (
        <Section icon={Target} title="Priority Fixes">
          <ul className="space-y-1.5">
            {analysis.priorityActions.map((a, i) => (
              <li key={i} className="text-xs text-[#5A4B8A] flex gap-2"><span className="text-[#FF7A7A] font-black">{i + 1}.</span>{a}</li>
            ))}
          </ul>
        </Section>
      )}
      {analysis?.strengths?.length > 0 && (
        <Section icon={TrendingUp} title="Strengths">
          <ul className="space-y-1.5">
            {analysis.strengths.map((a, i) => (
              <li key={i} className="text-xs text-[#5A4B8A] flex gap-2"><span className="text-[#5CE1A4] font-black">✓</span>{a}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}