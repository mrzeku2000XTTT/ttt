import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const BANNER_BG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b33822334_generated_image.png";

const ORBS = [
  { label: "Agentic Apps", className: "top-2 left-6" },
  { label: "DeFi", className: "top-1/4 right-2" },
  { label: "NFTs", className: "bottom-6 right-8" },
  { label: "Payments", className: "bottom-2 left-10" },
];

export default function BuilderLandingBanner() {
  return (
    <section className="relative overflow-hidden bg-[#0d0d0d]">
      <img src={BANNER_BG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/60" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[11px] font-black tracking-[0.2em] text-[#00E68E] mb-4">THE KASPA ECONOMY</p>
          <h2 className="text-3xl sm:text-4xl xl:text-5xl font-bold tracking-[-0.02em] leading-[1.05] text-white mb-5">
            More than a wallet. A full <span className="text-[#00E68E]">economic</span> layer.
          </h2>
          <p className="text-white/60 text-sm sm:text-base max-w-md mb-7 leading-relaxed">
            Every app you build ships with the Kaspa wallet kit — payments, tips and on-chain actions work out of the box, on the world's fastest L1.
          </p>
          <a
            href="/AppStoreV2"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white text-[#1A1A1A] text-sm font-bold hover:bg-[#00E68E] transition-colors"
          >
            Explore the Ecosystem <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Radial K with floating layer cards */}
        <div className="relative h-72 sm:h-96 hidden sm:block">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-56 h-56 rounded-full border border-[#00E68E]/20" />
            <div className="absolute w-72 h-72 rounded-full border border-[#00E68E]/10" />
            <div className="w-16 h-16 rounded-2xl bg-[#00E68E] flex items-center justify-center text-[#1A1A1A] font-black text-3xl shadow-[0_0_48px_rgba(0,230,142,0.6)]">
              K
            </div>
          </div>
          {ORBS.map((o, i) => (
            <motion.div
              key={o.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className={`absolute ${o.className} px-4 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-[#00E68E]/30 text-white text-xs font-bold`}
            >
              {o.label}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}