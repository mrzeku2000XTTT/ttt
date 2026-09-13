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

  if (!invoices) return null;

  return (
    <section className="mt-4">
      <h2 className="mb-1.5 text-base font-black">My 402 Receipts</h2>
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-[560px] border-collapse text-left text-[8px]">
          <thead><tr className="border-b border-border">{["Service Name", "Input", "KAS Amount", "Payment Status"].map((label) => <th key={label} className="px-2 py-1 font-black">{label}</th>)}</tr></thead>
          <tbody>
            {invoices.length === 0 ? <tr><td colSpan="4" className="px-2 py-2 text-center font-medium">No 402 receipts yet.</td></tr> : invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-0">
                <td className="px-2 py-1 font-bold">{inv.service_name}</td>
                <td className="max-w-[260px] truncate px-2 py-1 font-mono">{inv.input}</td>
                <td className="px-2 py-1 font-bold">{inv.amount_kas} KAS</td>
                <td className="px-2 py-1 font-bold">{(inv.status || "").toUpperCase().replace("_", " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}