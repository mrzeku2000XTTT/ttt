import React from "react";
import { Rocket } from "lucide-react";

export default function AboutMission() {
  return (
    <div className="space-y-6 max-w-lg">
      <div className="w-11 h-11 rounded-xl bg-emerald-400/15 flex items-center justify-center">
        <Rocket className="w-5 h-5 text-emerald-300" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-[200] tracking-tight">Our mission</h2>
      <p className="text-white/55 text-sm leading-relaxed font-[300]">
        Make the Kaspa ecosystem usable by everyone — not just developers. We turn the fastest proof-of-work network into apps people actually use every day.
      </p>
      <div className="space-y-3 pt-2">
        {[
          "Simple. Anyone can use it, no wallet jargon.",
          "Fast. Real-time settlement on Kaspa.",
          "Open. Built by and for the community.",
        ].map((t) => (
          <div key={t} className="flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <p className="text-white/60 text-sm font-[300]">{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}