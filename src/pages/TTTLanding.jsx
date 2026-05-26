import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ORB_IMAGE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/cde0e740c_generated_image.png";
function VineCorner({ className = "" }) {
  const vinePaths = [
    "M2 42C30 17 67 8 108 17C146 25 177 25 211 8",
    "M8 18C42 39 55 70 48 108C42 143 24 166 8 205",
    "M22 31C48 45 77 47 106 39C128 33 151 24 181 28",
    "M36 8C55 35 65 62 67 94C69 129 58 158 36 190",
    "M56 27C42 48 31 68 24 100",
    "M78 18C88 40 103 58 130 70",
    "M96 25C123 35 151 39 184 31",
    "M130 18C150 36 171 46 204 44",
    "M52 76C35 88 25 105 20 132",
    "M66 92C87 106 101 122 110 148",
    "M49 125C30 140 20 158 15 188",
    "M48 151C61 173 65 193 58 226",
    "M26 65C16 77 10 93 8 115",
    "M82 58C106 67 126 82 143 104",
    "M105 43C115 61 131 75 153 85",
    "M34 101C49 114 59 131 63 154"
  ];

  return (
    <svg viewBox="0 0 220 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vineGradient" x1="0" y1="0" x2="220" y2="240" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4b9b6" />
          <stop offset="0.32" stopColor="#ee907d" />
          <stop offset="0.62" stopColor="#d783b7" />
          <stop offset="0.82" stopColor="#9b7ed9" />
          <stop offset="1" stopColor="#6bd7ef" />
        </linearGradient>
        <filter id="softInk" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.18" />
        </filter>
      </defs>
      {vinePaths.map((path, index) => (
        <path
          key={path}
          d={path}
          stroke="url(#vineGradient)"
          strokeWidth={index < 4 ? 2.6 : 1.55}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#softInk)"
        />
      ))}
      <path d="M1 43C36 27 68 29 102 43" stroke="#f5c8c2" strokeWidth="5" strokeLinecap="round" opacity="0.26" />
      <path d="M38 7C48 45 47 82 34 122" stroke="#f5c8c2" strokeWidth="5" strokeLinecap="round" opacity="0.22" />
      <circle cx="70" cy="34" r="4" stroke="#df8ab6" strokeWidth="1.8" opacity="0.8" />
      <circle cx="109" cy="48" r="3" stroke="#ef947d" strokeWidth="1.6" opacity="0.78" />
      <circle cx="31" cy="91" r="3.5" stroke="#aa83d8" strokeWidth="1.6" opacity="0.72" />
      <circle cx="58" cy="142" r="3" stroke="#ef947d" strokeWidth="1.5" opacity="0.68" />
      <circle cx="146" cy="32" r="2.5" stroke="#75d2e8" strokeWidth="1.4" opacity="0.58" />
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