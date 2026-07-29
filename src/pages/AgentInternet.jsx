import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Zap } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import AgentCardCarousel from "@/components/agentinternet/AgentCardCarousel";
import AgentBlueprintModal from "@/components/agentinternet/AgentBlueprintModal";
import AgentInternetConsole from "@/components/agentinternet/AgentInternetConsole";

export default function AgentInternetPage() {
  const [selected, setSelected] = useState(null);
  const [launched, setLaunched] = useState(false);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <AgentCardCarousel onSelect={setSelected} />

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
        <div className="text-white/40 text-[10px] sm:text-xs font-mono tracking-[0.25em] uppercase">Scroll · tap a card</div>
      </div>

      <button
        onClick={() => setLaunched(true)}
        className="absolute z-50 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 h-12 rounded-full text-xs font-mono tracking-[0.2em] uppercase text-cyan-300 border border-cyan-400/40 bg-cyan-500/10 backdrop-blur-md hover:bg-cyan-500/20 transition-colors"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
      >
        <Zap className="w-4 h-4" />
        Launch Agent Internet
      </button>

      <AnimatePresence>
        {selected && <AgentBlueprintModal agent={selected} onClose={() => setSelected(null)} />}
        {launched && <AgentInternetConsole onClose={() => setLaunched(false)} />}
      </AnimatePresence>
    </div>
  );
}