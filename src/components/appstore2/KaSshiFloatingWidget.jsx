import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GripHorizontal, Minimize2 } from "lucide-react";

export default function KaSshiFloatingWidget({ open, onClose }) {
  const [pos, setPos] = useState({ x: 24, y: 100 });
  const [minimized, setMinimized] = useState(false);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const onPointerDown = useCallback((e) => {
    if (e.target.closest("button")) return;
    e.preventDefault();
    draggingRef.current = true;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    e.target.setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const x = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - offsetRef.current.x));
    const y = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - offsetRef.current.y));
    setPos({ x, y });
  }, []);

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          className="fixed z-[450] select-none touch-none"
          style={{ left: pos.x, top: pos.y }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* Header pill — visible when minimized */}
          {minimized && (
            <div
              className="bg-black/95 backdrop-blur-xl px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing rounded-2xl ring-2 ring-purple-400/60"
              style={{ width: 220, boxShadow: "0 0 50px rgba(168,85,247,0.4)" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <GripHorizontal className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <span className="text-white text-xs font-bold tracking-wide truncate">KaSshi · Live</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setMinimized(false); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10"
                  title="Expand"
                >
                  <Minimize2 className="w-3 h-3 text-cyan-400" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/20"
                >
                  <X className="w-3.5 h-3.5 text-white/60 hover:text-red-400" />
                </button>
              </div>
            </div>
          )}

          {/*
            Expanded shell — iframe ALWAYS mounted at full size so minimize doesn't kill audio.
            When minimized, slide the shell off-screen (never collapse height/use display:none).
          */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl ring-2 ring-purple-400/60"
            style={{
              width: 340,
              height: 440,
              boxShadow: "0 0 50px rgba(168,85,247,0.4)",
              position: minimized ? "absolute" : "relative",
              left: minimized ? -9999 : 0,
              top: minimized ? -9999 : 0,
              pointerEvents: minimized ? "none" : "auto",
            }}
          >
            <div className="bg-black/95 backdrop-blur-xl px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <GripHorizontal className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <span className="text-white text-xs font-bold tracking-wide truncate">KaSshi · Live</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setMinimized(true); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10"
                  title="Minimize"
                >
                  <Minimize2 className="w-3 h-3 text-cyan-400" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-500/20"
                >
                  <X className="w-3.5 h-3.5 text-white/60 hover:text-red-400" />
                </button>
              </div>
            </div>
            <iframe
              src="https://kasshi.io"
              title="KaSshi Live"
              className="w-full border-0 bg-black"
              style={{ height: "calc(100% - 38px)" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}