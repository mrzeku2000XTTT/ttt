import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Rocket, Wand2, Zap, ArrowRight, Check, Lock, Loader2 } from "lucide-react";
import LaunchBrandHero from "@/components/launchbrand/LaunchBrandHero";
import BrandStudio from "@/components/launchbrand/BrandStudio";
import { base44 } from "@/api/base44Client";

export default function LaunchBrandPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const features = [
    { icon: Wand2, title: "AI Brand Identity", desc: "Generate a logo, palette, and voice in seconds." },
    { icon: Rocket, title: "Instant Launch", desc: "Publish to a custom subdomain on Kaspa rails." },
    { icon: Zap, title: "Built-In Payments", desc: "KAS + KRC-20 tipping & checkout out of the box." },
    { icon: Sparkles, title: "Agent Storefront", desc: "Your own ZK agent answers customers 24/7." },
  ];

  const steps = [
    "Describe your brand",
    "AI builds your assets",
    "Customize & approve",
    "Launch on Kaspa",
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Top bar */}
      <nav className="fixed top-0 inset-x-0 z-50 h-12 flex items-center justify-between px-5 bg-black/60 backdrop-blur-2xl border-b border-white/5">
        <Link to="/TTTV2" className="flex items-center gap-2 text-white/70 hover:text-white text-[13px] font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-[900] tracking-tight">TTT</span>
          <span className="text-[9px] font-bold bg-white text-black px-1.5 py-[1px] rounded">BRAND</span>
        </div>
        <button className="h-8 px-4 rounded-full bg-white text-black text-[12px] font-bold hover:bg-white/90 transition-colors">
          Get Early Access
        </button>
      </nav>

      <LaunchBrandHero mounted={mounted} />

      {/* Brand Studio — AI chat that builds your brand */}
      <BrandStudio />

      {/* Features */}
      <section className="relative py-24 sm:py-32 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-[12px] font-semibold text-cyan-400 tracking-widest uppercase mb-3">Everything Included</p>
            <h2 className="text-4xl sm:text-5xl font-[900] tracking-tight">From idea to launch in minutes.</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative rounded-3xl p-6 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-cyan-500/40 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-cyan-500/0 via-violet-500/0 to-pink-500/0 group-hover:from-cyan-500/20 group-hover:via-violet-500/15 group-hover:to-pink-500/10 transition-all duration-500 pointer-events-none" />
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-cyan-300" />
                  </div>
                  <h3 className="font-[900] text-[15px] mb-1.5 tracking-tight">{f.title}</h3>
                  <p className="text-[13px] text-white/50 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 sm:py-32 px-5 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-[12px] font-semibold text-violet-400 tracking-widest uppercase mb-3">How It Works</p>
            <h2 className="text-4xl sm:text-5xl font-[900] tracking-tight">Four steps. One brand. Yours.</h2>
          </motion.div>

          <div className="space-y-3">
            {steps.map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center font-[900] text-lg shadow-lg shadow-cyan-500/30">
                  {i + 1}
                </div>
                <span className="font-bold text-lg flex-1">{s}</span>
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 sm:py-32 px-5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center rounded-[32px] p-12 sm:p-16 relative overflow-hidden border border-white/10 bg-gradient-to-br from-cyan-950/30 via-violet-950/20 to-black"
        >
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative">
            <h2 className="text-4xl sm:text-5xl font-[900] tracking-tight mb-4">Your brand. On-chain. Today.</h2>
            <p className="text-white/60 max-w-md mx-auto mb-8">Join the waitlist and get founder-tier access at launch.</p>
            <button className="h-12 px-8 rounded-full bg-white text-black text-[14px] font-bold hover:scale-105 active:scale-95 transition-transform inline-flex items-center gap-2">
              Launch My Brand <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}