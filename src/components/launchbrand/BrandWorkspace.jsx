import React from "react";
import { motion } from "framer-motion";

export default function BrandWorkspace({ brand }) {
  if (!brand) return null;

  return (
    <div className="h-full overflow-y-auto p-5 space-y-4">
      <div>
        <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-2">Workspace</div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-white/60 text-xs font-bold">{brand.completion || 0}% complete</span>
          <span className="text-[10px] font-bold tracking-widest text-cyan-300 uppercase">{brand.stage || "discovery"}</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${brand.completion || 0}%` }}
            className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400"
          />
        </div>
      </div>

      {brand.logo_url && (
        <div className="rounded-2xl overflow-hidden bg-white aspect-square">
          <img src={brand.logo_url} alt="" className="w-full h-full object-contain" />
        </div>
      )}

      {brand.name && (
        <div>
          <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1">Name</div>
          <div className="text-2xl font-[900] text-white tracking-tight">{brand.name}</div>
          {brand.tagline && <div className="text-white/50 text-sm mt-1">{brand.tagline}</div>}
        </div>
      )}

      {brand.palette && brand.palette.length > 0 && (
        <div>
          <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-2">Palette</div>
          <div className="grid grid-cols-5 gap-1.5">
            {brand.palette.map((c) => (
              <div key={c} className="aspect-square rounded-lg border border-white/10" style={{ background: c }} />
            ))}
          </div>
        </div>
      )}

      {brand.voice && (
        <div>
          <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-2">Voice</div>
          <div className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap">{brand.voice}</div>
        </div>
      )}

      {brand.description && (
        <div>
          <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1">About</div>
          <div className="text-white/60 text-xs leading-relaxed">{brand.description}</div>
        </div>
      )}

      {brand.target_audience && (
        <div>
          <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1">Audience</div>
          <div className="text-white/60 text-xs">{brand.target_audience}</div>
        </div>
      )}
    </div>
  );
}