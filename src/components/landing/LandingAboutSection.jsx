import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Rocket, Layers, Shield, Cpu, Globe, Users, Zap, Boxes, ArrowRight } from "lucide-react";

const STATS = [
  { icon: Boxes, value: "80+", label: "Apps shipped" },
  { icon: Globe, value: "10 bps", label: "Kaspa blocks/sec" },
  { icon: Users, value: "1", label: "Unified super app" },
  { icon: Zap, value: "Nov 7", label: "Born 2025" },
];

const ECOSYSTEM = [
  { name: "AI Studio", desc: "Image, video & agent tools" },
  { name: "Finance", desc: "Wallets, bridges & tipping" },
  { name: "Games", desc: "Arcade & prediction markets" },
  { name: "Creative", desc: "Design, motion & storyboards" },
  { name: "Social", desc: "Encrypted feed & community" },
  { name: "Dev Tools", desc: "No-code AI workflows" },
];

const TECH = [
  { title: "Kaspa BlockDAG", desc: "Real-time proof-of-work settlement at 10 blocks per second." },
  { title: "AI Agents", desc: "Autonomous agents that act, verify and create on your behalf." },
  { title: "On-chain Proof", desc: "Verifiable proofs anchored to the Kaspa network." },
  { title: "Zero-Knowledge", desc: "Privacy-first identity with Agent ZK." },
];

export default function LandingAboutSection() {
  return (
    <section className="relative z-10 px-6 py-20 sm:py-28" style={{ background: "#000" }}>
      {/* Heading */}
      <div className="max-w-4xl mx-auto text-center mb-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-16" style={{ background: "linear-gradient(90deg, transparent, rgba(200,150,40,0.5))" }} />
            <Sparkles className="w-4 h-4" style={{ color: "rgba(200,150,40,0.5)" }} />
            <div className="h-px w-16" style={{ background: "linear-gradient(90deg, rgba(200,150,40,0.5), transparent)" }} />
          </div>
          <h2 className="text-4xl sm:text-5xl font-[300] tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
            About <span className="font-[700]" style={{ background: "linear-gradient(180deg, #fff5cc, #c8960c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>TTT</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed max-w-lg mx-auto" style={{ color: "rgba(200,160,70,0.5)", fontFamily: "monospace" }}>
            One super app for the entire Kaspa ecosystem — AI, finance, games, creative tools and community, all on a real-time BlockDAG.
          </p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
        {STATS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              className="rounded-2xl p-4 text-center"
              style={{ background: "rgba(200,150,40,0.04)", border: "1px solid rgba(200,150,40,0.15)" }}
            >
              <Icon className="w-4 h-4 mx-auto mb-2" style={{ color: "rgba(200,160,70,0.6)" }} />
              <div className="text-2xl font-[300]" style={{ color: "#f5d050", fontFamily: "'Georgia', serif" }}>{s.value}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(200,160,70,0.4)", fontFamily: "monospace" }}>{s.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Ecosystem */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Layers className="w-4 h-4" style={{ color: "rgba(200,150,40,0.5)" }} />
          <h3 className="text-[11px] tracking-[0.3em] uppercase" style={{ color: "rgba(200,160,70,0.6)", fontFamily: "monospace" }}>Ecosystem</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ECOSYSTEM.map((e, i) => (
            <motion.div
              key={e.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="rounded-xl p-4"
              style={{ background: "rgba(200,150,40,0.03)", border: "1px solid rgba(200,150,40,0.1)" }}
            >
              <div className="text-sm font-bold mb-1" style={{ color: "#f5d050", fontFamily: "'Georgia', serif" }}>{e.name}</div>
              <div className="text-[11px]" style={{ color: "rgba(200,160,70,0.45)", fontFamily: "monospace" }}>{e.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Technology */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Cpu className="w-4 h-4" style={{ color: "rgba(200,150,40,0.5)" }} />
          <h3 className="text-[11px] tracking-[0.3em] uppercase" style={{ color: "rgba(200,160,70,0.6)", fontFamily: "monospace" }}>Technology</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TECH.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="flex items-start gap-3 rounded-xl p-4"
              style={{ background: "rgba(200,150,40,0.03)", border: "1px solid rgba(200,150,40,0.1)" }}
            >
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "rgba(200,160,70,0.5)" }} />
              <div>
                <div className="text-sm font-bold mb-0.5" style={{ color: "#f5d050", fontFamily: "'Georgia', serif" }}>{t.title}</div>
                <div className="text-[12px] leading-relaxed" style={{ color: "rgba(200,160,70,0.45)", fontFamily: "monospace" }}>{t.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto text-center">
        <Link to="/About">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full transition-all"
            style={{ border: "1px solid rgba(200,150,40,0.3)", background: "rgba(200,150,40,0.06)" }}
          >
            <Rocket className="w-4 h-4" style={{ color: "#f5d050" }} />
            <span className="text-[12px] tracking-[0.3em] uppercase" style={{ color: "#f5d050", fontFamily: "monospace" }}>Explore Full About</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#f5d050" }} />
          </motion.div>
        </Link>
      </div>
    </section>
  );
}