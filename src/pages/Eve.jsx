import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import EveChat from "@/components/eve/EveChat";

const EVE_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/220ffa959_generated_image.png";

export default function EvePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-zinc-900 flex flex-col">
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-5 bg-[#F5F5F7]/80 backdrop-blur-2xl border-b border-zinc-200/50"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <Link
          to="/AppStoreV2"
          className="flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900 transition-colors h-14 px-3 -ml-3 rounded-lg active:bg-zinc-200/60"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-[14px] font-medium">Store</span>
        </Link>
        <span className="text-[15px] font-[800] tracking-tight">Eve</span>
        <div className="w-16" />
      </nav>

      {/* Hero */}
      <div className="px-4 pt-8 pb-4 text-center">
        <motion.img
          src={EVE_LOGO}
          alt="Eve"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-20 h-20 rounded-[22px] object-cover shadow-[0_14px_34px_rgba(124,92,252,0.25)] mx-auto mb-3 rotate-[-2deg]"
        />
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-[900] tracking-tight"
        >
          Talk to Eve
        </motion.h1>
        <p className="text-zinc-500 text-sm mt-1.5 max-w-md mx-auto">
          A durable AI agent — our own take on the <span className="text-zinc-700 font-medium">eve</span> framework. Author instructions, tools and skills; chat to bring them to life.
        </p>
      </div>

      {/* Chat */}
      <div className="flex-1 px-3 sm:px-4 pb-6">
        <EveChat />
      </div>

      {/* Beige footer strip */}
      <div className="bg-[#E9E5DC] py-3 text-center">
        <p className="text-[11px] text-zinc-500 font-medium tracking-wide">
          Eve · an original TTT agent · inspired by the eve directory concept
        </p>
      </div>
    </div>
  );
}