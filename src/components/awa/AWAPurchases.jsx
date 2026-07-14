import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Receipt } from "lucide-react";

const STATUS_COLORS = {
  payment_required: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  fulfilled: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  failed: "text-red-300 border-red-500/40 bg-red-500/10",
};

export default function AWAPurchases({ refreshKey }) {
  const [invoices, setInvoices] = useState(null);

  useEffect(() => {
    base44.functions.invoke("awaX402", { action: "invoices" })
      .then((res) => setInvoices(res.data.invoices || []))
      .catch(() => setInvoices([]));
  }, [refreshKey]);

  if (!invoices || invoices.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-4 h-4 text-emerald-300" />
        <h2 className="text-white font-bold text-sm tracking-widest">MY 402 RECEIPTS</h2>
      </div>
      <div className="space-y-2">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-bold truncate">{inv.service_name}</div>
              <div className="text-white/30 text-[10px] font-mono truncate">{inv.input}</div>
            </div>
            <span className="text-emerald-300 font-mono text-xs font-bold whitespace-nowrap">{inv.amount_kas} KAS</span>
            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black tracking-widest whitespace-nowrap ${STATUS_COLORS[inv.status] || ""}`}>
              {(inv.status || "").toUpperCase().replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}