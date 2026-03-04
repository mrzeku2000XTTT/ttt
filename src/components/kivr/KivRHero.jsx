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
        <div className="w-24 h-24 rounded-[28px] overflow-hidden relative"
          style={{
            boxShadow: "0 0 40px rgba(255,90,20,0.4), 0 0 80px rgba(255,90,20,0.15)"
          }}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/a3f7bbc81_IMG_1275.jpg"
            alt="KivR Logo"
            className="w-full h-full object-contain"
            style={{ background: "#1a0a00" }}
          />
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