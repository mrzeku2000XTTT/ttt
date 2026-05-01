import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, GripHorizontal } from "lucide-react";

export default function MirageRunPanel({ logs, running, onClose }) {
  const [size, setSize] = useState({ w: 420, h: 300 });
  const [minimized, setMinimized] = useState(false);
  const resizing = useRef(null);

  const startResize = (e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startW: size.w,
      startH: size.h,
    };
  };

  const onMove = useCallback((e) => {
    if (!resizing.current) return;
    const r = resizing.current;
    const dx = e.clientX - r.startX;
    const dy = e.clientY - r.startY;
    setSize({
      // Panel is anchored bottom-right, so dragging left/up grows it
      w: Math.max(280, Math.min(900, r.startW - (r.dir.includes("w") ? dx : 0))),
      h: Math.max(160, Math.min(700, r.startH - (r.dir.includes("n") ? dy : 0))),
    });
  }, []);

  const onUp = useCallback(() => {
    resizing.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [onMove, onUp]);

  return (
    <motion.div
      initial={{ y: 300, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 300, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 240 }}
      className="absolute bottom-4 right-4 z-30 bg-black/85 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/20 overflow-hidden flex flex-col"
      style={{
        width: minimized ? 220 : size.w,
        height: minimized ? 44 : size.h,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100vh - 80px)",
      }}
    >
      {/* Resize handles (top + left edges, and top-left corner) */}
      {!minimized && (
        <>
          <div
            onMouseDown={(e) => startResize(e, "n")}
            className="absolute top-0 left-3 right-3 h-1.5 cursor-ns-resize hover:bg-emerald-400/30 z-50"
          />
          <div
            onMouseDown={(e) => startResize(e, "w")}
            className="absolute left-0 top-3 bottom-3 w-1.5 cursor-ew-resize hover:bg-emerald-400/30 z-50"
          />
          <div
            onMouseDown={(e) => startResize(e, "nw")}
            className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize hover:bg-emerald-400/40 z-50 flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
          </div>
        </>
      )}

      {/* Header */}
      <div
        onClick={() => minimized && setMinimized(false)}
        className={`flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-amber-500/10 ${minimized ? "cursor-pointer" : ""}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {running ? (
            <Loader2 className="w-3.5 h-3.5 text-emerald-300 animate-spin flex-shrink-0" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          )}
          <span className="text-white font-black text-xs tracking-wide truncate">
            {running ? "Running…" : "Run Log"}
          </span>
          {!minimized && logs.length > 0 && (
            <span className="text-white/40 text-[10px] font-bold">· {logs.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}
            className="text-white/50 hover:text-white p-1 rounded hover:bg-white/10"
            title={minimized ? "Expand" : "Minimize"}
          >
            <GripHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-white/50 hover:text-white p-1 rounded hover:bg-white/10"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-mono">
          {logs.length === 0 && (
            <div className="text-white/30 text-[11px]">Waiting for execution…</div>
          )}
          {logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]">
              <span className="text-white/30 shrink-0">{log.time}</span>
              <span
                className={
                  log.type === "error"
                    ? "text-red-300"
                    : log.type === "success"
                    ? "text-emerald-300"
                    : "text-white/70"
                }
              >
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}