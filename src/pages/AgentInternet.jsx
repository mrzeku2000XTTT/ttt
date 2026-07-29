import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AgentCardCarousel from "@/components/agentinternet/AgentCardCarousel";

export default function AgentInternetPage() {
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <AgentCardCarousel />

      <Link
        to="/"
        className="absolute z-50 flex items-center gap-2 px-4 h-11 rounded-full border border-white/15 bg-black/50 backdrop-blur-md text-white/70 hover:text-white hover:border-white/40 transition-colors text-xs font-mono tracking-widest uppercase"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)", left: "1rem" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div
        className="absolute z-50 right-4 text-right pointer-events-none"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        <div className="text-white font-black text-lg sm:text-2xl tracking-tight">AGENT INTERNET</div>
        <div className="text-white/40 text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase">Identity Cards</div>
      </div>
    </div>
  );
}