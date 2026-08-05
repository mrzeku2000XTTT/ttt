import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings as SettingsIcon, X, Video, Sparkles, Shield } from "lucide-react";

/**
 * LandingSettings — minimal dark-web settings drawer for the landing page.
 * Toggles persist in localStorage.
 */
const DEFAULTS = {
  galaxy: true,
  reducedMotion: false,
  scanlines: true,
  showPowers: true,
};

export function useLandingSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("ai_landing_settings");
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    try { localStorage.setItem("ai_landing_settings", JSON.stringify(settings)); } catch {}
  }, [settings]);

  const update = (key) => setSettings((s) => ({ ...s, [key]: !s[key] }));
  return { settings, update };
}

function Toggle({ on, onClick, label, icon: Icon, desc }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border border-white/10 bg-black/40 hover:bg-black/60 transition-colors text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${on ? "bg-cyan-500/20 text-cyan-300" : "bg-white/5 text-white/40"}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-white text-xs font-medium truncate">{label}</div>
          <div className="text-white/40 text-[10px] truncate">{desc}</div>
        </div>
      </div>
      <div className={`w-9 h-5 rounded-full shrink-0 relative transition-colors ${on ? "bg-cyan-400" : "bg-white/15"}`}>
        <motion.div
          layout
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
          style={{ left: on ? "calc(100% - 1.125rem)" : "0.125rem" }}
        />
      </div>
    </button>
  );
}

export default function LandingSettings({ open, onClose, settings, update }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="absolute top-0 right-0 bottom-0 z-50 w-[280px] max-w-[85vw] bg-zinc-950 border-l border-white/10 p-4 overflow-y-auto"
            style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-bold text-sm tracking-wide">Settings</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Toggle on={settings.galaxy} onClick={() => update("galaxy")} label="Galaxy Background" desc="Cycling space videos" icon={Video} />
              <Toggle on={settings.scanlines} onClick={() => update("scanlines")} label="Scanlines" desc="CRT terminal effect" icon={Sparkles} />
              <Toggle on={settings.showPowers} onClick={() => update("showPowers")} label="Power Hints" desc="Typing animation in input" icon={Sparkles} />
              <Toggle on={settings.reducedMotion} onClick={() => update("reducedMotion")} label="Reduced Motion" desc="Fewer animations" icon={Shield} />
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="text-[9px] font-mono tracking-widest uppercase text-white/30 leading-relaxed">
                Agent Internet v3.0<br/>
                TTT Supercomputer · Kaspa-native
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}