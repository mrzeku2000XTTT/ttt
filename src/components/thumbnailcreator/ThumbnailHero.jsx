import React from "react";
import { Sparkles, Wand2 } from "lucide-react";
import ThumbnailLogo from "./ThumbnailLogo";

export default function ThumbnailHero() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 p-6 sm:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.08),transparent_32%),linear-gradient(135deg,rgba(39,39,42,0.95),rgba(0,0,0,1))]" />
      <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <ThumbnailLogo />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-zinc-400">YouTube Thumbnail Studio</p>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">Real Thumbnail Creator</h1>
            </div>
          </div>
          <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            Generate realistic creator faces, avatars, characters, and polished YouTube-style thumbnails without the generic neon crypto look.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/10"><Sparkles className="h-4 w-4 text-white" /> Any face or avatar</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/10"><Wand2 className="h-4 w-4 text-white" /> Real YouTube editing</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {["I TRIED THIS", "DON'T MISS THIS", "HUGE RESULT", "BEFORE YOU CLICK"].map((text, index) => (
            <div key={text} className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl">
              <div className={`absolute inset-0 ${index % 2 ? "bg-gradient-to-br from-amber-200 via-zinc-200 to-zinc-700" : "bg-gradient-to-br from-sky-100 via-zinc-300 to-stone-900"}`} />
              <div className="absolute right-2 top-3 h-16 w-16 rounded-full bg-zinc-950/80 ring-4 ring-white/80 sm:h-20 sm:w-20" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-10">
                <p className="text-sm font-black leading-none text-white drop-shadow sm:text-lg">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}