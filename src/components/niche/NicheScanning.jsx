import React from 'react';
import NicheLogo from './NicheLogo';

// Full-screen scanning state — compass sweeps while the AI works
export default function NicheScanning() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-2xl bg-white/10 animate-pulse" />
        <NicheLogo size={72} />
        <div
          className="absolute inset-0 rounded-full border border-white/20"
          style={{ maskImage: 'linear-gradient(#fff 0 0)' }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, rgba(255,255,255,0.35), transparent 60deg)',
              animation: 'spin 1.6s linear infinite'
            }}
          />
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-semibold">Locking onto your signal…</p>
        <p className="text-white/40 text-sm mt-1">Reading your passions · matching your strengths · drafting post ideas</p>
      </div>
    </div>
  );
}