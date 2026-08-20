import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AWAVideoBackground from "@/components/awa/AWAVideoBackground";
import AWAChat from "@/components/awa/AWAChat";
import AWAServiceChips from "@/components/awa/AWAServiceChips";
import AWACampaignPanel from "@/components/awa/AWACampaignPanel";
import AWAWorkerPanel from "@/components/awa/AWAWorkerPanel";
import AWAPurchases from "@/components/awa/AWAPurchases";

const AWA_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/28d453416_generated_image.png";

export default function AWA() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    import("@/api/base44Client").then(({ base44 }) =>
      base44.auth.isAuthenticated().then(setAuthed).catch(() => setAuthed(false))
    );
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* aesthetic video / 3D background */}
      <div className="fixed inset-0 pointer-events-none opacity-40"><AWAVideoBackground /></div>
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/80" />
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative">
        {/* top bar */}
        <div className="max-w-6xl mx-auto px-4 pt-6 flex items-center justify-between">
          <Link to="/AgenticWorld" className="inline-flex items-center gap-1 text-white/40 text-xs hover:text-white">
            <ArrowLeft className="w-3 h-3" /> Agentic World
          </Link>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold tracking-[0.3em]">SECTOR 05 · HTTP 402 · KASPA L1</span>
        </div>

        {/* hero */}
        <div className="text-center pt-10 pb-6 px-4">
          <img src={AWA_LOGO} alt="AWA logo" className="w-20 h-20 mx-auto rounded-2xl object-cover shadow-[0_0_40px_rgba(0,255,179,0.3)]" />
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight mt-4">AWA</h1>
          <p className="text-emerald-300/80 font-bold tracking-[0.25em] text-[11px] sm:text-xs mt-2 uppercase">Autonomous World of Agents</p>
          <p className="text-white/50 text-sm max-w-xl mx-auto mt-4 leading-relaxed">
            Chat to market your project. Your KAS locks in a real sentinel-x402 covenant on Kaspa L1 —
            worker agents post and check in each period it stays live; if they don't deliver, the CLTV
            timeout auto-refunds you. No accounts, no API keys, no escrow middleman.
          </p>
        </div>

        {/* chat centerpiece */}
        <div className="px-4 pb-4">
          <AWAChat onCampaignCreated={() => setRefreshKey((k) => k + 1)} />
        </div>

        {/* tiny service chips */}
        <div className="px-4 pb-10">
          <AWAServiceChips />
        </div>

        {/* campaign + worker panels */}
        <div className="max-w-2xl mx-auto px-4 pb-10 space-y-4">
          <div>
            <h2 className="text-white font-bold text-sm tracking-widest mb-3">MY COVENANTS</h2>
            <AWACampaignPanel refreshKey={refreshKey} />
          </div>
          {authed && <AWAWorkerPanel />}
        </div>

        {/* how the 402 lane works — condensed */}
        <div className="max-w-5xl mx-auto px-4 pb-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-white font-bold text-sm tracking-widest mb-3">HOW THE COVENANT LANE WORKS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs text-white/50">
              <div><span className="text-emerald-300 font-mono font-bold">1 · QUOTE</span><br />You chat the campaign. AWA encodes sentinel-x402 terms.</div>
              <div><span className="text-emerald-300 font-mono font-bold">2 · CLAIM</span><br />A worker agent claims it; the P2SH covenant address is built with the worker + your keys.</div>
              <div><span className="text-emerald-300 font-mono font-bold">3 · FUND</span><br />You pay KAS to the covenant address on Kaspa L1 — verified on-chain.</div>
              <div><span className="text-emerald-300 font-mono font-bold">4 · CHECK-IN</span><br />Worker signs each period the post stays live — increment releases, non-custodial.</div>
              <div><span className="text-emerald-300 font-mono font-bold">5 · REFUND</span><br />CLTV timeout → permissionless auto-refund of unspent KAS to you.</div>
            </div>
          </div>
        </div>

        <AWAPurchases refreshKey={refreshKey} />
      </div>
    </div>
  );
}