import React from "react";
import { Sparkles, Wand2 } from "lucide-react";
import ThumbnailLogo from "./ThumbnailLogo";

export default function ThumbnailHero() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-zinc-950 via-black to-cyan-950/40 p-6 sm:p-10">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-lime-400/10 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <ThumbnailLogo />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Kaspa Super App</p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">TTT Thumbnail Creator</h1>
            </div>
          </div>
          <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            Create bold, scroll-stopping thumbnails for YouTube, TTTV, reels, and creator campaigns using AI inside TTT.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/10"><Sparkles className="h-4 w-4 text-cyan-300" /> AI generated</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/10"><Wand2 className="h-4 w-4 text-lime-300" /> Creator-ready</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {["SHOCKING KASPA MOVE", "I BUILT THIS IN TTT", "THIS CHANGES WEB3", "WATCH BEFORE 2026"].map((text, index) => (
            <div key={text} className={`aspect-video rounded-2xl border border-white/10 bg-gradient-to-br ${index % 2 ? "from-lime-400 via-cyan-400 to-blue-600" : "from-fuchsia-500 via-red-500 to-yellow-400"} p-1 shadow-2xl`}>
              <div className="flex h-full items-end rounded-[0.85rem] bg-black/45 p-3">
                <p className="text-sm font-black leading-none text-white drop-shadow sm:text-lg">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}