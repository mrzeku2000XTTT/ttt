import React from "react";
import { Users } from "lucide-react";

export default function AboutCommunity() {
  return (
    <div className="space-y-6 max-w-lg">
      <div className="w-11 h-11 rounded-xl bg-emerald-400/15 flex items-center justify-center">
        <Users className="w-5 h-5 text-emerald-300" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-[200] tracking-tight">Built by the community</h2>
      <p className="text-white/55 text-sm leading-relaxed font-[300]">
        TTT grows through its people. Anyone can propose, build and list apps in the ecosystem — turning ideas into shipped products on Kaspa.
      </p>
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-400/20 p-5">
        <p className="text-white/70 text-sm font-[300] italic">
          "For the community, by the community."
        </p>
      </div>
    </div>
  );
}