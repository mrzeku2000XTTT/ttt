import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Dumbbell, ShieldCheck, Flame, Activity, Trophy, Zap } from "lucide-react";

const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/88f689596_generated_image.png";
const HERO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1ab9e35eb_generated_image.png";
const EXTERNAL_URL = "https://kasthletics.com";
const ACCENT = "#49EACB";

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

// EKG / heartbeat pulse line — the brand motif
function PulseLine({ className = "" }) {
  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className={className} fill="none">
      <path
        d="M0 60 H320 L360 60 L390 20 L430 100 L470 40 L500 60 H1200"
        stroke={ACCENT}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function KasthleticsPage() {
  const openApp = () => window.open(EXTERNAL_URL, "_blank", "noopener,noreferrer");

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-black/80 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">App Store</span>
        </Link>
        <div className="flex items-center gap-2">
          <img src={LOGO} alt="Kasthletics" className="w-7 h-7 rounded-full ring-1 ring-[#49EACB]/30" />
          <span className="font-black tracking-tight text-sm hidden sm:block">KASTHLETICS</span>
        </div>
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
          <img src={HERO} alt="" className="w-full h-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/75 to-black" />
        </div>

        {/* glow orbs */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #49EACB, transparent 70%)" }} />

        <div className="relative max-w-3xl mx-auto px-5 pt-16 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative inline-block"
          >
            <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{ background: ACCENT }} />
            <img
              src={LOGO}
              alt="Kasthletics logo"
              className="relative w-28 h-28 mx-auto rounded-full shadow-2xl shadow-[#49EACB]/30 ring-1 ring-[#49EACB]/30"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-7 text-5xl sm:text-7xl font-[900] tracking-tighter"
          >
            KASTHLETICS
          </motion.h1>

          {/* pulse divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mx-auto mt-4 w-56 h-6"
          >
            <PulseLine className="w-full h-full" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-5 text-base sm:text-lg text-white/70 max-w-xl mx-auto"
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
              <Zap className="w-4 h-4" /> Launch Kasthletics
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
                className="group relative rounded-2xl bg-white/[0.04] border border-white/10 p-6 hover:border-[#49EACB]/50 transition-colors overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity" style={{ background: ACCENT }} />
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
          className="relative mt-12 rounded-3xl bg-gradient-to-br from-[#49EACB]/15 to-transparent border border-[#49EACB]/20 p-8 sm:p-12 text-center overflow-hidden"
        >
          <PulseLine className="absolute left-0 bottom-0 w-full h-16 opacity-20" />
          <h2 className="relative text-2xl sm:text-3xl font-[900] mb-3">Prove your workout. On-chain.</h2>
          <p className="relative text-white/60 max-w-md mx-auto mb-6">
            Open Kasthletics in a new tab and start building verifiable fitness consistency, powered by Kaspa.
          </p>
          <button
            onClick={openApp}
            className="relative inline-flex items-center gap-2 text-base font-bold text-black bg-[#49EACB] hover:bg-[#3fd9bc] h-12 px-8 rounded-full transition-colors shadow-lg shadow-[#49EACB]/30"
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