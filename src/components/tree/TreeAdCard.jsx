import React from "react";
import { TREE_TEMPLATES } from "@/components/tree/treeTemplates";
import { Copy } from "lucide-react";

export default function TreeAdCard({ ad }) {
  const tpl = TREE_TEMPLATES.find((t) => t.id === ad.template);
  const copyText = () =>
    navigator.clipboard.writeText(`${ad.hook}\n\n${ad.script}\n\n${ad.caption}\n${ad.cta}`);

  return (
    <div className="bg-gradient-to-b from-emerald-950/30 to-black/70 border border-emerald-500/20 rounded-2xl overflow-hidden">
      {ad.image_url && (
        <img src={ad.image_url} alt={tpl?.name || ad.template} className="w-full aspect-video object-cover" />
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-emerald-300 text-xs font-bold uppercase tracking-widest">
            {tpl ? `${tpl.emoji} ${tpl.name}` : ad.template}
          </span>
          <button onClick={copyText} className="text-white/40 hover:text-emerald-300" title="Copy ad text">
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <p className="text-white font-bold text-sm leading-snug">🪝 {ad.hook}</p>
        <p className="text-white/70 text-xs whitespace-pre-wrap leading-relaxed">{ad.script}</p>
        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-white/80 text-xs">{ad.caption}</p>
          <p className="text-emerald-300 text-xs font-semibold mt-1">{ad.cta}</p>
        </div>
        {ad.narration_url && (
          <div>
            <p className="text-emerald-300/60 text-[10px] uppercase tracking-widest mb-1">Narration</p>
            <audio controls src={ad.narration_url} className="w-full h-9" />
          </div>
        )}
      </div>
    </div>
  );
}