import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ruleFor } from "@/components/kcc/kccRules";
import { RefreshCw, Send, ExternalLink } from "lucide-react";

const STATUS_STYLE = {
  pending_payment: "text-yellow-400",
  minted: "text-emerald-400",
  redeem_filed: "text-cyan-400",
  redeemed: "text-gray-500",
};

export default function KCCCard({ nft, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const rule = ruleFor(nft.covenant_type);

  const check = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await base44.functions.invoke("kccNft", { action: "check", nft_id: nft.id });
      setMsg(res.data.latest_update?.slice(0, 220) || "No update yet");
      onChanged();
    } catch (e) {
      setMsg(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const redeem = async () => {
    const addr = prompt("Kaspa payout address (kaspa:...)");
    if (!addr) return;
    setBusy(true); setMsg("");
    try {
      await base44.functions.invoke("kccNft", { action: "redeem", nft_id: nft.id, payout_address: addr.trim() });
      setMsg("Redeem job filed — the covenant sweep is being built on-chain.");
      onChanged();
    } catch (e) {
      setMsg(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="aspect-square bg-black/60">
        {nft.image_url ? (
          <img src={nft.image_url} alt={nft.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-5xl font-black">KCC</div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-white font-bold truncate">{nft.name}</h3>
          <span className={`text-[10px] uppercase font-bold ${STATUS_STYLE[nft.status] || "text-white/50"}`}>{nft.status.replace("_", " ")}</span>
        </div>
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${rule.color}`}>{rule.label} · {nft.covenant_type}</span>
        <p className="text-white/40 text-xs">{rule.tagline}</p>
        <p className="text-white/60 text-xs">Bound value: <span className="text-white font-semibold">{nft.deposit_kas} KAS</span></p>
        {nft.covenant_address && (
          <a href={`https://explorer.kaspa.org/addresses/${nft.covenant_address}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-cyan-400 text-[10px] font-mono truncate hover:underline">
            {nft.covenant_address.slice(0, 24)}… <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        )}
        {nft.status === "pending_payment" && nft.payment_address && (
          <p className="text-yellow-400/80 text-[10px] break-all">Pay {nft.deposit_kas} KAS to {nft.payment_address}</p>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={check} disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${busy ? "animate-spin" : ""}`} /> Check
          </button>
          {nft.status === "minted" && (
            <button onClick={redeem} disabled={busy}
              className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50">
              <Send className="w-3 h-3" /> Redeem
            </button>
          )}
        </div>
        {msg && <p className="text-white/50 text-[10px] whitespace-pre-wrap">{msg}</p>}
      </div>
    </div>
  );
}