import React from "react";
import { PencilLine, SearchCheck, ShieldCheck, ImageIcon } from "lucide-react";

const STEPS = [
  { icon: PencilLine, title: "Describe", text: "Drop a rough idea or pick from 1000+ presets." },
  { icon: SearchCheck, title: "Enhance", text: "We research and rewrite it into a pro-grade prompt." },
  { icon: ShieldCheck, title: "Review", text: "Triple agent checks catch continuity & quality issues." },
  { icon: ImageIcon, title: "Generate", text: "Get a clean 16:9 studio sheet + motion cut prompt." },
];

export default function StoryboardSteps({ isDark = false }) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">How it works</h2>
        <span className={`text-xs font-bold uppercase tracking-[0.2em] ${isDark ? "text-white/45" : "text-zinc-500"}`}>4 simple steps</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <div
            key={title}
            className={`rounded-2xl border p-5 backdrop-blur-xl transition ${
              isDark ? "border-white/10 bg-white/[0.05] shadow-2xl shadow-black/30" : "border-zinc-200 bg-white shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isDark ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-900"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-3xl font-black ${isDark ? "text-white/10" : "text-zinc-200"}`}>{i + 1}</span>
            </div>
            <h3 className="mt-4 text-lg font-black">{title}</h3>
            <p className={`mt-1 text-sm leading-6 ${isDark ? "text-white/55" : "text-zinc-600"}`}>{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}