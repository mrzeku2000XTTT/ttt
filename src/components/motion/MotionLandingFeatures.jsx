import React from "react";
import { Wand2, Palette, Code2, Eye, Download, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Wand2,
    title: "Vibe Prompts",
    desc: "Describe your aesthetic in plain English. Motion translates it into pixel-faithful design specs.",
    color: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
  },
  {
    icon: Palette,
    title: "Preset Marketplace",
    desc: "Start from curated vibes: NFT, DeFi, SaaS, Agency, Hospitality, Fitness — and remix from there.",
    color: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
  },
  {
    icon: Code2,
    title: "Production-Ready Code",
    desc: "Get a single self-contained React component with Tailwind, Lucide icons, and inline custom CSS.",
    color: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: Eye,
    title: "Live Preview",
    desc: "See your generated page render in a sandboxed iframe instantly — no copy-paste, no setup.",
    color: "from-pink-500/20 to-pink-500/5",
    iconColor: "text-pink-400",
  },
  {
    icon: Download,
    title: "One-Click Export",
    desc: "Download the JSX file or copy the code straight into your project. Zero vendor lock-in.",
    color: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    icon: Sparkles,
    title: "Powered by Claude",
    desc: "Backed by Claude Sonnet 4.6 for nuanced understanding of typography, layout, and motion.",
    color: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
  },
];

export default function MotionLandingFeatures() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
          Built for designers who code,<br />
          <span className="text-white/40">and coders who design.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className={`group relative p-6 rounded-2xl bg-gradient-to-br ${f.color} border border-white/10 hover:border-white/20 transition-all overflow-hidden`}
            >
              <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 ${f.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-white font-bold text-base mb-1.5">{f.title}</h3>
              <p className="text-white/60 text-[13px] leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}