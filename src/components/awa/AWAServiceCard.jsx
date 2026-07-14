import React from "react";
import { Search, Palette, ShieldCheck, ArrowRight } from "lucide-react";

const ICONS = {
  "oracle-research": Search,
  "forge-image": Palette,
  "covenant-architect": ShieldCheck,
};

const BLURBS = {
  "oracle-research": "A paid research agent scrapes the live web and delivers a fact-dense markdown report on any topic.",
  "forge-image": "Commission a one-off AI artwork — pay the quote, receive the finished piece.",
  "covenant-architect": "An expert agent designs a full Toccata covenant++ blueprint (rule, params, spend paths) for your use case.",
};

export default function AWAServiceCard({ service, onBuy }) {
  const Icon = ICONS[service.id] || Search;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] hover:border-emerald-500/40 transition-colors p-5 flex flex-col">
      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-emerald-300" />
      </div>
      <h3 className="text-white font-bold text-sm">{service.name}</h3>
      <p className="text-white/40 text-xs mt-2 leading-relaxed flex-1">{BLURBS[service.id]}</p>
      <div className="flex items-center justify-between mt-5">
        <span className="text-emerald-300 font-mono font-bold text-sm">{service.price_kas} KAS</span>
        <button onClick={() => onBuy(service)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-black hover:bg-emerald-400">
          REQUEST <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}