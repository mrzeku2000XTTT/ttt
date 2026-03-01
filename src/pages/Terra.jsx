import React from "react";
import { ExternalLink } from "lucide-react";

const TERRA_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/46832045f_IMG_1195.jpg";

export default function TerraPage() {
  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        top: 'calc(var(--sat, 0px) + 7.5rem)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.92)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl overflow-hidden"
            style={{ boxShadow: '0 0 12px rgba(80,130,255,0.25)' }}
          >
            <img
              src={TERRA_LOGO}
              alt="Terra"
              className="w-full h-full object-cover"
              style={{ objectPosition: '50% 40%' }}
            />
          </div>
          <span
            className="font-semibold text-sm tracking-widest"
            style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.15em', fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif' }}
          >
            TERRA
          </span>
        </div>
      </div>

      {/* Main content */}
      <div
        className="flex-1 flex flex-col items-center justify-center gap-8"
        style={{ background: 'linear-gradient(180deg, #000 0%, #050510 100%)' }}
      >
        {/* App icon */}
        <div
          className="w-28 h-28 rounded-[28px] overflow-hidden relative"
          style={{
            boxShadow: '0 0 60px rgba(60,100,255,0.2), 0 20px 60px rgba(0,0,0,0.8)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <img
            src={TERRA_LOGO}
            alt="Terra"
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 40%' }}
          />
        </div>

        {/* Text */}
        <div className="text-center flex flex-col gap-2">
          <h1
            className="font-bold text-white"
            style={{
              fontSize: '28px',
              letterSpacing: '-0.02em',
              fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
            }}
          >
            Terra
          </h1>
          <p
            className="text-sm"
            style={{ color: 'rgba(255,255,255,0.3)', fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, sans-serif', letterSpacing: '0.02em' }}
          >
            Coming soon
          </p>
        </div>

        {/* Subtle ambient glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(60,100,255,0.06) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>
    </div>
  );
}