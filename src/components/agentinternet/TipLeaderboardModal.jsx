import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

/** Most-tipped listings and Kaspians, ranked by total KAS received. */
export default function TipLeaderboardModal({ open, onClose }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (!open) return;
    setRows(null);
    base44.entities.TipTransaction.list("-created_date", 1000)
      .then(tips => {
        const map = new Map();
        (tips || []).forEach(t => {
          if (!t.recipient_wallet) return;
          const key = t.recipient_wallet;
          const cur = map.get(key) || { name: t.recipient_name || key, wallet: key, total: 0, count: 0 };
          cur.total += Number(t.amount) || 0;
          cur.count += 1;
          if (t.recipient_name) cur.name = t.recipient_name;
          map.set(key, cur);
        });
        setRows([...map.values()].sort((a, b) => b.total - a.total).slice(0, 25));
      })
      .catch(() => setRows([]));
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[315] bg-black/95 backdrop-blur-xl flex flex-col"
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-white font-bold text-sm">Tip Leaderboard</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-2xl mx-auto space-y-2">
              {rows === null ? (
                <div className="flex items-center gap-2 text-white/40 text-xs justify-center py-10">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading tips…
                </div>
              ) : rows.length === 0 ? (
                <p className="text-white/40 text-xs text-center py-10">No tips yet — be the first to tip a verified Kaspian.</p>
              ) : (
                rows.map((r, i) => (
                  <div key={r.wallet} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
                    <span className={`w-6 text-center font-mono text-xs ${i === 0 ? "text-amber-300" : i < 3 ? "text-white/70" : "text-white/30"}`}>{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-[13px] truncate">{r.name}</p>
                      <p className="text-white/30 text-[10px] font-mono truncate">{r.wallet}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-amber-300 text-[13px] font-semibold">{r.total.toLocaleString()} KAS</p>
                      <p className="text-white/30 text-[10px]">{r.count} tip{r.count === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}