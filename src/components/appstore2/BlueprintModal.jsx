import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Vote, Link2, Layers, ArrowRight, Sparkles } from "lucide-react";

const ARCHITECTURE_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e37f03a1f_generated_image.png";
const PHASE1_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/216a28e88_generated_image.png";
const PHASE2_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0072bc0aa_generated_image.png";
const PHASE3_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f2d7e2646_generated_image.png";

const PHASES = [
  {
    num: "01",
    color: "from-emerald-400 to-cyan-500",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    icon: Shield,
    title: "Proof of Submission",
    timeline: "Days 1–2 · Easy",
    image: PHASE1_IMG,
    summary: "Every app listing is cryptographically signed by the submitter's Kasware wallet. No more anonymous fakes.",
    bullets: [
      "Kasware signature on every proposal",
      "Verified Submitter badge on each app card",
      "Public proof viewer — anyone can re-verify",
      "Submitter TTT ID linked publicly",
    ],
  },
  {
    num: "02",
    color: "from-cyan-400 to-blue-500",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    icon: Vote,
    title: "Community Curation",
    timeline: "Days 3–7 · Medium",
    image: PHASE2_IMG,
    summary: "The crowd decides what's listed. Sealed wallets vote. Auto-approval at threshold. Trending bubbles up.",
    bullets: [
      "1 sealed wallet = 1 vote (sybil-resistant)",
      "Auto-approve at 10 upvotes / 70% ratio",
      "Hacker News-style trending algorithm",
      "Community flagging + reporting system",
    ],
  },
  {
    num: "03",
    color: "from-purple-400 to-pink-500",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    icon: Link2,
    title: "On-Chain Registry",
    timeline: "Weeks 2–3 · Advanced",
    image: PHASE3_IMG,
    summary: "True decentralization. App metadata inscribed on Kaspa. Assets on IPFS. Anyone can rebuild the store from chain.",
    bullets: [
      "KRC-20 inscription of app data on Kaspa",
      "IPFS-hosted icons & screenshots",
      "Public indexer scans chain for listings",
      "Censorship-resistant — TTT is just one frontend",
    ],
  },
];

export default function BlueprintModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <div className="min-h-full flex items-start justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-zinc-950 ring-1 ring-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur ring-1 ring-white/20 flex items-center justify-center text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Hero */}
              <div className="relative h-56 sm:h-72">
                <img src={ARCHITECTURE_IMG} alt="Architecture blueprint" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 mb-3">
                    <Sparkles className="w-3 h-3 text-cyan-300" />
                    <span className="text-cyan-200 text-[10px] font-bold tracking-[0.2em] uppercase">Blueprint</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-[900] text-white tracking-tight leading-tight">
                    The Decentralized App Store
                  </h2>
                  <p className="text-white/60 text-xs sm:text-sm mt-1.5">
                    A 3-phase plan to make TTT's app store cryptographically verifiable, community-curated, and on-chain.
                  </p>
                </div>
              </div>

              {/* Architecture Section */}
              <div className="px-6 sm:px-8 py-6 border-b border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-white font-bold text-sm uppercase tracking-wider">System Architecture</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {[
                    { label: "User Layer", sub: "Frontend UI" },
                    { label: "Identity", sub: "Kasware · TTT ID" },
                    { label: "Curation", sub: "Votes · Stakes" },
                    { label: "Data", sub: "IPFS · Kaspa" },
                  ].map((l, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-xl ring-1 ring-white/10">
                      <div className="text-white text-xs font-bold">{l.label}</div>
                      <div className="text-white/40 text-[10px] mt-0.5">{l.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Phases */}
              <div className="p-6 sm:p-8 space-y-6">
                {PHASES.map((phase) => {
                  const Icon = phase.icon;
                  return (
                    <div
                      key={phase.num}
                      className="grid md:grid-cols-[180px_1fr] gap-4 p-4 sm:p-5 bg-white/[0.03] rounded-2xl ring-1 ring-white/10"
                    >
                      {/* Phase image */}
                      <div className="relative h-32 md:h-full rounded-xl overflow-hidden ring-1 ring-white/10">
                        <img src={phase.image} alt={phase.title} className="absolute inset-0 w-full h-full object-cover" />
                        <div className={`absolute inset-0 bg-gradient-to-br ${phase.color} opacity-20 mix-blend-overlay`} />
                        <div className="absolute top-2 left-2 w-9 h-9 rounded-lg bg-black/70 backdrop-blur ring-1 ring-white/20 flex items-center justify-center">
                          <span className="text-white font-black text-xs">{phase.num}</span>
                        </div>
                      </div>

                      {/* Phase content */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${phase.badge} border`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${phase.badge}`}>
                            {phase.timeline}
                          </span>
                        </div>
                        <h4 className="text-white font-[900] text-lg tracking-tight mb-1.5">{phase.title}</h4>
                        <p className="text-white/60 text-xs leading-relaxed mb-3">{phase.summary}</p>
                        <ul className="space-y-1.5">
                          {phase.bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-white/70 text-[11px]">
                              <ArrowRight className={`w-3 h-3 mt-0.5 flex-shrink-0 bg-gradient-to-br ${phase.color} bg-clip-text text-transparent`} style={{ color: "rgb(34 211 238)" }} />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="p-6 sm:p-8 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-white/40 text-[11px]">
                  TTT · Decentralized App Store · Since November 7, 2025
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold rounded-full transition-colors"
                >
                  Close Blueprint
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}