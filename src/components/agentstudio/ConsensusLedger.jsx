import React from "react";
import { ShieldCheck, ShieldX, ExternalLink } from "lucide-react";

export default function ConsensusLedger({ records }) {
  if (!records?.length) return null;

  return (
    <div className="mt-5 space-y-2 max-h-80 overflow-y-auto">
      {records.map((r) => {
        const ok = r.verdict === "verified";
        return (
          <div key={r.id} className={`rounded-xl border p-3 ${ok ? "border-emerald-200 bg-emerald-50/40" : "border-red-200 bg-red-50/40"}`}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${ok ? "text-emerald-600" : "text-red-500"}`}>
                {ok ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldX className="w-3.5 h-3.5" />}
                {ok ? "Verified" : "Rejected"}
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold">
                {r.summarizer_agent_name} → {r.auditor_agent_name}
              </span>
            </div>
            <p className="text-xs text-zinc-700 whitespace-pre-wrap">{r.claim}</p>
            {(r.mismatches || []).map((m, i) => (
              <p key={i} className="text-[11px] text-red-500 mt-1">✕ {m}</p>
            ))}
            {(r.reasons || []).slice(0, 3).map((m, i) => (
              <p key={i} className="text-[11px] text-zinc-500 mt-1">· {m}</p>
            ))}
            <div className="flex flex-wrap gap-3 mt-2">
              <a href={`https://explorer.kaspa.org/txs/${r.subject_tx_id}`} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-zinc-500 hover:underline flex items-center gap-1">
                subject: {r.subject_tx_id.slice(0, 16)}… <ExternalLink className="w-2.5 h-2.5" />
              </a>
              {r.anchor_tx_id && (
                <a href={`https://explorer.kaspa.org/txs/${r.anchor_tx_id}`} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-emerald-600 font-bold hover:underline flex items-center gap-1">
                  sign-off: {r.anchor_tx_id.slice(0, 16)}… <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}