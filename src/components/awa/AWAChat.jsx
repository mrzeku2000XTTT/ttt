import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getAnyWallet, generateWallet, importFromPrivateKey } from "@/lib/localKaspaWallet";
import { ArrowRight, Loader2, KeyRound } from "lucide-react";

const AWA_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/28d453416_generated_image.png";

const SUGGESTIONS = [
  "Promote my Kaspa wallet app on X for a week — budget 10 KAS",
  "Get a crypto influencer to post about my NFT project, 5 KAS",
  "Shoutout my DeFi tool on Twitter, keep it up 3 days, 4 KAS",
];

export default function AWAChat({ onCampaignCreated }) {
  const [wallet, setWallet] = useState(() => getAnyWallet());
  const [importKey, setImportKey] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "I'm AWA. Describe the campaign you want marketed — what to post, which project, your budget, and how long the post should stay up. I'll encode it into a sentinel-x402 covenant on Kaspa L1." }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, busy]);

  const send = async (text) => {
    const intent = (text ?? input).trim();
    if (!intent || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: intent }]);
    setBusy(true); setError("");
    try {
      const res = await base44.functions.invoke("awaCovenant", {
        action: "quote", intent,
        marketer_wallet_address: wallet?.address || ""
      });
      const t = res.data.terms;
      setMessages((m) => [...m, {
        role: "assistant",
        text: `Covenant quoted. ${t.description}\n\nPlatform: ${t.platform}\nBudget: ${t.total_kas} KAS locked → ${t.increment_kas} KAS to the worker per period × ${t.num_epochs} check-ins (≈ every ${Math.round(t.period_seconds / 3600)}h).\n\nYour KAS is held in a real P2SH covenant. The worker signs each check-in (non-custodial); if they don't deliver or the post comes down, the CLTV timeout auto-refunds you.`,
        campaign_id: res.data.campaign_id,
        terms: t
      }]);
      onCampaignCreated?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const doImport = () => { try { setWallet(importFromPrivateKey(importKey)); setImportKey(""); setShowKeys(false); } catch (e) { setError(e.message); } };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {wallet ? (
          <span className="rounded border border-border bg-card px-2 py-1 font-mono text-[9px] font-bold">{wallet.address.slice(0, 14)}…{wallet.address.slice(-6)}</span>
        ) : (
          <>
            <button onClick={() => setWallet(generateWallet())} className="rounded border border-border bg-card px-2 py-1 text-[10px] font-bold">Connect Kaspa Wallet</button>
            <button onClick={() => setShowKeys((s) => !s)} className="rounded border border-border bg-card px-2 py-1 text-[10px] font-bold"><KeyRound className="mr-1 inline h-3 w-3" />Import</button>
          </>
        )}
        {showKeys && !wallet && (
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <input value={importKey} onChange={(e) => setImportKey(e.target.value)} placeholder="private key (64 hex)" className="min-w-0 flex-1 rounded border border-border bg-card px-2 py-1 font-mono text-[10px] outline-none" />
            <button onClick={doImport} disabled={!importKey.trim()} className="rounded bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground disabled:opacity-40">Import</button>
          </div>
        )}
      </div>

      <div className="rounded-md border border-border bg-secondary p-2">
        <div className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Describe your campaign…" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground" />
          <button onClick={() => send()} disabled={busy || !input.trim()} className="flex h-7 w-7 flex-shrink-0 items-center justify-center disabled:opacity-30">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <section>
        <h2 className="mb-1.5 text-base font-black">AWA Campaign Agent</h2>
        <div className="grid grid-cols-[7.5rem_1fr] overflow-hidden rounded-md border border-border bg-card sm:grid-cols-[10rem_1fr]">
          <div className="flex items-start gap-2 border-r border-border p-2">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-lg font-black italic text-background">A</span>
            <div><div className="text-xs font-black">AWA</div><div className="text-[7px] font-bold leading-tight">sentinel-x402 covenant marketing<br />HTTP 402</div></div>
          </div>
          <div ref={scrollRef} className="max-h-[240px] overflow-y-auto p-2">
            <div className="space-y-2">
              {messages.map((m, i) => (
                <div key={i} className={`text-[9px] font-medium leading-tight whitespace-pre-line ${m.role === "user" ? "border-l-2 border-foreground pl-2" : ""}`}>
                  {m.text}
                  {m.terms && <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-border pt-2 text-[8px]"><span>Budget</span><b>{m.terms.total_kas} KAS</b><span>Per period</span><span>{m.terms.increment_kas} KAS</span><span>Check-ins</span><span>{m.terms.num_epochs} × {Math.round(m.terms.period_seconds / 3600)}h</span></div>}
                </div>
              ))}
              {busy && <div className="flex items-center gap-1 text-[9px]"><Loader2 className="h-3 w-3 animate-spin" /> Encoding covenant terms…</div>}
              {messages.length === 1 && <div><div className="mb-1 text-[9px] font-black">Suggested Campaigns</div><div className="flex flex-col items-start gap-1">{SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-secondary px-2 py-0.5 text-left text-[8px] font-medium">{s}</button>)}</div></div>}
            </div>
          </div>
          {error && <div className="col-span-2 border-t border-border px-3 py-2 text-[9px] text-destructive">{error}</div>}
        </div>
      </section>
    </div>
  );
}