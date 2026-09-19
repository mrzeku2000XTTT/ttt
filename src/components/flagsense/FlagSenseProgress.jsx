import React from "react";
import { ShieldCheck, Target } from "lucide-react";
import { AXIS_CHALLENGES } from "@/lib/flagSenseData";
import { axisScores, biggestOpportunity } from "@/lib/flagSenseStore";

/** Premium personal-growth dashboard — no childish gamification. */
export default function FlagSenseProgress({ state }) {
  const scores = axisScores(state);
  const opp = biggestOpportunity(scores);
  const answered = Object.keys(state.answers || {}).length;

  return (
    <div className="mx-auto w-full max-w-md px-6 pt-4 pb-28">
      <p className="fs-label">My growth</p>
      <h1 className="mb-6 text-[26px] font-bold tracking-tight">Progress</h1>

      <div className="mb-6 rounded-[1.75rem] border border-black/[0.06] bg-card p-6 shadow-sm">
        <div className="space-y-4">
          {scores.map((s) => (
            <div key={s.id}>
              <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                <span className="font-medium text-neutral-600">{s.label}</span>
                <span className="font-semibold tabular-nums">{s.value == null ? "—" : `${s.value}%`}</span>
              </div>
              <div className="fs-bar">
                <div className="fs-bar-fill bg-neutral-800" style={{ width: `${s.value ?? 0}%`, opacity: s.value == null ? 0.12 : 1 }} />
              </div>
            </div>
          ))}
        </div>
        {answered === 0 && (
          <p className="mt-4 text-[12px] text-neutral-500">Answer a few scenarios and your growth picture appears here.</p>
        )}
      </div>

      {opp && (
        <div className="mb-6 rounded-[1.75rem] border border-black/[0.06] bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-neutral-400" />
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">
              Your biggest opportunity this week
            </p>
          </div>
          <p className="mb-4 text-[17px] font-semibold tracking-tight">{opp.label}</p>
          <div className="rounded-2xl bg-secondary p-4">
            <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">One tiny challenge</p>
            <p className="text-[13.5px] font-medium leading-relaxed">{AXIS_CHALLENGES[opp.id]}</p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-[1.75rem] border border-black/[0.06] bg-card p-6 shadow-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-400" />
        <p className="text-[12.5px] leading-relaxed text-neutral-500">
          {answered} {answered === 1 ? "scenario" : "scenarios"} answered — all stored privately on this device.
          Growth here is a direction, not a grade.
        </p>
      </div>
    </div>
  );
}