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
      <div className="flex flex-col gap-1.5">
        {(services?.length ? services : SERVICES.map((s) => ({ id: s.id, name: s.name, price_kas: 0.5 }))).map((s) => {
          const meta = SERVICES.find((m) => m.id === s.id) || SERVICES[0];
          const Icon = meta.icon;
          return (
            <button key={s.id} onClick={() => setBuying(s)}
              className="group flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-left transition-colors hover:border-primary/50">
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-medium text-secondary-foreground">{meta.name}</span>
              <span className="ml-auto font-mono text-[10px] text-primary">{s.price_kas} KAS</span>
            </button>
          );
        })}
      </div>
      {buying && <AWAInvoiceModal service={buying} onClose={() => setBuying(null)} />}
    </>
  );
}