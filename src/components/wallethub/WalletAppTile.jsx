import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";

export default function WalletAppTile({ app, index }) {
  return (
    <Link
      to={createPageUrl(app.path)}
      onClick={() => { try { localStorage.setItem('came_from_categories', 'true'); } catch {} }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.04, type: "spring", stiffness: 320, damping: 24 }}
        whileHover={{ y: -6, scale: 1.04 }}
        whileTap={{ scale: 0.95 }}
        className="group flex flex-col items-center gap-2 cursor-pointer"
      >
        <div className="relative w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-[20px] overflow-hidden shadow-lg shadow-black/40 ring-1 ring-white/10 group-hover:ring-emerald-400/40 transition-all">
          <img src={app.logo} alt={app.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/25 via-transparent to-transparent" />
          {app.premium && (
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow">
              <Crown className="w-2.5 h-2.5 text-yellow-900" />
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-[12px] font-semibold text-white/90 leading-tight">{app.name}</p>
          <p className="text-[9px] text-white/35">{app.desc}</p>
        </div>
      </motion.div>
    </Link>
  );
}