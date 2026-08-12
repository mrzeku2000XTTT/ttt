import React from "react";
import { ExternalLink, Globe } from "lucide-react";

/**
 * Shown for JS-only sites (kaspa.org, tttz.xyz, …) whose HTML shell renders
 * blank in a sandboxed frame — we surface their real title / description /
 * social image instead of an empty white page.
 */
export default function SitePreviewCard({ url, meta }) {
  const host = (() => { try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; } })();

  return (
    <div className="absolute inset-0 overflow-y-auto bg-zinc-950 px-5 py-8 scrollbar-hide">
      <div className="max-w-md mx-auto">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
          {meta?.image ? (
            <img src={meta.image} alt="" className="w-full aspect-[1.91/1] object-cover bg-black" />
          ) : (
            <div className="w-full aspect-[1.91/1] bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
              <Globe className="w-8 h-8 text-cyan-300/70" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <img src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" className="w-4 h-4 rounded" />
              <span className="text-[10px] font-mono text-cyan-300/70">{host}</span>
            </div>
            <h3 className="text-white font-bold text-lg leading-snug">{meta?.title || host}</h3>
            {meta?.description && (
              <p className="mt-2 text-sm text-white/50 leading-relaxed">{meta.description}</p>
            )}
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 px-4 h-10 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs hover:bg-cyan-500/30 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open {host}
            </a>
          </div>
        </div>
        <p className="mt-4 text-center text-[10px] font-mono text-white/25">
          This site renders entirely in the browser, so TTT shows its verified preview instead.
        </p>
      </div>
    </div>
  );
}