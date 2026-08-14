import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

/**
 * Branded shareable card — turns any listing / coin into a downloadable image
 * for posting on X. card = { title, subtitle, description, logo, accent }
 */
export default function ShareCardModal({ card, onClose }) {
  const ref = useRef(null);
  const [saving, setSaving] = useState(false);

  const download = async () => {
    if (!ref.current) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(ref.current, { backgroundColor: "#000000", scale: 2, useCORS: true });
      const link = document.createElement("a");
      link.download = `${(card.title || "ttt-card").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[320] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-5"
        >
          <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>

          <div ref={ref} className="w-[340px] rounded-3xl p-6 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              {card.logo && <img src={card.logo} alt="" crossOrigin="anonymous" className="w-12 h-12 rounded-full" />}
              <div className="min-w-0">
                <div className="text-white font-bold text-base leading-tight truncate">{card.title}</div>
                {card.subtitle && <div className="text-cyan-300/70 text-[11px] font-mono truncate">{card.subtitle}</div>}
              </div>
            </div>
            {card.description && (
              <p className="text-white/60 text-[12px] leading-relaxed line-clamp-5">{card.description}</p>
            )}
            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-white font-black text-sm tracking-tight">TTT</span>
              <span className="text-white/30 text-[10px] font-mono">tttz.xyz</span>
            </div>
          </div>

          <button
            onClick={download}
            disabled={saving}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-medium hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {saving ? "Rendering…" : "Download card"}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}