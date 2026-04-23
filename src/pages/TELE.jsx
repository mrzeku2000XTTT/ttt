import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Bot, Zap, Shield, ExternalLink, Sparkles, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TELEGRAM_URL = base44.agents.getTelegramConnectURL("tele");

const FEATURES = [
  { icon: Bot, title: "Full Agent Power", desc: "Same AI that runs TTT — now on Telegram" },
  { icon: Zap, title: "Instant Replies", desc: "Real-time Kaspa info, news & feed data" },
  { icon: Shield, title: "Private & Secure", desc: "Telegram-native, your wallet stays in-app" },
  { icon: Sparkles, title: "Always On", desc: "24/7 access from anywhere you DM" },
];

const FloatingOrb = ({ delay = 0, size = 300, color = "from-cyan-500/30 to-blue-600/30", x = "0%", y = "0%" }) => (
  <motion.div
    className={`absolute rounded-full bg-gradient-to-br ${color} blur-3xl pointer-events-none`}
    style={{ width: size, height: size, left: x, top: y }}
    animate={{
      x: [0, 40, -20, 0],
      y: [0, -30, 20, 0],
      scale: [1, 1.15, 0.95, 1],
    }}
    transition={{ duration: 12, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

export default function TELEPage() {
  return (
    <div className="fixed inset-0 bg-black overflow-y-auto overflow-x-hidden">
      <FloatingOrb size={500} color="from-cyan-500/25 to-blue-600/10" x="-10%" y="-10%" delay={0} />
      <FloatingOrb size={400} color="from-blue-500/25 to-purple-600/10" x="60%" y="20%" delay={2} />
      <FloatingOrb size={350} color="from-sky-400/20 to-cyan-600/10" x="30%" y="70%" delay={4} />

      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <Link
        to={createPageUrl("AppStoreV2")}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm transition-all backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2, damping: 12 }}
              className="relative inline-flex items-center justify-center w-28 h-28 mb-8 mx-auto"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-3xl blur-xl"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative w-full h-full bg-gradient-to-br from-cyan-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Send className="w-12 h-12 text-white" strokeWidth={2.5} />
              </div>
              <motion.div
                className="absolute w-3 h-3 bg-cyan-300 rounded-full shadow-[0_0_12px_#22d3ee]"
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                style={{ top: "50%", left: "50%", transformOrigin: "0 -55px", marginLeft: -6, marginTop: -6 }}
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-cyan-200 to-cyan-500 mb-3 tracking-tight"
            >
              TELE
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-4"
            >
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-300 text-xs font-bold tracking-widest uppercase">Telegram Agent • Live</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-white/60 text-lg max-w-md mx-auto"
            >
              Your full-power TTT agent, live on Telegram. Kaspa info, feed posts, wallets, news — all from your DMs.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-2 gap-3 mb-10"
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.08 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative p-4 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/5 transition-all" />
                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-white font-bold text-sm mb-1">{f.title}</div>
                    <div className="text-white/50 text-xs leading-relaxed">{f.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.a
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-full flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-lg rounded-2xl shadow-2xl shadow-cyan-500/30 transition-all tracking-wider overflow-hidden group"
          >
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              style={{ width: "50%" }}
            />
            <MessageCircle className="w-5 h-5 relative z-10" />
            <span className="relative z-10">CONNECT ON TELEGRAM</span>
            <ExternalLink className="w-4 h-4 opacity-80 relative z-10" />
          </motion.a>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="text-center text-white/30 text-[11px] mt-4"
          >
            First-time setup: connect your Telegram bot in the TELE agent editor's Telegram tab, then tap above to chat.
          </motion.p>
        </div>
      </div>
    </div>
  );
}