import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ShieldCheck, ArrowRight, Copy, Check, RefreshCw, RotateCcw } from "lucide-react";

const STATUS_STYLE = {
  draft: "text-white/50 border-white/20 bg-white/5",
  open_for_workers: "text-cyan-300 border-cyan-500/40 bg-cyan-500/10",
  awaiting_fund: "text-amber-300 border-amber-500/40 bg-amber-500/10",
  active: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  checking_in: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  completed: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
  refunded: "text-white/60 border-white/20 bg-white/5",
  expired: "text-red-300 border-red-500/40 bg-red-500/10",
};

export default function AWACampaignPanel({ refreshKey }) {
  const [campaigns, setCampaigns] = useState(null);
  const [busy, setBusy] = useState(null);
  const [fundTx, setFundTx] = useState({});
  const [copied, setCopied] = useState("");

  const load = () => {
    base44.functions.invoke("awaCovenant", { action: "campaigns" })
      .then((res) => setCampaigns(res.data.campaigns || []))
      .catch(() => setCampaigns([]));
  };
  useEffect(load, [refreshKey]);

  const deploy = async (id) => {
    const tx = (fundTx[id] || "").trim().toLowerCase().replace(/^0x/, "");
    if (!/^[0-9a-f]{64}$/.test(tx)) return;
    setBusy(id);
    try {
      await base44.functions.invoke("awaCovenant", { action: "deploy", campaign_id: id, fund_tx_id: tx });
      load();
    } catch (e) { alert(e?.response?.data?.error || e.message); }
    setBusy(null);
  };

  const refund = async (id) => {
    setBusy(id);
    try {
      const res = await base44.functions.invoke("awaCovenant", { action: "refund", campaign_id: id });
      alert("Refund broadcast: " + res.data.refund_tx_id);
      load();
    } catch (e) { alert(e?.response?.data?.error || e.message); }
    setBusy(null);
  };

  const copy = (text, tag) => { navigator.clipboard?.writeText(text); setCopied(tag); setTimeout(() => setCopied(""), 1500); };

  if (!campaigns) return <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /></div>;
  if (campaigns.length === 0) return null;

  return (
    <div className="space-y-3">
      {campaigns.map((c) => (
        <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-white text-sm font-bold truncate">{c.description}</div>
              <div className="text-white/40 text-[11px] mt-0.5">{c.platform} · {c.total_kas} KAS · {c.increment_kas} KAS/period · {c.num_epochs} epochs</div>
            </div>
            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black tracking-widest whitespace-nowrap ${STATUS_STYLE[c.status] || ""}`}>
              {(c.status || "").toUpperCase().replace(/_/g, " ")}
            </span>
          </div>

          {c.status === "awaiting_fund" && c.covenant_address && (
            <div className="mt-3 space-y-2">
              <div className="text-[10px] text-white/50 font-bold tracking-widest">FUND THE COVENANT — SEND EXACTLY {c.total_kas} KAS TO</div>
              <button onClick={() => copy(c.covenant_address, c.id)}
                className="w-full flex items-center gap-2 bg-black/40 border border-white/10 hover:border-emerald-400/40 rounded-lg px-3 py-2 text-left">
                <span className="flex-1 text-emerald-300 font-mono text-[10px] break-all">{c.covenant_address}</span>
                {copied === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
              </button>
              <input value={fundTx[c.id] || ""} onChange={(e) => setFundTx({ ...fundTx, [c.id]: e.target.value })}
                placeholder="Paste the 64-hex Kaspa fund transaction id"
                className="w-full bg-black/40 border border-white/10 focus:border-emerald-400/50 rounded-lg px-3 py-2 text-white font-mono text-[11px] outline-none" />
              <button onClick={() => deploy(c.id)} disabled={busy === c.id || !(fundTx[c.id] || "").trim()}
                className="w-full py-2 rounded-lg bg-emerald-500 text-black font-black text-xs hover:bg-emerald-400 disabled:opacity-40 flex items-center justify-center gap-1.5">
                {busy === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} VERIFY ON L1 & ACTIVATE
              </button>
            </div>
          )}

          {(c.status === "active" || c.status === "checking_in") && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white/5 py-2"><div className="text-emerald-300 font-mono font-bold text-sm">{c.current_hop}/{c.num_epochs}</div><div className="text-[9px] text-white/40">check-ins</div></div>
              <div className="rounded-lg bg-white/5 py-2"><div className={`font-mono font-bold text-sm ${c.last_verified_alive ? "text-emerald-300" : "text-white/40"}`}>{c.last_verified_alive ? "LIVE" : "—"}</div><div className="text-[9px] text-white/40">post status</div></div>
              <div className="rounded-lg bg-white/5 py-2"><div className="text-white/70 font-mono text-[10px] truncate">{c.worker_wallet_address ? c.worker_wallet_address.slice(0, 8) + "…" : "—"}</div><div className="text-[9px] text-white/40">worker</div></div>
            </div>
          )}

          {(c.status === "active" || c.status === "checking_in" || c.status === "completed") && (
            <button onClick={() => refund(c.id)} disabled={busy === c.id}
              className="mt-2 text-[10px] text-white/50 hover:text-emerald-300 flex items-center gap-1 disabled:opacity-40">
              <RotateCcw className="w-3 h-3" /> {busy === c.id ? "checking CLTV…" : "Attempt permissionless refund (after CLTV)"}
            </button>
          )}

          {c.refund_tx_id && <div className="mt-2 text-[10px] text-white/40 font-mono">refund tx: {c.refund_tx_id.slice(0, 24)}…</div>}
          {c.check_in_tx_ids?.length > 0 && <div className="mt-1 text-[10px] text-white/40 font-mono">{c.check_in_tx_ids.length} check-in txs</div>}
        </div>
      ))}
    </div>
  );
}