import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Loader2, Search, Wallet } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getCharges, getSearchWallet, subscribe } from '@/lib/searchKaspaWallet';

const EXPLORER_TX = (txId) => `https://explorer.kaspa.org/transactions/${txId}`;

function fmtTime(at) {
  try {
    return new Date(at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function shortId(id) {
  const s = String(id || '');
  return s.length > 20 ? `${s.slice(0, 10)}…${s.slice(-6)}` : s;
}

const rowClass = 'flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition-colors hover:bg-white/[0.07] active:scale-[0.99]';

/** Transactions tab — search fees paid (each with its on-chain tx id) + wallet history. */
export default function SearchTransactionsTab() {
  const [wallet, setWallet] = useState(() => getSearchWallet());
  const [charges, setCharges] = useState(() => getCharges());
  const [chain, setChain] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadChain = useCallback(async () => {
    const w = getSearchWallet();
    if (!w?.address) return;
    setLoading(true);
    try {
      const raw = await base44.functions.invoke('getKaspaTransactionHistory', { address: w.address });
      const res = raw?.data ?? raw;
      setChain((res?.transactions || []).map((t) => ({ ...t, at: t.timestamp ? new Date(t.timestamp).getTime() : 0 })));
    } catch { /* keep what we have */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadChain();
    return subscribe(() => { setWallet(getSearchWallet()); setCharges(getCharges()); });
  }, [loadChain]);

  if (!wallet) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
        <Wallet className="mx-auto h-6 w-6 text-white/30" />
        <p className="mt-2 text-sm text-white/50">Create your Search Kaspa wallet to track fees and transactions.</p>
      </div>
    );
  }

  const rows = [
    ...charges.map((c) => ({ kind: 'fee', key: c.id, at: c.at, charge: c })),
    ...chain.map((t) => ({ kind: 'chain', key: t.id || t.hash || Math.random(), at: t.at, tx: t })),
  ].filter((r) => r.at).sort((a, b) => b.at - a.at);

  const feeTotal = charges.reduce((s, c) => s + (c.feeKas || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Searches paid</p>
          <p className="text-sm font-medium text-white/80">{wallet.searches || 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Fees spent</p>
          <p className="text-sm font-medium text-white/80">{feeTotal.toFixed(4)} KAS</p>
        </div>
      </div>

      {loading && rows.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-white/40">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" /> Loading transactions…
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-sm text-white/50">No transactions yet — fund your wallet and run a search to see fees here.</p>
        </div>
      )}

      <div className="space-y-2">
        {rows.map((row) => row.kind === 'fee' ? (
          row.charge.txId ? (
            <a key={row.key} href={EXPLORER_TX(row.charge.txId)} target="_blank" rel="noopener noreferrer" className={rowClass}>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
                <Search className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-white">Search fee{row.charge.query ? ` · ${row.charge.query}` : ''}</p>
                <p className="truncate font-mono text-[10px] text-white/40">{shortId(row.charge.txId)}</p>
                <p className="text-[10px] text-white/30">{fmtTime(row.at)}</p>
              </div>
              <span className="flex-shrink-0 text-[12px] font-medium text-cyan-300">−{row.charge.feeKas} KAS</span>
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-white/30" />
            </a>
          ) : (
            <div key={row.key} className={rowClass}>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
                <Search className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-white">Search fee{row.charge.query ? ` · ${row.charge.query}` : ''}</p>
                <p className="text-[10px] text-white/30">{fmtTime(row.at)} · settling on-chain…</p>
              </div>
              <span className="flex-shrink-0 text-[12px] font-medium text-cyan-300">−{row.charge.feeKas} KAS</span>
            </div>
          )
        ) : (
          <a key={row.key} href={EXPLORER_TX(row.tx.id)} target="_blank" rel="noopener noreferrer" className={rowClass}>
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border ${row.tx.type === 'receive' ? 'border-emerald-400/30 bg-emerald-500/15' : 'border-rose-400/30 bg-rose-500/15'}`}>
              {row.tx.type === 'receive'
                ? <ArrowDownLeft className="h-4 w-4 text-emerald-300" />
                : <ArrowUpRight className="h-4 w-4 text-rose-300" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-white">{row.tx.type === 'receive' ? 'Received' : 'Sent'}</p>
              <p className="truncate font-mono text-[10px] text-white/40">{shortId(row.tx.id)}</p>
              <p className="text-[10px] text-white/30">{fmtTime(row.at)}</p>
            </div>
            <span className={`flex-shrink-0 text-[12px] font-medium ${row.tx.type === 'receive' ? 'text-emerald-300' : 'text-rose-300'}`}>
              {row.tx.type === 'receive' ? '+' : '−'}{row.tx.amount} KAS
            </span>
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-white/30" />
          </a>
        ))}
      </div>
    </div>
  );
}