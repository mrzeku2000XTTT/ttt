import React, { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";

const STEPS = [
  "Resolving domain & SSL…",
  "Scanning site for phishing…",
  "Scanning site for malware & drainers…",
  "Checking domain reputation…",
  "AI indexing content & category…",
];

export default function ScanSteps() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 space-y-1.5">
      {STEPS.map((label, i) => (
        <div key={i} className={`flex items-center gap-2 text-[11px] ${i > step ? "opacity-30" : ""}`}>
          {i < step
            ? <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            : i === step
              ? <Loader2 className="w-3 h-3 text-cyan-400 animate-spin flex-shrink-0" />
              : <span className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0" />}
          <span className={i < step ? "text-white/45" : "text-white/75"}>{label}</span>
        </div>
      ))}
    </div>
  );
}