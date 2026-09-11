import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// One app card in the Portal grids
function PortalAppCard({ app, index }) {
  const navigate = useNavigate();
  const open = () => {
    if (app.externalUrl) window.open(app.externalUrl, "_blank", "noopener noreferrer");
    else if (app.path) navigate(`/${app.path}`);
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.4) }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={open}
      className="flex items-center gap-3.5 p-3.5 rounded-2xl text-left w-full"
      style={{
        background: "rgba(18,18,22,0.55)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
      }}
    >
      <div
        className="w-12 h-12 rounded-[14px] overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {app.logo ? (
          <img src={app.logo} alt={app.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <span className="text-white/40 text-sm font-bold">{app.name[0]}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-white text-sm font-semibold truncate">{app.name}</div>
        <div className="text-white/40 text-xs mt-0.5 truncate">{app.desc}</div>
      </div>
      <span className="text-white/20 text-sm flex-shrink-0">→</span>
    </motion.button>
  );
}

// Full-screen scrollable collection of apps shown over the void video
export default function PortalAppGrid({ title, subtitle, apps, onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col min-h-0"
    >
      {/* Dim the void behind the grid */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      <div className="relative z-10 flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 sm:px-8 py-4 border-b border-white/[0.06] flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 h-10 pl-2 pr-4 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
          >
            <span className="text-lg">‹</span> Portal
          </button>
          <div className="min-w-0">
            <div className="text-white font-bold text-lg tracking-tight truncate">{title}</div>
            <div className="text-white/35 text-[11px]">
              {subtitle} · {apps.length} apps
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 min-h-0">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-10">
            {apps.map((app, i) => (
              <PortalAppCard key={app.name} app={app} index={i} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}