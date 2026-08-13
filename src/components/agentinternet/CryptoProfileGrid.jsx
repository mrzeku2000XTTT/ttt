import React from "react";
import { ExternalLink, Users } from "lucide-react";

const X_LOGO = "https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png";

function handleFromUrl(url) {
  const m = (url || "").match(/(?:x|twitter)\.com\/([A-Za-z0-9_]+)/i);
  return m ? `@${m[1]}` : null;
}

export default function CryptoProfileGrid({ profiles, filter }) {
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
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
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
                <div className="text-white text-xs font-semibold truncate">{p.name}</div>
                {handle && <div className="text-amber-300/70 text-[10px] font-mono truncate">{handle}</div>}
              </div>
            </div>
            {p.description && (
              <p className="text-white/40 text-[10px] leading-relaxed line-clamp-3 flex-1">{p.description}</p>
            )}
            <div className="mt-2 flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-white/30">
              <ExternalLink className="w-2.5 h-2.5" /> Open on X
            </div>
          </a>
        );
      })}
    </div>
  );
}