import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Clock, Users, Coins, KeyRound, GitBranch, Lock, EyeOff } from "lucide-react";

// Plain-language covenant analysis card for the Slobz Tx Tracker.
export default function SlobzCovenantCard({ covenant, plain }) {
  if (!covenant && (!plain || !plain.covenant || !plain.covenant.isCovenant)) return null;
  const p = plain && plain.covenant ? plain.covenant : {};
  const isUnrevealed = covenant && covenant.role === 'funding-terms-unrevealed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[#2a1f5a] to-[#1a1230] rounded-[24px] border-2 border-[#7C5CFC]/40 shadow-[0_12px_32px_rgba(124,92,252,0.28)] p-5 md:p-6 mt-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-[#B89BFF]" />
        <h3 className="font-display font-black text-lg text-[#E9DEFF]">Covenant detected</h3>
        <span className="ml-auto text-[9px] tracking-[0.25em] font-bold text-[#B89BFF] bg-[#7C5CFC]/20 border border-[#7C5CFC]/40 rounded-full px-2 py-0.5">
          {isUnrevealed ? 'P2SH · HIDDEN' : 'P2SH · DECODED'}
        </span>
      </div>

      <p className="text-sm text-[#E9DEFF] font-semibold mb-4">
        {p.friendlyType || (covenant && covenant.estimatedType) || 'A Kaspa covenant (smart contract on the script layer).'}
      </p>

      {isUnrevealed && (
        <div className="flex items-start gap-2 text-[12px] text-[#C9B8FF] bg-[#7C5CFC]/15 border border-[#7C5CFC]/30 rounded-[14px] p-3 mb-4">
          <EyeOff className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>The exact covenant terms are <b>hidden until it gets spent</b> — Kaspa only reveals the redeem script when someone moves these funds. We scanned the address history and no spend was found yet, so the precise time-lock / signer count stays private for now.</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Fact icon={Clock} label="Time-lock" value={p.timelock || (covenant && covenant.timelockHuman) || 'none'} />
        <Fact icon={Users} label="Who signs" value={p.participants || (covenant && covenant.hasMultisig ? ((covenant.multisig.m || '?') + '-of-' + (covenant.multisig.n || covenant.pubkeyCount || '?')) : (covenant && covenant.checkSigCount ? covenant.checkSigCount + ' signer' : 'unknown'))} />
        <Fact icon={Coins} label="Amount" value={p.amount || (covenant && covenant.amount ? Number(covenant.amount).toFixed(6) + ' KAS' : 'unknown')} />
        <Fact icon={GitBranch} label="Structure" value={(covenant && covenant.hasBranching ? 'branching ' : '') + (p.kind || 'single path')} />
      </div>

      <div className="flex items-start gap-2 mt-3 text-[12px] text-[#E9DEFF]/80 bg-black/20 rounded-[14px] p-3">
        <KeyRound className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#B89BFF]" />
        <span><b>Who can spend:</b> {p.whoCanSpend || 'See the conditions above — the covenant releases funds only when its on-chain rules are met (signature, time-lock expiry, or both).'}</span>
      </div>

      {covenant && covenant.redeemScriptHash && (
        <div className="flex items-center gap-2 mt-3 text-[10px] text-[#9A8AD0] font-mono break-all">
          <Lock className="w-3 h-3 flex-shrink-0" />
          <span>script hash: {covenant.redeemScriptHash.slice(0, 48)}…</span>
        </div>
      )}
    </motion.div>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="bg-[#1a1230]/60 border border-[#7C5CFC]/20 rounded-[14px] p-3">
      <div className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] font-bold text-[#B89BFF] uppercase mb-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-sm text-[#E9DEFF] font-semibold capitalize-first leading-snug">{value}</div>
    </div>
  );
}