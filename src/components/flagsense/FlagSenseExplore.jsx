import React, { useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { SCENARIOS, CATEGORIES } from "@/lib/flagSenseData";

/** The scenario library — every category with its count, browsable scenario by scenario. */
export default function FlagSenseExplore({ state, onStart }) {
  const [cat, setCat] = useState(null);

  const counts = {};
  for (const s of SCENARIOS) counts[s.category] = (counts[s.category] || 0) + 1;
  const done = state.answers || {};

  if (cat) {
    const list = SCENARIOS.filter((s) => s.category === cat.id);
    return (
      <div className="mx-auto w-full max-w-md px-6 pt-4 pb-28">
        <button
          onClick={() => setCat(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All topics
        </button>
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-neutral-700">
            <cat.icon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">{cat.label}</h1>
            <p className="text-[12px] text-neutral-500">{list.length} {list.length === 1 ? "scenario" : "scenarios"}</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {list.map((s) => (
            <button
              key={s.id}
              onClick={() => onStart([s], "answers")}
              className="flex w-full items-center gap-3 rounded-2xl border border-black/[0.06] bg-card px-5 py-4 text-left shadow-sm transition-colors hover:border-black/20"
            >
              <span className="flex-1">
                <span className="block text-[14px] font-semibold leading-snug">{s.scenario}</span>
                <span className="mt-0.5 block text-[11.5px] capitalize text-neutral-500">
                  {s.difficulty}{done[s.id] ? " · done" : ""}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-neutral-300" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 pt-4 pb-28">
      <h1 className="mb-1 text-[26px] font-bold tracking-tight">Scenario library</h1>
      <p className="mb-6 text-[13.5px] text-neutral-500">Pick a topic and work through it one situation at a time.</p>
      <div className="grid grid-cols-2 gap-2.5">
        {CATEGORIES.filter((c) => counts[c.id]).map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c)}
            className="rounded-[1.4rem] border border-black/[0.06] bg-card p-5 text-left shadow-sm transition-colors hover:border-black/20"
          >
            <c.icon className="mb-3 h-5 w-5 text-neutral-400" />
            <p className="text-[13.5px] font-semibold leading-tight">{c.label}</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">{counts[c.id]} {counts[c.id] === 1 ? "scenario" : "scenarios"}</p>
          </button>
        ))}
      </div>
    </div>
  );
}