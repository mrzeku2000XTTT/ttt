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

export default function IgraAppsGrid() {
  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center gap-3 mb-4 text-[10px] tracking-[0.45em] uppercase"
        style={{ color: "rgba(255,180,120,0.6)", fontFamily: "monospace" }}>
        <span className="w-8 h-px" style={{ background: "rgba(255,180,120,0.3)" }} />
        APPS FORGED ON IGRA
        <span className="flex-1 h-px" style={{ background: "rgba(255,180,120,0.15)" }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {APPS.map((app, i) => {
          const Icon = app.icon;
          const card = (
            <motion.div key={app.name} whileHover={app.live ? { scale: 1.03, y: -3 } : {}}
              className="rounded-2xl p-4 h-full"
              style={{
                border: `1px solid ${app.live ? "rgba(249,115,22,0.35)" : "rgba(255,140,90,0.12)"}`,
                background: app.live ? "rgba(40,16,4,0.6)" : "rgba(24,10,6,0.4)",
                backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                boxShadow: app.live ? "0 0 30px rgba(249,115,22,0.12), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
                opacity: app.live ? 1 : 0.55, cursor: app.live ? "pointer" : "default",
              }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(249,115,22,0.14)", border: "1px solid rgba(249,115,22,0.25)" }}>
                  <Icon className="w-4 h-4" style={{ color: app.live ? "#fb923c" : "rgba(255,170,120,0.4)" }} />
                </div>
                {app.live
                  ? <ArrowUpRight className="w-4 h-4" style={{ color: "rgba(255,180,120,0.6)" }} />
                  : <span className="text-[7px] tracking-[0.25em] uppercase px-2 py-0.5 rounded-full"
                      style={{ border: "1px solid rgba(255,140,90,0.2)", color: "rgba(255,180,130,0.4)", fontFamily: "monospace" }}>
                      SOON
                    </span>}
              </div>
              <div className="text-[11px] font-black tracking-[0.2em] uppercase"
                style={{ color: app.live ? "#fdba74" : "rgba(255,190,150,0.45)", fontFamily: "monospace" }}>
                {app.name}
              </div>
              <div className="mt-1.5 text-[9px] leading-relaxed"
                style={{ color: "rgba(235,180,140,0.5)", fontFamily: "monospace" }}>
                {app.desc}
              </div>
            </motion.div>
          );
          return app.live
            ? <Link key={app.name} to={app.path} className="block">{card}</Link>
            : <div key={app.name}>{card}</div>;
        })}
      </div>
    </div>
  );
}