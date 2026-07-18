import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SlobzChat from "@/components/slobz/chat/SlobzChat";

const SLOB_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9f342179c_generated_image.png";

// Floating 3D "ASK NOW" button with the little purple slob — opens Slobz Chat.
export default function SlobzAskButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AnimatePresence>{open && <SlobzChat onClose={() => setOpen(false)} />}</AnimatePresence>
      {!open && (
        <motion.button
          onClick={() => setOpen(true)}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={{ y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="fixed bottom-5 right-5 z-[997] flex items-center gap-2 pr-5 pl-1.5 py-1.5 rounded-full bg-gradient-to-b from-[#8B6FF5] to-[#6B4BEB] shadow-[0_14px_34px_rgba(124,92,252,0.55),inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-3px_6px_rgba(0,0,0,0.2)]"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
          aria-label="Ask Slobz"
        >
          <span className="relative w-12 h-12 rounded-full overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.25)] ring-2 ring-white/40">
            <img src={SLOB_LOGO} alt="Slobz mascot" className="w-full h-full object-cover" />
          </span>
          <span className="text-left">
            <span className="block font-display text-[13px] font-black text-white leading-none">ASK NOW</span>
            <span className="block text-[9px] text-white/70 mt-0.5">chat with Slobz</span>
          </span>
        </motion.button>
      )}
    </>
  );
}