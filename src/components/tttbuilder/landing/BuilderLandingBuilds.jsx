import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowRight } from "lucide-react";

const BUILDS = [
  {
    img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/faff890ed_generated_image.png",
    badge: "DeFi",
    title: "Liquidity Bot Engine",
    desc: "Autonomous pool manager with live TVL, APR tracking and strategy cards.",
    prompt: "DeFi liquidity dashboard with live Kaspa TVL, pool stat cards and a strategy panel",
  },
  {
    img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/dd38787bc_generated_image.png",
    badge: "Payments",
    title: "Kaspa Pay",
    desc: "One-tap send, receive and QR checkout on Kaspa L1.",
    prompt: "Kaspa payment app with send, receive, QR codes and transaction history",
  },
  {
    img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/67abd6eb7_generated_image.png",
    badge: "NFT",
    title: "Mint Studio",
    desc: "KRC-20 token launcher with gallery, filters and a real mint flow.",
    prompt: "KRC-20 token hub with token list, mint page and deploy flow",
  },
  {
    img: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e6585ee3b_generated_image.png",
    badge: "Social",
    title: "Tip Feed",
    desc: "Onchain social feed with posts, profiles and KAS tips.",
    prompt: "Crypto social feed app with post cards, profiles and KAS tip buttons",
  },
];

export default function BuilderLandingBuilds({ onPick, onViewAll }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Featured Builds</h2>
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#00B36B] hover:text-[#00E68E] transition-colors"
        >
          View All Projects <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BUILDS.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="group bg-white border border-[#e8e4de] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(26,26,26,0.04)] hover:shadow-[0_14px_40px_rgba(26,26,26,0.12)] transition-all"
          >
            <div className="relative aspect-[4/3] bg-[#1A1A1A] overflow-hidden">
              <img src={b.img} alt={b.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[#00E68E] text-[10px] font-bold uppercase tracking-wider">{b.badge}</span>
            </div>
            <div className="p-4 flex items-start gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-sm mb-1 truncate">{b.title}</h3>
                <p className="text-[12px] text-[#666] leading-relaxed">{b.desc}</p>
              </div>
              <button
                onClick={() => onPick(b.prompt)}
                title={`Build something like ${b.title}`}
                className="ml-auto w-8 h-8 rounded-full bg-[#00E68E] text-[#1A1A1A] flex items-center justify-center flex-shrink-0 hover:bg-[#0ac97e] transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}