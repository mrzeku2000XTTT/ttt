import React, { useState } from "react";
import { X, HardHat } from "lucide-react";

const STORAGE_KEY = "dd_build_banner_dismissed_v1";

export default function DDBuildBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
  });

  if (dismissed) return null;

  const close = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setDismissed(true);
  };

  return (
    <div className="px-3 sm:px-6 pt-3 w-full max-w-6xl mx-auto">
      <div className="relative w-full rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 sm:px-4 py-2.5 flex items-center gap-2.5">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <HardHat className="w-4 h-4 text-amber-600" />
        </div>
        <p className="flex-1 min-w-0 text-[12px] sm:text-sm text-amber-900 leading-snug">
          <span className="font-semibold">Still being built in real time.</span>{" "}
          <span className="text-amber-800/90">Not finished v1 yet — but you can view the progress.</span>
        </p>
        <button
          onClick={close}
          aria-label="Dismiss"
          className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-amber-200/60 flex items-center justify-center text-amber-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}