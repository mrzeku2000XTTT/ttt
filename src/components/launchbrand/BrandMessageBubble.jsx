import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Copy, Check } from "lucide-react";

export default function BrandMessageBubble({ message, onPickName }) {
  const isUser = message.role === "user";

  if (message.kind === "names") {
    return (
      <BubbleShell isUser={false}>
        <div className="grid grid-cols-2 gap-2">
          {(message.data?.names || []).map((n) => (
            <button
              key={n}
              onClick={() => onPickName?.(n)}
              className="px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-400/40 text-left text-white font-bold text-sm transition-all"
            >
              {n}
            </button>
          ))}
        </div>
      </BubbleShell>
    );
  }

  if (message.kind === "palette") {
    return (
      <BubbleShell isUser={false}>
        <div className="flex gap-2">
          {(message.data?.palette || []).map((c) => (
            <Swatch key={c} color={c} />
          ))}
        </div>
      </BubbleShell>
    );
  }

  if (message.kind === "logo") {
    return (
      <BubbleShell isUser={false}>
        <div className="rounded-2xl overflow-hidden bg-white aspect-square w-44 mx-auto">
          {message.data?.url ? (
            <img src={message.data.url} alt="logo" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">No logo</div>
          )}
        </div>
      </BubbleShell>
    );
  }

  if (message.kind === "voice") {
    return (
      <BubbleShell isUser={false}>
        <div className="space-y-2">
          {message.data?.tone && (
            <div className="flex flex-wrap gap-1.5">
              {message.data.tone.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-400/30 text-violet-200 text-[11px] font-bold">
                  {t}
                </span>
              ))}
            </div>
          )}
          {message.data?.voice && <p className="text-white/80 text-sm leading-relaxed">{message.data.voice}</p>}
        </div>
      </BubbleShell>
    );
  }

  if (message.kind === "social") {
    return (
      <BubbleShell isUser={false}>
        <div className="space-y-2">
          {message.data?.tagline && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-white/10">
              <div className="text-[10px] font-bold tracking-widest text-cyan-300 uppercase mb-1">Tagline</div>
              <div className="text-white text-sm font-bold">{message.data.tagline}</div>
            </div>
          )}
          {["twitter", "instagram", "linkedin"].map((p) =>
            message.data?.[p] ? (
              <div key={p} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1">{p}</div>
                <div className="text-white/80 text-[13px] leading-relaxed">{message.data[p]}</div>
              </div>
            ) : null
          )}
        </div>
      </BubbleShell>
    );
  }

  if (message.kind === "broll") {
    const images = (message.data?.images || []).filter(Boolean);
    return (
      <BubbleShell isUser={false}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold tracking-widest text-cyan-300 uppercase">
              B-Roll · {images.length} frames
            </div>
            {images.length > 0 && (
              <div className="text-[10px] text-white/40">tap to enlarge</div>
            )}
          </div>
          {images.length === 0 ? (
            <div className="text-white/50 text-xs">B-roll generation didn't produce images. Ask me to regenerate.</div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {images.map((url, i) => (
                <a
                  key={url + i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 hover:border-cyan-400/50 bg-black/40"
                >
                  <img
                    src={url}
                    alt={`b-roll ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white/80">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </BubbleShell>
    );
  }

  if (message.kind === "summary") {
    return (
      <BubbleShell isUser={false}>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
          <Sparkles className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-100 text-sm leading-relaxed">{message.content}</p>
        </div>
      </BubbleShell>
    );
  }

  return (
    <BubbleShell isUser={isUser}>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
    </BubbleShell>
  );
}

function BubbleShell({ isUser, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-white text-black rounded-br-sm"
            : "bg-white/[0.05] text-white border border-white/10 rounded-bl-sm"
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
}

function Swatch({ color }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(color);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="group flex flex-col items-center gap-1.5"
    >
      <div className="w-12 h-12 rounded-xl border border-white/20 shadow-lg" style={{ background: color }}>
        <div className="w-full h-full rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
          {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
        </div>
      </div>
      <span className="text-[9px] font-mono text-white/50">{color}</span>
    </button>
  );
}