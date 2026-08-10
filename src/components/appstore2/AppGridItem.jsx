import React, { useState } from "react";
import { motion } from "framer-motion";
import { Crown, ExternalLink } from "lucide-react";

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.85 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 380, damping: 26 } },
};

function AppIcon({ app, hovered }) {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (hovered) {
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [hovered]);

  if (app.logo) {
    return (
      <div className="relative w-full h-full">
        <img src={app.logo} alt={app.name} className="absolute inset-0 w-full h-full object-cover rounded-2xl" loading="lazy" />
        {app.video && (
          <video
            ref={videoRef}
            src={app.video}
            muted
            loop
            playsInline
            preload="none"
            className={`absolute inset-0 w-full h-full object-cover rounded-2xl transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
          />
        )}
      </div>
    );
  }
  return (
    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 flex items-center justify-center">
      <span className="text-xl font-[900] text-zinc-500">{app.name[0]}</span>
    </div>
  );
}

/**
 * A single app tile. Stable component identity (defined at module scope) so it
 * never remounts mid-tap, and the icon does not animate while being pressed —
 * both of which used to swallow taps on mobile.
 */
export default function AppGridItem({ app }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={itemVariants}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center gap-1.5 cursor-pointer group transition-transform duration-200 hover:-translate-y-1 active:scale-95"
    >
      <div className="relative w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-xl transition-shadow">
        <AppIcon app={app} hovered={hovered} />
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/30 via-transparent to-transparent" />
        {app.premium && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-sm">
            <Crown className="w-2.5 h-2.5 text-yellow-900" />
          </div>
        )}
        {app.community && !app.review && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center shadow-sm" title="Community submission">
            <ExternalLink className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {app.review && (
          <div className="absolute -top-0.5 -right-0.5 px-1 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm" title="In Review">
            <span className="text-[7px] font-bold text-amber-900 uppercase">Review</span>
          </div>
        )}
      </div>
      <div className="text-center max-w-[72px]">
        <p className="text-[11px] font-semibold text-zinc-800 truncate leading-tight group-hover:text-zinc-950 transition-colors">{app.name}</p>
        <p className="text-[9px] text-zinc-400 truncate">{app.desc}</p>
      </div>
    </motion.div>
  );
}