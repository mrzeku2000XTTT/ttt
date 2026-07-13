import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

// Draggable mood board canvas — images, notes, color swatches
export default function MoodCanvas({ items, onMove, onEditNote, onRemove }) {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden"
      style={{ height: "60vh", minHeight: "420px",
        border: "1px solid rgba(255,140,90,0.18)", background: "rgba(12,5,2,0.55)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        backgroundImage: "radial-gradient(rgba(255,150,90,0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px" }}>
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] tracking-[0.35em] uppercase text-center px-6"
          style={{ color: "rgba(255,190,150,0.35)", fontFamily: "monospace" }}>
          EMPTY CANVAS · USE THE TOOLS TO FORGE YOUR MOOD
        </div>
      )}
      <AnimatePresence>
        {items.map((item) => (
          <motion.div key={item.id} drag dragMomentum={false}
            onDragEnd={(e, info) => onMove(item.id, info.offset.x, info.offset.y)}
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
            className="absolute group cursor-grab active:cursor-grabbing"
            style={{ left: item.x, top: item.y, rotate: item.rotate || 0, touchAction: "none" }}>
            {/* Delete */}
            <button onClick={() => onRemove(item.id)}
              className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full items-center justify-center hidden group-hover:flex focus:outline-none"
              style={{ background: "rgba(20,8,3,0.9)", border: "1px solid rgba(248,113,113,0.5)" }}>
              <X className="w-3 h-3 text-red-400" />
            </button>

            {item.type === "image" && (
              <img src={item.url} alt="mood" draggable={false}
                className="w-40 sm:w-48 rounded-xl pointer-events-none select-none"
                style={{ border: "1px solid rgba(255,160,110,0.3)", boxShadow: "0 8px 30px rgba(0,0,0,0.6)" }} />
            )}
            {item.type === "note" && (
              <textarea value={item.text}
                onChange={(e) => onEditNote(item.id, e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-40 h-28 p-3 rounded-xl resize-none focus:outline-none text-xs"
                style={{ background: "rgba(60,26,8,0.85)", border: "1px solid rgba(253,186,116,0.35)",
                  color: "#ffedd5", fontFamily: "monospace", boxShadow: "0 8px 30px rgba(0,0,0,0.6)" }}
                placeholder="mood note…" />
            )}
            {item.type === "color" && (
              <div className="w-20 h-20 rounded-2xl flex items-end justify-center pb-1.5"
                style={{ background: item.color, border: "1px solid rgba(255,255,255,0.25)",
                  boxShadow: `0 8px 30px ${item.color}55` }}>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(0,0,0,0.55)", color: "#fff", fontFamily: "monospace" }}>
                  {item.color.toUpperCase()}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}