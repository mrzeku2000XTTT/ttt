import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu } from "lucide-react";
import { APPS, KASPA_APPS_ORDER, LIFESTYLE_APP_PATHS } from "@/components/appstore2/appCatalog";
import PortalAppGrid from "@/components/portal/PortalAppGrid";
import KaspaMark from "@/components/tttbuilder/landing/KaspaMark";

const VOID_VIDEO = "https://media.base44.com/videos/public/6901295fa9bcfaa0f5ba2c2a/27bfb75f7_Portal_Void_Loop.mp4";

const AI_CATS = ["AI", "Creative", "Dev Tools", "Education", "Lifestyle", "Productivity", "Media", "Fitness"];

// The two TTT collections, straight from the App Store catalog.
function usePortalCollections() {
  return useMemo(() => {
    const kaspaNames = new Set([
      ...KASPA_APPS_ORDER,
      ...APPS.filter((a) => a.cat === "Kaspa" || a.cat === "Finance").map((a) => a.name),
    ]);
    const kaspaApps = APPS.filter((a) => kaspaNames.has(a.name) && !a.admin);
    const aiApps = APPS.filter(
      (a) => !kaspaNames.has(a.name) && !a.admin && AI_CATS.includes(a.cat) && !LIFESTYLE_APP_PATHS.includes(a.path)
    );
    return { kaspaApps, aiApps };
  }, []);
}

// Apple-style frosted glass button
function PortalButton({ label, sub, icon, onClick, delay, accent }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative w-full flex items-center gap-4 px-5 py-4 text-left overflow-hidden group"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 22,
        backdropFilter: "blur(30px) saturate(180%)",
        WebkitBackdropFilter: "blur(30px) saturate(180%)",
        boxShadow: `0 12px 44px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)`,
      }}
    >
      <div
        className="flex-shrink-0 w-11 h-11 rounded-[13px] flex items-center justify-center overflow-hidden"
        style={{ background: `${accent}1a`, border: `1px solid ${accent}40` }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-white font-bold text-[15px] tracking-tight">{label}</div>
        <div className="text-white/45 text-xs mt-0.5">{sub}</div>
      </div>
      <span className="text-white/25 text-lg group-hover:text-white/50 transition-colors">›</span>
    </motion.button>
  );
}

export default function PortalPage() {
  const [view, setView] = useState("home"); // home | ai | kaspa
  const { kaspaApps, aiApps } = usePortalCollections();

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col" style={{ background: "#000" }}>

      {/* ── Full-screen dark void video ── */}
      <video
        src={VOID_VIDEO}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      {/* Vignette to hold the void dark */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 15%, rgba(0,0,0,0.75) 100%)" }}
      />
      <div className="absolute inset-0 bg-black/25 pointer-events-none" />

      {/* ── HOME ── */}
      <AnimatePresence mode="wait">
        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-16"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2.5 mb-3">
                <div className="h-px w-10 bg-white/20" />
                <span className="text-[10px] tracking-[0.45em] uppercase font-semibold text-white/50">Portal</span>
                <div className="h-px w-10 bg-white/20" />
              </div>
              <h1
                className="font-black text-white text-6xl sm:text-7xl tracking-tight mb-2"
                style={{ textShadow: "0 0 80px rgba(168,85,247,0.35)" }}
              >
                TTT
              </h1>
              <p className="text-white/35 text-xs tracking-[0.35em] uppercase">Choose your world</p>
            </motion.div>

            {/* Two Apple-style buttons */}
            <div className="w-full max-w-sm flex flex-col gap-3.5 mt-14">
              <PortalButton
                label="All AI Apps"
                sub="Intelligence Engine"
                accent="#a855f7"
                delay={0.35}
                icon={<Cpu className="w-5 h-5 text-[#c084fc]" />}
                onClick={() => setView("ai")}
              />
              <PortalButton
                label="All Kaspa Apps"
                sub="DAGchain Ecosystem"
                accent="#00ff99"
                delay={0.5}
                icon={<KaspaMark size={26} />}
                onClick={() => setView("kaspa")}
              />
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex items-center gap-2 mt-16"
            >
              <KaspaMark size={14} />
              <span className="text-white/25 text-[10px] tracking-[0.4em] uppercase">由 Kaspa 提供支持</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COLLECTION VIEWS ── */}
      <AnimatePresence>
        {view === "ai" && (
          <PortalAppGrid
            key="ai"
            title="All AI Apps"
            subtitle="Intelligence Engine"
            apps={aiApps}
            onBack={() => setView("home")}
          />
        )}
        {view === "kaspa" && (
          <PortalAppGrid
            key="kaspa"
            title="All Kaspa Apps"
            subtitle="DAGchain Ecosystem"
            apps={kaspaApps}
            onBack={() => setView("home")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}