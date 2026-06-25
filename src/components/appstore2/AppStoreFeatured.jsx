import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Crown } from "lucide-react";

const FEATURED = [
  {
    name: "Buy KAS",
    desc: "Swap crypto instantly at the best rates",
    external: "https://kaspa.com/buy-kas",
    color: "from-teal-400 to-green-600",
    logo: "https://kaspa.com/wp-content/uploads/2024/01/kaspa-icon.png",
    bg: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=70",
  },
  {
    name: "Feed",
    desc: "Social feed with KAS tipping",
    path: "/Feed",
    color: "from-cyan-500 to-blue-600",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/759d6a05a_generated_image.png",
    bg: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=70",
  },
  {
    name: "Agent ZK",
    desc: "Cryptographic identity system",
    path: "/AgentZK",
    color: "from-violet-500 to-purple-700",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png",
    premium: true,
    bg: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=70",
  },
  {
    name: "StakeDAG",
    desc: "Prediction markets with escrow",
    path: "/StakeDAG",
    color: "from-emerald-500 to-teal-700",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/273ecff83_generated_image.png",
    bg: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=800&q=70",
  },
  {
    name: "Hikaru",
    desc: "AI image generation studio",
    path: "/Hikaru",
    color: "from-pink-500 to-rose-700",
    logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ede6944ce_generated_image.png",
    bg: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&q=70",
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {FEATURED.map((app, i) => {
          const card = (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              whileHover={{ y: -4 }}
              className={`relative rounded-2xl bg-gradient-to-br ${app.color} p-4 h-40 flex flex-col justify-between overflow-hidden shadow-lg group cursor-pointer`}
            >
              {app.bg && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                  style={{ backgroundImage: `url(${app.bg})` }}
                />
              )}
              <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-60 mix-blend-multiply`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute top-3 right-3 w-14 h-14 rounded-xl overflow-hidden shadow-lg opacity-95 group-hover:scale-110 transition-transform z-10">
                <img src={app.logo} alt={app.name} className="w-full h-full object-cover" />
              </div>
              {app.premium && (
                <Crown className="absolute top-3 left-3 w-4 h-4 text-yellow-300 z-10 drop-shadow-lg" />
              )}
              <div />
              <div className="relative z-10">
                <h3 className="text-white font-bold text-sm mb-0.5 drop-shadow-md">{app.name}</h3>
                <p className="text-white/85 text-[11px] leading-tight drop-shadow">{app.desc}</p>
              </div>
              <ArrowUpRight className="absolute bottom-3 right-3 w-4 h-4 text-white/60 group-hover:text-white transition-colors z-10" />
            </motion.div>
          );

          return app.external
            ? <a key={app.name} href={app.external} target="_blank" rel="noopener noreferrer">{card}</a>
            : <Link key={app.name} to={app.path} onClick={() => { try { localStorage.setItem('came_from_categories', 'true'); } catch {} }}>{card}</Link>;
        })}
      </div>
    </motion.div>
  );
}