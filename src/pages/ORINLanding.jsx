import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star, Brain, Zap, ChevronRight, Check, ArrowRight, Hotel, Compass, Clock, Shield } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Learns Your Travel Style",
    desc: "ORIN builds a memory of your budget range, preferred locations, hotel style, and past choices — no more starting from scratch.",
  },
  {
    icon: Zap,
    title: "Smarter Picks Every Time",
    desc: "The more you use ORIN, the better it gets. Suggestions improve as it understands what you actually like.",
  },
  {
    icon: Compass,
    title: "No More Endless Filtering",
    desc: "Skip the comparison trap. ORIN surfaces stays that fit you, not a list of everything available.",
  },
  {
    icon: Shield,
    title: "Your Preferences, Private",
    desc: "Your travel data stays yours. ORIN uses it only to improve your experience — never shared or sold.",
  },
];

const STEPS = [
  { step: "01", title: "Tell ORIN where you're going", desc: "Drop in your destination and travel dates." },
  { step: "02", title: "ORIN learns from your choices", desc: "Rate stays, save favorites, and let it observe your patterns." },
  { step: "03", title: "Get matched, not just listed", desc: "ORIN surfaces hotels that actually fit your style and budget." },
];

export default function ORINLanding() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 h-14 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Hotel className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-[800] tracking-tight">ORIN</span>
        </div>
        <Link
          to="/ORIN"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-amber-500 hover:bg-amber-400 transition-colors h-8 px-4 rounded-full"
        >
          Launch App
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-5 sm:px-8 text-center">
        {/* Glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold tracking-widest uppercase mb-6">
            <Zap className="w-3 h-3" />
            Travel Intelligence System
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-[900] tracking-tight leading-[1.05] mb-6">
            Hotels that know{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              how you travel
            </span>
          </h1>

          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            ORIN learns your preferences over time — budget, location style, hotel vibe — and uses that to surface stays that actually fit you. No more searching from scratch every trip.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/ORIN"
              className="flex items-center gap-2 text-[14px] font-bold text-black bg-amber-400 hover:bg-amber-300 transition-colors h-12 px-6 rounded-full shadow-lg shadow-amber-500/20"
            >
              Start Your Travel Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how"
              className="flex items-center gap-2 text-[14px] font-semibold text-white/70 hover:text-white transition-colors h-12 px-6 rounded-full border border-white/10 hover:border-white/20"
            >
              See how it works
            </a>
          </div>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative mt-16 max-w-2xl mx-auto"
        >
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
            <img
              src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&h=500&fit=crop"
              alt="Luxury hotel"
              className="w-full h-48 sm:h-72 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/20 to-transparent rounded-2xl" />
            {/* Floating card */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white">ORIN matched this for you</p>
                  <p className="text-[11px] text-white/50 truncate">Based on 6 past trips · boutique · city center · mid-range</p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-[12px] font-bold text-white">98%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-5 sm:px-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight mb-3">Built for frequent travelers</h2>
          <p className="text-white/50 max-w-xl mx-auto">If you value convenience over comparison, ORIN was made for you.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-2xl border border-white/8 bg-white/3 hover:border-amber-500/30 hover:bg-white/5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-[15px] font-[700] mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-white/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-5 sm:px-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight mb-3">How ORIN works</h2>
          <p className="text-white/50">Three simple steps to smarter hotel booking.</p>
        </motion.div>

        <div className="space-y-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-5 items-start p-5 rounded-2xl border border-white/8 bg-white/3"
            >
              <div className="text-[28px] font-[900] text-amber-500/30 leading-none w-10 flex-shrink-0">{s.step}</div>
              <div>
                <h3 className="text-[15px] font-[700] mb-1">{s.title}</h3>
                <p className="text-[13px] text-white/50">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto text-center"
        >
          <div className="relative p-8 sm:p-12 rounded-3xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent overflow-hidden">
            <div className="absolute inset-0 bg-amber-500/5 rounded-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-[900] tracking-tight mb-3">Ready to travel smarter?</h2>
              <p className="text-white/50 mb-8 text-[14px]">Build your travel profile and let ORIN find stays that actually fit you.</p>
              <Link
                to="/ORIN"
                className="inline-flex items-center gap-2 text-[14px] font-bold text-black bg-amber-400 hover:bg-amber-300 transition-colors h-12 px-8 rounded-full shadow-lg shadow-amber-500/20"
              >
                Launch ORIN
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5 text-center border-t border-white/5">
        <p className="text-[11px] text-white/20 font-medium tracking-widest uppercase">ORIN · Travel Intelligence</p>
      </footer>
    </div>
  );
}