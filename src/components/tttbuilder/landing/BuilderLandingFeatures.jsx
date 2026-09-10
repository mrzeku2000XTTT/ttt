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
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">Build With AI Agents</h2>
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
              className="bg-white border border-[#e8e4de] rounded-2xl p-5 shadow-[0_2px_12px_rgba(26,26,26,0.04)] hover:shadow-[0_10px_32px_rgba(26,26,26,0.08)] hover:border-[#00E68E]/50 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#00E68E]" />
              </div>
              <h3 className="font-bold mb-1.5">{f.title}</h3>
              <p className="text-[13px] text-[#666] leading-relaxed">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}