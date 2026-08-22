import React from "react";
import { TrendingDown, X } from "lucide-react";

// In-app notification banner shown inside the Search Crypto KCC20 browser when
// a user's favorited tokens are under selling pressure (24h price drop + volume).
export default function Kcc20SellAlerts({ alerts, onDismiss, onView }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="mb-3 rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-500/[0.12] to-red-500/[0.04] p-3 backdrop-blur-sm">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-red-500/25 border border-red-500/50 flex items-center justify-center flex-shrink-0 animate-pulse">
          <TrendingDown className="w-4 h-4 text-red-200" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-red-100 text-[11px] font-bold uppercase tracking-widest">
            Selling pressure · {alerts.length} favorite{alerts.length > 1 ? "s" : ""}
          </p>
          <p className="text-white/50 text-[10px] font-mono mt-0.5">
            People are selling tokens on your watchlist
          </p>
          <div className="mt-2 space-y-1">
            {alerts.map((a) => (
              <button
                key={a.tick}
                onClick={() => onView && onView(a)}
                className="flex items-center gap-2 w-full text-left px-2 py-1 rounded-lg bg-black/30 border border-red-500/20 hover:border-red-500/40 transition-colors"
              >
                {a.logo ? (
                  <img src={a.logo} alt="" className="w-5 h-5 rounded-full object-contain" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-[8px] font-mono text-white/50">{a.tick.slice(0, 3)}</span>
                  </div>
                )}
                <span className="text-white text-xs font-mono font-semibold">{a.tick}</span>
                <span className="text-red-300 text-[11px] font-mono font-bold">
                  {a.change24h.toFixed(2)}%
                </span>
                <span className="text-white/40 text-[9px] font-mono ml-auto truncate">
                  vol {Math.round(a.volume24h).toLocaleString()} KAS
                </span>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/40 hover:text-white transition-colors flex-shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}