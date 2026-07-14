import React from "react";
import { ChevronRight } from "lucide-react";

export default function TreeCampaignHistory({ campaigns, onSelect }) {
  if (!campaigns.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-emerald-300/70 text-xs uppercase tracking-widest">Past Campaigns</p>
      {campaigns.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c)}
          className="w-full flex items-center justify-between bg-white/5 hover:bg-emerald-500/10 border border-white/10 rounded-xl px-4 py-3 text-left transition-colors"
        >
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{c.product}</p>
            <p className="text-white/40 text-xs">{(c.ads || []).length} ads · {c.status}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}