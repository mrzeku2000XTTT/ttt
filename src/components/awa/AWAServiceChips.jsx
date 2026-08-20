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
      <div className="flex flex-wrap items-center justify-center gap-2">
        {(services || SERVICES.map((s) => ({ id: s.id, name: s.name, price_kas: 0.5 }))).map((s) => {
          const meta = SERVICES.find((m) => m.id === s.id) || SERVICES[0];
          const Icon = meta.icon;
          return (
            <button key={s.id} onClick={() => setBuying(s)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors">
              <Icon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-white/70 group-hover:text-white font-medium">{meta.name}</span>
              <span className="text-[10px] text-emerald-300/70 font-mono">{s.price_kas} KAS</span>
            </button>
          );
        })}
      </div>
      {buying && <AWAInvoiceModal service={buying} onClose={() => setBuying(null)} />}
    </>
  );
}