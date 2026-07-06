import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, Copy, ExternalLink, ArrowLeftRight, ArrowRight,
  FileText, QrCode, Check,
} from "lucide-react";

/* ---------- helpers ---------- */
function fmtKas(amt) {
  if (amt == null || isNaN(amt)) return "—";
  return `${parseFloat(amt).toLocaleString(undefined, { maximumFractionDigits: 8 })} KAS`;
}
function fmtTime(ms) {
  if (!ms) return "—";
  const d = new Date(ms > 1e12 ? ms : ms * 1000);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}
function shortHash(h, head = 10, tail = 8) {
  if (!h) return "—";
  const s = String(h);
  return s.length > head + tail ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;
}
function shortAddr(a) {
  if (!a) return "—";
  const s = String(a).replace(/^kaspa:/, "");
  return s.length > 14 ? `kaspa:${s.slice(0, 6)}…${s.slice(-6)}` : `kaspa:${s}`;
}

/* ---------- tiny copy button ---------- */
function CopyBtn({ value, className = "" }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      className={`shrink-0 text-zinc-500 hover:text-emerald-400 transition-colors ${className}`}
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

/* ---------- field row ---------- */
function Field({ label, value, mono = true, copy = false }) {
  return (
    <div className="flex items-start gap-1.5 py-1.5">
      <span className="text-[11px] text-zinc-500 shrink-0 min-w-[70px]">{label}</span>
      <code className={`flex-1 text-[11px] text-zinc-200 break-all ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </code>
      {copy && <CopyBtn value={value} />}
    </div>
  );
}

/* ---------- stat chip ---------- */
function Stat({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.03] border border-white/5">
      {Icon && <Icon className="w-3 h-3 text-zinc-500" />}
      <span className="text-[10px] text-zinc-500">{label}</span>
      <span className="text-[11px] text-zinc-200 font-mono">{value}</span>
    </div>
  );
}

export default function TransactionDetailWidget({ transaction, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const txId = transaction?.hash;

  const loadDetail = useCallback(async () => {
    if (!txId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getKaspaTransactionDetails", { txId });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      setDetail(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [txId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copyId = () => {
    if (!txId) return;
    navigator.clipboard?.writeText(txId).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1500);
    });
  };

  // derived
  const totalOut = detail?.outputs?.reduce((s, o) => s + (o.amount || 0), 0) ?? transaction?.amount;
  const confirmed = detail?.is_accepted === true;
  const explorerUrl = `https://kaspa.stream/transactions/${txId}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-white/10 bg-[#151515] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#1c1c1c]">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-zinc-100">Transaction</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-3.5rem)] px-4 py-4 space-y-4">

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-sm text-rose-400">{error}</div>
          ) : detail ? (
            <>
              {/* ── Two-column header ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left column */}
                <div className="rounded-lg border border-white/[0.06] bg-[#1c1c1c] p-3 space-y-1">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Transaction ID</div>
                  <div className="flex items-center gap-2 mb-1">
                    <code className="flex-1 font-mono text-[11px] text-emerald-300 break-all">{txId}</code>
                    <CopyBtn value={txId} />
                    <a href={explorerUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-emerald-400">
                      <QrCode className="w-3 h-3" />
                    </a>
                  </div>

                  <Field label="First seen" value={fmtTime(detail.block_time)} mono={false} />

                  {/* stats row */}
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    <Stat label="Version" value={detail.version ?? "—"} />
                    <Stat label="Inputs" value={detail.inputs?.length ?? 0} />
                    <Stat label="Outputs" value={detail.outputs?.length ?? 0} />
                    <Stat label="Mass" value={detail.mass ?? "—"} />
                  </div>

                  {/* transacted */}
                  <div className="flex items-baseline gap-3 pt-2 border-t border-white/5 mt-1">
                    <span className="font-mono text-lg text-emerald-400">{fmtKas(totalOut)}</span>
                  </div>

                  {/* status */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {confirmed ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                        Confirmed
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 font-medium">
                        Pending
                      </span>
                    )}
                    {detail.accepting_block_blue_score != null && (
                      <span className="text-[10px] text-zinc-500">
                        Blue score <span className="text-zinc-300 font-mono">{detail.accepting_block_blue_score}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right column */}
                <div className="rounded-lg border border-white/[0.06] bg-[#1c1c1c] p-3">
                  {detail.subnetwork_id && (
                    <Field label="Subnetwork ID" value={detail.subnetwork_id} />
                  )}
                  {detail.hash && (
                    <Field label="Hash" value={detail.hash} copy />
                  )}
                  {detail.payload && (
                    <Field label={`Payload (${Math.ceil(detail.payload.length / 2)} bytes)`} value={detail.payload.slice(0, 80) + "…"} copy />
                  )}
                  {detail.block_hash?.[0] && (
                    <Field label="Seen in block" value={detail.block_hash[0]} copy />
                  )}
                  {detail.accepting_block_hash && (
                    <Field label="Accepting block" value={detail.accepting_block_hash} copy />
                  )}
                  {detail.accepting_block_time && (
                    <Field label="Accepted" value={fmtTime(detail.accepting_block_time)} mono={false} />
                  )}
                </div>
              </div>

              {/* ── Inputs & Outputs ── */}
              <div className="rounded-lg border border-white/[0.06] bg-[#1c1c1c] overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-300">Inputs & outputs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch">
                  {/* Inputs */}
                  <div className="p-3 space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Inputs</div>
                    {detail.inputs?.length ? detail.inputs.map((inp, i) => (
                      <div key={i} className="rounded border border-white/5 bg-black/30 p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <code className="flex-1 font-mono text-[10px] text-zinc-400 break-all">
                            {shortHash(inp.previous_outpoint_hash)} #{inp.previous_outpoint_index ?? 0}
                          </code>
                        </div>
                        <div className="flex items-center gap-1">
                          <code className="flex-1 font-mono text-[10px] text-zinc-300 break-all">
                            {shortAddr(inp.previous_outpoint_address)}
                          </code>
                          <CopyBtn value={inp.previous_outpoint_address} />
                        </div>
                        {inp.previous_outpoint_amount != null && (
                          <div className="mt-1">
                            <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400">
                              −{fmtKas(inp.previous_outpoint_amount / 1e8)}
                            </span>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="text-[11px] text-zinc-600 py-4 text-center">No inputs (coinbase)</div>
                    )}
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center px-2 sm:border-x border-white/5">
                    <ArrowRight className="w-4 h-4 text-zinc-600 hidden sm:block" />
                  </div>

                  {/* Outputs */}
                  <div className="p-3 space-y-2">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Outputs</div>
                    {detail.outputs?.length ? detail.outputs.map((out, i) => (
                      <div key={i} className="rounded border border-white/5 bg-black/30 p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <code className="flex-1 font-mono text-[10px] text-zinc-400 break-all">
                            {shortHash(txId)} #{out.index}
                          </code>
                        </div>
                        <div className="flex items-center gap-1">
                          <code className="flex-1 font-mono text-[10px] text-zinc-300 break-all">
                            {shortAddr(out.script_public_key_address)}
                          </code>
                          <CopyBtn value={out.script_public_key_address} />
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                            +{fmtKas(out.amount)}
                          </span>
                          {out.script_public_key_type && (
                            <span className="text-[10px] text-zinc-500">{out.script_public_key_type}</span>
                          )}
                          {confirmed && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                              Accepted
                            </span>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-[11px] text-zinc-600 py-4 text-center">No outputs</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Explorer link */}
              <div className="flex justify-end">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  View on Kaspa Stream <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-sm text-zinc-500">No data</div>
          )}
        </div>
      </div>
    </div>
  );
}