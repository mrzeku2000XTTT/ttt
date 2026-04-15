import React from "react";
import { Link } from "react-router-dom";

// Logos sourced directly from AppStoreV2 — no duplicates
const ORBIT_APPS = [
  { name: "Feed", path: "/Feed", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/759d6a05a_generated_image.png" },
  { name: "Agent ZK", path: "/AgentZK", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png" },
  { name: "StakeDAG", path: "/StakeDAG", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/273ecff83_generated_image.png" },
  { name: "TTTV", path: "/Browser", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/04565f09d_generated_image.png" },
  { name: "Hikaru", path: "/Hikaru", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/ede6944ce_generated_image.png" },
  { name: "Bridge", path: "/Bridge", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c45793efd_generated_image.png" },
  { name: "DAGKnight", path: "/DAGKnightWallet", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/2ea9d0166_generated_image.png" },
  { name: "App Store", path: "/AppStoreV2", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/4b0087a11_generated_image.png" },
  { name: "Zeku AI", path: "/ZekuAI", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d6f99bc5e_generated_image.png" },
  { name: "Xùnhuà", path: "/Xunhua", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/21e345685_9541BAAA-657B-4CEB-8046-05643663293C.png" },
  { name: "Terra", path: "/Terra", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/46832045f_IMG_1195.jpg" },
  { name: "Prompto", path: "/Prompto", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/073d22c9d_generated_image.png" },
  { name: "Canvas", path: "/Canvas", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/b26fd671d_generated_image.png" },
  { name: "Freedom", path: "/Freedom", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/c93b4796d_generated_image.png" },
  { name: "Kurve", path: "/Kurve", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/7be912bf3_image.png" },
  { name: "Area 51", path: "/Area51", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/63bd53d0e_generated_image.png" },
  { name: "VAULT", path: "/Vault", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/08768f52c_generated_image.png" },
  { name: "Voxa", path: "/Voxa", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/bab833b9c_generated_image.png" },
  { name: "Speed", path: "/Speed", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/078ebbdaf_generated_image.png" },
  { name: "CineKas", path: "/Cinekas", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/e33356a93_generated_image.png" },
  { name: "Klock", path: "/Klock", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3a8b4c791_generated_image.png" },
  { name: "Security", path: "/SecurityAudit", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/81791a703_generated_image.png" },
  { name: "KaShop", path: "/KaShop", logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/00f7c1aac_image.png" },
  { name: "Farlands", path: "/Farlands", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/869680b72_IMG_0177.jpeg" },
];

const COUNT = ORBIT_APPS.length;
const DURATION = 60; // seconds for full rotation — slower = smoother
const RX_DESKTOP = 240;
const RY_DESKTOP = 85;
const RX_MOBILE = 140;
const RY_MOBILE = 55;
const ICON_DESKTOP = 56;
const ICON_MOBILE = 44;

// Build all keyframes as a single style block at module level
function buildKeyframes() {
  const steps = 120; // more steps = smoother
  let css = '';
  for (let idx = 0; idx < COUNT; idx++) {
    const baseAngle = (360 / COUNT) * idx;
    // Desktop
    css += `@keyframes orb_d_${idx} {\n`;
    for (let s = 0; s <= steps; s++) {
      const pct = ((s / steps) * 100).toFixed(2);
      const angle = baseAngle + (s / steps) * 360;
      const rad = (angle * Math.PI) / 180;
      const x = Math.cos(rad) * RX_DESKTOP;
      const y = Math.sin(rad) * RY_DESKTOP;
      const depth = (Math.sin(rad) + 1) / 2;
      const scale = 0.45 + depth * 0.55;
      const opacity = 0.3 + depth * 0.7;
      css += `${pct}%{transform:translate(calc(-50% + ${x.toFixed(1)}px),calc(-50% + ${y.toFixed(1)}px)) scale(${scale.toFixed(3)});opacity:${opacity.toFixed(3)};z-index:${Math.round(depth * 100)}}\n`;
    }
    css += '}\n';
    // Mobile
    css += `@keyframes orb_m_${idx} {\n`;
    for (let s = 0; s <= steps; s++) {
      const pct = ((s / steps) * 100).toFixed(2);
      const angle = baseAngle + (s / steps) * 360;
      const rad = (angle * Math.PI) / 180;
      const x = Math.cos(rad) * RX_MOBILE;
      const y = Math.sin(rad) * RY_MOBILE;
      const depth = (Math.sin(rad) + 1) / 2;
      const scale = 0.4 + depth * 0.6;
      const opacity = 0.25 + depth * 0.75;
      css += `${pct}%{transform:translate(calc(-50% + ${x.toFixed(1)}px),calc(-50% + ${y.toFixed(1)}px)) scale(${scale.toFixed(3)});opacity:${opacity.toFixed(3)};z-index:${Math.round(depth * 100)}}\n`;
    }
    css += '}\n';
  }
  return css;
}

const KEYFRAMES_CSS = buildKeyframes();

export default function OrbitingApps() {
  return (
    <div className="relative mx-auto select-none" style={{ width: '100%', maxWidth: RX_DESKTOP * 2 + 120, height: RY_DESKTOP * 2 + 140 }}>
      <style>{KEYFRAMES_CSS}</style>
      <style>{`
        .orbit-ring {
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.05);
          pointer-events: none;
        }
        .orbit-icon {
          position: absolute;
          left: 50%; top: 50%;
          will-change: transform, opacity;
        }
        .orbit-icon:hover {
          animation-play-state: paused !important;
        }
        @media (max-width: 639px) {
          .orbit-container { height: ${RY_MOBILE * 2 + 120}px !important; }
          .orbit-ring { width: ${RX_MOBILE * 2}px !important; height: ${RY_MOBILE * 2}px !important; }
        }
      `}</style>

      {/* Ellipse track */}
      <div className="orbit-ring hidden sm:block" style={{ width: RX_DESKTOP * 2, height: RY_DESKTOP * 2 }} />
      <div className="orbit-ring sm:hidden" style={{ width: RX_MOBILE * 2, height: RY_MOBILE * 2 }} />

      {/* Center glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)' }} />

      {ORBIT_APPS.map((app, i) => (
        <Link
          key={app.name}
          to={app.path}
          className="orbit-icon group"
          style={{
            animation: `orb_d_${i} ${DURATION}s linear infinite`,
          }}
        >
          {/* Mobile override via media query */}
          <style>{`
            @media (max-width: 639px) {
              .orbit-icon-${i} { animation-name: orb_m_${i} !important; }
            }
          `}</style>
          <div className={`orbit-icon-${i} flex flex-col items-center gap-1`} style={{ animation: 'inherit' }}>
            <div
              className="rounded-[16px] overflow-hidden bg-white ring-1 ring-black/[0.06] group-hover:ring-cyan-400/50 transition-shadow duration-300"
              style={{
                width: ICON_DESKTOP,
                height: ICON_DESKTOP,
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}
            >
              <img src={app.logo} alt={app.name} className="w-full h-full object-cover" draggable={false} loading="lazy" />
            </div>
            <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-cyan-600 transition-colors truncate max-w-[68px] text-center leading-tight">
              {app.name}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}