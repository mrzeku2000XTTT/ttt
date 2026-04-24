import React from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, Crown } from "lucide-react";

const AGENTS = [
  {
    name: "Agent ZK",
    tagline: "Elite AI Developer",
    description: "Codes endpoints, builds features, analyzes wallets, recommends shopping. Your TTT dev partner.",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ccaf1610a_generated_image.png",
    color: "from-cyan-400 to-blue-600",
    badge: "Premium",
    premium: true,
    page: "AgentZK",
  },
  {
    name: "Zeku AI",
    tagline: "Quantum Crypto Companion",
    description: "Market analysis, whale tracking, image recognition, predictive intelligence. VIP only.",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5a72645c0_generated_image.png",
    color: "from-purple-400 to-pink-500",
    badge: "Premium",
    premium: true,
    page: "ZekuAI",
  },
  {
    name: "TELE",
    tagline: "Telegram Super Agent",
    description: "Bridges Telegram users to TTT — Kaspa info, posts, tips, agent ZK lookups, news.",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5dcc4075b_generated_image.png",
    color: "from-cyan-400 to-sky-500",
    badge: "Bot",
    page: "TELE",
  },
  {
    name: "KAI",
    tagline: "Friendly TTT Chatbot",
    description: "Helps users navigate the feed, explains posts, fetches Kaspa news, and learns from URLs.",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/6d1827356_generated_image.png",
    color: "from-emerald-400 to-cyan-500",
    badge: "Free",
    page: "Feed",
  },
  {
    name: "Agent Ying",
    tagline: "Vision & Pattern AI",
    description: "Analyzes images, recognizes patterns, generates art, and powers visual intelligence.",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/486fc43b5_generated_image.png",
    color: "from-pink-400 to-rose-500",
    badge: "Vision",
    page: "IWork",
  },
  {
    name: "Hercules",
    tagline: "Premium Power Agent",
    description: "The titan AI — heavy lifting, advanced reasoning, complex multi-step tasks. Premium tier.",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/403be441c_generated_image.png",
    color: "from-yellow-400 to-orange-500",
    badge: "Premium",
    premium: true,
    page: "Hercules",
  },
  {
    name: "Bridge Assistant",
    tagline: "L1 ↔ L2 Guide",
    description: "Walks you through bridging assets between Kaspa L1 and Kasplex L2. Friendly & concise.",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/57957164e_generated_image.png",
    color: "from-blue-400 to-indigo-500",
    badge: "Free",
    page: "Bridge",
  },
  {
    name: "Career Advisor",
    tagline: "Real Jobs & Career Plans",
    description: "Searches Indeed for real job listings, analyzes career strengths, builds skill paths.",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/891ed59d9_generated_image.png",
    color: "from-amber-400 to-yellow-500",
    badge: "Free",
    page: "Career",
  },
  {
    name: "Sealed Wallet Analyzer",
    tagline: "Wallet Forensics AI",
    description: "Analyzes a specific sealed wallet — current balance vs seal date, security insights.",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/61fae1826_generated_image.png",
    color: "from-cyan-400 to-teal-500",
    badge: "Tool",
    page: "SealedWalletDetails",
  },
  {
    name: "Imposter AI",
    tagline: "Personality Mimic",
    description: "Learns from transcripts and mimics personalities. The ultimate impressionist AI.",
    image: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/83161cdac_generated_image.png",
    color: "from-red-500 to-zinc-700",
    badge: "Lab",
    page: "X",
  },
];

export default function AIRosterShowcase() {
  return (
    <div className="px-6 sm:px-8 py-6 border-t border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <Bot className="w-4 h-4 text-cyan-400" />
        <h3 className="text-white font-bold text-sm uppercase tracking-wider">The TTT AI Roster</h3>
      </div>
      <p className="text-white/40 text-xs mb-5">
        {AGENTS.length} agents powering the TTT ecosystem — each with a unique role.
      </p>

      <div className="grid sm:grid-cols-2 gap-3">
        {AGENTS.map((agent, idx) => (
          <motion.div
            key={agent.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="group relative overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/[0.03] hover:ring-cyan-500/40 transition-all"
          >
            {/* Banner */}
            <div className="relative h-28 overflow-hidden">
              <img
                src={agent.image}
                alt={agent.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-30 mix-blend-overlay`} />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

              {/* Badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur ring-1 ring-white/20">
                {agent.premium ? (
                  <Crown className="w-2.5 h-2.5 text-yellow-400" />
                ) : (
                  <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                )}
                <span className="text-white text-[9px] font-bold tracking-wider uppercase">{agent.badge}</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-3.5">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-white font-[900] text-sm tracking-tight">{agent.name}</h4>
              </div>
              <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 bg-gradient-to-r ${agent.color} bg-clip-text text-transparent`}>
                {agent.tagline}
              </div>
              <p className="text-white/60 text-[11px] leading-relaxed">{agent.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}