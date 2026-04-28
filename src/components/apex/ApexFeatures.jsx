import React from "react";
import { motion } from "framer-motion";
import { Shield, Eye, Network } from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    title: "Success-Only Ledger",
    desc: "Failed runs are forgotten. Successful executions get cryptographically certified — clean, permanent, immutable."
  },
  {
    icon: Eye,
    title: "Zero Data Exposure",
    desc: "APEX never sees your prompts, outputs, or recipients. Just a SHA-256 fingerprint that proves the work happened."
  },
  {
    icon: Network,
    title: "DAG-Linked Proofs",
    desc: "Every proof connects to the next, forming an unforgeable chain of completed work — verifiable by anyone, owned by you."
  },
];

export default function ApexFeatures() {
  return (
    <section className="relative py-24 px-6">
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-orange-400/80 text-[10px] font-bold tracking-[0.3em] uppercase">What APEX Does</span>
          <h2
            className="text-white font-black text-4xl sm:text-5xl md:text-6xl mt-3 leading-tight"
            style={{ fontFamily: "'Orbitron', system-ui, sans-serif" }}
          >
            PROOF WITHOUT<br />EXPOSURE
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group relative p-7 rounded-2xl bg-black/60 backdrop-blur-md border border-orange-500/20 hover:border-orange-500/50 transition-all overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-orange-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500/30 to-red-500/30 border border-orange-500/40 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-orange-300" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}