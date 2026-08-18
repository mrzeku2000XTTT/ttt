import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Music2, Facebook, Twitter, Youtube, Instagram, Wallet, Zap, Github } from "lucide-react";

const FOOTER_LINKS = [
  {
    header: "Discover",
    links: ["Agent Dashboard", "New Agent", "Agent Wallet", "Consensus Audit", "GitHub Export"],
  },
  {
    header: "The Mission",
    links: ["Origin Story", "The Collective", "Newsroom Hub", "Join the Team"],
  },
  {
    header: "Concierge",
    links: ["Get in Touch", "Legal Privacy", "User Agreement", "Report Concern"],
  },
];

const SOCIAL_ICONS = [Music2, Facebook, Twitter, Youtube, Instagram];

export default function AgentStudioLanding({ onEnter, onNew }) {
  return (
    <main
      className="relative w-full min-h-[115vh] overflow-x-hidden flex flex-col items-center font-sans selection:bg-white/20 selection:text-white"
      style={{ fontFamily: '"Helvetica Regular", Inter, system-ui, sans-serif' }}
    >
      {/* Immersive video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[0]"
        src="https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/d06ac3978_Agent_Swarm_BG.mp4"
      />

      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 flex flex-col flex-1">
        {/* Top nav row */}
        <div className="flex items-center justify-between py-6">
          <Link
            to="/AppStoreV2"
            className="flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> App Store
          </Link>
          <div className="flex items-center gap-1.5 text-sm font-medium text-white/90">
            <Sparkles className="w-4 h-4" /> Agent Internet Studio
          </div>
        </div>

        {/* Upper CTA */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass text-white/80 text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
              <Sparkles className="w-3 h-3" /> Alpha Studio
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-white leading-[1.05] mb-5 max-w-4xl">
              Train autonomous agents on Kaspa.
            </h1>
            <p className="text-white/70 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed mb-9">
              Every training epoch is a real self-send transaction — provable, non-custodial, and yours to export. The covenant is the law.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onEnter}
                className="liquid-glass rounded-full px-7 py-3.5 text-sm font-medium text-white hover:text-white transition-colors"
              >
                Enter Studio
              </button>
              <button
                onClick={onNew}
                className="rounded-full px-7 py-3.5 text-sm font-medium text-black bg-white hover:bg-white/90 transition-colors"
              >
                Create New Agent
              </button>
            </div>

            {/* mini step row */}
            <div className="grid grid-cols-3 gap-3 mt-12 max-w-2xl mx-auto">
              {[
                { icon: Wallet, label: "Generate a wallet" },
                { icon: Zap, label: "Train by self-sending" },
                { icon: Github, label: "Push to your GitHub" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="liquid-glass rounded-2xl px-3 py-4 flex flex-col items-center gap-2">
                    <Icon className="w-4 h-4 text-white/80" />
                    <span className="text-[10px] sm:text-xs text-white/70 font-medium leading-tight">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="liquid-glass w-full rounded-3xl p-6 md:p-10 text-white/70 mt-32 md:mt-64"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 mb-10">
            {/* Brand column */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor" className="text-white">
                  <path d="M 4.688 136 C 68.373 136 120 187.627 120 251.312 C 120 252.883 119.967 254.445 119.905 256 L 0 256 L 0 136.096 C 1.555 136.034 3.117 136 4.688 136 Z M 251.312 136 C 252.883 136 254.445 136.034 256 136.096 L 256 256 L 136.095 256 C 136.032 254.438 136.001 252.875 136 251.312 C 136 187.627 187.627 136 251.312 136 Z M 119.905 0 C 119.967 1.555 120 3.117 120 4.688 C 120 68.373 68.373 120 4.687 120 C 3.117 120 1.555 119.967 0 119.905 L 0 0 Z M 256 119.905 C 254.445 119.967 252.883 120 251.312 120 C 187.627 120 136 68.373 136 4.687 C 136 3.117 136.033 1.555 136.095 0 L 256 0 Z" />
                </svg>
                <span className="text-xl font-medium text-white">AGENT INTERNET</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                Agent Internet Studio provides provable, non-custodial training for autonomous agents on Kaspa — anchored by real on-chain transactions.
              </p>
            </div>

            {/* Links */}
            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {FOOTER_LINKS.map((col) => (
                <div key={col.header}>
                  <h4 className="text-sm uppercase tracking-wider text-white font-medium mb-4">{col.header}</h4>
                  <ul className="text-xs space-y-2">
                    {col.links.map((l) => (
                      <li key={l}>
                        <button className="text-left hover:text-white transition-colors">{l}</button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
            <p className="text-[10px] uppercase tracking-widest opacity-50">Built on Kaspa · Agent Internet Studio</p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest opacity-50">Join the Journey:</span>
              <div className="flex items-center gap-4">
                {SOCIAL_ICONS.map((Icon, i) => (
                  <a key={i} href="#" className="opacity-70 hover:opacity-100 transition-colors hover:text-white">
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </main>
  );
}