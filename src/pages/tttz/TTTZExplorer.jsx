import React, { useState } from "react";
import { Search, ExternalLink, CheckCircle, XCircle } from "lucide-react";

const COVENANTS = [
  {
    txid: "a39f870f",
    name: "First Toccata v1 Covenant Genesis",
    amount: 0.01,
    status: "spent",
    type: "ZKVault",
    covenantId: "CVT-001",
  },
  {
    txid: "57a50540",
    name: "First v1 Covenant Spend",
    amount: null,
    status: "spent",
    type: "ZKVault",
    covenantId: "CVT-001",
    note: "Returned to wallet",
  },
  {
    txid: "e6cf5a6d40d2977d3b2f7a79b2819841da77a1b3905615c1b907bc378db7f963",
    name: "TTT v2 Deployment",
    amount: 1.0,
    status: "active",
    type: "ZKCounter",
    covenantId: "TTT-v2",
    note: "Reclaimed",
  },
  {
    txid: "617ba6b9",
    name: "Wallet Consolidation",
    amount: 6.71,
    status: "active",
    type: "Consolidation",
    covenantId: "—",
  },
];

const FILTERS = ["All", "Active", "Spent"];

export default function TTTZExplorer() {
  const [filter, setFilter] = useState("All");

  const filtered = COVENANTS.filter(c => {
    if (filter === "All") return true;
    return c.status === filter.toLowerCase();
  });

  return (
    <div className="space-y-5 pt-6">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5" style={{ color: "#00ffcc" }} />
        <h2 className="text-xl font-bold" style={{ color: "#e0e0e0" }}>Covenant Explorer</h2>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              background: filter === f ? "rgba(0,255,204,0.08)" : "transparent",
              color: filter === f ? "#00ffcc" : "#555",
              border: filter === f ? "1px solid rgba(0,255,204,0.2)" : "1px solid #1a1a1a",
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1a1a1a" }}>
        {/* Desktop header */}
        <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider"
          style={{ background: "#0d0d0d", color: "#444", borderBottom: "1px solid #1a1a1a" }}>
          <div className="col-span-3">Transaction</div>
          <div className="col-span-4">Covenant</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-1">KAS</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {filtered.map((c, i) => (
          <a key={i} href={`https://kaspa.stream/txs/${c.txid}`} target="_blank" rel="noopener noreferrer"
            className="block sm:grid sm:grid-cols-12 sm:gap-2 px-4 py-3 group transition-colors hover:bg-[#0f0f0f]"
            style={{ borderBottom: i < filtered.length - 1 ? "1px solid #1a1a1a" : "none" }}>
            {/* TX */}
            <div className="sm:col-span-3 mb-2 sm:mb-0">
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs" style={{ color: "#00ffcc" }}>
                  {c.txid.slice(0, 16)}{c.txid.length > 16 ? "..." : ""}
                </span>
                <ExternalLink className="w-3 h-3 opacity-30 group-hover:opacity-100" style={{ color: "#666" }} />
              </div>
              <div className="sm:hidden text-[10px] font-mono mt-0.5" style={{ color: "#444" }}>{c.covenantId}</div>
            </div>

            {/* Covenant Name */}
            <div className="sm:col-span-4 mb-2 sm:mb-0">
              <span className="text-xs" style={{ color: "#aaa" }}>{c.name}</span>
              {c.note && <span className="block text-[10px] font-mono" style={{ color: "#555" }}>{c.note}</span>}
              <div className="sm:hidden text-[10px] font-mono mt-0.5" style={{ color: "#555" }}>{c.type}</div>
            </div>

            {/* Type (desktop) */}
            <div className="hidden sm:flex sm:col-span-2 items-center">
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded" style={{ background: "#111", color: "#888" }}>
                {c.type}
              </span>
            </div>

            {/* Amount */}
            <div className="hidden sm:flex sm:col-span-1 items-center font-mono text-xs" style={{ color: "#777" }}>
              {c.amount !== null ? c.amount.toFixed(2) : "—"}
            </div>

            {/* Status */}
            <div className="sm:col-span-2 sm:flex sm:justify-end flex items-center gap-1">
              {c.status === "active" ? (
                <><CheckCircle className="w-3.5 h-3.5" style={{ color: "#00ffcc" }} /><span className="text-xs font-medium" style={{ color: "#00ffcc" }}>Active</span></>
              ) : (
                <><XCircle className="w-3.5 h-3.5" style={{ color: "#ff6666" }} /><span className="text-xs font-medium" style={{ color: "#ff6666" }}>Spent</span></>
              )}
            </div>
          </a>
        ))}
      </div>

      <p className="text-center text-[10px] font-mono" style={{ color: "#333" }}>
        Showing {filtered.length} of {COVENANTS.length} covenants · Click any row to view on kaspa.stream
      </p>
    </div>
  );
}