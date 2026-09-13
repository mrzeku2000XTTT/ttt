import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Receipt } from "lucide-react";

const STATUS_COLORS = {
  payment_required: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  fulfilled: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  failed: "text-red-300 border-red-500/40 bg-red-500/10",
};

export default function AWAPurchases({ refreshKey, onCountChange }) {
  const [invoices, setInvoices] = useState(null);

  useEffect(() => {
    base44.functions.invoke("awaX402", { action: "invoices" })
      .then((res) => {
        const nextInvoices = res.data.invoices || [];
        setInvoices(nextInvoices);
        onCountChange?.(nextInvoices.length);
      })
      .catch(() => {
        setInvoices([]);
        onCountChange?.(0);
      });
  }, [refreshKey]);

  if (!invoices || invoices.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-3 flex items-center gap-2">
        <Receipt className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-black uppercase text-card-foreground">MY 402 RECEIPTS</h2>
      </div>
      <div className="space-y-2">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex flex-wrap items-center gap-2 border-b border-border py-2 last:border-0 sm:flex-nowrap">
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-card-foreground">{inv.service_name}</div>
              <div className="truncate font-mono text-[9px] text-muted-foreground">{inv.input}</div>
            </div>
            <span className="whitespace-nowrap font-mono text-[10px] font-bold text-primary">{inv.amount_kas} KAS</span>
            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black tracking-widest whitespace-nowrap ${STATUS_COLORS[inv.status] || ""}`}>
              {(inv.status || "").toUpperCase().replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}