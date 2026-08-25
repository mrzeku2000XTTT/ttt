import React, { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Shows the user's cumulative DD agent credit usage and equivalent KAS cost.
export default function DDCreditBar() {
  const [email, setEmail] = useState("");
  const [total, setTotal] = useState({ credits: 0, kaspa: 0, runs: 0 });

  const load = async () => {
    try {
      const u = await base44.auth.me();
      if (!u?.email) return;
      setEmail(u.email);
      const records = await base44.entities.DDCreditUsage.filter({ user_email: u.email }, "-created_date", 100);
      const credits = records.reduce((s, r) => s + (r.credits_used || 0), 0);
      const kaspa = records.reduce((s, r) => s + (r.kaspa_cost_sompi || 0), 0) / 100000000;
      setTotal({ credits, kaspa, runs: records.length });
    } catch {}
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-neutral-50 border border-neutral-200 text-xs">
      <Zap className="w-3.5 h-3.5 text-amber-500" />
      <span className="font-medium text-neutral-700">{total.credits.toFixed(1)} credits</span>
      <span className="text-neutral-300">·</span>
      <span className="text-neutral-500">≈ {total.kaspa.toFixed(4)} KAS</span>
      <span className="text-neutral-300">·</span>
      <span className="text-neutral-400">{total.runs} runs</span>
    </div>
  );
}