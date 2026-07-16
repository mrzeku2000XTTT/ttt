import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import WhiteWaves from "@/components/sector6/WhiteWaves";
import Sector6Room from "@/components/sector6/Sector6Room";

export default function Sector6Page() {
  const [showRoom, setShowRoom] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-800 relative overflow-hidden" style={{ fontFamily: "'Rajdhani', system-ui, sans-serif" }}>
      {/* Wavy line decorations */}
      <WhiteWaves className="absolute -top-24 -left-32 w-[480px] h-[480px] pointer-events-none" />
      <WhiteWaves className="absolute -top-10 right-0 w-[560px] h-[560px] pointer-events-none" flip />
      <WhiteWaves className="absolute bottom-[-140px] right-24 w-[520px] h-[520px] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-16 py-8">
        <div className="font-black tracking-[0.2em] text-gray-900 text-lg">SECTOR 6</div>
        <div className="hidden md:flex items-center gap-8 text-[11px] tracking-[0.25em] text-gray-500">
          <span className="cursor-default">HOME</span>
          <span className="px-4 py-1.5 rounded-full bg-gray-800 text-white cursor-default">ROOM</span>
          <span className="cursor-default">ABOUT</span>
          <span className="cursor-default">CONTACT</span>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 px-8 md:px-16 pt-16 md:pt-24 pb-24 max-w-3xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-black tracking-[0.08em] text-gray-800"
        >
          SECTOR 6
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-lg md:text-xl tracking-[0.5em] text-gray-400 font-light"
        >
          THEN, AT THAT TIME...
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-sm leading-relaxed text-gray-400 max-w-md"
        >
          A pure white space with four corners. Step inside the real 3D room —
          orbit, zoom, and explore Sector 6. This is where we actually do stuff.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setShowRoom(true)}
          className="mt-10 px-10 py-3 rounded-full bg-gray-600 hover:bg-gray-800 text-white text-[11px] font-bold tracking-[0.3em] transition-colors"
        >
          SHOW 3D ROOM
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={() => navigate("/SectorVI")}
          className="mt-4 flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white text-[11px] font-bold tracking-[0.3em] transition-colors hover:bg-gray-900"
        >
          ENTER THE REAL SECTORS <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Fullscreen 3D Room */}
      <AnimatePresence>
        {showRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white"
          >
            <Sector6Room />
            <div className="absolute top-6 left-8 pointer-events-none">
              <div className="font-black tracking-[0.2em] text-gray-800 text-sm">SECTOR 6 — 3D ROOM</div>
              <div className="text-[10px] tracking-[0.25em] text-gray-400 mt-1">DRAG TO ORBIT · SCROLL TO ZOOM</div>
            </div>
            <button
              onClick={() => setShowRoom(false)}
              className="absolute top-6 right-8 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}