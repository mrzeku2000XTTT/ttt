import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

/**
 * Branded shareable card — turns any listing / coin into a downloadable image
 * for posting on X. card = { title, subtitle, description, logo, accent }
 */
const clamp = (s, n) => {
  const t = (s || "").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
};

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

          {/* Inline styles + JS-clamped text — html2canvas mis-renders truncate/line-clamp */}
          <div
            ref={ref}
            style={{
              width: 360,
              padding: 28,
              borderRadius: 24,
              background: "#0a0a0a",
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: "Arial, Helvetica, sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              {card.logo && (
                <img src={card.logo} alt="" crossOrigin="anonymous" style={{ width: 48, height: 48, borderRadius: 999, flexShrink: 0 }} />
              )}
              <div style={{ overflow: "hidden" }}>
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 17, lineHeight: "24px", whiteSpace: "nowrap", overflow: "hidden" }}>
                  {clamp(card.title, 24)}
                </div>
                {card.subtitle && (
                  <div style={{ color: "#67e8f9", fontSize: 12, lineHeight: "18px", whiteSpace: "nowrap", overflow: "hidden" }}>
                    {clamp(card.subtitle, 34)}
                  </div>
                )}
              </div>
            </div>
            {card.description && (
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: "22px", margin: 0 }}>
                {clamp(card.description, 220)}
              </p>
            )}
            <div style={{ marginTop: 22, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#ffffff", fontWeight: 900, fontSize: 15, lineHeight: "20px" }}>TTT</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, lineHeight: "20px" }}>tttz.xyz</span>
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