import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ExternalLink, MapPin } from "lucide-react";
import { NATIONS } from "@/components/kaspanations/nations";

export default function NationsGrid() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {NATIONS.map((n, i) => (
        <motion.div
          key={n.name}
          onClick={() => { if (n.live) navigate(`/KaspaNations/${n.slug}`); }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 + i * 0.1 }}
          whileHover={n.live ? { scale: 1.03, y: -3 } : {}}
          className={`relative p-4 flex flex-col gap-2 ${n.live ? "cursor-pointer sm:col-span-2 lg:col-span-3" : "cursor-default opacity-50"}`}
          style={{
            border: n.live ? "1px solid rgba(80,255,180,0.45)" : "1px solid rgba(80,255,180,0.15)",
            background: n.live ? "rgba(0,20,12,0.75)" : "rgba(0,12,8,0.55)",
            backdropFilter: "blur(10px)",
            boxShadow: n.live ? "0 0 40px rgba(60,230,160,0.15)" : "none",
          }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={n.live ? "text-3xl" : "text-xl"}>{n.flag}</span>
              <div>
                <div className={`font-black tracking-[0.2em] ${n.live ? "text-lg" : "text-xs"}`}
                  style={{ color: n.live ? "#7dffce" : "rgba(125,255,206,0.5)", fontFamily: "monospace" }}>
                  {n.name}
                </div>
                <div className="text-[9px] tracking-[0.35em] uppercase flex items-center gap-1"
                  style={{ color: "rgba(120,220,180,0.5)", fontFamily: "monospace" }}>
                  <MapPin className="w-2.5 h-2.5" /> {n.country}
                </div>
              </div>
            </div>
            {n.live ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.25em] px-2 py-1"
                  style={{ color: "#4ade80", border: "1px solid rgba(74,222,128,0.4)", fontFamily: "monospace" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> LIVE
                </span>
                <ExternalLink className="w-4 h-4" style={{ color: "rgba(125,255,206,0.7)" }} />
              </div>
            ) : (
              <span className="text-[8px] tracking-[0.3em] uppercase px-2 py-1"
                style={{ color: "rgba(120,220,180,0.35)", border: "1px solid rgba(80,255,180,0.12)", fontFamily: "monospace" }}>
                SOON
              </span>
            )}
          </div>
          {n.live && (
            <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "rgba(160,240,210,0.6)", fontFamily: "monospace" }}>
              {n.tagline}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}