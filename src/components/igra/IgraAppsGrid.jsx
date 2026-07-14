import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Lock, ArrowUpRight } from "lucide-react";
import { IGRA_AGENT_LOGO } from "@/components/igra/agent/igraAgentLogo";

// Real apps built inside the Igra Horizon sector
const APPS = [
  {
    name: "IGRA AGENT",
    desc: "AI agents transacting iKAS agent-to-agent via Igra nodes",
    path: "/IgraAgent",
    live: true,
  },
  { name: "FORGE SLOT 02" },
  { name: "FORGE SLOT 03" },
];

const GOLD = "#C9A24B";
const MINT = "#6EE7B7";

export default function IgraAppsGrid() {
  const featured = APPS.find((a) => a.live);
  const upcoming = APPS.filter((a) => !a.live);

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
            {/* Native Igra Agent emblem */}
            <div className="w-24 h-24 flex-shrink-0 relative">
              <div className="absolute -inset-1 rotate-45" style={{ border: `1.5px solid ${GOLD}` }} />
              <img src={IGRA_AGENT_LOGO} alt="Igra Agent"
                className="w-full h-full object-cover rounded-2xl relative"
                style={{ border: "1px solid rgba(201,162,75,0.5)" }} />
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

      {/* Upcoming forge slots — compact chips, no scroll on mobile */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
        {upcoming.map((app) => (
          <div key={app.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ border: "1px solid rgba(201,162,75,0.25)", background: "rgba(8,7,4,0.6)", opacity: 0.75 }}>
            <Lock className="w-3 h-3" style={{ color: "rgba(201,162,75,0.6)" }} strokeWidth={1.5} />
            <span className="text-[8px] font-black tracking-[0.2em] uppercase"
              style={{ color: "rgba(201,162,75,0.8)", fontFamily: "monospace" }}>
              {app.name} · SOON
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}