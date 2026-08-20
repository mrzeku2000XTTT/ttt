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
    <div className="w-full max-w-2xl mx-auto">
      {/* Wallet pill */}
      <div className="flex items-center gap-2 justify-center mb-3">
        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
        {wallet ? (
          <span className="text-[11px] text-white/50 font-mono">{wallet.address.slice(0, 14)}…{wallet.address.slice(-6)}</span>
        ) : (
          <>
            <button onClick={() => setWallet(generateWallet())} className="text-[11px] px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-200">Connect TTT wallet</button>
            <button onClick={() => setShowKeys((s) => !s)} className="text-[11px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/60"><KeyRound className="w-3 h-3 inline mr-1" />Import</button>
          </>
        )}
      </div>
      {showKeys && !wallet && (
        <div className="flex items-center gap-2 justify-center mb-3">
          <input value={importKey} onChange={(e) => setImportKey(e.target.value)} placeholder="private key (64 hex)" className="w-64 bg-black/40 border border-white/10 rounded px-2 py-1 text-white font-mono text-[10px] outline-none" />
          <button onClick={doImport} disabled={!importKey.trim()} className="text-[11px] px-2 py-1 rounded bg-emerald-500 text-black font-bold disabled:opacity-40">Import</button>
        </div>
      )}

      {/* Apple-white chat card */}
      <div className="rounded-3xl bg-white shadow-[0_8px_40px_rgba(0,255,179,0.12)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-white">
          <img src={AWA_LOGO} alt="AWA" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <div className="text-zinc-900 font-bold text-sm tracking-tight">AWA</div>
            <div className="text-zinc-400 text-[10px] -mt-0.5">sentinel-x402 covenant marketing</div>
          </div>
          <span className="ml-auto flex items-center gap-1 text-[9px] font-bold tracking-widest text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full"><Sparkles className="w-3 h-3" />HTTP 402</span>
        </div>

        <div ref={scrollRef} className="px-5 py-4 space-y-3 max-h-[340px] overflow-y-auto bg-white">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${m.role === "user" ? "bg-zinc-900 text-white rounded-br-sm" : "bg-zinc-100 text-zinc-800 rounded-bl-sm"}`}>
                {m.text}
                {m.terms && (
                  <div className="mt-2 pt-2 border-t border-zinc-200 grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="text-zinc-500">Budget</div><div className="text-zinc-900 font-mono font-bold">{m.terms.total_kas} KAS</div>
                    <div className="text-zinc-500">Per period</div><div className="text-zinc-900 font-mono">{m.terms.increment_kas} KAS</div>
                    <div className="text-zinc-500">Check-ins</div><div className="text-zinc-900 font-mono">{m.terms.num_epochs} × {Math.round(m.terms.period_seconds / 3600)}h</div>
                    <div className="col-span-2 text-[10px] text-emerald-600 font-semibold pt-1">✓ Campaign open for worker agents — see panel below to fund once claimed</div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && <div className="flex justify-start"><div className="bg-zinc-100 rounded-2xl px-3.5 py-2.5 text-[13px] text-zinc-500 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" /> Encoding covenant terms…</div></div>}
        </div>

        {error && <div className="mx-5 mb-2 text-[11px] text-red-600 bg-red-50 rounded-lg px-3 py-1.5">{error}</div>}

        <div className="px-5 py-3 border-t border-zinc-100 bg-white">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 border border-zinc-200">{s}</button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Describe your campaign…"
              className="flex-1 bg-zinc-100 rounded-full px-4 py-2.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 outline-none focus:bg-zinc-50 focus:ring-2 focus:ring-emerald-400/40" />
            <button onClick={() => send()} disabled={busy || !input.trim()}
              className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-40 transition-colors flex-shrink-0">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}