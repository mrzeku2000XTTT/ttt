import React from "react";
import { Link } from "react-router-dom";

const APPS = [
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
  { name: "Area 51", path: "/Area51", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/63bd53d0e_generated_image.png" },
  { name: "VAULT", path: "/Vault", logo: "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/08768f52c_generated_image.png" },
];

const N = APPS.length;
const DUR = 50; // seconds per full revolution

// Two-row marquee approach — ultra lightweight, no per-item keyframes
// Row 1: first half, Row 2: second half, opposite directions
const ROW1 = APPS.slice(0, Math.ceil(N / 2));
const ROW2 = APPS.slice(Math.ceil(N / 2));

function MarqueeRow({ apps, reverse = false }) {
  // Triple the items for seamless loop
  const tripled = [...apps, ...apps, ...apps];
  return (
    <div className="relative overflow-hidden w-full">
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-[#F5F5F7] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-[#F5F5F7] to-transparent z-10 pointer-events-none" />
      <div
        className="flex items-center gap-5 sm:gap-7 w-max"
        style={{
          animation: `marquee-${reverse ? 'r' : 'l'} ${DUR}s linear infinite`,
        }}
      >
        {tripled.map((app, i) => (
          <Link key={`${app.name}-${i}`} to={app.path} className="flex-shrink-0 group">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] overflow-hidden bg-white shadow-md ring-1 ring-black/[0.06] group-hover:shadow-lg group-hover:ring-cyan-400/40 group-hover:scale-110 transition-all duration-300">
                <img src={app.logo} alt={app.name} className="w-full h-full object-cover" draggable={false} loading="lazy" />
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-zinc-500 group-hover:text-zinc-900 transition-colors truncate max-w-[72px] text-center">
                {app.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function OrbitingApps() {
  return (
    <div className="space-y-5 -mx-5">
      <style>{`
        @keyframes marquee-l {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes marquee-r {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }
      `}</style>
      <MarqueeRow apps={ROW1} />
      <MarqueeRow apps={ROW2} reverse />
    </div>
  );
}