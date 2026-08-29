import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, ExternalLink } from "lucide-react";
import { createPageUrl } from "@/utils";

// Shared docs hero — app icon, name, tagline, and action buttons.
// Layouts inject their own accent styling around this.
export default function DocsHero({ app, docs, onBack, accent = "zinc" }) {
  const accentMap = {
    zinc: "from-zinc-900 to-zinc-700",
    violet: "from-violet-600 to-fuchsia-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    cyan: "from-cyan-500 to-blue-600",
  };
  const grad = accentMap[accent] || accentMap.zinc;

  const openApp = app.path
    ? createPageUrl(app.path)
    : app.externalUrl;

  return (
    <div className="relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-[0.07]`} />
      <div className="relative px-5 sm:px-8 pt-6 pb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          App Store
        </button>

        <div className="flex items-start gap-4 sm:gap-5">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-lg flex-shrink-0"
          >
            {app.logo ? (
              <img src={app.logo} alt={app.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-2xl font-[900] text-zinc-500">
                {app.name?.[0]?.toUpperCase()}
              </div>
            )}
            {app.premium && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow">
                <Crown className="w-3 h-3 text-yellow-900" />
              </div>
            )}
          </motion.div>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-[900] tracking-tight text-zinc-900 leading-tight">{app.name}</h1>
            <p className="text-sm sm:text-[15px] text-zinc-500 mt-1">{docs.tagline}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600">{app.cat}</span>
              {app.admin && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Admin</span>}
              {app.premium && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">Premium</span>}
            </div>
          </div>

          {openApp && (
            openApp.startsWith("http") ? (
              <a
                href={openApp}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-700 transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                Open App
              </a>
            ) : (
              <button
                onClick={() => { try { localStorage.setItem('came_from_categories', 'true'); } catch {} window.location.href = openApp; }}
                className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-zinc-900 text-white text-[13px] font-semibold hover:bg-zinc-700 transition-colors flex-shrink-0"
              >
                Open App
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}