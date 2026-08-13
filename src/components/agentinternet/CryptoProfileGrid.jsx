import React from "react";
import { Bot, ExternalLink, Users } from "lucide-react";

const X_LOGO = "https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png";

function handleFromUrl(url) {
  const m = (url || "").match(/(?:x|twitter)\.com\/([A-Za-z0-9_]+)/i);
  return m ? `@${m[1]}` : null;
}

export default function CryptoProfileGrid({ profiles, filter, onAskAI }) {
  const term = (filter || "").trim().toLowerCase();
  const shown = term
    ? profiles.filter(p =>
        (p.name || "").toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term) ||
        (p.url || "").toLowerCase().includes(term) ||
        (p.features || []).some(f => (f || "").toLowerCase().includes(term)))
    : profiles;

  if (shown.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-xs">No crypto profiles {term ? `matching "${filter}"` : "indexed yet"}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {shown.map(p => {
        const handle = handleFromUrl(p.url);
        return (
          <div
            key={p.id}
            className="flex flex-col p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-amber-500/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src={p.logo || X_LOGO}
                alt=""
                className="w-8 h-8 rounded-full object-cover bg-black flex-shrink-0"
                onError={(e) => { e.currentTarget.src = X_LOGO; }}
              />
              <div className="min-w-0">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-white text-xs font-semibold truncate hover:text-amber-300 transition-colors"
                >
                  {p.name}
                </a>
                {handle && <div className="text-amber-300/70 text-[10px] font-mono truncate">{handle}</div>}
              </div>
            </div>
            {p.description && (
              <p className="text-white/40 text-[10px] leading-relaxed line-clamp-3 flex-1">{p.description}</p>
            )}
            <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-2">
              <button
                onClick={() => onAskAI?.(p)}
                className="inline-flex items-center gap-1 text-[10px] text-amber-300/80 hover:text-amber-200 transition-colors"
              >
                <Bot className="w-3 h-3" /> Ask their AI
              </button>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors ml-auto"
              >
                <ExternalLink className="w-2.5 h-2.5" /> X
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}