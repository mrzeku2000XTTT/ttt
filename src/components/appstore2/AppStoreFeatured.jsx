import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Crown } from "lucide-react";

const FEATURED = [
  {
    name: "Feed",
    desc: "Social feed with KAS tipping",
    path: "/Feed",
    color: "from-cyan-500 to-blue-600",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/759d6a05a_generated_image.png",
  },
  {
    name: "Agent ZK",
    desc: "Cryptographic identity system",
    path: "/AgentZK",
    color: "from-violet-500 to-purple-700",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png",
    premium: true,
  },
  {
    name: "StakeDAG",
    desc: "Prediction markets with escrow",
    path: "/StakeDAG",
    color: "from-emerald-500 to-teal-700",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/273ecff83_generated_image.png",
  },
  {
    name: "Hikaru",
    desc: "AI image generation studio",
    path: "/Hikaru",
    color: "from-pink-500 to-rose-700",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ede6944ce_generated_image.png",
  },
];

export default function AppStoreFeatured() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-10"
    >
      <h2 className="text-lg font-[800] mb-4">Featured</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FEATURED.map((app, i) => (
          <Link key={app.name} to={app.path}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              whileHover={{ y: -4 }}
              className={`relative rounded-2xl bg-gradient-to-br ${app.color} p-4 h-40 flex flex-col justify-between overflow-hidden shadow-lg group cursor-pointer`}
            >
              <div className="absolute top-3 right-3 w-14 h-14 rounded-xl overflow-hidden shadow-lg opacity-90 group-hover:scale-110 transition-transform">
                <img src={app.logo} alt={app.name} className="w-full h-full object-cover" />
              </div>
              {app.premium && (
                <Crown className="absolute top-3 left-3 w-4 h-4 text-yellow-300" />
              )}
              <div />
              <div>
                <h3 className="text-white font-bold text-sm mb-0.5">{app.name}</h3>
                <p className="text-white/70 text-[11px] leading-tight">{app.desc}</p>
              </div>
              <ArrowUpRight className="absolute bottom-3 right-3 w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}