import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const PRODUCTS = [
  {
    name: "Feed",
    desc: "Post, comment, tip & stamp",
    path: "/Feed",
    color: "from-cyan-500 to-blue-500",
    emoji: "💬",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/13e8ec094_image.png"
  },
  {
    name: "Agent ZK",
    desc: "Cryptographic identity",
    path: "/AgentZK",
    color: "from-violet-500 to-purple-600",
    emoji: "🤖",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png"
  },
  {
    name: "StakeDAG",
    desc: "Prediction markets",
    path: "/StakeDAG",
    color: "from-amber-500 to-orange-500",
    emoji: "🎲",
    logo: null
  },
  {
    name: "TTTV",
    desc: "Media browser",
    path: "/Browser",
    color: "from-pink-500 to-rose-500",
    emoji: "📺",
    logo: null
  },
  {
    name: "Hikaru",
    desc: "AI image studio",
    path: "/Hikaru",
    color: "from-emerald-500 to-teal-500",
    emoji: "🎨",
    logo: null
  },
  {
    name: "Bridge",
    desc: "Send KAS anywhere",
    path: "/Bridge",
    color: "from-blue-500 to-indigo-500",
    emoji: "🌉",
    logo: null
  },
  {
    name: "DAGKnight",
    desc: "Advanced wallet",
    path: "/DAGKnightWallet",
    color: "from-zinc-600 to-zinc-800",
    emoji: "⚔️",
    logo: null
  },
  {
    name: "App Store",
    desc: "80+ community apps",
    path: "/AppStore",
    color: "from-yellow-500 to-amber-500",
    emoji: "👑",
    logo: null
  },
];

export default function ProductGrid() {
  return (
    <section id="products" className="py-20 sm:py-28 px-5">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <p className="text-[13px] font-semibold text-zinc-400 tracking-wide uppercase mb-2">Ecosystem</p>
          <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">Everything in one place.</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {PRODUCTS.map((p, i) => (
            <Link key={p.name} to={p.path}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="group bg-white rounded-2xl p-5 sm:p-6 ring-1 ring-zinc-200/60 hover:ring-zinc-300 hover:shadow-xl hover:shadow-zinc-200/40 transition-all duration-500 cursor-pointer h-full"
              >
                <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${p.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500 overflow-hidden`}>
                  {p.logo ? (
                    <img src={p.logo} alt={p.name} className="w-8 h-8 object-contain rounded-md" />
                  ) : (
                    <span className="text-xl">{p.emoji}</span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-zinc-900 mb-0.5">{p.name}</h3>
                <p className="text-[12px] text-zinc-400 leading-relaxed">{p.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}