import React from "react";
import { Link } from "react-router-dom";

const ORBIT_APPS = [
  { name: "Feed", path: "/Feed", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/759d6a05a_generated_image.png" },
  { name: "Agent ZK", path: "/AgentZK", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png" },
  { name: "StakeDAG", path: "/StakeDAG", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/273ecff83_generated_image.png" },
  { name: "TTTV", path: "/Browser", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/04565f09d_generated_image.png" },
  { name: "Hikaru", path: "/Hikaru", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ede6944ce_generated_image.png" },
  { name: "Bridge", path: "/Bridge", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c45793efd_generated_image.png" },
  { name: "DAGKnight", path: "/DAGKnightWallet", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2ea9d0166_generated_image.png" },
  { name: "App Store", path: "/AppStore", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4b0087a11_generated_image.png" },
  { name: "Zeku AI", path: "/ZekuAI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d6f99bc5e_generated_image.png" },
  { name: "Terra", path: "/Terra", logo: "https://cryptologos.cc/logos/kaspa-kas-logo.png?v=041" },
  { name: "Arcade", path: "/Arcade", logo: "https://pbs.twimg.com/profile_images/1825985565697167360/LJjUp5PY_400x400.jpg" },
  { name: "NFT Mint", path: "/NFTMint", logo: "https://pbs.twimg.com/profile_images/1719654688747167744/rIb_jn2c_400x400.jpg" },
  { name: "Marketplace", path: "/Marketplace", logo: "https://pbs.twimg.com/profile_images/1658547689494286337/wBwyas0P_400x400.jpg" },
  { name: "KA-CHING", path: "/Klock", logo: "https://pbs.twimg.com/profile_images/1795478474100805632/fy0c6gym_400x400.jpg" },
  { name: "Xunhua", path: "/Xunhua", logo: "https://pbs.twimg.com/profile_images/1822717712076460032/a8UMhB8z_400x400.jpg" },
  { name: "Canvas", path: "/Canvas", logo: "https://kasplex.org/assets/png/LOGO1-1-DV2KMDbu.png" },
  { name: "Prompto", path: "/Prompto", logo: "https://www.kasware.xyz/static/media/home-main.6b611fab36e5a2e49994.png" },
  { name: "Courses", path: "/Courses", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/759d6a05a_generated_image.png" },
];

const COUNT = ORBIT_APPS.length;
const DURATION = 45; // seconds for full rotation

export default function OrbitingApps() {
  // Radii for ellipse
  const RX = 220;
  const RY = 75;
  const ICON = 56;

  return (
    <div className="relative mx-auto select-none" style={{ width: RX * 2 + 120, height: RY * 2 + 140 }}>
      {/* CSS animation — one keyframe set, each item offset by angle */}
      <style>{`
        @keyframes orbitPath {
          from { --orbit-angle: 0deg; }
          to   { --orbit-angle: 360deg; }
        }
        .orbit-item {
          animation: orbitPath ${DURATION}s linear infinite;
          position: absolute;
          left: 50%;
          top: 50%;
          will-change: transform, opacity;
        }
        .orbit-item:hover {
          animation-play-state: paused;
        }
        ${ORBIT_APPS.map((_, i) => {
          const offset = (360 / COUNT) * i;
          return `.orbit-item-${i} { animation-delay: ${-(DURATION * offset / 360).toFixed(3)}s; }`;
        }).join('\n')}
      `}</style>

      {/* Subtle ellipse track */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: RX * 2,
          height: RY * 2,
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      />

      {/* Center glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)' }} />

      {ORBIT_APPS.map((app, i) => {
        const baseAngle = (360 / COUNT) * i;
        // We compute transforms in JS but animate via CSS offset
        // Use inline style with calc — CSS custom property approach
        // For broader compat, we'll just use JS-driven inline keyframes per element
        return (
          <OrbitIcon key={app.name} app={app} index={i} baseAngle={baseAngle} rx={RX} ry={RY} iconSize={ICON} duration={DURATION} count={COUNT} />
        );
      })}
    </div>
  );
}

function OrbitIcon({ app, index, baseAngle, rx, ry, iconSize, duration, count }) {
  // Generate a unique keyframe for this icon's path
  const kfName = `orbit_${index}`;
  const steps = 60;
  let keyframes = `@keyframes ${kfName} {\n`;
  for (let s = 0; s <= steps; s++) {
    const pct = (s / steps) * 100;
    const angle = baseAngle + (s / steps) * 360;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * rx;
    const y = Math.sin(rad) * ry;
    const depth = (Math.sin(rad) + 1) / 2; // 0=back, 1=front
    const scale = 0.5 + depth * 0.5;
    const opacity = 0.35 + depth * 0.65;
    const z = Math.round(depth * 100);
    keyframes += `  ${pct.toFixed(2)}% { transform: translate(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px)) scale(${scale.toFixed(3)}); opacity: ${opacity.toFixed(3)}; z-index: ${z}; }\n`;
  }
  keyframes += `}`;

  return (
    <>
      <style>{keyframes}</style>
      <Link
        to={app.path}
        className="absolute left-1/2 top-1/2 group"
        style={{
          animation: `${kfName} ${duration}s linear infinite`,
          willChange: 'transform, opacity',
        }}
      >
        <div className="flex flex-col items-center gap-1">
          <div
            className="rounded-[16px] shadow-md overflow-hidden bg-white ring-1 ring-black/[0.06] group-hover:ring-cyan-400/50 group-hover:shadow-xl group-hover:shadow-cyan-200/30 transition-shadow duration-300"
            style={{ width: iconSize, height: iconSize }}
          >
            <img src={app.logo} alt={app.name} className="w-full h-full object-cover" draggable={false} />
          </div>
          <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-cyan-600 transition-colors truncate max-w-[72px] text-center">
            {app.name}
          </span>
        </div>
      </Link>
    </>
  );
}