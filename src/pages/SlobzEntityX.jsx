import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import SlobzNav from "@/components/slobz/SlobzNav";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import EntityXHero from "@/components/entityx/EntityXHero";
import EntityXReport from "@/components/entityx/EntityXReport";

export default function SlobzEntityX() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await base44.functions.invoke("entityXTracker", { action: "overview" });
        if (alive) setData(res.data);
      } catch {
        if (alive) setData({ success: false });
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  return (
    <div className="min-h-screen bg-[#DED6F2] text-[#1F1B2E] pb-20 font-body relative">
      <SlobzBlobs />
      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
        <SlobzNav />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDFBF7] shadow-[0_6px_16px_rgba(124,92,252,0.2)] text-[10px] font-display font-extrabold text-[#7C5CFC] uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-[#5CE1A4] animate-pulse" /> Whale Watch · Sector 6
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-[#4A2FA8]">ENTITY X</h1>
          <p className="text-sm text-[#5A4B8A] mt-2 max-w-lg mx-auto">
            Tracking the highest Kaspa holder in real time. If they can stack this hard, so can you — one micro-step at a time.
          </p>
        </motion.div>

        <div className="mb-8">
          <EntityXHero data={data} loading={loading} />
        </div>

        <EntityXReport />

        <p className="text-[10px] text-[#8B84A3] text-center mt-8 max-w-md mx-auto">
          On-chain data from the public Kaspa node API, cross-checked against multiple explorers. Educational purposes only — not financial advice. DYOR.
        </p>
      </div>
    </div>
  );
}