import React from "react";
import { Bot, Zap, ShieldCheck, Youtube } from "lucide-react";
import ProductivityChat from "@/components/productivity/ProductivityChat";
import { BETTER_IDEAS_VIDEOS, buildYouTubeUrl } from "@/data/betterIdeasMemory";

export default function Productivity() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/30 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 text-cyan-300" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              Better Ideas AI <Zap className="w-4 h-4 text-amber-400" />
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5">
              A productivity coach trained on Joey Schweitzer's channel. Talk to it, get real tools in chat, pay per reply in KAS.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-[11px] text-emerald-200 font-medium">AWA x402 · L1</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <ProductivityChat />
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Youtube className="w-4 h-4 text-red-500" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Trained on — verified Better Ideas uploads</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BETTER_IDEAS_VIDEOS.slice(0, 8).map((v) => (
              <a key={v.videoId} href={buildYouTubeUrl(v.videoId)} target="_blank" rel="noreferrer"
                className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] hover:border-cyan-400/40 hover:bg-white/[0.04] transition-colors px-2.5 py-2">
                <img src={`https://img.youtube.com/vi/${v.videoId}/default.jpg`} alt="" className="w-12 h-8 rounded object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-white/80 truncate">{v.title}</p>
                  <p className="text-[10px] text-white/40">{v.uploadedAt} · {v.length}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}