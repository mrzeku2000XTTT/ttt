import React from "react";
import { motion } from "framer-motion";
import { Facebook, Twitter, Youtube, Instagram } from "lucide-react";

/* TikTok icon (lucide has none) */
function TikTok({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M16.5 3c.3 2.1 1.5 3.5 3.5 3.8v2.6c-1.3.1-2.5-.3-3.6-1v6.6c0 3.4-2.8 6.5-6.4 6.5-3.7 0-6.5-2.9-6.5-6.5 0-3.5 2.9-6.3 6.4-6.3.3 0 .6 0 .9.1v2.8c-.3-.1-.6-.1-.9-.1-1.9 0-3.5 1.6-3.5 3.5s1.6 3.5 3.5 3.5 3.5-1.5 3.5-3.5V3h3.1z" />
    </svg>
  );
}

/* A single animated robot drone overlay (pointer-events-none, decorative) */
function Drone({ size = 56, delay = 0, duration = 8, dx = 30, className = "" }) {
  const rotors = [[10, 12], [54, 12], [10, 52], [54, 52]];
  return (
    <motion.div
      className={`pointer-events-none absolute ${className}`}
      initial={{ y: 0, x: 0 }}
      animate={{ y: [0, -24, 0], x: [0, dx, 0], rotate: [0, 6, -6, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* arms */}
        <line x1="32" y1="32" x2="10" y2="12" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="32" x2="54" y2="12" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="32" x2="10" y2="52" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="32" x2="54" y2="52" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" />
        {/* body */}
        <ellipse cx="32" cy="32" rx="9" ry="7" fill="rgba(8,10,18,0.85)" stroke="rgba(125,211,252,0.85)" strokeWidth="1.5" />
        <circle cx="32" cy="32" r="2.6" fill="#7dd3fc" />
        {/* rotors */}
        {rotors.map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
            <motion.g
              style={{ transformOrigin: `${cx}px ${cy}px` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.18, repeat: Infinity, ease: "linear" }}
            >
              <rect x={cx - 7} y={cy - 0.6} width="14" height="1.2" rx="0.6" fill="rgba(255,255,255,0.65)" />
              <rect x={cx - 0.6} y={cy - 7} width="1.2" height="14" rx="0.6" fill="rgba(255,255,255,0.65)" />
            </motion.g>
          </g>
        ))}
      </svg>
    </motion.div>
  );
}

const FOOTER_LINKS = [
  {
    header: "Studio",
    links: ["Agent Dashboard", "Create Agent", "Agent Wallet", "Consensus Audit", "GitHub Export"],
  },
  {
    header: "Network",
    links: ["The Covenant", "Agent Directory", "Newsroom", "Join the Builders"],
  },
  {
    header: "Support",
    links: ["Get in Touch", "Privacy Policy", "Terms of Use", "Report a Bug"],
  },
];

const SOCIAL_ICONS = [TikTok, Facebook, Twitter, Youtube, Instagram];

export default function AgentStudioLanding({ onEnter, onNew }) {
  return (
    <main className="relative w-full min-h-[115vh] overflow-x-hidden flex flex-col items-center font-sans selection:bg-white/20 selection:text-white">
      {/* Immersive video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[0]"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_114316_1c7889ad-2885-410e-b493-98119fee0ddb.mp4"
      />

      {/* Robot drones swarming overlay */}
      <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
        <Drone size={64} duration={9} delay={0} dx={40} className="top-[14%] left-[12%]" />
        <Drone size={44} duration={7} delay={1.2} dx={-30} className="top-[22%] right-[16%]" />
        <Drone size={52} duration={11} delay={0.6} dx={50} className="top-[40%] left-[22%]" />
        <Drone size={38} duration={6.5} delay={2} dx={-26} className="top-[34%] right-[10%]" />
        <Drone size={70} duration={13} delay={0.3} dx={60} className="top-[8%] left-[46%]" />
        <Drone size={34} duration={8} delay={1.8} dx={-40} className="top-[52%] left-[8%]" />
        <Drone size={48} duration={10} delay={2.4} dx={34} className="top-[16%] right-[40%]" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 flex flex-col flex-1">
        {/* Upper CTA (placeholder) */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full liquid-glass text-white/80 text-[10px] font-bold tracking-[0.2em] uppercase mb-6">
              Alpha Studio
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-white leading-[1.05] mb-5 max-w-4xl">
              The Agent Internet
            </h1>
            <p className="text-white/70 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed mb-9">
              Provable, non-custodial training for autonomous agents on Kaspa — anchored by real on-chain transactions.
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
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="liquid-glass w-full rounded-3xl p-6 md:p-10 text-white/70 mt-32 md:mt-64"
        >
          {/* Top grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 mb-10">
            {/* Brand */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                  <rect x="2" y="2" width="20" height="20" rx="6" fill="rgba(255,255,255,0.06)" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.2" />
                  <circle cx="12" cy="12" r="2.4" fill="currentColor" />
                  <circle cx="6.5" cy="6.5" r="1.6" fill="currentColor" />
                  <circle cx="17.5" cy="6.5" r="1.6" fill="currentColor" />
                  <circle cx="6.5" cy="17.5" r="1.6" fill="currentColor" />
                  <circle cx="17.5" cy="17.5" r="1.6" fill="currentColor" />
                  <line x1="12" y1="12" x2="6.5" y2="6.5" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1" />
                  <line x1="12" y1="12" x2="17.5" y2="6.5" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1" />
                  <line x1="12" y1="12" x2="6.5" y2="17.5" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1" />
                  <line x1="12" y1="12" x2="17.5" y2="17.5" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1" />
                </svg>
                <span className="text-xl font-medium text-white">AGENT INTERNET</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                Agent Internet Studio trains autonomous agents on Kaspa — every epoch anchored by a real on-chain self-send. Provable, non-custodial, yours to export.
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
            <p className="text-[10px] uppercase tracking-widest opacity-50">Powered by Kaspa · Agent Internet Studio</p>
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