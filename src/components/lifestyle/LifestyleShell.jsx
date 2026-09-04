import React from "react";
import BackToStore from "@/components/BackToStore";

/**
 * Shared shell for the lifestyle AI-tool apps — gives every app a consistent
 * hero (logo, name, tagline, feature chips), a body slot, and a "how it works"
 * footer so each page reads like a real product, not a bare form.
 */
export default function LifestyleShell({ logo, name, tagline, features = [], steps = [], children }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <BackToStore />

      {/* Hero */}
      <div className="max-w-md mx-auto px-5 pt-10 pb-6">
        <img
          src={logo}
          alt={name}
          className="w-16 h-16 rounded-2xl object-cover mb-5 border border-white/10 bg-white/5"
        />
        <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
        <p className="text-white/50 text-sm mt-2 leading-relaxed">{tagline}</p>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {features.map((f, i) => (
              <span
                key={i}
                className="text-[11px] uppercase tracking-wider text-white/60 border border-white/15 rounded-full px-3 py-1"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="max-w-md mx-auto px-5 pb-10">{children}</div>

      {/* How it works */}
      {steps.length > 0 && (
        <div className="max-w-md mx-auto px-5 pb-16">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-3">How it works</p>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-white/60 leading-relaxed pt-0.5">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}