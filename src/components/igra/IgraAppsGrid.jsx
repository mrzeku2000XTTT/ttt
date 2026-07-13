import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, Lock, ArrowUpRight } from "lucide-react";

// Real apps built inside the Igra Horizon sector
const APPS = [
  {
    name: "IGRA AGENT",
    desc: "AI agents transacting iKAS agent-to-agent via Igra nodes",
    icon: Zap,
    path: "/IgraAgent",
    live: true,
  },
  { name: "FORGE SLOT 02", desc: "Next app being forged on Igra", icon: Lock },
  { name: "FORGE SLOT 03", desc: "Next app being forged on Igra", icon: Lock },
];

const GOLD = "#C9A24B";
const MINT = "#6EE7B7";

export default function IgraAppsGrid() {
  const featured = APPS.find((a) => a.live);
  const upcoming = APPS.filter((a) => !a.live);
  const FeaturedIcon = featured.icon;

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-3 mb-4 text-[10px] tracking-[0.4em] uppercase"
        style={{ color: GOLD, fontFamily: "monospace" }}>
        <span className="w-8 border-t border-dotted" style={{ borderColor: "rgba(201,162,75,0.5)" }} />
        APPS FORGED ON IGRA
        <span className="flex-1 border-t border-dotted" style={{ borderColor: "rgba(201,162,75,0.3)" }} />
      </div>

      {/* Featured live app — full width */}
      <Link to={featured.path} className="block">
        <motion.div whileHover={{ scale: 1.01, y: -2 }}
          className="rounded-2xl p-6 relative"
          style={{ border: "1px solid rgba(201,162,75,0.45)", background: "rgba(8,7,4,0.8)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", cursor: "pointer" }}>
          <div className="absolute top-5 right-5 flex items-center gap-1 text-[10px] font-bold tracking-[0.25em] uppercase"
            style={{ color: MINT, fontFamily: "monospace" }}>
            VIEW APP <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-6 flex-col sm:flex-row">
            {/* Gold line-art emblem */}
            <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center relative">
              <div className="absolute inset-0 rotate-45" style={{ border: `1.5px solid ${GOLD}` }} />
              <div className="absolute inset-2.5 rotate-45" style={{ border: `1px solid rgba(201,162,75,0.5)` }} />
              <FeaturedIcon className="w-9 h-9 relative" style={{ color: "#E5C567" }} strokeWidth={1.5} />
            </div>
            <div className="text-center sm:text-left">
              <div className="text-xl sm:text-2xl font-black tracking-[0.15em] uppercase text-white"
                style={{ fontFamily: "monospace" }}>
                {featured.name}
              </div>
              <div className="mt-2 text-[11px] leading-relaxed" style={{ color: "#D9C9A3", fontFamily: "monospace" }}>
                {featured.desc}
              </div>
            </div>
          </div>
        </motion.div>
      </Link>

      {/* Upcoming forge slots */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        {upcoming.map((app) => {
          const Icon = app.icon;
          return (
            <div key={app.name} className="rounded-2xl p-4"
              style={{ border: "1px solid rgba(201,162,75,0.2)", background: "rgba(8,7,4,0.6)",
                backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", opacity: 0.7 }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ border: "1px solid rgba(201,162,75,0.35)" }}>
                  <Icon className="w-4 h-4" style={{ color: "rgba(201,162,75,0.6)" }} strokeWidth={1.5} />
                </div>
                <span className="text-[7px] tracking-[0.25em] uppercase px-2.5 py-1 rounded-full"
                  style={{ border: "1px solid rgba(201,162,75,0.3)", color: "rgba(201,162,75,0.6)", fontFamily: "monospace" }}>
                  SOON
                </span>
              </div>
              <div className="text-[11px] font-black tracking-[0.2em] uppercase"
                style={{ color: "rgba(201,162,75,0.8)", fontFamily: "monospace" }}>
                {app.name}
              </div>
              <div className="mt-1.5 text-[9px] leading-relaxed"
                style={{ color: "rgba(217,201,163,0.6)", fontFamily: "monospace" }}>
                {app.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}