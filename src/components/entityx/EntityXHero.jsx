import React from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowDownLeft, ArrowUpRight, Copy, Check } from "lucide-react";

export default function EntityXHero({ data, loading }) {
  const [copied, setCopied] = React.useState(false);

  const copyAddr = () => {
    if (!data?.address) return;
    navigator.clipboard.writeText(data.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] p-10 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#7C5CFC]" />
      </div>
    );
  }

  if (!data?.success) {
    return (
      <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] p-8 text-center text-sm text-[#F96B4C]">
        Could not load Entity X data right now. Try refreshing.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Balance */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-[#4A2FA8] to-[#3D2E7C] rounded-[28px] shadow-[0_20px_50px_rgba(61,46,124,0.4)] p-8 text-white"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-[#5CE1A4] animate-pulse" />
          <span className="text-[10px] font-display font-extrabold uppercase tracking-widest text-white/60">Live On-Chain Balance</span>
        </div>
        <div className="font-display text-4xl md:text-5xl font-black leading-none mb-1">
          {data.balanceKas?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          <span className="text-xl text-white/60 ml-2">KAS</span>
        </div>
        {data.balanceUsd && (
          <div className="text-sm text-[#B9A8F5] mb-5">≈ ${data.balanceUsd.toLocaleString()} USD @ ${data.priceUsd?.toFixed(4)}</div>
        )}
        <button onClick={copyAddr} className="flex items-center gap-2 text-[10px] font-mono text-white/50 hover:text-white/80 break-all text-left">
          {copied ? <Check className="w-3 h-3 flex-shrink-0 text-[#5CE1A4]" /> : <Copy className="w-3 h-3 flex-shrink-0" />}
          {data.address}
        </button>
      </motion.div>

      {/* Recent transactions */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] p-6"
      >
        <h3 className="font-display text-sm font-black text-[#3D2E7C] uppercase tracking-widest mb-4">Recent Movements</h3>
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {(data.recent || []).map((tx) => (
            <a
              key={tx.txId}
              href={`https://explorer.kaspa.org/txs/${tx.txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-[14px] bg-[#F3F0FA] hover:bg-[#EBE6F8] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${tx.direction === "in" ? "bg-[#E4F7EC] text-[#1E9E5A]" : "bg-[#FFF1E9] text-[#F96B4C]"}`}>
                  {tx.direction === "in" ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                </span>
                <div className="min-w-0">
                  <div className={`text-xs font-display font-extrabold ${tx.direction === "in" ? "text-[#1E9E5A]" : "text-[#F96B4C]"}`}>
                    {tx.direction === "in" ? "+" : "−"}{tx.amountKas.toLocaleString(undefined, { maximumFractionDigits: 2 })} KAS
                  </div>
                  <div className="text-[9px] font-mono text-[#8B84A3] truncate">{tx.txId.slice(0, 20)}…</div>
                </div>
              </div>
              <span className="text-[9px] text-[#8B84A3] flex-shrink-0">
                {tx.time ? new Date(tx.time).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
              </span>
            </a>
          ))}
          {(!data.recent || data.recent.length === 0) && (
            <div className="text-xs text-[#8B84A3] text-center py-6">No recent movements found.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}