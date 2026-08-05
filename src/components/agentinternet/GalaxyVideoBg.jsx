import React, { useState, useEffect, useRef } from "react";

/**
 * GalaxyVideoBg — crossfades through 5 space/galaxy videos as a full-bleed background.
 * Videos play muted, loop, and rotate every ~12s with a 1.5s crossfade.
 */
const VIDEO_URLS = [
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_030111_a9e15665-d379-4a7f-8116-695bbe452ad1.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260429_171347_f640c30d-ec21-426a-98bc-77e07c2c60cb.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4',
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_115655_b4d9cd77-feed-43cd-a198-af78ebdf1f7a.mp4'
];

const ROTATION_MS = 12000;

export default function GalaxyVideoBg() {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(() => VIDEO_URLS.map(() => false));
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % VIDEO_URLS.length);
    }, ROTATION_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  const markLoaded = (idx) => setLoaded((prev) => {
    if (prev[idx]) return prev;
    const next = [...prev]; next[idx] = true; return next;
  });

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {VIDEO_URLS.map((src, idx) => {
        const isActive = idx === active;
        const isReady = loaded[idx];
        return (
          <video
            key={src}
            src={src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => markLoaded(idx)}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
            style={{
              opacity: isActive && isReady ? 0.55 : 0,
              filter: "saturate(1.1) contrast(1.05)",
            }}
          />
        );
      })}

      {/* Vignette + dark web gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.85) 75%, #000 100%)",
        }}
      />
      {/* Scanline / terminal tint */}
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
        }}
      />
      {/* Edge glow */}
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(6,182,212,0.08)] pointer-events-none" />
    </div>
  );
}