import React from "react";
import { Phone, Mic, Wifi } from "lucide-react";
import { motion } from "framer-motion";

export default function KivRHero() {
  return (
    <div className="relative flex flex-col items-center pt-10 pb-6 px-4 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,90,20,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 mb-4"
      >
        <div className="w-24 h-24 rounded-[28px] flex items-center justify-center relative"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,90,20,0.4)",
            boxShadow: "0 0 40px rgba(255,90,20,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
          }}>
          {/* K + waveform icon */}
          <div className="relative flex items-center justify-center">
            <span className="text-white font-black text-4xl" style={{ textShadow: "0 0 20px rgba(255,90,20,0.8)" }}>K</span>
            <div className="absolute -bottom-2 flex items-center gap-0.5">
              {[2, 4, 3, 5, 3, 4, 2].map((h, i) => (
                <motion.div key={i}
                  animate={{ scaleY: [1, 1.8, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 + i * 0.1, delay: i * 0.1 }}
                  className="w-0.5 rounded-full"
                  style={{ height: h * 2, background: "rgba(255,90,20,0.8)" }}
                />
              ))}
            </div>
          </div>
          <div className="absolute bottom-2 right-2">
            <Mic size={10} color="rgba(255,255,255,0.6)" />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
        <h1 className="text-white font-black text-4xl tracking-tight text-center mb-1">
          Kiv<span style={{ color: "#ff5a14" }}>R</span>
        </h1>
        <p className="text-center text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Kaspa · IVR · Voice Payments
        </p>
      </motion.div>

      {/* Live indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full"
        style={{ background: "rgba(255,90,20,0.1)", border: "1px solid rgba(255,90,20,0.25)" }}
      >
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#ff5a14" }}
        />
        <span className="text-xs font-semibold" style={{ color: "#ff5a14" }}>Non-Custodial IVR</span>
        <Wifi size={10} color="rgba(255,90,20,0.7)" />
      </motion.div>
    </div>
  );
}