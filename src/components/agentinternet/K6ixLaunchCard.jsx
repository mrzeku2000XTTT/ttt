import React, { useState } from "react";
import { Film, ExternalLink, Copy, Check } from "lucide-react";

const K6IX_URL = "https://k6ix.base44.app";

/**
 * Motion hand-off card. TTT A.I doesn't render launch videos itself — it hands
 * the finished brief to K6ix's motion launcher, embedded right here in chat, so
 * the user can watch and generate the assets inside the conversation.
 */
export default function K6ixLaunchCard({ output }) {
  const meta = output?.meta || {};
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyBrief = () => {
    try { navigator.clipboard?.writeText(meta.prompt || ""); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-3 rounded-2xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 to-orange-500/5 overflow-hidden">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Film className="w-3.5 h-3.5 text-rose-300" />
          <span className="text-white text-xs font-semibold">{output?.title || "Motion brief ready"}</span>
          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-400/20 text-rose-200 uppercase">K6ix</span>
        </div>
        <p className="text-[10px] text-white/55 leading-relaxed">{output?.detail}</p>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {meta.aspect_ratio && <Chip>{meta.aspect_ratio}</Chip>}
          {meta.duration && <Chip>{meta.duration}s</Chip>}
          {meta.background && <Chip>{meta.background} bg</Chip>}
          {meta.cuts && <Chip>{meta.cuts}</Chip>}
        </div>

        {meta.prompt && (
          <div className="mt-2 rounded-xl bg-black/50 border border-white/10 p-2">
            <div className="text-[9px] font-mono text-white/35 uppercase tracking-wider mb-1">motion prompt</div>
            <p className="text-[10px] text-white/70 leading-snug">{meta.prompt}</p>
            <button
              onClick={copyBrief}
              className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-cyan-300 hover:text-cyan-200"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? "copied" : "copy brief"}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex-1 h-9 rounded-xl border border-rose-400/40 text-rose-200 text-[10px] font-mono uppercase tracking-wider hover:bg-rose-400/10 transition-colors"
          >
            {open ? "close launcher" : "open motion launcher"}
          </button>
          <a
            href={K6IX_URL}
            target="_blank"
            rel="noreferrer"
            className="h-9 px-3 rounded-xl border border-white/20 text-white/70 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> full
          </a>
        </div>
      </div>

      {open && (
        <iframe
          src={K6IX_URL}
          title="K6ix motion launcher"
          className="w-full h-[70vh] border-t border-white/10 bg-black"
          allow="clipboard-write; fullscreen"
        />
      )}
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/15 text-[9px] font-mono text-white/60">
      {children}
    </span>
  );
}