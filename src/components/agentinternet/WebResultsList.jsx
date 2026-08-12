import React from "react";
import { Loader2, ExternalLink, Search } from "lucide-react";

/** Native, readable results list for the TTT web browser. */
export default function WebResultsList({ query, results, loading, error, onOpen }) {
  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-3" />
        <span className="text-white/40 text-xs font-mono">searching · {query}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-zinc-950 text-center">
        <p className="text-white/60 text-sm mb-2">Search failed</p>
        <p className="text-white/30 text-xs max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-zinc-950 px-3 py-4 scrollbar-hide">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4 px-1">
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-mono text-white/40">{results.length} results · {query}</span>
        </div>

        {results.length === 0 ? (
          <div className="text-center text-white/30 text-xs py-16">No results found.</div>
        ) : (
          <div className="space-y-2">
            {results.map((r, i) => (
              <button
                key={r.url + i}
                onClick={() => onOpen(r.url)}
                className="w-full text-left rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-colors p-3.5"
              >
                <div className="flex items-start gap-3">
                  {r.favicon ? (
                    <img src={r.favicon} alt="" className="w-7 h-7 rounded-lg flex-shrink-0 mt-0.5 bg-white/5" loading="lazy" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/30 to-indigo-500/30 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-mono text-cyan-300/70 truncate">{r.host}</div>
                    <div className="text-sm text-white font-medium leading-snug line-clamp-2">{r.title}</div>
                    {r.snippet && (
                      <p className="mt-1 text-xs text-white/45 leading-relaxed line-clamp-3">{r.snippet}</p>
                    )}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/25 flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}