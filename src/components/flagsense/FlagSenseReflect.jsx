import React from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { SCENARIOS, AXES, AXIS_CHALLENGES } from "@/lib/flagSenseData";
import { buildFeed, axisScores, biggestOpportunity } from "@/lib/flagSenseStore";

/** Self-reflection mode: "Am I the red flag?" — run honestly, then see patterns. */
export default function FlagSenseReflect({ state, onStart }) {
  const reflect = state.reflect || {};
  const answered = Object.keys(reflect).length;
  const ready = answered >= 5;
  const scores = axisScores(state, "reflect");
  const opp = biggestOpportunity(scores);
  const feed = buildFeed(SCENARIOS, state, "reflect", 5);

  const strongest = scores.filter((s) => s.value != null).sort((a, b) => b.value - a.value)[0];

  return (
    <div className="mx-auto w-full max-w-md px-6 pt-4 pb-10">
      <p className="fs-label">Self-reflection</p>
      <h1 className="mb-2 text-[26px] font-bold tracking-tight">"Am I the red flag?"</h1>
      <p className="mb-6 text-[13.5px] leading-relaxed text-neutral-500">
        Everyone has behaviors they can improve. Let's find yours — no judgment, just honesty.
      </p>

      <div className="mb-6 rounded-[1.75rem] border border-black/[0.06] bg-card p-6 shadow-sm">
        <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">How it works</p>
        <p className="mb-4 text-[14px] leading-relaxed text-neutral-700">
          You'll get five situations. Answer with what you <em>usually</em> do — not what you know you should do.
        </p>
        <p className="text-[13px] leading-relaxed text-neutral-500">
          {answered > 0
            ? `${answered} answered so far. ${ready ? "Your pattern is ready below." : `Keep going — your pattern unlocks after 5.`}`
            : "Everything you answer here stays on this device."}
        </p>
      </div>

      {feed.length > 0 && (
        <button
          onClick={() => onStart(feed, "reflect")}
          className="mb-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-6 py-4 text-[14.5px] font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          {answered > 0 ? <><RotateCcw className="h-4 w-4" /> Reflect on more</> : <>Start reflection <ArrowRight className="h-4 w-4" /></>}
        </button>
      )}

      {ready && (
        <div className="fs-fade-up rounded-[1.75rem] border border-black/[0.06] bg-card p-6 shadow-sm">
          <p className="fs-label">Your current patterns</p>
          <div className="mb-5 space-y-3.5">
            {scores.map((s) => (
              <div key={s.id}>
                <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-neutral-600">{s.label}</span>
                  <span className="font-semibold tabular-nums">{s.value}%</span>
                </div>
                <div className="fs-bar">
                  <div className="fs-bar-fill bg-neutral-800" style={{ width: `${s.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          <p className="mb-5 text-[13.5px] leading-relaxed text-neutral-700">
            {strongest && opp && strongest.id !== opp.id
              ? `You seem comfortable with ${strongest.label.toLowerCase()} — but ${opp.label.toLowerCase()} may be an area worth practicing.`
              : "Answer a few more to see your pattern more clearly."}
          </p>

          {opp && (
            <div className="rounded-2xl bg-secondary p-4">
              <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-500">Practice this week</p>
              <p className="text-[13.5px] font-medium leading-relaxed">{AXIS_CHALLENGES[opp.id]}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}