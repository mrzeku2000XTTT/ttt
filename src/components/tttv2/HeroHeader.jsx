import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const FEATURED_APPS = [
  {
    name: "Feed",
    path: "/Feed",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/759d6a05a_generated_image.png",
    size: "large",
  },
  {
    name: "Agent ZK",
    path: "/AgentZK",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png",
    size: "small",
  },
  {
    name: "StakeDAG",
    path: "/StakeDAG",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/273ecff83_generated_image.png",
    size: "small",
  },
  {
    name: "TTTV",
    path: "/Browser",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/04565f09d_generated_image.png",
    size: "medium",
  },
  {
    name: "Hikaru",
    path: "/Hikaru",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ede6944ce_generated_image.png",
    size: "medium",
  },
  {
    name: "Bridge",
    path: "/Bridge",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c45793efd_generated_image.png",
    size: "small",
  },
  {
    name: "DAGKnight",
    path: "/DAGKnightWallet",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2ea9d0166_generated_image.png",
    size: "large",
  },
  {
    name: "App Store",
    path: "/AppStore",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4b0087a11_generated_image.png",
    size: "small",
  },
  {
    name: "Zeku AI",
    path: "/ZekuAI",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ede6944ce_generated_image.png",
    size: "medium",
  },
];

const sizePixels = {
  small: { width: 56, height: 56, radius: 16 },
  medium: { width: 72, height: 72, radius: 20 },
  large: { width: 88, height: 88, radius: 22 },
};

function MarqueeIcon({ app }) {
  const s = sizePixels[app.size] || sizePixels.small;
  return (
    <Link to={app.path} className="flex-shrink-0">
      <div className="flex flex-col items-center gap-1.5 cursor-pointer group">
        <div
          className="shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 overflow-hidden flex-shrink-0"
          style={{ width: s.width, height: s.height, borderRadius: s.radius }}
        >
          <img src={app.logo} alt={app.name} className="w-full h-full object-cover" draggable={false} />
        </div>
        <span className="text-[11px] font-medium text-zinc-500 group-hover:text-zinc-900 transition-colors truncate max-w-[80px] text-center">
          {app.name}
        </span>
      </div>
    </Link>
  );
}

function ScrollingRow({ apps, direction = "left", speed = 30 }) {
  const doubled = [...apps, ...apps, ...apps];
  return (
    <div className="relative overflow-hidden w-full">
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-[#F5F5F7] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-[#F5F5F7] to-transparent z-10 pointer-events-none" />
      <motion.div
        className="flex items-end gap-5 sm:gap-6 w-max"
        animate={{ x: direction === "left" ? ["0%", "-33.333%"] : ["-33.333%", "0%"] }}
        transition={{ x: { duration: speed, ease: "linear", repeat: Infinity } }}
      >
        {doubled.map((app, i) => (
          <MarqueeIcon key={`${app.name}-${i}`} app={app} />
        ))}
      </motion.div>
    </div>
  );
}

export default function HeroHeader() {
  return (
    <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-16 px-5 overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-cyan-100/40 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 ring-1 ring-zinc-200/60 mb-6"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-zinc-500 tracking-wide uppercase">Version 2.0</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-[clamp(2rem,6vw,4rem)] font-[900] leading-[1] tracking-tight text-zinc-900 mb-3"
        >
          The Kaspa
          <br />
          <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            App Store.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[15px] text-zinc-400 max-w-md mx-auto leading-relaxed mb-10"
        >
          80+ apps. One ecosystem. Built on the fastest blockDAG.
        </motion.p>

        {/* Animated scrolling app icons — two rows, opposite directions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="space-y-4 mb-10 -mx-5"
        >
          <ScrollingRow apps={FEATURED_APPS.filter((_, i) => i % 2 === 0)} direction="left" speed={35} />
          <ScrollingRow apps={FEATURED_APPS.filter((_, i) => i % 2 === 1)} direction="right" speed={40} />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/Feed">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="h-11 px-7 bg-zinc-900 text-white text-[14px] font-semibold rounded-full shadow-lg shadow-zinc-900/15 flex items-center gap-2 hover:bg-zinc-800 transition-colors"
            >
              Get Started <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </Link>
          <Link to="/AppStore">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="h-11 px-7 text-zinc-600 text-[14px] font-semibold rounded-full ring-1 ring-zinc-200 hover:ring-zinc-300 hover:bg-zinc-50 transition-all flex items-center gap-2"
            >
              Browse All Apps
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}