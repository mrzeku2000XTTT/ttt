import React from "react";
import { Lock, FileInput, BellRing, Rows3, SunMoon } from "lucide-react";

const FEATURES = [
  { Icon: Lock, title: "Local only", body: "Lives in your browser. No account, no server copy." },
  { Icon: FileInput, title: "Any schedule", body: "Paste text, drop a screenshot, or an .ics export." },
  { Icon: BellRing, title: "Real iOS template", body: "The notification Apple actually ships." },
  { Icon: Rows3, title: "Both faces", body: "Lock screen stack, or one banner at a time." },
  { Icon: SunMoon, title: "Light and dark", body: "See the same day on either lock screen." },
];

const STEPS = [
  { n: "01", title: "Bring the schedule", body: "Paste it, drop a screenshot, or the .ics your calendar exports." },
  { n: "02", title: "NUDGE reads the day", body: "The agent finds what is actually happening, in order." },
  { n: "03", title: "Read it as notifications", body: "Each moment arrives as its own notification card." },
  { n: "04", title: "Take it with you", body: "Copy the brief out by hand, whenever you like." },
];

/** Feature bar + the workflow, straight from the landing standard. */
export default function NudgeLandingFeatures() {
  return (
    <>
      <section id="product" className="border-y border-[#f0f0f0] bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-7 px-5 py-10 sm:px-8 md:grid-cols-5">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title}>
              <Icon className="h-4 w-4 text-[#666666]" />
              <p className="mt-2.5 text-[12.5px] font-semibold text-black">{title}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#8a8a94]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">The workflow</p>
          <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-black sm:text-[34px]">
            Four steps, no account needed.
          </h2>
          <p className="mt-2 text-[13px] text-[#666666]">
            The whole loop happens in the tab you already have open.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-[#ececec] p-5">
              <span className="bg-gradient-to-r from-[#0000FF] to-[#A020F0] bg-clip-text text-[11px] font-bold tracking-[0.1em] text-transparent">
                {s.n}
              </span>
              <p className="mt-3 text-[13.5px] font-semibold text-black">{s.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#8a8a94]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}