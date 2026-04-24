import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle } from "lucide-react";

export default function FlyerDetailCard({ flyer, onClose, onChat }) {
  return (
    <AnimatePresence>
      {flyer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[90%] max-w-md"
        >
          <div
            className="rounded-3xl bg-black/85 backdrop-blur-2xl ring-2 p-6 shadow-2xl"
            style={{ borderColor: flyer.accent, boxShadow: `0 0 60px ${flyer.accent}55` }}
          >
            {/* Corner brackets */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: flyer.accent }} />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: flyer.accent }}>
                  {flyer.label}
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-white text-2xl font-[900] tracking-tight mb-2">{flyer.title}</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-5">{flyer.body}</p>

            <button
              onClick={onChat}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-black font-bold text-sm transition-all hover:scale-[1.02]"
              style={{ background: flyer.accent }}
            >
              <MessageCircle className="w-4 h-4" />
              Talk to this Agent
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}