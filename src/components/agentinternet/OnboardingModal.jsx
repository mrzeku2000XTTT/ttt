import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Check, Wifi, Shield, Sparkles } from "lucide-react";
import OrganicOrb from "@/components/agentinternet/OrganicOrb";

const STORAGE_KEY = "ttt_ai_onboarded";

// Detect whether this device/browser has seen onboarding.
export function hasOnboarded() {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
}
function markOnboarded() {
  try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
}

const STEPS = [
  {
    title: "Welcome to TTT A.I",
    sub: "The first Kaspa super app store.",
    body: "One unified superagent controls 250+ AI agents and every app. You're not logging in — you're booting a supercomputer.",
    accent: ["#ffffff", "#22d3ee", "#6366f1"],
  },
  {
    title: "Phone UI · Pocket Superagent",
    sub: "Carry the whole network in your pocket.",
    body: "Your phone becomes the surface. The orb wakes agents on demand, in the right order, without you touching a thing.",
    accent: ["#67e8f9", "#22d3ee", "#0891b2"],
  },
  {
    title: "Browser · Apps Mount Live",
    sub: "250+ apps, headless & callable.",
    body: "No iframes. The agent calls each app's logic on the backend and shows proof in chat. Apps mount like kernel modules.",
    accent: ["#a78bfa", "#8b5cf6", "#6366f1"],
  },
  {
    title: "kaspa.org · L1 Handshake",
    sub: "Native to the Kaspa DAG.",
    body: "Every action settles on Kaspa L1 — fast, final, feeless-feeling. Wallets generate client-side; keys never touch a server.",
    accent: ["#fbbf24", "#f59e0b", "#f97316"],
  },
  {
    title: "Launch · You're Ready",
    sub: "Enter the Agent Internet.",
    body: "New here? This was your 5-step orientation. Skip it next time. Now go — ask the orb anything.",
    accent: ["#34d399", "#10b981", "#059669"],
  },
];

export default function OnboardingModal({ open, onFinish, onClose }) {
  const [step, setStep] = useState(0);
  useEffect(() => { if (open) setStep(0); }, [open]);

  const finish = (completed) => {
    if (completed) markOnboarded();
    onFinish?.();
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish(true);
  };

  const skip = () => {
    // Skip the remaining steps but still proceed to the destination —
    // don't dump the user back on the landing page.
    finish(true);
  };

  const s = STEPS[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-xl flex items-center justify-center px-4"
        >
          {/* Skip */}
          <button
            onClick={skip}
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 h-9 rounded-full border border-white/15 bg-black/50 text-white/60 hover:text-white hover:border-white/40 text-xs font-mono uppercase tracking-widest transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Skip
          </button>

          <div className="relative w-full max-w-sm">
            {/* Step counter */}
            <div className="flex items-center justify-center gap-1.5 mb-5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-cyan-300" : i < step ? "w-2 bg-cyan-500/60" : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: 0.4 }}
                className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6 overflow-hidden"
              >
                {/* Motion graphic stage */}
                <div className="relative h-44 mb-5 flex items-center justify-center">
                  <StepGraphic step={step} accent={s.accent} />
                </div>

                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 mb-2">
                    <OrganicOrb size={12} colors={s.accent} glow={false} />
                    <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-white/50">{s.sub}</span>
                  </div>
                  <h2 className="font-heading font-black text-2xl tracking-tight text-white leading-tight">{s.title}</h2>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed font-body">{s.body}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="mt-5 flex items-center justify-between">
              <button
                onClick={skip}
                className="text-[11px] font-mono uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
              >
                {step === STEPS.length - 1 ? "Close" : "Skip tour"}
              </button>
              <button
                onClick={next}
                className="flex items-center gap-2 px-5 h-10 rounded-full border border-cyan-400/40 bg-transparent text-cyan-300 hover:border-cyan-300/70 hover:text-cyan-200 text-xs font-bold tracking-widest uppercase transition-colors"
              >
                {step === STEPS.length - 1 ? (
                  <><Check className="w-4 h-4" /> Enter</>
                ) : (
                  <>Next <ArrowRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Motion graphics per step ── */

function PhoneFrame({ children, glow }) {
  return (
    <div className="relative" style={{ width: 108, height: 196 }}>
      <div className="absolute inset-0 rounded-[22px] border border-white/25 bg-black/80 shadow-[0_0_30px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* notch */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-full bg-white/20" />
        <div className="absolute inset-0 pt-5 flex items-center justify-center">{children}</div>
      </div>
      {glow && (
        <motion.div
          className="absolute -inset-3 rounded-[28px] blur-xl -z-10"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.4), transparent 70%)" }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        />
      )}
    </div>
  );
}

function BrowserFrame({ children }) {
  return (
    <div className="relative w-full max-w-[260px]" style={{ height: 132 }}>
      <div className="absolute inset-0 rounded-xl border border-white/20 bg-black/70 overflow-hidden shadow-[0_0_24px_rgba(99,102,241,0.25)]">
        {/* chrome bar */}
        <div className="h-6 flex items-center gap-1.5 px-2 border-b border-white/10 bg-white/5">
          <span className="w-2 h-2 rounded-full bg-red-400/70" />
          <span className="w-2 h-2 rounded-full bg-yellow-400/70" />
          <span className="w-2 h-2 rounded-full bg-green-400/70" />
          <div className="ml-2 flex-1 h-3 rounded-full bg-white/10 flex items-center px-2">
            <span className="text-[7px] font-mono text-white/40">tttz.xyz</span>
          </div>
        </div>
        <div className="relative h-full pt-6">{children}</div>
      </div>
    </div>
  );
}

function StepGraphic({ step, accent }) {
  if (step === 0) {
    // Big orb morph + ring pulse — "booting a supercomputer"
    return (
      <div className="relative flex items-center justify-center">
        {[0, 1, 2].map((r) => (
          <motion.div
            key={r}
            className="absolute rounded-full border border-cyan-400/30"
            style={{ width: 80 + r * 40, height: 80 + r * 40 }}
            animate={{ opacity: [0.6, 0.1, 0.6], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: r * 0.3 }}
          />
        ))}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          <OrganicOrb size={64} colors={accent} />
        </motion.div>
      </div>
    );
  }

  if (step === 1) {
    // Phone UI — orb inside phone, agent dots orbiting
    return (
      <PhoneFrame glow>
        <div className="relative flex items-center justify-center">
          <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <OrganicOrb size={36} colors={accent} />
          </motion.div>
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300/80"
              style={{ top: "50%", left: "50%" }}
              animate={{
                x: [Math.cos((i / 4) * Math.PI * 2) * 26, Math.cos((i / 4) * Math.PI * 2 + 0.3) * 26],
                y: [Math.sin((i / 4) * Math.PI * 2) * 26, Math.sin((i / 4) * Math.PI * 2 + 0.3) * 26],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </PhoneFrame>
    );
  }

  if (step === 2) {
    // Browser — apps mounting as a grid
    const tiles = Array.from({ length: 9 });
    return (
      <BrowserFrame>
        <div className="grid grid-cols-3 gap-1.5 px-2 pt-1">
          {tiles.map((_, i) => (
            <motion.div
              key={i}
              className="aspect-square rounded-md border border-white/10 bg-white/5 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-violet-400/80 to-cyan-400/80" />
            </motion.div>
          ))}
        </div>
        <motion.div
          className="absolute bottom-2 left-2 right-2 h-2 rounded-full bg-cyan-400/30 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div
            className="h-full bg-cyan-300"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.8, duration: 1.2 }}
          />
        </motion.div>
      </BrowserFrame>
    );
  }

  if (step === 3) {
    // kaspa.org handshake — two nodes + DAG links
    return (
      <div className="relative w-full max-w-[240px] h-32 flex items-center justify-center">
        {/* left node */}
        <motion.div
          className="absolute left-2 w-10 h-10 rounded-full border border-amber-400/40 bg-amber-500/10 flex items-center justify-center"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <span className="text-[8px] font-mono text-amber-300">tttz</span>
        </motion.div>
        {/* right node */}
        <motion.div
          className="absolute right-2 w-10 h-10 rounded-full border border-amber-400/40 bg-amber-500/10 flex items-center justify-center"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: 0.3 }}
        >
          <span className="text-[8px] font-mono text-amber-300">kaspa</span>
        </motion.div>
        {/* DAG links */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-amber-300/60"
            style={{ width: 120, top: 40 + i * 22 }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 1, 0], scaleX: 1 }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
        <motion.div
          className="absolute top-1 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] font-mono text-amber-300/80"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          <Wifi className="w-2.5 h-2.5" /> L1 finality
        </motion.div>
      </div>
    );
  }

  // step 4 — ready checkmark + orb
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute rounded-full border border-emerald-400/30"
        style={{ width: 100, height: 100 }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center"
      >
        <Check className="w-8 h-8 text-emerald-300" strokeWidth={3} />
      </motion.div>
      <motion.div
        className="absolute -bottom-6 flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-emerald-300/80"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Sparkles className="w-3 h-3" /> ready
      </motion.div>
    </div>
  );
}