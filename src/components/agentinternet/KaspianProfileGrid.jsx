import React from "react";
import { Bot, ExternalLink, Users, BadgeCheck, Share2, Sparkles, Coins } from "lucide-react";
import XAvatar from "./XAvatar";

function handleOf(url) {
  try { return "@" + new URL(url).pathname.replace(/\/+$/, "").replace(/^\//, ""); }
  catch { return url; }
}

const isFresh = (app) => {
  const t = app.indexed_at || app.created_date;
  return t ? Date.now() - new Date(t).getTime() < 86400000 : false;
};

/**
 * $KAS — the Kaspian wall. Every indexed X profile from the Kaspa community,
 * each with its own AI agent. KNS-verified owners get a badge, and profiles
 * added in the last 24h are flagged as new.
 */
export default function KaspianProfileGrid({ profiles, onAskAI, onShare, onTip, canTip, verifiedUrls }) {
  if (!profiles?.length) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-12">
        <Users className="w-8 h-8 text-white/20 mb-3" />
        <p className="text-white/50 text-sm mb-1">No Kaspians indexed yet</p>
        <p className="text-white/30 text-xs">Add one with the + button — anyone posting $KAS on X belongs here.</p>
      </div>
    );
  }

  const isVerified = (url) => verifiedUrls?.has((url || "").toLowerCase().replace(/\/+$/, ""));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map((app, i) => (
          <div
            key={app.id || i}
            className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/25 transition-colors p-3.5 flex flex-col"
          >
            {isFresh(app) && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[8px] font-mono uppercase tracking-widest">
                <Sparkles className="w-2.5 h-2.5" /> New
              </span>
            )}

            <div className="flex items-center gap-2.5 mb-2">
              <XAvatar url={app.url} size={38} />
              <div className="min-w-0 flex-1">
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[14px] text-white font-medium hover:text-cyan-300 transition-colors"
                >
                  <span className="truncate">{app.name}</span>
                  {isVerified(app.url) && (
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" title="KNS-verified owner" />
                  )}
                </a>
                <span className="text-[11px] text-cyan-400/60 font-mono truncate block">{handleOf(app.url)}</span>
              </div>
            </div>

            {app.description && (
              <p className="text-[12px] text-white/55 leading-relaxed line-clamp-3 flex-1">{app.description}</p>
            )}

            <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-white/[0.06]">
              <button
                onClick={() => onAskAI?.(app)}
                className="inline-flex items-center gap-1 text-[11px] text-cyan-300/80 hover:text-cyan-200 transition-colors"
              >
                <Bot className="w-3 h-3" /> Ask their AI
              </button>
              <button
                onClick={() => onShare?.(app)}
                title="Download a shareable card"
                className="inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors"
              >
                <Share2 className="w-3 h-3" />
              </button>
              {canTip?.(app) && (
                <button
                  onClick={() => onTip?.(app)}
                  title="Tip this Kaspian in KAS"
                  className="inline-flex items-center gap-1 text-[11px] text-amber-300/80 hover:text-amber-200 transition-colors"
                >
                  <Coins className="w-3 h-3" /> Tip
                </button>
              )}
              <a
                href={app.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-white/30 hover:text-white/60 transition-colors ml-auto"
              >
                <ExternalLink className="w-3 h-3" /> X
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}