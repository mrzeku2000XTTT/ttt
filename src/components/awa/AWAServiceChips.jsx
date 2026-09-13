import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Palette, ShieldCheck, Loader2 } from "lucide-react";
import AWAInvoiceModal from "@/components/awa/AWAInvoiceModal";

const SERVICES = [
  { id: "oracle-research", name: "Oracle", icon: Search, blurb: "Live deep-research report" },
  { id: "forge-image", name: "Forge", icon: Palette, blurb: "AI artwork commission" },
  { id: "covenant-architect", name: "Architect", icon: ShieldCheck, blurb: "Covenant++ blueprint" },
];

// The 3 existing one-shot x402 services, shrunk to tiny chips under the chat.
export default function AWAServiceChips() {
  const [services, setServices] = useState(null);
  const [buying, setBuying] = useState(null);

  useEffect(() => {
    base44.functions.invoke("awaX402", { action: "services" })
      .then((res) => setServices(res.data.services || []))
      .catch(() => setServices([]));
  }, []);

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {(services?.length ? services : SERVICES.map((s) => ({ id: s.id, name: s.name, price_kas: 0.5 }))).map((s) => {
          const meta = SERVICES.find((m) => m.id === s.id) || SERVICES[0];
          const Icon = meta.icon;
          return (
            <button key={s.id} onClick={() => setBuying(s)}
              className="group flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-card px-1.5 py-2 text-left hover:bg-secondary sm:gap-2 sm:px-2">
              <span className="flex h-8 w-8 items-center justify-center rounded border border-border bg-secondary"><Icon className="h-4 w-4" /></span>
              <span className="text-xs font-black leading-none">{meta.name}<small className="mt-1 block text-[8px] font-bold">{s.price_kas} KAS</small></span>
            </button>
          );
        })}
      </div>
      {buying && <AWAInvoiceModal service={buying} onClose={() => setBuying(null)} />}
    </>
  );
}