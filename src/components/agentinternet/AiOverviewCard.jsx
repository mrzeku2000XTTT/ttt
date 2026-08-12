import React from "react";
import { Sparkles } from "lucide-react";

export default function AiOverviewCard({ text, loading }) {
  if (!text && !loading) return null;
  return (
    <div className="max-w-2xl mx-auto mb-5 p-3.5 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/20">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className={`w-3.5 h-3.5 text-cyan-400 ${loading ? "animate-pulse" : ""}`} />
        <span className="text-[11px] font-semibold text-cyan-300 tracking-wide">AI overview</span>
      </div>
      {text ? (
        <p className="text-[13px] text-white/75 leading-relaxed">{text}</p>
      ) : (
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded bg-white/10 animate-pulse" />
          <div className="h-2.5 w-4/5 rounded bg-white/10 animate-pulse" />
        </div>
      )}
    </div>
  );
}