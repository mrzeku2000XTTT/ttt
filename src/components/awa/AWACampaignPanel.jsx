import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ShieldCheck, ArrowRight, Copy, Check, RefreshCw, RotateCcw } from "lucide-react";

const STATUS_STYLE = {
  draft: "bg-secondary",
  open_for_workers: "bg-secondary",
  awaiting_fund: "bg-secondary",
  active: "bg-foreground text-background",
  checking_in: "bg-foreground text-background",
  completed: "bg-foreground text-background",
  refunded: "bg-secondary",
  expired: "border-destructive text-destructive",
};

export default function AWACampaignPanel({ refreshKey, onCountChange }) {
  const [campaigns, setCampaigns] = useState(null);
  const [busy, setBusy] = useState(null);
  const [fundTx, setFundTx] = useState({});
  const [copied, setCopied] = useState("");

  const load = () => {
    base44.functions.invoke("awaCovenant", { action: "campaigns" })
      .then((res) => {
        const nextCampaigns = res.data.campaigns || [];
        setCampaigns(nextCampaigns);
        onCountChange?.(nextCampaigns.length);
      })
      .catch(() => {
        setCampaigns([]);
        onCountChange?.(0);
      });
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

  if (!campaigns) return <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left text-[8px]">
        <thead>
          <tr className="border-b border-border">
            {['Description', 'Platform', 'Total KAS', 'KAS per period', 'Epochs', 'Status', 'Funding Address & TxID', 'Check-ins', 'Post Status', 'Worker', 'Permissionless Refund'].map((label) => <th key={label} className="px-2 py-1 font-black leading-tight">{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <React.Fragment key={c.id}>
              <tr className="border-b border-border align-top">
                <td className="max-w-[190px] truncate px-2 py-1 font-bold">{c.description}</td>
                <td className="px-2 py-1">{c.platform}</td>
                <td className="px-2 py-1 font-bold">{c.total_kas} KAS</td>
                <td className="px-2 py-1">{c.increment_kas} KAS</td>
                <td className="px-2 py-1">{c.num_epochs}</td>
                <td className="px-2 py-1"><span className={`rounded-full border border-border px-1.5 py-0.5 font-bold ${STATUS_STYLE[c.status] || ''}`}>{(c.status || '').toUpperCase().replace(/_/g, ' ')}</span></td>
                <td className="max-w-[170px] truncate px-2 py-1 font-mono">{c.covenant_address || '—'}{c.fund_tx_id ? ` · ${c.fund_tx_id}` : ''}</td>
                <td className="px-2 py-1">{c.current_hop || 0}/{c.num_epochs}</td>
                <td className="px-2 py-1">{c.last_verified_alive ? 'LIVE' : '—'}</td>
                <td className="max-w-[90px] truncate px-2 py-1 font-mono">{c.worker_wallet_address || '—'}</td>
                <td className="px-2 py-1">{c.refund_tx_id ? 'REFUNDED' : '—'}</td>
              </tr>
              {c.status === 'awaiting_fund' && c.covenant_address && (
                <tr className="border-b border-border"><td colSpan="11" className="p-2">
                  <div className="grid items-center gap-1.5 sm:grid-cols-[1fr_1fr_auto]">
                    <button onClick={() => copy(c.covenant_address, c.id)} className="flex min-w-0 items-center gap-1 rounded border border-border bg-background px-2 py-1 text-left font-mono text-[8px]"><span className="truncate">Send exactly {c.total_kas} KAS to {c.covenant_address}</span>{copied === c.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}</button>
                    <input value={fundTx[c.id] || ''} onChange={(e) => setFundTx({ ...fundTx, [c.id]: e.target.value })} placeholder="Paste the 64-hex Kaspa fund transaction id" className="min-w-0 rounded border border-border bg-background px-2 py-1 font-mono text-[8px] outline-none" />
                    <button onClick={() => deploy(c.id)} disabled={busy === c.id || !(fundTx[c.id] || '').trim()} className="rounded bg-primary px-2 py-1 text-[8px] font-black text-primary-foreground disabled:opacity-40">{busy === c.id ? <Loader2 className="inline h-3 w-3 animate-spin" /> : <ShieldCheck className="mr-1 inline h-3 w-3" />}VERIFY ON L1 &amp; ACTIVATE</button>
                  </div>
                </td></tr>
              )}
              {(c.status === 'active' || c.status === 'checking_in' || c.status === 'completed') && (
                <tr className="border-b border-border"><td colSpan="11" className="px-2 py-1">
                  <button onClick={() => refund(c.id)} disabled={busy === c.id} className="text-[8px] font-bold disabled:opacity-40"><RotateCcw className="mr-1 inline h-3 w-3" />{busy === c.id ? 'Checking CLTV…' : 'Attempt permissionless refund after CLTV'}</button>
                </td></tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}