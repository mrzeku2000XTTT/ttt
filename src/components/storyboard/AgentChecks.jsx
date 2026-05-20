import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function AgentChecks({ checks = [] }) {
  if (!checks.length) return null;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {checks.map((check) => (
        <div key={check.agent} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-sm font-black text-zinc-950">
            <CheckCircle2 className="h-4 w-4" /> {check.agent}
          </div>
          <p className="text-sm leading-6 text-zinc-600">{check.feedback}</p>
        </div>
      ))}
    </div>
  );
}