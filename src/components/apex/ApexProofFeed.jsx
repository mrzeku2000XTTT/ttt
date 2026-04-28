import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Clock, Hash, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export default function ApexProofFeed() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await base44.entities.ApexProof.list("-completed_at", 12);
        if (mounted) setProofs(data || []);
      } catch (e) {
        if (mounted) setProofs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <section className="relative py-24 px-6">
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-orange-400/80 text-[10px] font-bold tracking-[0.3em] uppercase">Live Ledger</span>
          <h2
            className="text-white font-black text-4xl sm:text-5xl mt-3 leading-tight"
            style={{ fontFamily: "'Orbitron', system-ui, sans-serif" }}
          >
            VERIFIED RUNS
          </h2>
          <p className="text-white/50 text-sm mt-3">Every successful NODA execution, sealed in proof.</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : proofs.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-black/50 backdrop-blur-md border border-orange-500/20">
            <Shield className="w-10 h-10 text-orange-400/40 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No proofs yet. Run a NODA workflow to seal the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {proofs.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="group relative p-4 rounded-xl bg-black/60 backdrop-blur-md border border-orange-500/20 hover:border-orange-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500/30 to-red-500/30 border border-orange-500/40 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-3.5 h-3.5 text-orange-300" />
                    </div>
                    <span className="text-white font-bold text-sm truncate">{p.workflow_name || "Workflow"}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                    Sealed
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-white/40 text-[11px] font-mono mb-2 truncate">
                  <Hash className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{p.proof_hash?.slice(0, 32) || "—"}…</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {p.completed_at ? format(new Date(p.completed_at), "MMM d, HH:mm") : ""}
                  </div>
                  <div className="flex items-center gap-3">
                    {typeof p.node_count === "number" && (
                      <span>{p.node_count} nodes</span>
                    )}
                    {typeof p.duration_ms === "number" && (
                      <span>{(p.duration_ms / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}