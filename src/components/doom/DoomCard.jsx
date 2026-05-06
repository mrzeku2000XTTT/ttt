import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Typewriter that types the text char by char.
 */
function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setDisplayed("");
    setIdx(0);
  }, [text]);

  useEffect(() => {
    if (idx >= text.length) return;
    const delay = 18 + Math.random() * 22; // slight randomness for realism
    const t = setTimeout(() => {
      setDisplayed((prev) => prev + text[idx]);
      setIdx((i) => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [idx, text]);

  return (
    <>
      {displayed}
      {idx < text.length && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-0.5 h-6 bg-white/70 ml-0.5 align-middle"
        />
      )}
    </>
  );
}

/**
 * One full-screen "doom card" — a fact + a haunting image.
 * Image is generated on-demand. When the user scrolls away, a new replacement
 * is fetched via the onReplace callback so the feed feels infinite.
 */
export default function DoomCard({ fact, imagePrompt, sourceUrl, index, onReplace }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const cardRef = useRef(null);
  const hasTriggeredReplace = useRef(false);

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

  // When the card scrolls out of view (intersection < 10%), trigger onReplace
  useEffect(() => {
    if (!onReplace || !cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !hasTriggeredReplace.current) {
          hasTriggeredReplace.current = true;
          onReplace(index);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [index, onReplace]);

  const handleManualReplace = async () => {
    if (replacing || !onReplace) return;
    setReplacing(true);
    await onReplace(index);
    setReplacing(false);
  };

  return (
    <div ref={cardRef} className="relative w-full h-screen snap-start snap-always overflow-hidden bg-black flex items-end">
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
          <TypewriterText text={fact} />
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

      {/* Manual replace button */}
      {onReplace && (
        <button
          onClick={handleManualReplace}
          disabled={replacing}
          className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 border border-white/10 text-white/50 hover:text-white backdrop-blur transition-colors"
          title="Replace this card"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${replacing ? "animate-spin" : ""}`} />
        </button>
      )}
    </div>
  );
}