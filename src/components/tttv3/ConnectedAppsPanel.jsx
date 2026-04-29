import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Zap, Network, Loader2 } from "lucide-react";

/**
 * ConnectedAppsPanel — shows the live count of TTT apps the agent runtime can connect to.
 * Reads from the TTTAppRegistry entity (seeded from App Store V2).
 */
export default function ConnectedAppsPanel() {
  const [stats, setStats] = useState({ total: 0, capabilities: 0, categories: 0, loading: true });
  const [sample, setSample] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const apps = await base44.entities.TTTAppRegistry.filter({ is_active: true }, "-created_date", 500);
        const caps = new Set();
        const cats = new Set();
        apps.forEach(a => {
          (a.agent_capabilities || []).forEach(c => caps.add(c));
          if (a.category) cats.add(a.category);
        });
        setStats({ total: apps.length, capabilities: caps.size, categories: cats.size, loading: false });
        // Pick 12 random sample logos for the constellation
        setSample([...apps].sort(() => Math.random() - 0.5).slice(0, 12));
      } catch {
        setStats({ total: 0, capabilities: 0, categories: 0, loading: false });
      }
    })();
  }, []);

  return (
    <section className="relative py-32 px-5 bg-gradient-to-b from-black via-zinc-950 to-black">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <p className="text-[12px] font-semibold text-emerald-400 tracking-widest uppercase mb-3">Agent Network</p>
          <h2 className="text-4xl sm:text-5xl font-[900] tracking-tight mb-3">Connected Apps.</h2>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Every TTT 3.0 agent can open, search, and invoke capabilities across the entire ecosystem.
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-10 max-w-2xl mx-auto">
          {[
            { label: "Apps", value: stats.total, icon: Network, accent: "from-cyan-400 to-blue-500" },
            { label: "Capabilities", value: stats.capabilities, icon: Zap, accent: "from-violet-400 to-purple-500" },
            { label: "Categories", value: stats.categories, icon: Network, accent: "from-emerald-400 to-teal-500" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl p-6 bg-white/[0.03] ring-1 ring-white/10 text-center relative overflow-hidden"
            >
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${s.accent} opacity-10 blur-2xl`} />
              <s.icon className="w-5 h-5 text-white/40 mx-auto mb-3" />
              <div className="text-4xl font-[900] tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                {stats.loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : s.value}
              </div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* App constellation */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="rounded-3xl p-8 bg-white/[0.02] ring-1 ring-white/10 backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">Live · agent.connectors.list()</span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-3">
            {sample.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i, type: "spring", stiffness: 280 }}
                whileHover={{ scale: 1.15, y: -4 }}
                className="aspect-square rounded-2xl overflow-hidden ring-1 ring-white/10 bg-white/5"
                title={`${app.app_name} — ${app.description || ""}`}
              >
                {app.logo_url ? (
                  <img src={app.logo_url} alt={app.app_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40 text-xs font-bold">
                    {app.app_name[0]}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-white/40">Agent runtime · live connector mesh</span>
            <span className="text-white/30">v3.0</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}