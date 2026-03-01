import React from "react";

const TERRA_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/46832045f_IMG_1195.jpg";

export default function TerraPage() {
  return (
    <div
      className="fixed inset-0 flex flex-col bg-black"
      style={{
        top: "calc(var(--sat, 0px) + 7.5rem)",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 4rem)",
      }}
    >
      {/* Top bar — iOS-style */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl overflow-hidden"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}
          >
            <img
              src={TERRA_LOGO}
              alt="Terra"
              className="w-full h-full object-cover"
              style={{ objectPosition: "50% 40%" }}
            />
          </div>
          <span
            className="text-white font-semibold text-base tracking-tight"
            style={{ fontFamily: "-apple-system, SF Pro Display, sans-serif" }}
          >
            Terra
          </span>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          <span className="text-white/40 text-xs font-medium">Coming Soon</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 bg-[#0a0a0a]">
        {/* App icon */}
        <div className="relative">
          <div
            className="w-28 h-28 rounded-[2rem] overflow-hidden"
            style={{
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.08), 0 20px 60px rgba(0,0,0,0.9), 0 0 80px rgba(30,80,200,0.2)",
            }}
          >
            <img
              src={TERRA_LOGO}
              alt="Terra"
              className="w-full h-full object-cover"
              style={{ objectPosition: "50% 40%" }}
            />
          </div>
          {/* Subtle glow */}
          <div
            className="absolute inset-0 rounded-[2rem] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 30%, rgba(60,100,255,0.15), transparent 70%)",
            }}
          />
        </div>

        {/* Text */}
        <div className="text-center px-8">
          <h1
            className="text-white text-3xl font-bold tracking-tight mb-2"
            style={{ fontFamily: "-apple-system, SF Pro Display, sans-serif" }}
          >
            Terra
          </h1>
          <p
            className="text-white/30 text-sm leading-relaxed"
            style={{ fontFamily: "-apple-system, SF Pro Text, sans-serif" }}
          >
            Something big is on the way.{"\n"}Stay tuned.
          </p>
        </div>

        {/* iOS-style pill button */}
        <div
          className="px-6 py-3 rounded-full"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span
            className="text-white/40 text-sm font-medium"
            style={{ fontFamily: "-apple-system, SF Pro Text, sans-serif" }}
          >
            Notify me
          </span>
        </div>
      </div>

      {/* Bottom subtle separator */}
      <div className="h-px bg-white/5 flex-shrink-0" />
    </div>
  );
}