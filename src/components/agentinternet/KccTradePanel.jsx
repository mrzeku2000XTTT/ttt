import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, Wallet, Info, ExternalLink } from "lucide-react";
import AgentWalletBar from "./AgentWalletBar";

/**
 * KccTradePanel — honest trade entry for a KCC-20 token.
 *
 * KCC-20 trading is on-chain Kaspa L1 covenant-based and wallet-signed. There is
 * no hosted KRON/Kascov REST API that executes buy/sell/limit orders server-side,
 * so this panel does NOT fake buttons that can't fire. It shows the connected TTT
 * wallet balance (so the user knows what they can spend) and links to the real
 * platforms where the trade actually happens — KRON (bonding curve), Kascov
 * (covenant explorer) and KaspaCom (order-book limit orders).
 */
export default function KccTradePanel({ token, onClose }) {
  return (
    <AnimatePresence>
      {token && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[320] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-zinc-950 border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
              <span className="text-white font-bold text-sm">Trade ${token.tick}</span>
              <span className="ml-auto text-[10px] text-white/30 font-mono">KCC-20</span>
            </div>

            {/* Connected TTT wallet — same bar used in AI chat, PIN/local-key based */}
            <AgentWalletBar />

            <div className="px-4 py-4 space-y-4">
              <div className="rounded-xl bg-cyan-500/[0.06] border border-cyan-400/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="text-[11px] font-semibold text-cyan-200">{token.name} · ${token.tick}</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Dev holding {token.dev_holding_pct != null ? `${token.dev_holding_pct}%` : "—"}
                  {token.dev_amount != null ? ` · ${Number(token.dev_amount).toLocaleString()} ${token.tick}` : ""}
                  {" · "}sentiment {token.sentiment}.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-white/70 font-semibold">Trade on the real platform</p>
                <TradeLink
                  href={token.kron_url}
                  title="KRON"
                  desc="Bonding-curve buy/sell on Kaspa L1. Connect a Kaspa wallet (Kasware/Zelcore) there to sign the trade."
                />
                <TradeLink
                  href={token.kascov_url}
                  title="Kascov"
                  desc="Covenant explorer — inspect the curve, supply and live transitions for this token."
                />
                <TradeLink
                  href="https://kaspacom.com"
                  title="KaspaCom"
                  desc="Order-book KCC-20 trading with limit + market orders (wallet-signed, on-chain)."
                />
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-amber-500/[0.06] border border-amber-400/20 p-2.5">
                <Info className="w-3.5 h-3.5 text-amber-300 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-200/80 leading-relaxed">
                  KCC-20 trades are signed by your own wallet on Kaspa L1 — no server-side
                  API can place them for you, and there is no fee-based KRON trading SDK.
                  In-app wallet-signed covenant trading (buy/sell/limit with the TTT wallet +
                  PIN) is a separate, larger build. This panel gives you the live data and
                  sends you to where the real trade happens.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const TradeLink = ({ href, title, desc }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="block rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-400/30 p-3 transition-colors"
  >
    <div className="flex items-center gap-2 mb-0.5">
      <span className="text-white text-[12px] font-semibold">{title}</span>
      <ArrowUpRight className="w-3.5 h-3.5 text-cyan-300 ml-auto" />
    </div>
    <p className="text-[10px] text-white/50 leading-relaxed">{desc}</p>
  </a>
);