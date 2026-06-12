import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, ExternalLink, Play, Film, Tv, Zap } from "lucide-react";

const NEPU_URL = "https://nepu.to/";
const LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/5f2c1cefa_generated_image.png";

const FEATURES = [
  { icon: Film, label: "Movies", desc: "Huge library of films" },
  { icon: Tv, label: "TV Shows", desc: "Full series, all seasons" },
  { icon: Zap, label: "No Signup", desc: "Stream instantly, free" },
];

export default function NEPUPage() {
  return (
    <div className="fixed inset-0 bg-black overflow-y-auto">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=2000&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-red-950/20 to-black/90" />

      {/* Back button */}
      <Link
        to={createPageUrl("AppStoreV2")}
        className="absolute z-50 flex items-center gap-2 px-4 py-3 bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/20 rounded-xl text-white text-sm font-medium transition-all"
        style={{ 
          top: 'calc(1rem + env(safe-area-inset-top, 0px))',
          left: 'calc(0.5rem + env(safe-area-inset-left, 0px))',
          touchAction: 'manipulation',
          minHeight: '44px'
        }}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      {/* Content */}
      <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full text-center">
          {/* Logo */}
          <img
            src={LOGO}
            alt="NEPU"
            className="w-24 h-24 mx-auto mb-6 rounded-3xl shadow-2xl shadow-red-500/30"
          />

          <h1 className="text-5xl sm:text-6xl font-black text-white mb-2 tracking-widest">
            NEPU
          </h1>
          <p className="text-red-400 font-bold mb-2 tracking-widest uppercase text-xs">
            Free TV Shows & Movies
          </p>
          <p className="text-white/50 text-sm mb-10 px-4">
            Stream thousands of movies and TV series for free. No account, no
            ads walls — just hit play.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex flex-col items-center gap-1 p-3 bg-white/5 border border-white/10 rounded-xl"
                >
                  <Icon className="w-5 h-5 text-red-400" />
                  <div className="text-white text-xs font-bold">{f.label}</div>
                  <div className="text-white/40 text-[10px]">{f.desc}</div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <a
            href={NEPU_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-lg rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 tracking-widest"
          >
            <Play className="w-5 h-5 fill-white" />
            OPEN NEPU
            <ExternalLink className="w-4 h-4 opacity-70" />
          </a>
          <p className="text-white/30 text-[10px] mt-3">
            Opens nepu.to in a new tab
          </p>
        </div>
      </div>
    </div>
  );
}