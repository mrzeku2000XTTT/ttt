import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Play, Globe, ArrowRight, Clapperboard, Wallet, Users, Star } from "lucide-react";

export default function CinekasOnboarding({ onEnter, logo }) {
  const [step, setStep] = useState(0);

  const features = [
    { icon: Clapperboard, title: "Stream & Create", desc: "Watch and publish cinematic clips in seconds.", color: "from-emerald-500 to-cyan-500" },
    { icon: Wallet, title: "Kaspa-native", desc: "Tip creators instantly in $KAS. No middlemen.", color: "from-cyan-500 to-blue-500" },
    { icon: Users, title: "Creator-first", desc: "Monetize your audience with on-chain rewards.", color: "from-blue-500 to-indigo-500" },
    { icon: Globe, title: "Global Stage", desc: "Your work reaches a worldwide Kaspa audience.", color: "from-indigo-500 to-purple-500" },
  ];

  const stats = [
    { label: "Creators", value: "12K+" },
    { label: "Clips", value: "240K+" },
    { label: "KAS Tipped", value: "1.8M" },
    { label: "Avg Rating", value: "4.9★" },
  ];

  return (
    <div className="fixed inset-0 z-[999] overflow-y-auto bg-black">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/4 w-[60vw] h-[60vh] bg-emerald-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[50vw] h-[50vh] bg-cyan-500/15 blur-[120px] rounded-full" />
      </div>

      <div className="relative min-h-full flex flex-col">
        {/* Premium browser chrome header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {logo}
            <div>
              <div className="text-white font-bold text-sm leading-none">CineKas</div>
              <div className="text-white/30 text-[10px] leading-none mt-0.5">cinekas.xyz</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
              <Globe className="w-3 h-3" /> Secure
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-medium">
              <Star className="w-3 h-3" /> Premium
            </div>
          </div>
        </div>

        {/* Browser address bar mockup */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs">
              <Globe className="w-3.5 h-3.5 text-emerald-400/70" />
              <span className="font-mono">https://cinekas.xyz</span>
              <div className="ml-auto flex items-center gap-1 text-emerald-400/70">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[11px] font-medium mb-5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              The Kaspa-native streaming platform
            </div>
            <h1 className="text-white font-black text-3xl sm:text-5xl leading-tight mb-3 tracking-tight">
              Cinema meets <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">Kaspa</span>
            </h1>
            <p className="text-white/50 text-sm sm:text-base leading-relaxed mb-8">
              CineKas is where creators stream, share, and earn. Watch cinematic clips, tip your favorites in $KAS, and publish your own work to a global audience — all on-chain, all in seconds.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-8">
              {stats.map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-white font-bold text-lg sm:text-2xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{s.value}</div>
                  <div className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feature cards */}
          {step >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3 max-w-2xl w-full mb-8"
            >
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden group"
                >
                  <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full bg-gradient-to-br ${f.color} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-2.5`}>
                    <f.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            {step === 0 ? (
              <button
                onClick={() => setStep(1)}
                className="px-7 py-3.5 rounded-xl bg-white text-black font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-all active:scale-95 shadow-[0_8px_30px_rgba(255,255,255,0.15)]"
              >
                <Play className="w-4 h-4 fill-black" /> Take the tour
              </button>
            ) : (
              <button
                onClick={onEnter}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-base flex items-center gap-2 hover:from-emerald-400 hover:to-cyan-400 transition-all active:scale-95 shadow-[0_8px_40px_rgba(16,185,129,0.35)]"
              >
                Enter CineKas <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <p className="text-white/25 text-[11px]">No signup required to browse</p>
          </motion.div>
        </div>

        <div className="px-6 py-4 text-center text-white/20 text-[10px] border-t border-white/5">
          Powered by Kaspa DAG • Built on cinekas.xyz
        </div>
      </div>
    </div>
  );
}