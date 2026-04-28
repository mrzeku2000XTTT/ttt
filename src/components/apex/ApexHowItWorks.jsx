import React from "react";
import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "NODA Runs",
    desc: "You build a workflow in NODA and hit run. APEX waits silently in the background — no hooks, no logging, no peeking."
  },
  {
    n: "02",
    title: "Success Triggers",
    desc: "When the run completes successfully, APEX hashes the metadata (workflow ID, duration, node count) — never the contents."
  },
  {
    n: "03",
    title: "Proof Sealed",
    desc: "The hash gets sealed into the APEX ledger. Anyone can verify your run happened. Nobody can see what it did."
  },
];

export default function ApexHowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 px-6">
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-orange-400/80 text-[10px] font-bold tracking-[0.3em] uppercase">The Flow</span>
          <h2
            className="text-white font-black text-4xl sm:text-5xl md:text-6xl mt-3 leading-tight"
            style={{ fontFamily: "'Orbitron', system-ui, sans-serif" }}
          >
            HOW THE DRAGON<br />GUARDS YOUR WORK
          </h2>
        </motion.div>

        <div className="space-y-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="relative flex items-start gap-6 p-7 rounded-2xl bg-gradient-to-br from-black/70 to-black/40 backdrop-blur-md border border-orange-500/20 hover:border-orange-500/50 transition-all"
            >
              <div
                className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-red-600 flex-shrink-0 leading-none"
                style={{ fontFamily: "'Orbitron', system-ui, sans-serif" }}
              >
                {s.n}
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-white font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed max-w-2xl">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}