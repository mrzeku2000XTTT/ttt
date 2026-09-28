import React from "react";
import { Sparkles, Bell, MapPin, AlertTriangle, Clock3, Layers, ArrowRight } from "lucide-react";
import { SAMPLE_BRIEF } from "./nudgeSample";

const n = (i) => SAMPLE_BRIEF.notifications[i];

const CARDS = [
  { Icon: Layers, title: "The headline", body: "One line that says how the day is shaped before you read a word of it.", value: SAMPLE_BRIEF.headline },
  { Icon: Bell, title: "Up next", body: "The very next thing, stated flatly, with the real time in the corner.", value: `${n(0).time} · ${n(0).title}` },
  { Icon: MapPin, title: "The heads-up", body: "Travel and prep pulled out of the schedule before it becomes a problem.", value: n(1).body },
  { Icon: AlertTriangle, title: "The clash", body: "Only raised when the schedule really overlaps. Never invented.", value: "Nothing clashes today." },
  { Icon: Clock3, title: "Real timestamps", body: "Every card carries the time from your own schedule, not a round number.", value: n(5).time },
  { Icon: Sparkles, title: "The detail line", body: "Tap a card and the context opens underneath it.", value: n(5).detail },
];

/** What it produces — a card per capability, each with a real value from the run. */
export default function NudgeLandingExtracts({ onDrop }) {
  return (
    <section id="extracts" className="border-t border-[#f0f0f0] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a3a3a3]">What it produces</p>
          <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-black sm:text-[34px]">
            Every part of a notification, in your own words.
          </h2>
          <p className="mt-2 text-[13px] text-[#666666]">Values below come from one real run of the app.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map(({ Icon, title, body, value }) => (
            <div key={title} className="flex flex-col rounded-2xl border border-[#ececec] p-5">
              <Icon className="h-4 w-4 text-[#666666]" />
              <p className="mt-3 text-[13.5px] font-semibold text-black">{title}</p>
              <p className="mt-1 flex-1 text-[12px] leading-relaxed text-[#8a8a94]">{body}</p>
              <p className="mt-4 truncate rounded-lg bg-[#f7f7f9] px-3 py-2 text-[11.5px] text-[#4b5563]">{value}</p>
            </div>
          ))}

          {/* the last cell is the dark CTA box */}
          <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#0a0a14] via-[#141034] to-[#2a0f45] p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">NUDGE</p>
              <p className="mt-3 text-[15px] font-semibold leading-snug text-white">
                Your calendar, as notifications.
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/60">
                Nothing saved but in this browser. A screenshot is sent privately, only when you ask.
              </p>
            </div>
            <button
              onClick={onDrop}
              className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-white text-[12.5px] font-semibold text-[#0a0a14] transition-opacity hover:opacity-90"
            >
              Turn into notifications <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}