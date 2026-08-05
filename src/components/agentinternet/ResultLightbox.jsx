import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ExternalLink, Copy, Check } from "lucide-react";

/**
 * ResultLightbox — opens a returned asset full-screen so users can view the
 * real campaign/image and save it (download, copy, or open in a new tab).
 */
export default function ResultLightbox({ item, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!item) return null;
  const { type, title, detail, image, url } = item;

  const saveImage = async () => {
    if (!image) return;
    try {
      const res = await fetch(image);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `${(title || "ttt-asset").replace(/\s+/g, "_").toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      window.open(image, "_blank");
    }
  };

  const copyUrl = () => {
    try { navigator.clipboard?.writeText(image || url || ""); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-zinc-950 overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {image ? (
              <div className="bg-black flex items-center justify-center max-h-[60vh]">
                <img src={image} alt={title} className="w-full max-h-[60vh] object-contain" />
              </div>
            ) : url ? (
              <iframe src={url} title={title} className="w-full h-[60vh] bg-white" />
            ) : (
              <div className="h-40 flex items-center justify-center text-white/40 text-sm font-mono">no preview</div>
            )}

            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-300/80">{type}</span>
              </div>
              <h3 className="text-white font-heading font-bold text-base">{title}</h3>
              {detail && <p className="text-white/55 text-xs mt-1 leading-relaxed">{detail}</p>}

              <div className="flex flex-wrap gap-2 mt-3">
                {image && (
                  <button
                    onClick={saveImage}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-cyan-400 text-black text-xs font-bold hover:bg-cyan-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Save image
                  </button>
                )}
                {image && (
                  <button
                    onClick={copyUrl}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-white/15 bg-white/5 text-white text-xs font-medium hover:bg-white/10 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                )}
                {(image || url) && (
                  <a
                    href={image || url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-white/15 bg-white/5 text-white text-xs font-medium hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}