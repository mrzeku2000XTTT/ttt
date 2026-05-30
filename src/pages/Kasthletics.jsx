import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Dumbbell, ShieldCheck, Flame, Activity, Trophy } from "lucide-react";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/403d1b0e8_generated_image.png";
const HERO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1d19d9fc6_generated_image.png";
const EXTERNAL_URL = "https://kasthletics.app";

const FEATURES = [
  { icon: Dumbbell, title: "Train", desc: "Real workouts, real reps — no fake streaks." },
  { icon: ShieldCheck, title: "Verify", desc: "Proof-of-Workout secured on Kaspa." },
  { icon: Trophy, title: "Prove", desc: "Earn verifiable proof of your consistency." },
];

const STATS = [
  { icon: Flame, label: "Proof-of-Workout" },
  { icon: Activity, label: "AI Fitness Coach" },
  { icon: ShieldCheck, label: "On-chain Verified" },
];

export default function KasthleticsPage() {
  const openApp = () => window.open(EXTERNAL_URL, "_blank", "noopener,noreferrer");

  return (
    <div className="min-h-screen bg-[#0B0F0E] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-[#0B0F0E]/80 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">App Store</span>
        </Link>
        <button
          onClick={openApp}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-black bg-[#49EACB] hover:bg-[#3fd9bc] h-9 px-4 rounded-full transition-colors"
        >
          Open App <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* Hero */}
      <div className="relative">
        <div className="absolute inset-0">
          <img src={HERO} alt="Kasthletics" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F0E]/40 via-[#0B0F0E]/70 to-[#0B0F0E]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-5 pt-16 pb-20 text-center">
          <motion.img
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            src={LOGO}
            alt="Kasthletics logo"
            className="w-24 h-24 mx-auto rounded-3xl shadow-2xl shadow-[#49EACB]/20 ring-1 ring-white/10"
          />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-4xl sm:text-6xl font-[900] tracking-tight"
          >
            Kasthletics
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-4 text-base sm:text-lg text-white/70 max-w-xl mx-auto"
          >
            The AI fitness app built on Kaspa. <span className="text-[#49EACB] font-semibold">Train → Verify → Prove.</span> No fake streaks. No “trust me bro” workouts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.26 }}
            className="mt-8 flex items-center justify-center gap-3 flex-wrap"
          >
            <button
              onClick={openApp}
              className="flex items-center gap-2 text-base font-bold text-black bg-[#49EACB] hover:bg-[#3fd9bc] h-12 px-7 rounded-full transition-colors shadow-lg shadow-[#49EACB]/30"
            >
              Launch Kasthletics <ExternalLink className="w-4 h-4" />
            </button>
            <Link
              to="/AppStoreV2"
              className="flex items-center text-base font-semibold text-white bg-white/10 hover:bg-white/20 h-12 px-6 rounded-full transition-colors"
            >
              Browse Apps
            </Link>
          </motion.div>

          <div className="mt-10 flex items-center justify-center gap-5 flex-wrap">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-2 text-white/60 text-xs sm:text-sm">
                  <Icon className="w-4 h-4 text-[#49EACB]" />
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-5 pb-20">
        <div className="grid sm:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 hover:border-[#49EACB]/40 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-[#49EACB]/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#49EACB]" />
                </div>
                <h3 className="text-lg font-bold mb-1">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 rounded-3xl bg-gradient-to-br from-[#49EACB]/15 to-transparent border border-[#49EACB]/20 p-8 sm:p-12 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-[900] mb-3">Prove your workout. On-chain.</h2>
          <p className="text-white/60 max-w-md mx-auto mb-6">
            Open Kasthletics in a new tab and start building verifiable fitness consistency, powered by Kaspa.
          </p>
          <button
            onClick={openApp}
            className="inline-flex items-center gap-2 text-base font-bold text-black bg-[#49EACB] hover:bg-[#3fd9bc] h-12 px-8 rounded-full transition-colors shadow-lg shadow-[#49EACB]/30"
          >
            Open Kasthletics <ExternalLink className="w-4 h-4" />
          </button>
        </motion.div>

        <p className="text-center text-white/30 text-xs mt-10">
          Kasthletics is an independent app in the Kaspa ecosystem · Listed on TTT App Store
        </p>
      </div>
    </div>
  );
}