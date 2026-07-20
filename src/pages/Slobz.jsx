import React from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { User, LogOut, Sparkles, ArrowRight } from "lucide-react";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import SlobzNetworkToggle from "@/components/slobz/SlobzNetworkToggle";
import SlobzAskButton from "@/components/slobz/SlobzAskButton";

const HERO_BG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d74177eb0_generated_image.png";
const CLAY_FACE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ff7c5a573_generated_image.png";
const CARD_IMG = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2fdf8782e_generated_image.png";
const ICON_BOLT = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/59b9b3958_generated_image.png";
const ICON_LOCK = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ff3973122_generated_image.png";

// The purple slob squad
const SLOB_WAVE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/0809726ab_generated_image.png";
const SLOB_CHAOS = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bbe388724_generated_image.png";
const SLOB_RESUME = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/a7b97311a_generated_image.png";
const SLOB_BRIEFCASE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/f0ddba039_generated_image.png";
const SLOB_GUARD = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e5e4444a5_generated_image.png";
const SLOB_DIRECTOR = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e19daf9e9_generated_image.png";
const SLOB_WHALE = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e67cfa80f_generated_image.png";
const SLOB_ZEN = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/05bf553e1_generated_image.png";
const SLOB_SCIENTIST = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/60bb0a620_generated_image.png";
const SLOB_SLEEP = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/df8a323cb_generated_image.png";
const SLOB_RADAR = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bbe1b996d_generated_image.png";
const SLOB_LEDGER = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/1466aec26_generated_image.png";

const features = [
  {
    title: "The Chaos Intake",
    desc: "Dump your raw, unfiltered thoughts. The SAE engine roasts you, extracts your skills, and ghost-writes your resume.",
    img: SLOB_CHAOS,
    path: "/SlobzIntake",
    cta: "START THE INTAKE",
  },
  {
    title: "Momentum Track",
    desc: "Low-stress micro-gigs paying $15-30. Instant payout. Zero interviews. Zero friction. Build momentum one gig at a time.",
    img: SLOB_BRIEFCASE,
    path: "/SlobzGigs",
    cta: "BROWSE GIGS",
  },
  {
    title: "Escrow Market",
    desc: "Real covenant escrow on Kaspa. Employers lock KAS on-chain per gig, an AI agent checks the work, funds release automatically.",
    img: SLOB_GUARD,
    path: "/SlobzMarket",
    cta: "ENTER THE MARKET",
  },
  {
    title: "Animation Station",
    desc: "Clay animations by the community. Post your own and earn KAS tips from fellow slobs who love your work.",
    img: SLOB_DIRECTOR,
    path: "/SlobzAnimations",
    cta: "WATCH & TIP",
  },
  {
    title: "Entity X",
    desc: "Live-track the biggest Kaspa holder — balance, movements, and instant 7/30-day fact-checked flow reports to keep you motivated.",
    img: SLOB_WHALE,
    path: "/SlobzEntityX",
    cta: "WATCH THE WHALE",
  },
  {
    title: "Site Radar",
    desc: "Track any website URL like a mini SEMrush — SEO score, page health, estimated traffic, keywords and competitors. All in plain English.",
    img: SLOB_RADAR,
    path: "/SlobzSiteTracker",
    cta: "TRACK A WEBSITE",
  },
  {
    title: "TX Tracker",
    desc: "Paste any Kaspa transaction ID and get a plain-English story of what happened — who paid whom, how much, and when. No jargon.",
    img: SLOB_LEDGER,
    path: "/SlobzTxTracker",
    cta: "TRACK A TRANSACTION",
  },
  {
    title: "Financial Wellness",
    desc: "The Sloba Card: instant payouts, behavioral guardrails, and an auto-saving Get Out Bucket for your independence fund.",
    img: SLOB_ZEN,
    path: "/SlobzWellness",
    cta: "SEE THE CARD",
  },
];

export default function Slobz() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#DED6F2] text-[#1F1B2E] pb-20 font-body relative">
      <SlobzBlobs />
      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
        {/* Top nav */}
        <div className="flex items-center justify-between py-5">
          <div className="flex items-center gap-6">
            <span className="font-display text-2xl font-black text-[#3D2E7C]">Slobz</span>
            <span className="hidden md:block text-sm text-[#5A4B8A]">Get a job if you're a slob.</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-[#5A4B8A]">
            <Sparkles className="w-4 h-4 text-[#7C5CFC]" />
            <span>Sector 6 · SLOBZ</span>
          </div>
          <div className="flex items-center gap-3 text-[#5A4B8A]">
            <SlobzNetworkToggle />
            <User className="w-5 h-5 hidden sm:block" />
            <button
              onClick={() => navigate("/Sector6")}
              title="Back to Sector 6"
              className="p-1.5 rounded-full hover:bg-[#EBE6F8] hover:text-[#7C5CFC] transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hero */}
        <div
          className="relative rounded-[32px] overflow-hidden bg-cover bg-center min-h-[440px] md:min-h-[560px] flex flex-col items-center justify-center text-center px-6"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-2.5 rounded-full bg-[#8B6FF5] shadow-[0_8px_20px_rgba(124,92,252,0.4)] mb-6"
          >
            <span className="font-display text-sm font-extrabold text-white">The Anti-Career Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl md:text-5xl font-black text-[#4A2FA8] leading-[1.15] max-w-2xl"
          >
            Stop pretending you have it together. Admit you're a slob. Let's fix it.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-sm md:text-base text-[#4A3D75] max-w-md font-body"
          >
            Dump your chaos. Extract your skills. Get micro-gigs, a real resume, and a redemption plan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 mt-8"
          >
            <button
              onClick={() => navigate("/SlobzIntake")}
              className="px-8 py-3.5 rounded-full bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] hover:from-[#FF7A59] hover:to-[#F05A3B] shadow-[0_10px_24px_rgba(249,107,76,0.45)] font-display text-sm font-extrabold text-white transition-all"
            >
              PROCESS MY CHAOS
            </button>
            <button
              onClick={() => navigate("/SlobzGigs")}
              className="px-8 py-3.5 rounded-full bg-[#8B6FF5] hover:bg-[#7C5CFC] shadow-[0_8px_20px_rgba(124,92,252,0.45)] font-display text-sm font-extrabold text-white transition-colors"
            >
              BROWSE MICRO-GIGS
            </button>
          </motion.div>

          {/* Waving slob mascot */}
          <motion.img
            src={SLOB_WAVE}
            alt="Slobz mascot waving"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{ opacity: { delay: 0.5 }, y: { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 } }}
            className="hidden md:block absolute bottom-4 left-4 w-28 h-28 rounded-[24px] object-cover shadow-[0_12px_30px_rgba(61,46,124,0.35)] rotate-[-4deg]"
          />
        </div>

        {/* Campaign video */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 bg-[#FDFBF7] rounded-[32px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-4 md:p-6"
        >
          <div className="flex items-center justify-between px-2 pb-4">
            <div>
              <div className="text-[10px] tracking-[0.3em] text-[#7C5CFC] font-bold">SEE IT IN ACTION</div>
              <h2 className="font-heading text-xl md:text-2xl font-semibold text-[#1F1B2E] mt-1">Slobz — the anti-career platform</h2>
            </div>
            <img
              src={SLOB_RESUME}
              alt="Slob mascot with a resume"
              className="w-16 h-16 rounded-[18px] object-cover shadow-[0_8px_20px_rgba(124,92,252,0.3)] rotate-[3deg]"
            />
          </div>
          <video
            src="https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/0949dafd6_Campaign_Ad.mp4"
            className="w-full rounded-[24px] bg-[#E9E4F5]"
            controls
            autoPlay
            muted
            loop
            playsInline
            aria-label="Slobz campaign ad — clay 3D demo of the app with a cursor clicking through Chaos Intake and micro-gigs"
          />
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {features.map((f, i) => (
            <motion.div
              key={f.path}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i }}
              whileHover={{ y: -6 }}
              onClick={() => navigate(f.path)}
              className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-6 cursor-pointer group"
            >
              <div className="rounded-[20px] overflow-hidden mb-5 bg-[#E9E4F5]">
                <img src={f.img} alt={f.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#1F1B2E]">{f.title}</h3>
              <p className="text-xs text-[#7A7290] leading-relaxed mt-2 mb-5">{f.desc}</p>
              <Link
                to={f.path}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#7C5CFC] group-hover:bg-[#6B4BEB] text-white text-[11px] font-display font-extrabold shadow-[0_6px_16px_rgba(124,92,252,0.35)] transition-colors"
              >
                {f.cta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div className="text-center mt-14">
          <div className="flex items-end justify-center gap-4 mb-5">
            <motion.img
              src={SLOB_SCIENTIST}
              alt="Slob scientist — testnet lab"
              whileHover={{ rotate: -6, scale: 1.05 }}
              className="w-20 h-20 md:w-24 md:h-24 rounded-[20px] object-cover shadow-[0_10px_24px_rgba(124,92,252,0.28)] rotate-[-3deg]"
            />
            <motion.img
              src={SLOB_SLEEP}
              alt="Sleeping slob — rest is part of the plan"
              whileHover={{ rotate: 6, scale: 1.05 }}
              className="w-20 h-20 md:w-24 md:h-24 rounded-[20px] object-cover shadow-[0_10px_24px_rgba(124,92,252,0.28)] rotate-[3deg] mb-2"
            />
          </div>
          <p className="font-display text-lg font-extrabold text-[#4A2FA8]">GET A JOB IF YOU'RE A SLOB.</p>
          <p className="text-xs text-[#7A7290] mt-1.5">Radical candor. Zero corporate jargon. Built for ADHD brains.</p>
        </div>
      </div>
      <SlobzAskButton />
    </div>
  );
}