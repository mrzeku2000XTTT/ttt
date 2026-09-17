import React, { useState } from "react";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { CATEGORIES } from "@/lib/flagSenseData";

const GOALS = [
  { id: "partner", label: "Understand my partner" },
  { id: "myself", label: "Understand myself" },
  { id: "communication", label: "Improve communication" },
  { id: "healthier", label: "Build healthier relationships" },
  { id: "curious", label: "Just curious" },
];

const WHO = [
  { id: "me", label: "Me" },
  { id: "relationship", label: "My relationship" },
  { id: "both", label: "Both" },
];

/** Short 3-step onboarding. Never assumes the partner is the problem. */
export default function FlagSenseOnboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(null);
  const [who, setWho] = useState(null);
  const [interests, setInterests] = useState([]);

  const toggle = (id) =>
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  return (
    <div className="flag-sense fixed inset-0 z-[400] overflow-y-auto">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-12">
        {step === 0 && (
          <div className="flex flex-1 flex-col justify-center fs-fade-up">
            <HeartHandshake className="mb-6 h-8 w-8 text-neutral-300" />
            <h1 className="mb-4 text-[34px] font-bold leading-[1.1] tracking-tight">
              Understand.<br />Reflect.<br />Grow.
            </h1>
            <p className="mb-10 text-[15px] leading-relaxed text-neutral-600">
              Learn how relationship behaviors can affect both people — and what healthier can look like.
            </p>
            <PrimaryButton onClick={() => setStep(1)}>Continue</PrimaryButton>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-1 flex-col justify-center fs-fade-up">
            <p className="fs-label">Step 2 of 3</p>
            <h2 className="mb-2 text-[26px] font-bold tracking-tight">What are you here for?</h2>
            <p className="mb-6 text-[13.5px] text-neutral-500">This shapes which scenarios you see first.</p>
            <div className="mb-8 space-y-2.5">
              {GOALS.map((g) => (
                <Choice key={g.id} active={goal === g.id} onClick={() => setGoal(g.id)}>{g.label}</Choice>
              ))}
            </div>
            <PrimaryButton disabled={!goal} onClick={() => setStep(2)}>Continue</PrimaryButton>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-1 flex-col justify-center fs-fade-up">
            <p className="fs-label">Step 3 of 3</p>
            <h2 className="mb-2 text-[26px] font-bold tracking-tight">Who is this for?</h2>
            <p className="mb-6 text-[13.5px] text-neutral-500">
              There's no wrong answer — and we never assume your partner is the problem.
            </p>
            <div className="mb-8 space-y-2.5">
              {WHO.map((w) => (
                <Choice key={w.id} active={who === w.id} onClick={() => setWho(w.id)}>{w.label}</Choice>
              ))}
            </div>
            <PrimaryButton disabled={!who} onClick={() => setStep(3)}>Continue</PrimaryButton>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-1 flex-col justify-center fs-fade-up">
            <p className="fs-label">Almost done</p>
            <h2 className="mb-2 text-[26px] font-bold tracking-tight">Pick a few topics</h2>
            <p className="mb-6 text-[13.5px] text-neutral-500">
              We'll prioritize these — and still introduce others over time.
            </p>
            <div className="mb-8 flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 12).map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={`rounded-full border px-4 py-2 text-[12.5px] font-medium transition-colors ${
                    interests.includes(c.id)
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-black/10 bg-white text-neutral-700 hover:border-black/25"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <PrimaryButton disabled={interests.length === 0} onClick={() => onDone({ goal, who, interests })}>
              Start exploring
              <ArrowRight className="h-4 w-4" />
            </PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-[15px] font-semibold text-white shadow-lg transition-colors hover:bg-neutral-800 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Choice({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-2xl border px-5 py-4 text-left text-[14.5px] font-medium transition-colors ${
        active ? "border-neutral-900 bg-neutral-900 text-white" : "border-black/10 bg-white hover:border-black/25"
      }`}
    >
      {children}
    </button>
  );
}