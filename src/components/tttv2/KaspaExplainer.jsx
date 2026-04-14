import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ExternalLink, Zap, Shield, Globe, Layers, ChevronRight } from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "10,000+ TPS", desc: "Kaspa processes thousands of transactions per second using its blockDAG architecture.", color: "text-cyan-500 bg-cyan-50" },
  { icon: Shield, title: "Proof of Work", desc: "Secured by kHeavyHash — GPU-mineable, fair, and decentralized consensus.", color: "text-emerald-500 bg-emerald-50" },
  { icon: Layers, title: "blockDAG", desc: "Unlike blockchain, Kaspa's DAG allows multiple blocks created simultaneously — no orphans.", color: "text-violet-500 bg-violet-50" },
  { icon: Globe, title: "Fair Launch", desc: "No premine, no ICO, no VC funding. 100% community-driven from day one.", color: "text-amber-500 bg-amber-50" },
];

export default function KaspaExplainer() {
  return (
    <section id="kaspa" className="py-20 sm:py-28 px-5 bg-gradient-to-b from-zinc-900 to-black text-white">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/13e8ec094_image.png"
              alt="Kaspa"
              className="w-10 h-10 rounded-full"
            />
            <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight">What is Kaspa?</h2>
          </div>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm leading-relaxed">
            Kaspa is the world's fastest proof-of-work cryptocurrency. Built on a revolutionary blockDAG architecture,
            it achieves instant confirmations while maintaining the security guarantees of Bitcoin-class consensus.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 ring-1 ring-white/10 hover:ring-white/20 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                <p className="text-[12px] text-zinc-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/WhatIsKaspa">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-white/10 px-6 py-2.5 rounded-full ring-1 ring-white/20 hover:ring-white/40 hover:bg-white/15 transition-all">
              Learn more about Kaspa <ChevronRight className="w-4 h-4" />
            </motion.button>
          </Link>
          <a href="https://kaspa.org" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 px-5 py-2.5 rounded-full ring-1 ring-cyan-500/20 hover:ring-cyan-500/40 transition-all">
            kaspa.org <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}