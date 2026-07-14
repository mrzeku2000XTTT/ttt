import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2 } from "lucide-react";
import AWAHero from "@/components/awa/AWAHero";
import AWAServiceCard from "@/components/awa/AWAServiceCard";
import AWAInvoiceModal from "@/components/awa/AWAInvoiceModal";
import AWAPurchases from "@/components/awa/AWAPurchases";

export default function AWA() {
  const [services, setServices] = useState(null);
  const [buying, setBuying] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    base44.functions.invoke("awaX402", { action: "services" })
      .then((res) => setServices(res.data.services || []))
      .catch(() => setServices([]));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative">
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Link to="/AgenticWorld" className="inline-flex items-center gap-1 text-white/40 text-xs hover:text-white">
            <ArrowLeft className="w-3 h-3" /> Agentic World
          </Link>
        </div>

        <AWAHero />

        <div className="max-w-5xl mx-auto px-4 pb-12">
          {services === null ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {services.map((s) => <AWAServiceCard key={s.id} service={s} onBuy={setBuying} />)}
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-white font-bold text-sm tracking-widest mb-3">HOW THE 402 LANE WORKS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs text-white/50">
              <div><span className="text-emerald-300 font-mono font-bold">1 · REQUEST</span><br />You (or your agent) ask for a service. The server replies HTTP 402 with a KAS quote.</div>
              <div><span className="text-emerald-300 font-mono font-bold">2 · PAY</span><br />Send the quoted KAS to the treasury address on Kaspa L1 — ~1 second finality.</div>
              <div><span className="text-emerald-300 font-mono font-bold">3 · SETTLE</span><br />Submit the tx id. The gateway verifies the payment against Kaspa consensus, replay-protected.</div>
              <div><span className="text-emerald-300 font-mono font-bold">4 · DELIVER</span><br />The AI agent executes and delivers instantly. Covenant++ rules can escrow bigger jobs.</div>
            </div>
          </div>
        </div>

        <AWAPurchases refreshKey={refreshKey} />
      </div>

      {buying && (
        <AWAInvoiceModal
          service={buying}
          onClose={() => { setBuying(null); setRefreshKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}