import React, { useState } from "react";
import { X } from "lucide-react";
import FlagSenseCard from "@/components/flagsense/FlagSenseCard";
import FlagSenseResult from "@/components/flagsense/FlagSenseResult";

/** Runs a queue of scenarios: card → result → next. Records each answer. */
export default function FlagSenseSession({ feed, mode, onAnswer, onExit }) {
  const [idx, setIdx] = useState(0);
  const [choice, setChoice] = useState(null);
  const [done, setDone] = useState(false);
  const scenario = feed[idx];
  const last = idx === feed.length - 1;

  const choose = (level) => {
    setChoice(level);
    onAnswer(scenario.id, level, mode);
  };

  const next = () => {
    setChoice(null);
    if (last) setDone(true);
    else setIdx((i) => i + 1);
  };

  return (
    <div className="flag-sense fixed inset-0 z-[350] flex flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-6 pb-10">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {feed.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < idx ? "w-3 bg-neutral-300" : i === idx ? "w-6 bg-neutral-900" : "w-3 bg-neutral-200"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onExit}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-secondary"
            aria-label="Close session"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center fs-fade-up">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--fs-green)/0.12)] text-2xl">🌱</div>
            <h2 className="mb-2 text-[24px] font-bold tracking-tight">Session complete</h2>
            <p className="mb-8 max-w-xs text-[14px] leading-relaxed text-neutral-600">
              Notice. Understand. Reflect. Empathize. Practice. That's the whole loop — a little at a time.
            </p>
            <button
              onClick={onExit}
              className="rounded-2xl bg-neutral-900 px-8 py-3.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              Back to FlagSense
            </button>
          </div>
        ) : choice ? (
          <FlagSenseResult scenario={scenario} choice={choice} last={last} onNext={next} />
        ) : (
          <FlagSenseCard scenario={scenario} onChoose={choose} reflectMode={mode === "reflect"} />
        )}
      </div>
    </div>
  );
}