import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, AlertTriangle, ArrowRight, CircleCheck } from "lucide-react";
import { FEELING_OPTIONS } from "@/lib/flagSenseData";

const FEEDBACK = {
  green: { title: "That's a healthy response", color: "var(--fs-green)", note: "This behavior tends to build trust and closeness." },
  yellow: { title: "Worth reflecting on", color: "var(--fs-amber)", note: "This isn't a verdict — it's a behavior worth noticing. Many well-meaning responses land this way." },
  red: { title: "This may create distance", color: "var(--fs-red)", note: "This behavior can hurt trust over time. Not a label — just something worth understanding." },
};

/** After a choice: why it matters → think about them → try this (healthier alternative). */
export default function FlagSenseResult({ scenario, choice, last, onNext }) {
  const [stage, setStage] = useState(0);
  const [picked, setPicked] = useState([]);
  const [copied, setCopied] = useState(false);
  const fb = FEEDBACK[choice];

  const toggleFeeling = (f) =>
    setPicked((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(scenario.example_phrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="flex flex-1 flex-col justify-center">
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto w-full max-w-sm"
      >
        {stage === 0 && (
          <div className="rounded-[1.75rem] border border-black/[0.06] bg-card p-7 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${fb.color})` }} />
              <p className="text-[13px] font-semibold text-neutral-500">{fb.title}</p>
            </div>
            <h3 className="mb-3 text-[19px] font-bold tracking-tight">Why it matters</h3>
            <p className="mb-4 text-[14.5px] leading-relaxed text-neutral-700">{scenario.why_it_matters}</p>
            <p className="text-[13px] leading-relaxed text-neutral-500">{fb.note}</p>
            {scenario.safety && (
              <div className="mt-4 flex gap-2.5 rounded-2xl bg-[hsl(var(--fs-red)/0.06)] p-3.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--fs-red))]" />
                <p className="text-[12px] leading-relaxed text-neutral-700">
                  This is a <strong>safety concern</strong>, not ordinary relationship conflict. If a pattern like this is part of your life, please talk to someone you trust or a local support resource — this isn't something to fix alone.
                </p>
              </div>
            )}
            <ContinueRow label="Think about them" onClick={() => setStage(1)} />
          </div>
        )}

        {stage === 1 && (
          <div className="rounded-[1.75rem] border border-black/[0.06] bg-card p-7 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.35)]">
            <p className="fs-label">Think about them</p>
            <h3 className="mb-2 text-[19px] font-bold tracking-tight">{scenario.reflection_question}</h3>
            <p className="mb-5 text-[13px] text-neutral-500">Tap any that could apply — people experience the same moment differently.</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {FEELING_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => toggleFeeling(f)}
                  className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                    picked.includes(f)
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-black/10 bg-white text-neutral-700 hover:border-black/25"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="mb-5 text-[12.5px] leading-relaxed text-neutral-500">
              There's rarely one right answer — two people can live the same moment completely differently. That's the point.
            </p>
            <ContinueRow label="Try this instead" onClick={() => setStage(2)} />
          </div>
        )}

        {stage === 2 && (
          <div className="rounded-[1.75rem] border border-black/[0.06] bg-card p-7 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.35)]">
            <p className="fs-label">Try this</p>
            <h3 className="mb-2 text-[19px] font-bold tracking-tight">A healthier alternative</h3>
            <p className="mb-5 text-[14.5px] leading-relaxed text-neutral-700">{scenario.healthier_alternative}</p>

            <div className="mb-4 rounded-2xl bg-secondary p-4">
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">Say it like this</p>
              <p className="text-[14px] font-medium leading-relaxed">"{scenario.example_phrase}"</p>
              <button
                onClick={copy}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-neutral-700 transition-colors hover:border-black/30"
              >
                {copied ? <Check className="h-3 w-3 text-[hsl(var(--fs-green))]" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <p className="mb-5 text-[12.5px] leading-relaxed text-neutral-500">
              Understand it → replace it → practice it. One honest sentence is where change starts.
            </p>

            <button
              onClick={onNext}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              {last ? <><CircleCheck className="h-4 w-4" /> Finish session</> : <>Next scenario <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ContinueRow({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-neutral-800"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}