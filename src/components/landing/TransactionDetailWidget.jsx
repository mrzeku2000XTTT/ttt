import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { X, ArrowDownToLine, ArrowUpFromLine, ShieldCheck, Copy, ExternalLink, Activity } from "lucide-react";

function fmtAmount(amt) {
  if (amt == null || isNaN(amt)) return "—";
  return `${parseFloat(amt).toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS`;
}

function fmtTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts > 1e12 ? ts : ts * 1000);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function shortAddr(addr) {
  if (!addr) return "—";
  const a = String(addr).replace(/^kaspa:/, "");
  return a.length > 14 ? `kaspa:${a.slice(0, 6)}…${a.slice(-6)}` : `kaspa:${a}`;
}

export default function TransactionDetailWidget({ transaction, onClose }) {
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [copied, setCopied] = useState(false);

  const lookupAddress = transaction?.to || transaction?.from;

  const loadRecent = useCallback(async () => {
    if (!lookupAddress) {
      setLoadingRecent(false);
      return;
    }
    setLoadingRecent(true);
    try {
      const res = await base44.functions.invoke("getKaspaTransactionHistory", {
        address: lookupAddress,
      });
      const list = res?.data?.transactions || res?.transactions || [];
      setRecent(Array.isArray(list) ? list.slice(0, 12) : []);
    } catch (e) {
      setRecent([]);
    } finally {
      setLoadingRecent(false);
    }
  }, [lookupAddress]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copyId = () => {
    if (!transaction?.hash) return;
    navigator.clipboard?.writeText(transaction.hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const covenantReady = Boolean(
    transaction?.from && transaction?.to && transaction?.amount != null
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl border border-amber-400/30 bg-zinc-950/95 shadow-[0_0_40px_rgba(253,185,49,0.15)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-400/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-xs tracking-widest text-amber-400 uppercase">
              Transaction
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-3.5rem)] px-4 py-4 space-y-4">
          {/* Transaction ID */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
              Transaction ID
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-[11px] text-amber-200 break-all">
                {transaction?.hash || "—"}
              </code>
              <button
                onClick={copyId}
                className="shrink-0 text-zinc-400 hover:text-amber-400 transition-colors"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && (
              <span className="text-[10px] text-emerald-400">Copied!</span>
            )}
          </div>

          {/* Input / Output grid */}
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <ArrowUpFromLine className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Input
                </div>
                <div className="font-mono text-[11px] text-zinc-300 break-all">
                  {shortAddr(transaction?.from)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                  Output
                </div>
                <div className="font-mono text-[11px] text-zinc-300 break-all">
                  {shortAddr(transaction?.to)}
                </div>
              </div>
            </div>
          </div>

          {/* Amount + Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
                Amount
              </div>
              <div className="font-mono text-sm text-amber-300">
                {fmtAmount(transaction?.amount)}
              </div>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
                Timestamp
              </div>
              <div className="text-[11px] text-zinc-300">
                {fmtTime(transaction?.timestamp)}
              </div>
            </div>
          </div>

          {/* Covenant++ ready */}
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.04] px-3 py-2">
            <ShieldCheck
              className={`w-4 h-4 shrink-0 ${
                covenantReady ? "text-emerald-400" : "text-zinc-500"
              }`}
            />
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                Covenant++ Ready
              </div>
              <div
                className={`text-xs font-medium ${
                  covenantReady ? "text-emerald-400" : "text-zinc-400"
                }`}
              >
                {covenantReady
                  ? "Inputs/outputs resolved — scriptable"
                  : "Awaiting on-chain resolution"}
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                covenantReady ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
              }`}
            />
          </div>

          {/* Recent transactions of address */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                Recent Txs of Address
              </span>
              <a
                href={`https://kaspa.fyi/addresses/${
                  String(lookupAddress || "").replace(/^kaspa:/, "")
                }`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300"
              >
                Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="rounded-lg border border-white/5 bg-black/40 divide-y divide-white/5 max-h-52 overflow-y-auto">
              {loadingRecent ? (
                <div className="px-3 py-6 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                </div>
              ) : recent.length === 0 ? (
                <div className="px-3 py-6 text-center text-[11px] text-zinc-500">
                  No recent transactions found
                </div>
              ) : (
                recent.map((tx, i) => (
                  <div
                    key={tx.id || i}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          tx.type === "receive"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {tx.type === "receive" ? "IN" : "OUT"}
                      </span>
                      <code className="font-mono text-[10px] text-zinc-400 truncate">
                        {shortAddr(tx.counterpartyAddress)}
                      </code>
                    </div>
                    <span
                      className={`font-mono text-[11px] shrink-0 ml-2 ${
                        tx.type === "receive"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {tx.type === "receive" ? "+" : "−"}
                      {fmtAmount(tx.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}