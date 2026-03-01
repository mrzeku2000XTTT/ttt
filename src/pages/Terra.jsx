import React from "react";
import { ExternalLink } from "lucide-react";

const TERRA_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/791e2bd15_IMG_1195.jpg";

export default function TerraPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-black" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)', overflow: 'hidden' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-xl border-b border-blue-500/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl overflow-hidden">
            <img
              src={TERRA_LOGO}
              alt="Terra"
              className="w-full h-full object-cover"
              style={{ objectPosition: '50% 35%' }}
            />
          </div>
          <span className="text-blue-300 font-bold text-sm tracking-widest">TERRA</span>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.4)]">
          <img
            src={TERRA_LOGO}
            alt="Terra"
            className="w-full h-full object-cover"
            style={{ objectPosition: '50% 35%' }}
          />
        </div>
        <div className="text-center">
          <h1 className="text-white font-black text-3xl tracking-widest mb-2">TERRA</h1>
          <p className="text-white/40 text-sm">Coming soon</p>
        </div>
      </div>
    </div>
  );
}