import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import AboutSidebar from "@/components/about/AboutSidebar";
import AboutOverview from "@/components/about/AboutOverview";
import AboutMission from "@/components/about/AboutMission";
import AboutEcosystem from "@/components/about/AboutEcosystem";
import AboutTechnology from "@/components/about/AboutTechnology";
import AboutSecurity from "@/components/about/AboutSecurity";
import AboutCommunity from "@/components/about/AboutCommunity";
import AboutMilestones from "@/components/about/AboutMilestones";
import AboutCertifications from "@/components/about/AboutCertifications";

const PANELS = {
  overview: AboutOverview,
  mission: AboutMission,
  ecosystem: AboutEcosystem,
  technology: AboutTechnology,
  security: AboutSecurity,
  community: AboutCommunity,
  milestones: AboutMilestones,
  certifications: AboutCertifications,
};

export default function AboutPage() {
  const [active, setActive] = useState("overview");
  const Panel = PANELS[active];

  return (
    <div className="min-h-screen bg-[#070B0A] text-white relative overflow-x-hidden">
      {/* Gradient background (dark only) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-400/5 blur-[120px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 h-14 border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/TTTV2" className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-[300]">Back</span>
        </Link>
        <span className="text-sm font-[600] tracking-[0.3em]">TTT</span>
        <div className="w-12" />
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-6xl font-[200] tracking-tight">
            About <span className="font-[700] bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">TTT</span>
          </h1>
          <p className="text-white/40 text-sm font-[300] mt-3">The decentralized super app for Kaspa.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
          {/* Side tabs */}
          <aside className="sm:w-48 flex-shrink-0">
            <div className="sm:sticky sm:top-8">
              <AboutSidebar active={active} onChange={setActive} />
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <Panel />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <p className="text-center text-white/20 text-[11px] font-[300] tracking-wide mt-20 pt-8 border-t border-white/5">
          TTT · Since November 7, 2025 · Built on Kaspa
        </p>
      </div>
    </div>
  );
}