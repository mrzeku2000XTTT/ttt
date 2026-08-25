import React, { useState, useEffect, useCallback } from "react";
import { Zap, Infinity as InfinityIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Shows cumulative DD credit usage, purchased KKDAG balance, and real-time
// KKDAG conversion. Admins see an ∞ badge but their usage is still tracked.
// 1 integration credit ≈ 1 KKDAG (per ddOrchestrator billing).
export default function DDCreditBar({ refreshKey = 0 }) {
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [total, setTotal] = useState({ credits: 0, kaspa: 0, runs: 0 });
  const [kkdagBalance, setKkdagBalance] = useState(null); // null = admin/unknown

  const load = useCallback(async () => {
    try {
      const u = await base44.auth.me();
      if (!u?.email) return;
      setEmail(u.email);
      setIsAdmin(u.role === "admin");
      const [usageRecords, walletRecords] = await Promise.all([
        base44.entities.DDCreditUsage.filter({ user_email: u.email }, "-created_date", 100).catch(() => []),
        u.role === "admin"
          ? Promise.resolve([])
          : base44.entities.DDKKDAGWallet.filter({ user_email: u.email }).catch(() => []),
      ]);
      const credits = usageRecords.reduce((s, r) => s + (r.credits_used || 0), 0);
      const kaspa = usageRecords.reduce((s, r) => s + (r.kaspa_cost_sompi || 0), 0) / 100000000;
      setTotal({ credits, kaspa, runs: usageRecords.length });
      if (u.role !== "admin" && walletRecords?.length) {
        setKkdagBalance(walletRecords[0].balance || 0);
      }
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  // KKDAG equivalent of credits used (1:1 with integration credits in orchestrator)
  const kkdagEquivalent = total.credits;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 h-9 rounded-xl bg-neutral-50 border border-neutral-200 text-xs whitespace-nowrap overflow-x-auto scrollbar-hide max-w-full">
      {isAdmin && (
        <span className="flex items-center gap-0.5 px-1.5 h-6 rounded-md bg-violet-100 text-violet-700 font-semibold flex-shrink-0">
          <InfinityIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Admin</span>
        </span>
      )}
      <span className="flex items-center gap-1 flex-shrink-0">
        <Zap className="w-3.5 h-3.5 text-amber-500" />
        <span className="font-medium text-neutral-700">{total.credits.toFixed(1)}</span>
        <span className="text-neutral-400 hidden sm:inline">credits</span>
      </span>
      {kkdagBalance !== null && (
        <>
          <span className="text-neutral-300 flex-shrink-0">·</span>
          <span className="flex items-center gap-1 flex-shrink-0">
            <span className="font-medium text-neutral-700">{kkdagBalance.toLocaleString()}</span>
            <span className="text-neutral-400">KKDAG</span>
          </span>
        </>
      )}
      <span className="text-neutral-300 flex-shrink-0 hidden sm:inline">·</span>
      <span className="text-neutral-500 flex-shrink-0 hidden sm:inline">≈ {kkdagEquivalent.toFixed(0)} KKDAG</span>
      <span className="text-neutral-300 flex-shrink-0">·</span>
      <span className="text-neutral-400 flex-shrink-0">{total.runs}<span className="hidden sm:inline"> runs</span></span>
    </div>
  );
}