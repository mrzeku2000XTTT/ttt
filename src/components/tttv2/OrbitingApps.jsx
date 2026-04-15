import React, { useState, useEffect } from "react";
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
  const [angle, setAngle] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  useEffect(() => {
    let frame;
    let lastTime = performance.now();
    const speed = 0.3; // degrees per frame (~18 deg/sec)

    const animate = (now) => {
      const delta = now - lastTime;
      lastTime = now;
      if (hoveredIdx < 0) {
        setAngle(prev => (prev + speed * (delta / 16)) % 360);
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [hoveredIdx]);

  const count = FEATURED_APPS.length;
  // Ellipse radii — wider horizontally, compressed vertically for 3D tilt
  const radiusX = typeof window !== 'undefined' && window.innerWidth < 640 ? 130 : 220;
  const radiusY = typeof window !== 'undefined' && window.innerWidth < 640 ? 50 : 80;

  return (
    <div className="relative mx-auto" style={{ width: radiusX * 2 + 100, height: radiusY * 2 + 120 }}>
      {/* Subtle ellipse track */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200/40"
        style={{ width: radiusX * 2, height: radiusY * 2 }}
      />

      {/* Center glow */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-radial from-cyan-200/30 via-transparent to-transparent rounded-full blur-2xl" />

      {FEATURED_APPS.map((app, i) => {
        const theta = ((360 / count) * i + angle) * (Math.PI / 180);
        const x = Math.cos(theta) * radiusX;
        const y = Math.sin(theta) * radiusY;

        // Scale based on vertical position to simulate 3D depth
        // Items at the "back" (top, y < 0) are smaller; "front" (bottom, y > 0) are larger
        const depthFactor = (Math.sin(theta) + 1) / 2; // 0 = back, 1 = front
        const scale = 0.55 + depthFactor * 0.55;
        const opacity = 0.4 + depthFactor * 0.6;
        const zIndex = Math.round(depthFactor * 100);
        const isHovered = hoveredIdx === i;
        const iconSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 48 : 64;

        return (
          <Link
            key={app.name}
            to={app.path}
            className="absolute"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: `translate(-50%, -50%) scale(${isHovered ? scale * 1.2 : scale})`,
              zIndex: isHovered ? 200 : zIndex,
              opacity: isHovered ? 1 : opacity,
              transition: 'transform 0.3s ease, opacity 0.3s ease',
            }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(-1)}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className="rounded-[18px] shadow-lg overflow-hidden bg-white ring-1 ring-zinc-200/60"
                style={{
                  width: iconSize,
                  height: iconSize,
                  boxShadow: isHovered
                    ? '0 8px 30px rgba(6,182,212,0.3), 0 0 0 2px rgba(6,182,212,0.4)'
                    : `0 ${4 + depthFactor * 8}px ${8 + depthFactor * 16}px rgba(0,0,0,${0.05 + depthFactor * 0.1})`,
                }}
              >
                <img
                  src={app.logo}
                  alt={app.name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
              <span
                className="text-[10px] font-semibold text-zinc-500 truncate max-w-[72px] text-center transition-colors"
                style={{
                  opacity: depthFactor > 0.3 ? 1 : 0,
                  color: isHovered ? '#0891b2' : undefined,
                }}
              >
                {app.name}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}