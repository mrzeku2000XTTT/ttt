import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ORB_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/cde0e740c_generated_image.png";
function VineCorner({ className = "" }) {
  return (
    <svg viewBox="0 0 260 260" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vineGradient" x1="0" y1="0" x2="260" y2="260" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f5b6b6" />
          <stop offset="0.38" stopColor="#f08a72" />
          <stop offset="0.7" stopColor="#b77ad9" />
          <stop offset="1" stopColor="#65d6f1" />
        </linearGradient>
      </defs>
      <path d="M6 34C42 14 80 10 121 22C158 33 191 25 232 8" stroke="url(#vineGradient)" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 10C54 33 67 54 72 91C77 127 65 162 36 209" stroke="url(#vineGradient)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M45 30C30 49 20 69 18 94" stroke="url(#vineGradient)" strokeWidth="2" strokeLinecap="round" />
      <path d="M71 39C94 50 113 54 139 50" stroke="url(#vineGradient)" strokeWidth="2" strokeLinecap="round" />
      <path d="M96 20C111 42 127 58 154 69" stroke="url(#vineGradient)" strokeWidth="2" strokeLinecap="round" />
      <path d="M126 24C141 36 159 42 183 38" stroke="url(#vineGradient)" strokeWidth="2" strokeLinecap="round" />
      <path d="M164 31C184 45 204 49 231 43" stroke="url(#vineGradient)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M52 74C35 84 25 99 21 121" stroke="url(#vineGradient)" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M75 81C95 91 111 105 122 128" stroke="url(#vineGradient)" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M61 124C43 132 31 148 26 172" stroke="url(#vineGradient)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M55 158C66 178 70 196 65 223" stroke="url(#vineGradient)" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="88" cy="34" r="4" stroke="#de8ab8" strokeWidth="2" />
      <circle cx="127" cy="55" r="3" stroke="#ef9177" strokeWidth="1.8" />
      <circle cx="48" cy="101" r="3.5" stroke="#b782d8" strokeWidth="1.8" />
      <circle cx="73" cy="148" r="3" stroke="#ef9177" strokeWidth="1.7" />
    </svg>
  );
}

export default function TTTLandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-slate-950">
      <div className="absolute inset-0 bg-white" />
      <VineCorner className="pointer-events-none absolute left-0 top-0 h-52 w-52 opacity-60 sm:h-72 sm:w-72" />
      <VineCorner className="pointer-events-none absolute right-0 top-0 h-52 w-52 scale-x-[-1] opacity-60 sm:h-72 sm:w-72" />
      <VineCorner className="pointer-events-none absolute bottom-0 left-0 h-52 w-52 scale-y-[-1] opacity-35 sm:h-72 sm:w-72" />
      <VineCorner className="pointer-events-none absolute bottom-0 right-0 h-52 w-52 scale-[-1] opacity-35 sm:h-72 sm:w-72" />
      <img
        src={ORB_IMAGE}
        alt="TTT cosmic orb background"
        className="absolute inset-0 h-full w-full scale-90 object-contain object-center opacity-100 [image-rendering:auto] transform-gpu md:scale-[0.78]"
      />
      <img
        src={ORB_IMAGE}
        alt="TTT orb water reflection"
        className="absolute inset-x-0 bottom-0 h-1/3 w-full origin-bottom scale-y-[-1] object-contain object-bottom opacity-18"
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white via-white/65 to-transparent" />
      <div className="absolute inset-0 bg-white/5" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-end px-4 pb-8 pt-10 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative h-[min(62vh,620px)] w-full"
        >
          <Link
            to="/TTTGate"
            aria-label="Launch old TTT portal"
            className="absolute inset-0"
          />
        </motion.div>



        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mb-2 text-sm font-medium tracking-[0.45em] text-slate-900/80 sm:text-base"
        >
          地球到火星交易
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xs font-medium tracking-[0.32em] text-slate-600/70 sm:text-sm"
        >
          由 Kaspa 提供支持
        </motion.p>
      </section>
    </main>
  );
}