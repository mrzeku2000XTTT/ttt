import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PinPad from "@/components/wallet/PinPad";
import { hashPin, getStoredPinHash } from "@/components/wallet/walletLock";
import { Loader2, ShieldCheck, AlertTriangle, Check, Wallet } from "lucide-react";

const ACCENT = "#d97706";
const BRIGHT = "#f59e0b";
const FONT = "'Impact', 'Arial Black', 'Arial Narrow', sans-serif";

function loadMainWallet() {
  try {
    const wallets = JSON.parse(localStorage.getItem("terra_wallets") || "[]");
    if (!wallets.length) return null;
    // Main = first wallet that can sign, else first
    return wallets.find(w => w.mnemonic) || wallets[0];
  } catch { return null; }
}

// ZK-initiated Send KAS card: view balance → enter details → sign with 6-digit PIN →
// backend broadcasts. Seed never leaves the browser except inside the signed send call.
export default function ZKSendKasCard({ prefillTo = "", prefillAmount = "", onSent }) {
  const [wallet] = useState(() => loadMainWallet());
  const [balance, setBalance] = useState(null);
  const [to, setTo] = useState(prefillTo);
  const [amount, setAmount] = useState(prefillAmount);
  const [step, setStep] = useState("form"); // form | pin | sending | done | error
  const [pinError, setPinError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [txId, setTxId] = useState("");

  useEffect(() => {
    if (!wallet?.address) return;
    base44.functions.invoke("getKaspaBalance", { address: wallet.address })
      .then(res => setBalance(res?.data?.balanceKAS ?? null))
      .catch(() => setBalance(null));
  }, [wallet?.address]);

  const pinConfigured = !!getStoredPinHash();
  const canSign = !!wallet?.mnemonic;
  const validTo = /^kaspa:[a-z0-9]{61,63}$/.test(to.trim());
  const amt = parseFloat(amount);
  const validAmount = amt > 0 && (balance === null || amt <= balance);
  const canContinue = validTo && validAmount && canSign && pinConfigured;

  const handlePin = async (pin) => {
    setPinError("");
    const hash = await hashPin(pin);
    if (hash !== getStoredPinHash()) {
      setPinError("WRONG PIN — TRY AGAIN");
      return;
    }
    setStep("sending");
    try {
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        mnemonic: wallet.mnemonic,
        fromAddress: wallet.address,
        toAddress: to.trim(),
        amountKas: amt,
      });
      if (res.data?.error) throw new Error(res.data.error);
      const id = String(res.data.txId || "");
      setTxId(id);
      setStep("done");
      if (onSent) onSent({ txId: id, amount: amt, to: to.trim() });
    } catch (err) {
      setErrorMsg(err.message || "Transaction failed");
      setStep("error");
    }
  };

  const box = { background: "rgba(0,0,0,0.4)", border: "2px solid rgba(217,119,6,0.35)" };

  if (!wallet) {
    return (
      <div className="max-w-[78%] px-4 py-3" style={{ ...box, boxShadow: "3px 3px 0px #78350f" }}>
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest" style={{ color: BRIGHT, fontFamily: FONT }}>
          <AlertTriangle className="w-3.5 h-3.5" /> NO MAIN WALLET FOUND
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: "rgba(217,119,6,0.6)" }}>
          Create or import a wallet in Terra first — then I can send KAS for you.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[90%] sm:max-w-[78%] p-4" style={{ ...box, boxShadow: "3px 3px 0px #78350f" }}>
      {/* Header + live balance (view-only) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest" style={{ color: BRIGHT, fontFamily: FONT }}>
          <Wallet className="w-3.5 h-3.5" /> SEND KAS · MAIN WALLET
        </div>
        <div className="text-[10px] font-bold uppercase" style={{ color: "rgba(217,119,6,0.6)" }}>
          {balance === null ? "…" : `${Number(balance).toLocaleString("en-US", { maximumFractionDigits: 4 })} KAS`}
        </div>
      </div>
      <div className="text-[9px] font-mono mb-3" style={{ color: "rgba(217,119,6,0.4)" }}>
        {wallet.address.slice(0, 18)}…{wallet.address.slice(-8)}
      </div>

      {step === "form" && (
        <div className="space-y-2.5">
          <input value={to} onChange={e => setTo(e.target.value.trim())}
            placeholder="kaspa:q… recipient"
            className="w-full px-3 py-2 text-[11px] font-mono outline-none"
            style={{ background: "rgba(0,0,0,0.5)", border: `2px solid ${validTo ? "rgba(52,199,89,0.5)" : "rgba(217,119,6,0.3)"}`, color: BRIGHT }} />
          <div className="flex gap-2">
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="AMOUNT (KAS)" inputMode="decimal"
              className="flex-1 px-3 py-2 text-[12px] font-bold outline-none"
              style={{ background: "rgba(0,0,0,0.5)", border: "2px solid rgba(217,119,6,0.3)", color: BRIGHT }} />
            <button onClick={() => balance !== null && setAmount(String(Math.max(0, balance - 0.001)))}
              className="px-3 text-[10px] font-black uppercase"
              style={{ border: "2px solid rgba(217,119,6,0.35)", color: "rgba(217,119,6,0.7)", fontFamily: FONT }}>MAX</button>
          </div>
          {!canSign && (
            <p className="text-[10px]" style={{ color: "#fbbf24" }}>
              ⚠ Main wallet has no seed stored locally. Import it in Terra with its seed phrase to enable sending.
            </p>
          )}
          {canSign && !pinConfigured && (
            <p className="text-[10px]" style={{ color: "#fbbf24" }}>
              ⚠ No wallet PIN set. Open the Wallet page once to set your 6-digit PIN, then retry.
            </p>
          )}
          <button onClick={() => canContinue && setStep("pin")} disabled={!canContinue}
            className="w-full py-2.5 text-[11px] font-black uppercase tracking-widest disabled:opacity-40"
            style={{ background: canContinue ? ACCENT : "rgba(217,119,6,0.1)", color: canContinue ? "#000" : "rgba(217,119,6,0.5)", border: `2px solid ${ACCENT}`, boxShadow: canContinue ? "2px 2px 0px #78350f" : "none", fontFamily: FONT }}>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> SIGN WITH PIN</span>
          </button>
        </div>
      )}

      {step === "pin" && (
        <div className="py-2">
          <div className="text-center text-[10px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: BRIGHT, fontFamily: FONT }}>
            ENTER 6-DIGIT PIN TO SIGN {amt} KAS
          </div>
          <PinPad onComplete={handlePin} />
          {pinError && <div className="text-center text-[10px] font-black mt-3" style={{ color: "#ef4444" }}>{pinError}</div>}
          <button onClick={() => setStep("form")} className="w-full mt-3 py-1.5 text-[10px] font-black uppercase" style={{ color: "rgba(217,119,6,0.5)", fontFamily: FONT }}>◀ BACK</button>
        </div>
      )}

      {step === "sending" && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: BRIGHT }} />
          <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: BRIGHT, fontFamily: FONT }}>SIGNED · BROADCASTING…</span>
        </div>
      )}

      {step === "done" && (
        <div className="py-3 text-center">
          <div className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-widest" style={{ color: "#34c759", fontFamily: FONT }}>
            <Check className="w-4 h-4" /> {amt} KAS SENT
          </div>
          <div className="text-[9px] font-mono mt-2 break-all" style={{ color: "rgba(217,119,6,0.45)" }}>{txId}</div>
        </div>
      )}

      {step === "error" && (
        <div className="py-2 space-y-2">
          <div className="text-[11px]" style={{ color: "#ef4444" }}>✗ {errorMsg}</div>
          <button onClick={() => setStep("form")} className="px-4 py-1.5 text-[10px] font-black uppercase"
            style={{ border: `2px solid ${ACCENT}`, color: BRIGHT, fontFamily: FONT }}>TRY AGAIN</button>
        </div>
      )}
    </div>
  );
}