import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Gamepad2, Coins, Trophy, Zap } from "lucide-react";

const KASPLAY_URL = "https://kasplay.fun";
const LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/17dc7c8d0_image.png";

const FEATURES = [
  { icon: Gamepad2, title: "Instant Play", desc: "Jump straight into Kaspa-powered games — no download, no install, no friction." },
  { icon: Coins, title: "Play with KAS", desc: "Win, wager, and tip in real Kaspa. Every game runs on fast, final L1 settlement." },
  { icon: Trophy, title: "Climb the Boards", desc: "Compete for top scores and earn your spot on the live KasPlay leaderboard." },
  { icon: Zap, title: "Blockspeed", desc: "Built on Kaspa's DAG — near-instant confirmations so the game never waits." },
];

export default function KasPlayPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const openGame = () => {
    window.open(KASPLAY_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 h-14 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <img src={LOGO} alt="KasPlay" className="w-7 h-7 rounded-lg" />
          <span className="font-black text-base tracking-tight">KasPlay</span>
        </div>
        <button
          onClick={openGame}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-500/30"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Open
        </button>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-20 sm:py-28">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(249,115,22,0.18), transparent 70%)" }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="relative z-10 mb-6"
        >
          <img src={LOGO} alt="KasPlay" className="w-20 h-20 rounded-3xl shadow-2xl shadow-orange-500/30 ring-1 ring-white/10" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-xs uppercase tracking-[0.2em] text-orange-400 font-semibold mb-3"
        >
          Kaspa Gaming Arcade
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="relative z-10 text-4xl sm:text-6xl font-black tracking-tight max-w-2xl"
        >
          Play games.
          <br />
          <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">Win KAS.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative z-10 text-white/55 text-base sm:text-lg max-w-md mt-5 leading-relaxed"
        >
          KasPlay is a Kaspa-native arcade — play, compete, and tip in real KAS at blockspeed.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="relative z-10 mt-9 flex flex-col sm:flex-row items-center gap-3"
        >
          <button
            onClick={openGame}
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-sm shadow-xl shadow-orange-500/30 transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" /> Open KasPlay in New Tab
          </button>
          <Link to="/AppStoreV2" className="text-white/50 hover:text-white text-sm font-medium">
            Browse more apps
          </Link>
        </motion.div>
        <p className="relative z-10 text-white/30 text-[11px] mt-4">
          Opens in a new tab — KasPlay runs on its own domain.
        </p>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 border border-white/10 bg-white/[0.03]"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="font-bold text-sm mb-1.5">{f.title}</h3>
                <p className="text-white/45 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center rounded-3xl p-10 border border-orange-500/25"
          style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.08), transparent)" }}
        >
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Ready to play?</h2>
          <p className="text-white/50 text-sm mb-7 max-w-sm mx-auto">
            Launch KasPlay in a new tab and start earning KAS right now.
          </p>
          <button
            onClick={openGame}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-sm shadow-xl shadow-orange-500/30 transition-all active:scale-95"
          >
            <ExternalLink className="w-4 h-4" /> Launch KasPlay
          </button>
        </motion.div>
      </section>

      <footer className="px-6 py-8 text-center border-t border-white/5">
        <p className="text-white/25 text-[11px] tracking-widest uppercase">KasPlay · Kaspa Gaming</p>
      </footer>
    </div>
  );
}