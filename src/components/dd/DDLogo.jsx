import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const LOGO_URL = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/9c255656c_IMG_5210.jpeg";

const DEFAULTS = {
  bgColor: "#1a1a1a",
  faceScale: 0.72,
  faceLeft: 14,
  faceTop: 14,
  textColor: "#f5f5f5",
  eyeTop: 34,
  eyeRight: 16,
  eyeSize: 0.18,
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem("dd_logo_prefs");
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULTS;
}

export function saveLogoPrefs(prefs) {
  const merged = { ...loadPrefs(), ...prefs };
  localStorage.setItem("dd_logo_prefs", JSON.stringify(merged));
  window.dispatchEvent(new Event("dd_logo_prefs_changed"));
  return merged;
}

export function useLogoPrefs() {
  const [prefs, setPrefs] = useState(loadPrefs);
  useEffect(() => {
    const handler = () => setPrefs(loadPrefs());
    window.addEventListener("dd_logo_prefs_changed", handler);
    return () => window.removeEventListener("dd_logo_prefs_changed", handler);
  }, []);
  return prefs;
}

export default function DDLogo({ size = 32, showWord = true, animate = true, active = false, dark = false, prefs: prefsOverride }) {
  const stored = useLogoPrefs();
  const prefs = prefsOverride || stored;
  const isDark = dark || prefs.bgColor.toLowerCase() !== "#ffffff";

  return (
    <div className="flex items-center gap-2 select-none">
      <motion.div
        initial={animate ? { opacity: 0, scale: 0.5 } : false}
        animate={animate ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative shrink-0"
        style={{ width: size, height: size }}
      >
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ background: prefs.bgColor }}
        >
          <img
            src={LOGO_URL}
            alt="DD"
            className="object-contain"
            style={{
              width: `${prefs.faceScale * 100}%`,
              height: `${prefs.faceScale * 100}%`,
              position: "absolute",
              left: `${prefs.faceLeft}%`,
              top: `${prefs.faceTop}%`,
              filter: isDark ? "invert(1)" : undefined,
              mixBlendMode: isDark ? "screen" : undefined,
            }}
          />
        </div>
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `2px solid ${isDark ? prefs.bgColor : "#e5e5e5"}` }}
        />
        <motion.span
          className="absolute font-bold leading-none pointer-events-none z-10"
          style={{
            top: `${prefs.eyeTop}%`,
            right: `${prefs.eyeRight}%`,
            fontSize: Math.max(7, Math.round(size * prefs.eyeSize)),
            color: prefs.textColor,
            letterSpacing: "-0.04em",
          }}
          animate={{ opacity: [1, 1, 0.15, 1, 1], scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", times: [0, 0.82, 0.88, 0.94, 1] }}
        >
          DD
        </motion.span>
        {active && (
          <motion.span
            className="absolute inset-0 rounded-full ring-2 ring-neutral-700/50 pointer-events-none"
            animate={{ opacity: [0.25, 0.7, 0.25] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </motion.div>
      {showWord && (
        <motion.span
          initial={animate ? { opacity: 0, x: -6 } : false}
          animate={animate ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.45, delay: 0.28, ease: "easeOut" }}
          className="font-bold tracking-tight text-neutral-900"
          style={{ fontSize: Math.round(size * 0.6), lineHeight: 1 }}
        >
          DD
        </motion.span>
      )}
    </div>
  );
}