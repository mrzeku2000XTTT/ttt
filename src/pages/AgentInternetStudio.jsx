import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import AgentStudio3DScene from "@/components/agentstudio/AgentStudio3DScene";

/** AGENTINTERNETSTUDIO — 3D WebGL index page for the studio. */
export default function AgentInternetStudioPage() {
  const navigate = useNavigate();
  return (
    <main className="relative w-full min-h-screen overflow-hidden bg-black flex flex-col font-sans selection:bg-cyan-400/30 selection:text-white">
      {/* 3D WebGL background */}
      <div className="absolute inset-0 z-0">
        <AgentStudio3DScene />
      </div>
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/45 via-black/25 to-black/75 pointer-events-none" />

      {/* Header — TTT back */}
      <header className="relative z-10 px-6 sm:px-10 py-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-white text-2xl sm:text-3xl font-bold tracking-tight hover:text-cyan-300 transition-colors"
          title="Back"
        >
          TTT
        </button>
        <span className="text-white/70 text-sm font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Agent Internet
        </span>
      </header>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-2xl"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-white leading-[1.05] mb-4">
            Agent Internet Studio
          </h1>
          <p className="text-white/80 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed mb-9">
            A 3D studio for building, training, and deploying autonomous agents on Kaspa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/AgentStudio")}
              className="w-full sm:w-auto rounded-full px-7 py-3.5 text-sm font-medium text-black bg-white hover:bg-white/90 transition-colors"
            >
              Enter Studio
            </button>
            <button
              onClick={() => navigate("/AgentStudio")}
              className="w-full sm:w-auto rounded-full px-7 py-3.5 text-sm font-medium text-white border border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-md transition-colors"
            >
              Create New Agent
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}