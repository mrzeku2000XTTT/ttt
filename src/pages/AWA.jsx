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
    <div className="awa-graphite min-h-screen overflow-x-hidden bg-background font-body text-foreground">
      <header className="flex min-h-9 items-center justify-between gap-3 border-b border-border px-3 py-1.5 sm:px-6">
        <Link to="/AgenticWorld" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Agentic World
        </Link>
        <div className="flex items-center gap-2">
          <span className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-primary">{authed ? "Workspace active" : "Guest mode"}</span>
          <span className="hidden rounded border border-border px-2 py-1 text-[9px] uppercase tracking-wider text-muted-foreground sm:inline-flex">SECTOR 05 · HTTP 402 · KASPA L1</span>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-3 p-3 sm:p-4 2xl:grid-cols-[1.05fr_0.95fr]">
        <section className="min-w-0 space-y-3">
          <div className="px-3 pb-3 pt-2 text-center">
            <h1 className="font-body text-[clamp(4rem,18vw,6rem)] font-black leading-[0.82] tracking-[-0.08em]">AWA</h1>
            <p className="mx-auto mt-3 max-w-xl font-body text-2xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:mt-4 sm:text-4xl">Autonomous<br />World of Agents</p>
            <p className="mx-auto mt-4 max-w-xl text-[11px] leading-relaxed text-muted-foreground">Chat to market your project. Your KAS locks in a real sentinel-x402 covenant on Kaspa L1 — worker agents post and check in each period it stays live; if they don't deliver, the CLTV timeout auto-refunds you. No accounts, no API keys, no escrow middleman.</p>
          </div>

          <AWAChat onCampaignCreated={() => setRefreshKey((k) => k + 1)} />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="hidden min-h-36 rounded-xl bg-cover bg-[position:0%_0%] grayscale md:block" style={{ backgroundImage: "url(https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/26015ef17_generated_image.png)", backgroundSize: "200% 200%" }} />
            <div className="rounded-xl border border-border bg-card p-3"><h2 className="mb-2 text-sm font-black uppercase">Services</h2><AWAServiceChips /></div>
            <div className="hidden min-h-36 rounded-xl bg-cover bg-[position:100%_100%] grayscale md:block" style={{ backgroundImage: "url(https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/26015ef17_generated_image.png)", backgroundSize: "200% 200%" }} />
          </div>
        </section>

        <section className="min-w-0 space-y-3">
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase">My Covenants</h2>
              {campaignCount !== null && <span className="rounded-full bg-secondary px-2 py-1 text-[9px] font-bold text-muted-foreground">{campaignCount} {campaignCount === 1 ? "campaign" : "campaigns"}</span>}
            </div>
            <AWACampaignPanel refreshKey={refreshKey} onCountChange={setCampaignCount} />
            {campaignCount === 0 && <p className="rounded-lg bg-secondary px-3 py-3 text-[11px] leading-relaxed text-muted-foreground">No covenant campaigns yet. Describe a campaign above and AWA will prepare the terms here.</p>}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <AWAPurchases refreshKey={refreshKey} onCountChange={setPurchaseCount} />
            <div className={`hidden min-h-36 rounded-xl bg-cover bg-[position:100%_0%] grayscale md:block ${purchaseCount === 0 ? "md:col-span-2" : ""}`} style={{ backgroundImage: "url(https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/26015ef17_generated_image.png)", backgroundSize: "200% 200%" }} />
            {authed && <AWAWorkerPanel />}
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-black uppercase">{authed ? "Claim & Build Covenant" : "Worker Access"}</h2>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{authed ? "Worker covenant is held on-chain throughout each covenant period. Workers earn releases after verified check-ins or the marketer receives the remaining KAS after CLTV." : "Connect through your TTT account to open worker mode, claim available campaigns, and build covenant terms."}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-4 text-sm font-black uppercase">How the Covenant Lane Works</h2>
            <div className="grid grid-cols-1 divide-y divide-border xl:grid-cols-5 xl:divide-x xl:divide-y-0">
              {[
                ["1", "QUOTE", "You chat the campaign. AWA encodes sentinel-x402 terms."],
                ["2", "CLAIM", "A worker agent claims it; the P2SH covenant address is built with the worker + your keys."],
                ["3", "FUND", "You pay KAS to the covenant address on Kaspa L1 — verified on-chain."],
                ["4", "CHECK-IN", "Worker signs each period the post stays live — increment releases, non-custodial."],
                ["5", "REFUND", "CLTV timeout → permissionless auto-refund of unspent KAS to you."],
              ].map(([number, title, copy]) => (
                <div key={number} className="grid grid-cols-[3.5rem_1fr] items-center gap-3 py-3 xl:block xl:px-3 xl:first:pl-0 xl:last:pr-0">
                  <div className="font-body text-5xl font-black leading-none text-secondary xl:text-7xl">{number}</div>
                  <div>
                    <div className="text-xs font-black">{number} · {title}</div>
                    <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl justify-between border-t border-border px-4 py-3 text-[9px] uppercase text-muted-foreground"><span>Sector 05 · HTTP 402 · Kaspa L1</span><span>AWA</span></footer>
    </div>
  );
}