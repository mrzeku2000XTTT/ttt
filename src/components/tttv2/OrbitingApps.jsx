import React from "react";
import { Link } from "react-router-dom";

const FEATURED_APPS = [
  { name: "Feed", path: "/Feed", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/759d6a05a_generated_image.png" },
  { name: "Agent ZK", path: "/AgentZK", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png" },
  { name: "StakeDAG", path: "/StakeDAG", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/273ecff83_generated_image.png" },
  { name: "TTTV", path: "/Browser", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/04565f09d_generated_image.png" },
  { name: "Hikaru", path: "/Hikaru", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ede6944ce_generated_image.png" },
  { name: "Bridge", path: "/Bridge", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c45793efd_generated_image.png" },
  { name: "DAGKnight", path: "/DAGKnightWallet", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2ea9d0166_generated_image.png" },
  { name: "App Store", path: "/AppStore", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4b0087a11_generated_image.png" },
  { name: "Zeku AI", path: "/ZekuAI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d6f99bc5e_generated_image.png" },
  { name: "Terra", path: "/Terra", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/273ecff83_generated_image.png" },
  { name: "Arcade", path: "/Arcade", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/04565f09d_generated_image.png" },
  { name: "NFT Mint", path: "/NFTMint", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ede6944ce_generated_image.png" },
];

export default function OrbitingApps() {
  const count = FEATURED_APPS.length;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const radius = isMobile ? 120 : 200;
  const iconSize = isMobile ? 48 : 64;

  return (
    <div className="relative mx-auto" style={{ width: radius * 2 + 100, height: radius * 2 + 100 }}>
      {/* Subtle circle track */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/40"
        style={{ width: radius * 2, height: radius * 2 }}
      />

      {/* Center glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-radial from-cyan-200/30 via-transparent to-transparent rounded-full blur-2xl" />

      {FEATURED_APPS.map((app, i) => {
        const theta = ((360 / count) * i - 90) * (Math.PI / 180);
        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius;

        return (
          <Link
            key={app.name}
            to={app.path}
            className="absolute group"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          >
            <div className="flex flex-col items-center gap-1 transition-transform duration-200 group-hover:scale-110">
              <div
                className="rounded-[18px] shadow-lg overflow-hidden bg-white ring-1 ring-zinc-200/60 transition-shadow duration-200 group-hover:shadow-[0_8px_30px_rgba(6,182,212,0.3),0_0_0_2px_rgba(6,182,212,0.4)]"
                style={{ width: iconSize, height: iconSize }}
              >
                <img
                  src={app.logo}
                  alt={app.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 truncate max-w-[72px] text-center group-hover:text-cyan-600 transition-colors">
                {app.name}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}