import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useKcc20Wallet, shortKaspaAddress } from "@/lib/useKcc20Wallet";
import { sendTokenKcc20 } from "@/lib/kcc20Pwa";

// BIBLIA × Treasury — a quiet give panel. Connect the Scorpion (KCC20) wallet,
// donate KCC-20 tokens into the covenant-guarded treasury vault, and donors
// receive a small KAS blessing back from the treasury.

const TOKENS = [
  { tick: "KKDAG", note: "Scorpion native" },
  { tick: "KRON", note: "KRON protocol" },
  { tick: "KROSHI", note: "Kaspa OG" },
  { tick: "COOK", note: "Cook launchpad" },
];
const AMOUNTS = ["100", "500", "1000", "5000"];

const NOTE_STYLES = {
  gold: "text-[#8a7340]",
  red: "text-[#a05252]",
};

export default function BibliaGive() {
  const kcc20 = useKcc20Wallet();
  const [open, setOpen] = useState(false);
  const [vault, setVault] = useState(null);
  const [user, setUser] = useState(null);
  const [tick, setTick] = useState("KKDAG");
  const [customTick, setCustomTick] = useState("");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimNote, setClaimNote] = useState(null);

  const activeTick = (customTick || tick).toUpperCase().trim();
  const isAdmin = user?.role === "admin";

  const loadVault = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("treasuryVault", { action: "status" });
      setVault(res.data);
    } catch {
      setVault({ address: null });
    }
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (open) {
      loadVault();
      setNote(null);
      setClaimNote(null);
    }
  }, [open, loadVault]);

  const initVault = async () => {
    setBusy(true);
    setNote(null);
    try {
      await base44.functions.invoke("treasuryVault", { action: "init" });
      setNote({ tone: "gold", text: "The treasury vault is prepared." });
      loadVault();
    } catch (e) {
      setNote({ tone: "red", text: e?.response?.data?.error || e.message || "Could not prepare the vault." });
    } finally {
      setBusy(false);
    }
  };

  const give = async () => {
    const amt = parseFloat(amount);
    if (!vault?.address) {
      setNote({ tone: "red", text: "The treasury is still being prepared." });
      return;
    }
    if (!activeTick || !amt || amt <= 0) {
      setNote({ tone: "red", text: "Choose a token and an amount." });
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      if (!kcc20.address) await kcc20.connect();
      const r = await sendTokenKcc20({ tick: activeTick, amount: amt, dest: vault.address });
      const txId = r?.txId || r?.txid || "kcc20-tx";
      await base44.entities.TreasuryTip.create({
        sender_wallet: kcc20.address,
        sender_name: name.trim().slice(0, 40),
        tick: activeTick,
        amount: amt,
        tx_hash: txId,
        kind: "donation",
      });
      setNote({ tone: "gold", text: `Given — ${amt.toLocaleString()} ${activeTick} rests in the treasury.` });
      setAmount("");
    } catch (e) {
      setNote({ tone: "red", text: e?.response?.data?.error || e.message || "The gift could not be sent." });
    } finally {
      setBusy(false);
    }
  };

  const claim = async () => {
    if (!kcc20.address) {
      setClaimNote({ tone: "red", text: "Connect your Scorpion wallet first." });
      return;
    }
    setClaimBusy(true);
    setClaimNote(null);
    try {
      const res = await base44.functions.invoke("treasuryVault", {
        action: "claim_reward",
        wallet: kcc20.address,
      });
      setClaimNote({ tone: "gold", text: `A blessing of ${res.data.kas_amount} KAS was sent to your wallet.` });
    } catch (e) {
      setClaimNote({ tone: "red", text: e?.response?.data?.error || e.message || "No blessing could be sent." });
    } finally {
      setClaimBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="absolute bottom-7 left-1/2 z-20 -translate-x-1/2 select-none text-[10px] uppercase tracking-[0.35em] opacity-40 transition hover:opacity-90"
      >
        Give · Treasury
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a2418]/30 p-5 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } }}
              exit={{ opacity: 0, y: 12, transition: { duration: 0.18 } }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#c5b085]/50 bg-[#faf6ec] p-6 shadow-[0_24px_60px_rgba(42,36,24,0.25)] sm:p-8"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-heading text-xl text-[#2a2418]">The Treasury</h2>
                <button onClick={() => setOpen(false)} className="opacity-50 transition hover:opacity-100">
                  <X className="h-4 w-4 text-[#2a2418]" />
                </button>
              </div>
              <p className="mt-2 text-[11px] italic leading-relaxed text-[#2a2418]/60">
                “Each of you should give what you have decided in your heart to give.” — 2 Corinthians 9:7
              </p>

              {/* wallet */}
              <div className="mt-6">
                {kcc20.address ? (
                  <div className="flex items-center justify-between rounded-full border border-[#c5b085]/40 bg-[#f2ede4] px-4 py-2.5">
                    <span className="text-xs text-[#2a2418]/70">🦂 Scorpion</span>
                    <span className="font-mono text-xs text-[#8a7340]">{shortKaspaAddress(kcc20.address)}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => kcc20.connect().catch((e) => setNote({ tone: "red", text: e.message }))}
                    disabled={kcc20.loading}
                    className="w-full rounded-full border border-[#c5b085] bg-[#c5b085] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#2a2418] transition hover:bg-[#b89d6f] disabled:opacity-50"
                  >
                    {kcc20.loading ? "Connecting…" : "Connect Scorpion 🦂"}
                  </button>
                )}
              </div>

              {/* admin: prepare the vault once */}
              {isAdmin && !vault?.address && (
                <button
                  onClick={initVault}
                  disabled={busy}
                  className="mt-4 w-full rounded-full border border-[#c5b085]/60 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-[#8a7340] transition hover:bg-[#c5b085]/10 disabled:opacity-50"
                >
                  {busy ? "Preparing…" : "Prepare the treasury vault"}
                </button>
              )}

              {vault?.address && (
                <p className="mt-3 break-all text-center font-mono text-[10px] text-[#2a2418]/40">
                  vault · {vault.address}
                </p>
              )}

              {/* give */}
              <div className="mt-6 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#2a2418]/50">Give KCC-20</p>
                <div className="grid grid-cols-2 gap-2">
                  {TOKENS.map((t) => (
                    <button
                      key={t.tick}
                      onClick={() => { setTick(t.tick); setCustomTick(""); }}
                      className={`rounded-xl border px-3 py-2 text-left transition ${
                        !customTick && tick === t.tick
                          ? "border-[#c5b085] bg-[#c5b085]/15"
                          : "border-[#c5b085]/30 hover:bg-[#c5b085]/10"
                      }`}
                    >
                      <span className="block text-xs font-semibold text-[#2a2418]">{t.tick}</span>
                      <span className="block text-[9px] text-[#2a2418]/50">{t.note}</span>
                    </button>
                  ))}
                </div>
                <input
                  value={customTick}
                  onChange={(e) => setCustomTick(e.target.value.toUpperCase())}
                  placeholder="Or another tick…"
                  className="w-full rounded-xl border border-[#c5b085]/30 bg-[#f2ede4] px-3 py-2 text-sm text-[#2a2418] outline-none placeholder:text-[#2a2418]/35 focus:border-[#c5b085]"
                />

                <div className="grid grid-cols-4 gap-2">
                  {AMOUNTS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAmount(a)}
                      className={`rounded-full border px-2 py-1.5 text-xs transition ${
                        amount === a
                          ? "border-[#c5b085] bg-[#c5b085]/15 text-[#2a2418]"
                          : "border-[#c5b085]/30 text-[#2a2418]/60 hover:bg-[#c5b085]/10"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-1/2 rounded-xl border border-[#c5b085]/30 bg-[#f2ede4] px-3 py-2 text-sm text-[#2a2418] outline-none placeholder:text-[#2a2418]/35 focus:border-[#c5b085]"
                  />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name (optional)"
                    className="w-1/2 rounded-xl border border-[#c5b085]/30 bg-[#f2ede4] px-3 py-2 text-sm text-[#2a2418] outline-none placeholder:text-[#2a2418]/35 focus:border-[#c5b085]"
                  />
                </div>

                <button
                  onClick={give}
                  disabled={busy || !amount}
                  className="w-full rounded-full bg-[#2a2418] px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#f2ede4] transition hover:bg-[#3a3226] disabled:opacity-40"
                >
                  {busy ? "Giving…" : `Give ${activeTick}`}
                </button>
                {note && <p className={`text-center text-xs ${NOTE_STYLES[note.tone]}`}>{note.text}</p>}
              </div>

              {/* blessing */}
              <div className="mt-6 border-t border-[#c5b085]/25 pt-5 text-center">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#2a2418]/50">The Blessing</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#2a2418]/55">
                  Given freely, received freely — donors may claim a small KAS blessing from the treasury, once a day.
                </p>
                <button
                  onClick={claim}
                  disabled={claimBusy}
                  className="mt-3 rounded-full border border-[#c5b085] px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-[#8a7340] transition hover:bg-[#c5b085]/10 disabled:opacity-40"
                >
                  {claimBusy ? "Receiving…" : "Receive the blessing"}
                </button>
                {claimNote && <p className={`mt-2 text-xs ${NOTE_STYLES[claimNote.tone]}`}>{claimNote.text}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}