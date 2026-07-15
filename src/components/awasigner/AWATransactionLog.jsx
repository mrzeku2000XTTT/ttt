import React from "react";
import { ExternalLink, History } from "lucide-react";

export default function AWATransactionLog({ transactions }) {
  return (
    <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
        <History className="w-4 h-4 text-cyan-400" /> Transaction Log
      </h2>
      {transactions.length === 0 ? (
        <p className="text-sm text-zinc-500 py-8 text-center">No AWA payments yet. Complete a payment above to see it here.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 text-xs border-b border-white/10">
                <th className="pb-3 pr-4 font-semibold">DATE</th>
                <th className="pb-3 pr-4 font-semibold">SERVICE</th>
                <th className="pb-3 pr-4 font-semibold">AMOUNT (KAS)</th>
                <th className="pb-3 pr-4 font-semibold">TX ID</th>
                <th className="pb-3 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr
                  key={i}
                  onClick={() => window.open(`https://explorer.kaspa.org/txs/${tx.tx_id}`, "_blank")}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="py-3 pr-4 text-zinc-300 whitespace-nowrap">{new Date(tx.date).toLocaleString()}</td>
                  <td className="py-3 pr-4 text-white">{tx.service}</td>
                  <td className="py-3 pr-4 text-cyan-400 font-mono">{tx.amount_kas}</td>
                  <td className="py-3 pr-4 text-zinc-400 font-mono text-xs">
                    <span className="flex items-center gap-1">
                      {tx.tx_id.slice(0, 12)}…{tx.tx_id.slice(-6)}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">
                      {tx.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}