import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * One full-screen "doom card" — a fact + a haunting image.
 * Image is generated on-demand the first time the card is rendered.
 */
export default function DoomCard({ fact, imagePrompt, sourceUrl, index }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    base44.functions
      .invoke("doomScrollImage", { prompt: imagePrompt })
      .then((res) => {
        if (cancelled) return;
        if (res?.data?.url) setImageUrl(res.data.url);
        else setImgError(true);
      })
      .catch(() => !cancelled && setImgError(true));
    return () => { cancelled = true; };
  }, [imagePrompt]);

  return (
    <div className="relative w-full h-screen snap-start snap-always overflow-hidden bg-black flex items-end">
      {/* Image */}
      {imageUrl ? (
        <motion.img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1.15, opacity: 1 }}
          transition={{ scale: { duration: 18, ease: "linear" }, opacity: { duration: 1.2 } }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-950 via-black to-purple-950">
          {!imgError && <Loader2 className="w-8 h-8 text-red-500/50 animate-spin" />}
        </div>
      )}

      {/* Vignette + grain */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 w-full px-6 pb-24 pt-16 max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="text-red-400/80 text-[10px] font-bold tracking-[0.4em] uppercase mb-3">
          № {String(index + 1).padStart(3, "0")}
        </div>
        <p className="text-white text-2xl sm:text-3xl md:text-4xl font-serif leading-tight tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)]">
          {fact}
        </p>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-6 text-white/40 hover:text-white/70 text-[10px] font-mono uppercase tracking-widest transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Grokipedia
          </a>
        )}
      </motion.div>

      {/* Swipe hint on first card */}
      {index === 0 && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase z-10"
          animate={{ y: [0, 8, 0], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ↓ Scroll ↓
        </motion.div>
      )}
    </div>
  );
}