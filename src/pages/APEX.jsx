import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import ApexDragonScene from "@/components/apex/ApexDragonScene";
import ApexHero from "@/components/apex/ApexHero";
import ApexFeatures from "@/components/apex/ApexFeatures";
import ApexHowItWorks from "@/components/apex/ApexHowItWorks";
import ApexProofFeed from "@/components/apex/ApexProofFeed";
import ApexCTA from "@/components/apex/ApexCTA";

export default function APEXPage() {
  useEffect(() => {
    // Inject Orbitron font
    const id = "apex-orbitron-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;800;900&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* Cinematic dragon parallax background */}
      <ApexDragonScene />

      {/* Top nav */}
      <nav className="relative z-20 flex items-center justify-between px-5 sm:px-8 py-5">
        <Link
          to="/AppStoreV2"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 hover:border-orange-500/40 text-white/70 hover:text-white text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-orange-500/30">
          <Shield className="w-3.5 h-3.5 text-orange-400" />
          <span
            className="text-white text-xs font-black tracking-widest"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            APEX
          </span>
        </div>
        <Link
          to="/NODAStudio"
          className="px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white text-xs font-bold shadow-lg shadow-orange-500/30 transition-all"
        >
          Open NODA
        </Link>
      </nav>

      {/* Sections — all sit on top of fixed dragon background */}
      <div className="relative z-10">
        <ApexHero />
        <ApexFeatures />
        <ApexHowItWorks />
        <ApexProofFeed />
        <ApexCTA />

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center">
          <p className="text-white/30 text-[11px] font-medium tracking-wider">
            APEX · Zero-knowledge proof for NODA · Built on Kaspa
          </p>
        </footer>
      </div>
    </div>
  );
}