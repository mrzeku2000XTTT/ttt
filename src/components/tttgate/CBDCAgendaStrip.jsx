import React from "react";
import { motion } from "framer-motion";

const ORGS = [
  { name: "World Economic Forum", tag: "WEF", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bd573fd12_generated_image.png", url: "https://www.weforum.org" },
  { name: "International Monetary Fund", tag: "IMF", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c1e65fe11_generated_image.png", url: "https://www.imf.org" },
  { name: "Bank for Intl. Settlements", tag: "BIS", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/602ed9ed6_generated_image.png", url: "https://www.bis.org" },
  { name: "BlackRock", tag: "BLK", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/785578d06_generated_image.png", url: "https://www.blackrock.com" },
  { name: "European Central Bank", tag: "ECB", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/349a4088a_generated_image.png", url: "https://www.ecb.europa.eu" },
  { name: "United Nations", tag: "UN", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/944fa9b41_generated_image.png", url: "https://www.un.org" },
  { name: "Federal Reserve", tag: "FED", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5e99c5497_generated_image.png", url: "https://www.federalreserve.gov" },
  { name: "World Bank", tag: "WB", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/fd4bc74a6_generated_image.png", url: "https://www.worldbank.org" },
  { name: "People's Bank of China", tag: "PBOC", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d5236822b_generated_image.png", url: "https://www.pbc.gov.cn" },
  { name: "Mastercard", tag: "MC", img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5b6d51115_generated_image.png", url: "https://www.mastercard.com" },
];

// Duplicate the list so the marquee loops seamlessly
const LOOP = [...ORGS, ...ORGS];

export default function CBDCAgendaStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="absolute bottom-24 left-0 right-0 z-20"
    >
      {/* Section label */}
      <div className="text-center mb-2 px-4">
        <span className="text-[9px] sm:text-[10px] tracking-[0.45em] uppercase font-bold"
          style={{ color: "rgba(255,80,80,0.7)", textShadow: "0 0 10px rgba(255,0,0,0.4)" }}>
          The Architects · CBDC & Agenda 2030
        </span>
      </div>

      {/* Film strip container */}
      <div className="relative overflow-hidden mx-auto" style={{ maxWidth: "100%" }}>
        {/* Left/right edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(90deg, #000 0%, transparent 100%)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none"
          style={{ background: "linear-gradient(270deg, #000 0%, transparent 100%)" }} />

        {/* Scrolling track — pauses on hover */}
        <motion.div
          className="flex gap-3 w-max group"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          whileHover={{ transition: { duration: 0.4 } }}
        >
          {LOOP.map((org, i) => (
            <a key={i} href={org.url} target="_blank" rel="noopener noreferrer"
              className="relative flex-shrink-0 block cursor-pointer transition-transform hover:z-20"
              style={{ width: 180 }}
              title={org.name}
            >
              {/* Top sprocket strip */}
              <div className="flex items-center gap-2 px-2 py-1 bg-black"
                style={{ borderTop: "1px solid rgba(255,40,40,0.2)" }}>
                {[...Array(8)].map((_, h) => (
                  <div key={h} className="w-2 h-2 rounded-sm bg-zinc-700/60 flex-shrink-0" />
                ))}
              </div>

              {/* Image frame */}
              <div className="relative aspect-[4/3] overflow-hidden bg-black"
                style={{ borderLeft: "1px solid rgba(255,40,40,0.2)", borderRight: "1px solid rgba(255,40,40,0.2)" }}>
                <img src={org.img} alt={org.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  style={{ filter: "contrast(1.05) saturate(0.85) brightness(0.8)" }} />
                {/* Red scan tint */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(180deg, rgba(255,0,0,0.04) 0%, transparent 40%, rgba(0,0,0,0.3) 100%)" }} />
                {/* Tag badge */}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm"
                  style={{ border: "1px solid rgba(255,40,40,0.4)" }}>
                  <span className="text-[8px] font-black tracking-widest text-red-400">{org.tag}</span>
                </div>
                {/* Hover ring */}
                <div className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 hover:opacity-100"
                  style={{ boxShadow: "inset 0 0 0 2px rgba(255,60,60,0.7)" }} />
              </div>

              {/* Bottom sprocket strip */}
              <div className="flex items-center gap-2 px-2 py-1 bg-black"
                style={{ borderBottom: "1px solid rgba(255,40,40,0.2)" }}>
                {[...Array(8)].map((_, h) => (
                  <div key={h} className="w-2 h-2 rounded-sm bg-zinc-700/60 flex-shrink-0" />
                ))}
              </div>
            </a>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}