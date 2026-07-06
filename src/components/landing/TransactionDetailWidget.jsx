import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  X, Copy, ExternalLink, ArrowLeftRight, ArrowRight, Search,
  FileText, Check, Wallet, Box, ArrowDownToLine, ArrowUpFromLine,
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

/* ---------- tag component ---------- */
const TAG_STYLES = {
  "Igra L2": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "KRC-20": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Native": "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  "Covenant++": "bg-amber-500/15 text-amber-400 border-amber-500/30",
};
function Tag({ label }) {
  return (
    <span className={`inline-flex items-center text-[9px] px-1.5 py-0.5 rounded border font-medium ${
      TAG_STYLES[label] || TAG_STYLES.Native
    }`}>
      {label}
    </span>
  );
}

/* ---------- copy button ---------- */
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
function Field({ label, value, copy = false }) {
  return (
    <div className="flex items-start gap-1.5 py-1.5">
      <span className="text-[11px] text-zinc-500 shrink-0 min-w-[80px]">{label}</span>
      <code className="flex-1 text-[11px] text-zinc-200 break-all font-mono">
        {value ?? "—"}
      </code>
      {copy && <CopyBtn value={value} />}
    </div>
  );
}

/* ---------- stat chip ---------- */
function Stat({ label, value }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.03] border border-white/5">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <span className="text-[11px] text-zinc-200 font-mono">{value}</span>
    </div>
  );
}

export default function TransactionDetailWidget({ transaction, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runSearch = useCallback(async (query) => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("searchKaspaExplorer", { query });
      const data = res?.data || res;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load the initial transaction if provided
  useEffect(() => {
    if (transaction?.hash) {
      runSearch(transaction.hash);
    }
  }, [transaction?.hash, runSearch]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) runSearch(searchQuery.trim());
  };

  const explorerUrl = result?.type === "transaction"
    ? `https://kaspa.stream/transactions/${result.transaction_id}`
    : result?.type === "address"
    ? `https://kaspa.stream/addresses/${result.address}`
    : result?.type === "block"
    ? `https://kaspa.stream/blocks/${result.hash}`
    : "#";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-white/10 bg-[#161616] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#1c1c1c] shrink-0">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-zinc-100">Transaction</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={onSubmit} className="px-4 py-3 border-b border-white/10 bg-[#1c1c1c] shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transaction, address, or block…"
              className="w-full pl-9 pr-3 py-2 text-[12px] text-zinc-200 placeholder-zinc-600 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              autoFocus
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[9px] text-zinc-600">Try:</span>
            <button type="button" onClick={() => { setSearchQuery("kaspa:qrcuvdgf63a839863m4fnefwnycm7c25g75h0fp7rs8g4kr6e52zqwg9396py"); runSearch("kaspa:qrcuvdgf63a839863m4fnefwnycm7c25g75h0fp7rs8g4kr6e52zqwg9396py"); }} className="text-[9px] text-emerald-500/70 hover:text-emerald-400">address</button>
            <span className="text-[9px] text-zinc-700">·</span>
            <button type="button" onClick={() => { setSearchQuery(transaction?.hash || "97b1e5cb68ccd88d983da4456b3681ab3f59fc6b769625b6dff5c455c039f491"); runSearch(transaction?.hash || "97b1e5cb68ccd88d983da4456b3681ab3f59fc6b769625b6dff5c455c039f491"); }} className="text-[9px] text-emerald-500/70 hover:text-emerald-400">tx hash</button>
          </div>
        </form>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-10 text-sm text-rose-400">{error}</div>
          ) : !result ? (
            <div className="text-center py-10 text-sm text-zinc-500">
              Search for a transaction, address, or block above.
            </div>
          ) : result.type === "transaction" ? (
            <TransactionView data={result} explorerUrl={explorerUrl} />
          ) : result.type === "address" ? (
            <AddressView data={result} explorerUrl={explorerUrl} />
          ) : result.type === "block" ? (
            <BlockView data={result} explorerUrl={explorerUrl} onTxClick={runSearch} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ============ TRANSACTION VIEW ============ */
function TransactionView({ data, explorerUrl }) {
  const totalOut = data.outputs?.reduce((s, o) => s + (o.amount || 0), 0) ?? 0;
  const confirmed = data.is_accepted === true;

  return (
    <>
      {/* Tags */}
      {data.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.tags.map((t) => <Tag key={t} label={t} />)}
          <Tag label="Explorer" />
        </div>
      )}

      {/* Header card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left */}
        <div className="rounded-lg border border-white/[0.06] bg-[#1c1c1c] p-3 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Transaction ID</div>
          <div className="flex items-center gap-2 mb-1">
            <code className="flex-1 font-mono text-[11px] text-emerald-400 break-all">{data.transaction_id}</code>
            <CopyBtn value={data.transaction_id} />
          </div>
          <Field label="First seen" value={fmtTime(data.block_time)} />

          <div className="flex flex-wrap gap-1.5 pt-1.5">
            <Stat label="Version" value={data.version ?? "—"} />
            <Stat label="Inputs" value={data.inputs?.length ?? 0} />
            <Stat label="Outputs" value={data.outputs?.length ?? 0} />
            <Stat label="Mass" value={data.mass ?? "—"} />
          </div>

          <div className="flex items-baseline gap-3 pt-2 border-t border-white/5 mt-1">
            <span className="font-mono text-lg text-emerald-400">{fmtKas(totalOut)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {confirmed ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">Confirmed</span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 font-medium">Pending</span>
            )}
            {data.accepting_block_blue_score != null && (
              <span className="text-[10px] text-zinc-500">
                Blue score <span className="text-zinc-300 font-mono">{data.accepting_block_blue_score}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="rounded-lg border border-white/[0.06] bg-[#1c1c1c] p-3">
          {data.subnetwork_id && <Field label="Subnetwork ID" value={data.subnetwork_id} />}
          {data.hash && <Field label="Hash" value={data.hash} copy />}
          {data.payload && <Field label={`Payload (${Math.ceil(data.payload.length / 2)} bytes)`} value={data.payload.slice(0, 80) + "…"} copy />}
          {data.block_hash?.[0] && <Field label="Seen in block" value={data.block_hash[0]} copy />}
          {data.accepting_block_hash && <Field label="Accepting block" value={data.accepting_block_hash} copy />}
          {data.accepting_block_time && <Field label="Accepted" value={fmtTime(data.accepting_block_time)} />}
        </div>
      </div>

      {/* Inputs & Outputs */}
      <div className="rounded-lg border border-white/[0.06] bg-[#1c1c1c] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
          <FileText className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-300">Inputs & outputs</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch">
          {/* Inputs */}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpFromLine className="w-3 h-3 text-rose-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Inputs</span>
            </div>
            {data.inputs?.length ? data.inputs.map((inp, i) => (
              <div key={i} className="rounded border border-white/5 bg-black/30 p-2">
                <code className="block font-mono text-[10px] text-zinc-400 break-all mb-1">
                  {shortHash(inp.previous_outpoint_hash)} #{inp.previous_outpoint_index ?? 0}
                </code>
                <div className="flex items-center gap-1">
                  <code className="flex-1 font-mono text-[10px] text-zinc-300 break-all">{shortAddr(inp.previous_outpoint_address)}</code>
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
            )) : <div className="text-[11px] text-zinc-600 py-4 text-center">No inputs (coinbase)</div>}
          </div>

          <div className="flex items-center justify-center px-2 sm:border-x border-white/5">
            <ArrowRight className="w-4 h-4 text-zinc-600 hidden sm:block" />
          </div>

          {/* Outputs */}
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-1 mb-1">
              <ArrowDownToLine className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">Outputs</span>
            </div>
            {data.outputs?.length ? data.outputs.map((out, i) => (
              <div key={i} className="rounded border border-white/5 bg-black/30 p-2">
                <code className="block font-mono text-[10px] text-zinc-400 break-all mb-1">
                  {shortHash(data.transaction_id)} #{out.index}
                </code>
                <div className="flex items-center gap-1">
                  <code className="flex-1 font-mono text-[10px] text-zinc-300 break-all">{shortAddr(out.script_public_key_address)}</code>
                  <CopyBtn value={out.script_public_key_address} />
                </div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                    +{fmtKas(out.amount)}
                  </span>
                  {out.script_public_key_type && <span className="text-[10px] text-zinc-500">{out.script_public_key_type}</span>}
                  {confirmed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Accepted</span>}
                </div>
              </div>
            )) : <div className="text-[11px] text-zinc-600 py-4 text-center">No outputs</div>}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <a href={explorerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300">
          View on Kaspa Stream <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </>
  );
}

/* ============ ADDRESS VIEW ============ */
function AddressView({ data, explorerUrl }) {
  const bal = data.balance;
  return (
    <>
      <div className="rounded-lg border border-white/[0.06] bg-[#1c1c1c] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-300">Address</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <code className="flex-1 font-mono text-[11px] text-emerald-400 break-all">{data.address}</code>
          <CopyBtn value={data.address} />
        </div>
        {bal && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-black/30 p-2 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Balance</div>
              <div className="font-mono text-sm text-emerald-400">{fmtKas(bal.balance)}</div>
            </div>
            <div className="rounded bg-black/30 p-2 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Transactions</div>
              <div className="font-mono text-sm text-zinc-200">{bal.txCount}</div>
            </div>
            <div className="rounded bg-black/30 p-2 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Total Received</div>
              <div className="font-mono text-xs text-zinc-300">{fmtKas(bal.totalReceived)}</div>
            </div>
            <div className="rounded bg-black/30 p-2 border border-white/5">
              <div className="text-[10px] uppercase text-zinc-500">Total Sent</div>
              <div className="font-mono text-xs text-zinc-300">{fmtKas(bal.totalSent)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-[#1c1c1c] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
          <FileText className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-300">Recent Transactions</span>
        </div>
        <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
          {data.transactions?.length ? data.transactions.map((tx, i) => (
            <div key={tx.transaction_id || i} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  tx.type === "receive" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                }`}>
                  {tx.type === "receive" ? "IN" : "OUT"}
                </span>
                <code className="font-mono text-[10px] text-zinc-400 truncate">{shortHash(tx.transaction_id, 12, 8)}</code>
                <div className="flex gap-0.5">
                  {tx.tags?.map((t) => <Tag key={t} label={t} />)}
                </div>
              </div>
              <span className={`font-mono text-[11px] shrink-0 ml-2 ${
                tx.type === "receive" ? "text-emerald-400" : "text-rose-400"
              }`}>
                {tx.type === "receive" ? "+" : "−"}{fmtKas(tx.amount)}
              </span>
            </div>
          )) : <div className="px-3 py-6 text-center text-[11px] text-zinc-600">No transactions found</div>}
        </div>
      </div>

      <div className="flex justify-end">
        <a href={explorerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300">
          View on Kaspa Stream <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </>
  );
}

/* ============ BLOCK VIEW ============ */
function BlockView({ data, explorerUrl, onTxClick }) {
  return (
    <>
      <div className="rounded-lg border border-white/[0.06] bg-[#1c1c1c] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Box className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-300">Block</span>
        </div>
        <Field label="Hash" value={data.hash} copy />
        <Field label="Blue score" value={data.blueScore ?? "—"} />
        <Field label="Timestamp" value={fmtTime(data.timestamp)} />
        <Field label="Transactions" value={data.transactionCount ?? 0} />
        {data.isChainBlock != null && (
          <div className="pt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              data.isChainBlock ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-500/15 text-zinc-400"
            }`}>
              {data.isChainBlock ? "Chain Block" : "Non-Chain Block"}
            </span>
          </div>
        )}
      </div>

      {data.transactions?.length > 0 && (
        <div className="rounded-lg border border-white/[0.06] bg-[#1c1c1c] overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-300">Block Transactions</span>
          </div>
          <div className="divide-y divide-white/5">
            {data.transactions.map((txId, i) => (
              <button
                key={i}
                onClick={() => onTxClick(txId)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.02] transition-colors text-left"
              >
                <code className="font-mono text-[10px] text-zinc-400 truncate">{shortHash(txId, 14, 10)}</code>
                <span className="text-[10px] text-emerald-500/70 shrink-0 ml-2">View →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <a href={explorerUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300">
          View on Kaspa Stream <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </>
  );
}