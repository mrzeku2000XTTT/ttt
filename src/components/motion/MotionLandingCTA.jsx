import React from "react";
import { Link } from "react-router-dom";
import { Wand2, ArrowRight } from "lucide-react";

export default function MotionLandingCTA() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 p-10 sm:p-16 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.2),transparent_60%)] -z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.2),transparent_60%)] -z-10" />

        <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight">
          Your next landing page<br />
          <span className="bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
            is one prompt away.
          </span>
        </h2>
        <p className="text-white/60 text-base sm:text-lg mb-8 max-w-xl mx-auto">
          Stop copy-pasting templates. Describe what you want, hit generate, ship.
        </p>

        <Link
          to="/MotionStudio"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-all shadow-2xl shadow-cyan-500/30"
        >
          <Wand2 className="w-4 h-4" />
          Launch Motion
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-[11px] text-white/30 mt-6">
          Currently in admin-only preview · Open access coming soon
        </p>
      </div>
    </section>
  );
}