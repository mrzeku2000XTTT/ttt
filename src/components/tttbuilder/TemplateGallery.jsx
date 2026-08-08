import React from "react";
import { Wallet, Network, TrendingUp, Cpu, Coins, ArrowLeftRight, Image, CreditCard, Lock, Users, Sparkles } from "lucide-react";
import { KASPA_TEMPLATES } from "@/components/tttbuilder/kaspaTemplates";

const ICONS = {
  Wallet, Network, TrendingUp, Cpu, Coins, ArrowLeftRight, Image, CreditCard, Lock, Users, Sparkles,
};

export default function TemplateGallery({ onPick, disabled }) {
  return (
    <div className="mt-14 max-w-5xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="text-[11px] font-bold tracking-widest text-[#86868B] uppercase">
          Kaspa app templates
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KASPA_TEMPLATES.map((t) => {
          const Icon = ICONS[t.icon] || Sparkles;
          return (
            <button
              key={t.id}
              onClick={() => onPick(t)}
              disabled={disabled}
              className="group text-left p-4 rounded-2xl bg-white border border-black/[0.06] hover:border-[#007AFF]/40 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] disabled:opacity-40 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 flex items-center justify-center mb-2.5 group-hover:bg-[#007AFF]/20 transition-colors">
                <Icon className="w-[18px] h-[18px] text-[#007AFF]" />
              </div>
              <div className="text-[13px] font-bold text-[#1D1D1F] leading-tight">{t.name}</div>
              <div className="text-[10px] text-[#86868B] mt-1 leading-snug">{t.blurb}</div>
              <div className="mt-2 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F5F5F7] text-[#86868B] group-hover:bg-[#007AFF]/10 group-hover:text-[#007AFF] transition-colors">
                {t.tag}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}