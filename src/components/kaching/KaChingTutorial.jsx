import React, { useState } from "react";
import { X, BookOpen, Wallet, ArrowDownToLine, Send, Shield, KeyRound, Check, Layers, Lock, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    id: "intro",
    icon: BookOpen,
    title: "What is KaChing Wallet?",
    body: [
      "KaChing Wallet is a privacy-first Kaspa wallet. Your private keys are generated and stored only on this device — nothing is ever sent to a server.",
      "It adds three things no standard Kaspa wallet has: fresh derived receive addresses, manual UTXO coin control, and m-of-n multisig vaults.",
      "This tutorial is written so both humans and AI agents can follow it step by step.",
    ],
  },
  {
    id: "start",
    icon: Wallet,
    title: "1 · Create or import",
    body: [
      "On first open you either Create a new wallet or paste an existing 64-hex private key to import one.",
      "Your key never leaves the browser. If you clear site data the wallet is gone — back up your key somewhere safe first.",
    ],
  },
  {
    id: "receive",
    icon: ArrowDownToLine,
    title: "2 · Receive (fresh addresses)",
    body: [
      "Tap the Receive tab. Each tap of 'New address' derives a brand-new kaspa: address from your key — so every deposit lands on a different address.",
      "This breaks the link between your deposits and makes chain analysis harder. Show the QR to a sender, or copy the address.",
      "The address book remembers which addresses you've handed out and marks them used once they receive funds.",
    ],
  },
  {
    id: "send",
    icon: Send,
    title: "3 · Send — Auto vs Coin Control",
    body: [
      "Auto: pick a source address, paste a recipient, enter an amount, send. The wallet picks UTXOs for you.",
      "Coin Control: the privacy feature. Tap 'Coin Control' and the wallet lists every UTXO (unspent output) your address owns, with amount and txid.",
      "You manually tick exactly which UTXOs to spend. Unticked UTXOs stay completely untouched — so you can isolate a deposit, avoid mixing coins, or stage a precise spend.",
      "This is the manual UTXO selection most Kaspa wallets hide from you.",
    ],
  },
  {
    id: "multisig",
    icon: Shield,
    title: "4 · Co-signer Approval (m-of-n)",
    body: [
      "The 'Approve' tab lets a group of n co-signers require m approvals before the owner broadcasts a spend. Example: 2-of-3 — any two of three keys must approve.",
      "Honest scope: approvals are an off-chain gate recorded on this device. The owner's key still signs the real on-chain Kaspa transaction, so this is shared approval — not a lock that strips the owner's control. True on-chain Kaspa multisig (covenant scripts) isn't built here yet.",
      "Step 1 — Create vault: Approve tab → Vaults → New vault. Add co-signers with 'Generate key' (a fresh keypair on this device) or 'External' (paste someone's 64-hex x-only pubkey). Set how many approvals are needed (m).",
      "Step 2 — New proposal: pick the vault, pick the source address, enter recipient + amount. An unsigned proposal is created — no funds move yet.",
      "Step 3 — Approve: each co-signer signs the proposal. On this device, 'Approve' signs with every locally-held co-signer key at once; the count rises toward m.",
      "Step 4 — Execute: once the count hits the threshold, 'Execute' unlocks and the owner broadcasts the real on-chain Kaspa transaction.",
      "Use cases: shared treasury, two-device confirmation, escrow, or just forcing yourself to confirm on a second device before big moves.",
    ],
  },
  {
    id: "agent",
    icon: KeyRound,
    title: "For AI agents",
    body: [
      "Agents can drive this wallet programmatically: derive receive addresses, list UTXOs via the sendKaspaCoinControl function (action: 'list'), and broadcast signed spends (action: 'send').",
      "Multisig flow for agents: createProposal → signProposal (repeat until threshold) → execute via sendKaspaTransaction.",
      "All signing stays client-side; the backend only relays the final signed transaction to the Kaspa network. Never expose a private key to an untrusted agent.",
    ],
  },
];

export default function KaChingTutorial({ open, onClose }) {
  const [idx, setIdx] = useState(0);
  if (!open) return null;
  const s = SECTIONS[idx];
  const Icon = s.icon;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-3xl bg-zinc-950 border border-white/10 flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-300" />
            <span className="text-sm font-bold text-white">KaChing Wallet · Tutorial</span>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center">
              <Icon className="w-4 h-4 text-cyan-300" />
            </div>
            <h2 className="text-base font-bold text-white">{s.title}</h2>
          </div>
          <div className="space-y-2.5">
            {s.body.map((p, i) => (
              <p key={i} className="text-[13px] leading-relaxed text-white/70">{p}</p>
            ))}
          </div>

          {s.id === "multisig" && (
            <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-3 space-y-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300/80">Quick flow</div>
              {["Create vault (m of n)", "New proposal", "Approve × m", "Execute → on-chain"].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/80">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-200 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                  {step}
                  {i < 3 && <ChevronRight className="w-3 h-3 text-white/30 ml-auto" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="h-9 px-3 rounded-lg text-xs text-white/60 disabled:opacity-30 hover:bg-white/5"
          >
            Back
          </button>
          <div className="flex gap-1">
            {SECTIONS.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-cyan-400" : "bg-white/20"}`} />
            ))}
          </div>
          {idx < SECTIONS.length - 1 ? (
            <button onClick={() => setIdx(idx + 1)} className="h-9 px-4 rounded-lg bg-cyan-500 text-black text-xs font-semibold">Next</button>
          ) : (
            <button onClick={onClose} className="h-9 px-4 rounded-lg bg-cyan-500 text-black text-xs font-semibold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Done</button>
          )}
        </div>
      </div>
    </div>
  );
}