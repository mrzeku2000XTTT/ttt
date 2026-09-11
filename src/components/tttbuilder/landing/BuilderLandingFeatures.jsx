import React from "react";
import { motion } from "framer-motion";
import { Bot, Coins, CreditCard, Image as ImageIcon } from "lucide-react";

const FEATURES = [
  { icon: Bot, title: "Agentic Workflows", desc: "Multi-agent systems that plan, call tools and act — shipped as real, runnable code." },
  { icon: Coins, title: "Kaspa DeFi", desc: "Swap interfaces, TVL dashboards and live price data straight from public APIs." },
  { icon: CreditCard, title: "Onchain Payments", desc: "The Kaspa wallet kit ships in every build — send, receive and sign by default." },
  { icon: ImageIcon, title: "NFT & Creator Apps", desc: "KRC-20 token hubs, galleries and mint pages wired to real on-chain data." },
];

export default function BuilderLandingFeatures() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8 text-white">Build With AI Agents</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-[#121212]/70 backdrop-blur-sm border border-[#00ff99]/15 rounded-2xl p-5 hover:border-[#00ff99]/50 hover:shadow-[0_10px_36px_rgba(0,255,153,0.12)] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#00ff99]/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#00ff99]" />
              </div>
              <h3 className="font-bold mb-1.5 text-white">{f.title}</h3>
              <p className="text-[13px] text-[#a0a0a0] leading-relaxed">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}