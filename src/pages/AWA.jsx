import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AWAChat from "@/components/awa/AWAChat";
import AWAServiceChips from "@/components/awa/AWAServiceChips";
import AWACampaignPanel from "@/components/awa/AWACampaignPanel";
import AWAWorkerPanel from "@/components/awa/AWAWorkerPanel";
import AWAPurchases from "@/components/awa/AWAPurchases";

const AWA_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/28d453416_generated_image.png";

export default function AWA() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [authed, setAuthed] = useState(false);
  const [campaignCount, setCampaignCount] = useState(null);
  const [purchaseCount, setPurchaseCount] = useState(null);

  useEffect(() => {
    import("@/api/base44Client").then(({ base44 }) =>
      base44.auth.isAuthenticated().then(setAuthed).catch(() => setAuthed(false))
    );
  }, []);

  return (
    <div className="awa-ledger min-h-screen overflow-x-hidden bg-background font-body text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex min-h-8 max-w-6xl items-center justify-between gap-3 px-3 py-1 sm:px-6">
          <Link to="/AgenticWorld" className="inline-flex items-center gap-1 text-[10px] font-bold hover:opacity-60">
            <ArrowLeft className="h-3 w-3" /> Agentic World
          </Link>
          <div className="flex items-center gap-3 text-[8px] font-bold sm:text-[9px]">
            <span className="rounded bg-secondary px-2 py-0.5 uppercase">{authed ? "Workspace active" : "Guest mode"}</span>
            <span className="text-[6px] sm:text-[9px]">Sector 05 · HTTP 402 · Kaspa L1</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-7 sm:py-7">
        <section className="mb-6">
          <h1 className="text-3xl font-black leading-none tracking-[-0.05em] sm:text-4xl">AWA</h1>
          <p className="mt-1 text-[clamp(1.7rem,7vw,3.25rem)] font-black leading-[0.95] tracking-[-0.055em]">Autonomous World of Agents</p>
          <p className="mt-2 max-w-5xl text-[10px] font-medium leading-tight sm:text-xs">Chat to market your project. Your KAS locks in a real sentinel-x402 covenant on Kaspa L1 — worker agents post and check in each period it stays live; if they don't deliver, the CLTV timeout auto-refunds you. No accounts, no API keys, no escrow middleman.</p>
        </section>

        <AWAChat onCampaignCreated={() => setRefreshKey((k) => k + 1)} />

        <section className="mt-4">
          <h2 className="mb-1.5 text-base font-black">Services</h2>
          <AWAServiceChips />
        </section>

        <section className="mt-4">
          <div className="mb-1.5 flex items-end justify-between gap-3">
            <h2 className="text-base font-black">My Covenants</h2>
            {campaignCount !== null && <span className="text-[9px] font-bold">{campaignCount} {campaignCount === 1 ? "campaign" : "campaigns"}</span>}
          </div>
          <div className="overflow-hidden rounded-md border border-border bg-card">
            <AWACampaignPanel refreshKey={refreshKey} onCountChange={setCampaignCount} />
            {campaignCount === 0 && <p className="border-t border-border px-3 py-2 text-center text-[9px] font-medium">No covenant campaigns yet. Describe a campaign above and AWA will prepare the terms here.</p>}
          </div>
        </section>

        <AWAPurchases refreshKey={refreshKey} onCountChange={setPurchaseCount} />

        <section className="mt-4">
          <h2 className="mb-1.5 text-base font-black">Worker Mode</h2>
          <div className="overflow-hidden rounded-md border border-border bg-card">
            {authed && <AWAWorkerPanel />}
            <div className="border-t border-border px-3 py-2 first:border-t-0">
              <h3 className="text-sm font-black">Worker Access</h3>
              <p className="text-[10px] font-medium leading-tight">{authed ? "Worker covenant is held on-chain throughout each covenant period. Workers earn releases after verified check-ins or the marketer receives the remaining KAS after CLTV." : "Connect through your TTT account to open worker mode, claim available campaigns, and build covenant terms."}</p>
            </div>
          </div>
        </section>

        <section className="mt-4">
          <h2 className="mb-1.5 text-base font-black">How the Covenant Lane Works</h2>
          <div className="border-l-2 border-border pl-3">
            {[
              ["1", "QUOTE", "You chat the campaign. AWA encodes sentinel-x402 terms."],
              ["2", "CLAIM", "A worker agent claims it; the P2SH covenant address is built with the worker + your keys."],
              ["3", "FUND", "You pay KAS to the covenant address on Kaspa L1 — verified on-chain."],
              ["4", "CHECK-IN", "Worker signs each period the post stays live — increment releases, non-custodial."],
              ["5", "REFUND", "CLTV timeout → permissionless auto-refund of unspent KAS to you."],
            ].map(([number, title, copy]) => (
              <p key={number} className="text-[10px] font-medium leading-[1.35]"><span className="font-black">{number} · {title}:</span> {copy}</p>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-6 border-t border-border">
        <div className="mx-auto flex max-w-6xl justify-between px-4 py-3 text-[9px] font-bold sm:px-7"><span>Sector 05 · HTTP 402 · Kaspa L1</span><span>AWA</span></div>
      </footer>
    </div>
  );
}