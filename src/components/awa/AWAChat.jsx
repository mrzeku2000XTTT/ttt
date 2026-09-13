import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getAnyWallet, generateWallet, importFromPrivateKey } from "@/lib/localKaspaWallet";
import { Send, Loader2, Wallet, KeyRound, Sparkles } from "lucide-react";

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
    <div className="grid min-w-0 w-full gap-3 lg:grid-cols-[2fr_1fr]">
      <div className="mb-1 flex min-w-0 flex-wrap items-center justify-center gap-2 lg:col-span-2">
        <Wallet className="h-3.5 w-3.5 text-primary" />
        {wallet ? (
          <span className="font-mono text-[11px] text-muted-foreground">{wallet.address.slice(0, 14)}…{wallet.address.slice(-6)}</span>
        ) : (
          <>
            <button onClick={() => setWallet(generateWallet())} className="rounded-full bg-primary px-4 py-2 text-[11px] font-black text-primary-foreground">Connect TTT wallet</button>
            <button onClick={() => setShowKeys((s) => !s)} className="rounded-full border border-border px-3 py-2 text-[11px] text-muted-foreground"><KeyRound className="mr-1 inline h-3 w-3" />Import</button>
          </>
        )}
      </div>
      {showKeys && !wallet && (
        <div className="mb-1 flex items-center justify-center gap-2 lg:col-span-2">
          <input value={importKey} onChange={(e) => setImportKey(e.target.value)} placeholder="private key (64 hex)" className="w-64 rounded-full border border-border bg-card px-3 py-2 font-mono text-[10px] text-foreground outline-none" />
          <button onClick={doImport} disabled={!importKey.trim()} className="rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-40">Import</button>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-background lg:col-span-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Describe your campaign…" className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-background/50" />
        <button onClick={() => send()} disabled={busy || !input.trim()} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-background text-foreground disabled:opacity-40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <img src={AWA_LOGO} alt="AWA" className="h-7 w-7 rounded-full object-cover grayscale" />
          <div><div className="text-sm font-bold text-card-foreground">AWA</div><div className="text-[9px] text-muted-foreground">sentinel-x402 covenant marketing</div></div>
          <span className="ml-auto rounded border border-border px-2 py-1 text-[8px] font-bold text-muted-foreground"><Sparkles className="mr-1 inline h-3 w-3" />HTTP 402</span>
        </div>
        <div ref={scrollRef} className="max-h-[260px] space-y-3 overflow-y-auto px-4 py-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-xl border border-border px-3 py-2 text-[11px] leading-relaxed whitespace-pre-line ${m.role === "user" ? "bg-foreground text-background" : "bg-secondary text-secondary-foreground"}`}>
                {m.text}
                {m.terms && <div className="mt-2 grid grid-cols-2 gap-1 border-t border-border pt-2 text-[10px]"><div className="text-muted-foreground">Budget</div><div className="font-mono font-bold">{m.terms.total_kas} KAS</div><div className="text-muted-foreground">Per period</div><div className="font-mono">{m.terms.increment_kas} KAS</div><div className="text-muted-foreground">Check-ins</div><div className="font-mono">{m.terms.num_epochs} × {Math.round(m.terms.period_seconds / 3600)}h</div><div className="col-span-2 pt-1 font-semibold text-primary">Campaign open for worker agents — see panel to fund once claimed</div></div>}
              </div>
            </div>
          ))}
          {busy && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-[11px] text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Encoding covenant terms…</div></div>}
          {messages.length === 1 && <div className="flex flex-wrap gap-1.5">{SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[9px] text-muted-foreground hover:text-foreground">{s}</button>)}</div>}
        </div>
        {error && <div className="m-3 rounded-lg bg-destructive/10 px-3 py-2 text-[11px] text-destructive">{error}</div>}
      </div>
      <div className="hidden min-h-48 rounded-xl bg-cover bg-[position:0%_100%] grayscale lg:block" style={{ backgroundImage: "url(https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/26015ef17_generated_image.png)", backgroundSize: "200% 200%" }} />
    </div>
  );
}