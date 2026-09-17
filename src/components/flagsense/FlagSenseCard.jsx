import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { PauseCircle } from "lucide-react";
import FlagSensePause from "@/components/flagsense/FlagSensePause";
import { CATEGORIES } from "@/lib/flagSenseData";

const LEVELS = [
  { id: "green", label: "Healthy", hint: "I respect their space and respond with care", color: "var(--fs-green)" },
  { id: "yellow", label: "Worth reflecting on", hint: "I mean well but it may not land that way", color: "var(--fs-amber)" },
  { id: "red", label: "Concerning", hint: "This may create distance or hurt trust", color: "var(--fs-red)" },
];

/** The hero scenario card — swipe or choose, then see the explanation. */
export default function FlagSenseCard({ scenario, onChoose, reflectMode = false }) {
  const [paused, setPaused] = useState(false);
  const cat = CATEGORIES.find((c) => c.id === scenario.category);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-6, 6]);
  const greenGlow = useTransform(x, [40, 180], [0, 1]);
  const redGlow = useTransform(x, [-180, -40], [1, 0]);

  const finish = (level) => {
    onChoose(level);
  };

  const onDragEnd = (_, info) => {
    const { offset, velocity } = info;
    if (offset.x > 110 || velocity.x > 700) finish("green");
    else if (offset.x < -110 || velocity.x < -700) finish("red");
    else if (offset.y < -140) finish("yellow");
  };

  return (
    <div className="flex flex-1 flex-col justify-center">
      <motion.div
        drag
        dragElastic={0.65}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        onDragEnd={onDragEnd}
        style={{ x, y, rotate }}
        className="relative mx-auto w-full max-w-sm cursor-grab active:cursor-grabbing"
      >
        <motion.div style={{ opacity: greenGlow }} className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-[hsl(var(--fs-green)/0.12)]" />
        <motion.div style={{ opacity: redGlow }} className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-[hsl(var(--fs-red)/0.1)]" />

        <div className="relative overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-card px-6 py-8 shadow-[0_24px_70px_-30px_rgba(0,0,0,0.3)]">
          <div className="mb-6 flex items-center justify-between">
            {cat && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-600">
                <cat.icon className="h-3 w-3" />
                {cat.label}
              </span>
            )}
            <button
              onClick={() => setPaused(true)}
              title="Pause before you react"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-secondary hover:text-neutral-600"
            >
              <PauseCircle className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            {reflectMode ? "What would you usually do?" : "Think about this"}
          </p>
          <h2 className="text-[21px] font-semibold leading-[1.3] tracking-tight">
            {scenario.scenario}
          </h2>
          <p className="mt-3 text-[13px] text-neutral-500">
            {reflectMode ? "Be honest — this one's just for you." : "How would you respond? Swipe, or choose below."}
          </p>
        </div>
      </motion.div>

      <div className="mx-auto mt-5 w-full max-w-sm space-y-2.5">
        {LEVELS.map((lv) => (
          <button
            key={lv.id}
            onClick={() => finish(lv.id)}
            className="flex w-full items-center gap-3 rounded-2xl border border-black/[0.07] bg-card px-4 py-3.5 text-left shadow-sm transition-colors hover:border-black/20"
          >
            <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: `hsl(${lv.color})` }} />
            <span className="flex-1">
              <span className="block text-[14px] font-semibold">{lv.label}</span>
              <span className="block text-[11.5px] leading-snug text-neutral-500">{lv.hint}</span>
            </span>
          </button>
        ))}
      </div>

      {paused && <FlagSensePause onClose={() => setPaused(false)} />}
    </div>
  );
}