import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PinPad from "@/components/wallet/PinPad";
import { verifyStoredPin, getStoredPinHash } from "@/components/wallet/walletLock";
import { Loader2, ShieldCheck, Check, Wallet, Sparkles, AlertTriangle } from "lucide-react";

const GOLD = "#D4AF37";
const GREEN = "#76A582";
const BLACK = "#000000";
const BULL_WALLET_KEY = "bull_wallet";

function loadBullWallet() {
  try {
    const w = localStorage.getItem(BULL_WALLET_KEY);
    return w ? JSON.parse(w) : null;
  } catch {
    return null;
  }
}

function saveBullWallet(wallet) {
  try {
    localStorage.setItem(BULL_WALLET_KEY, JSON.stringify(wallet));
  } catch {}
}

function shortAddr(addr) {
  if (!addr) return "—";
  const a = String(addr).replace(/^kaspa:/, "");
  return `${a.slice(0, 10)}…${a.slice(-6)}`;
}

// Gold Bull self-send card.
// Generates a dedicated Bull Wallet (seed stays in localStorage only — NEVER server).
// Self-sends KAS from the bull wallet to its own address, then records the entry.
export default function BullSendKasCard({ onSent }) {
  const [wallet, setWallet] = useState(() => loadBullWallet());
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState("form"); // form | pin | sending | done | error
  const [genStep, setGenStep] = useState("idle"); // idle | generating | error
  const [genError, setGenError] = useState("");
  const [pinError, setPinError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [txId, setTxId] = useState("");

  const fetchBalance = (addr) => {
    if (!addr) return;
    base44.functions
      .invoke("getKaspaBalance", { address: addr })
      .then((res) => setBalance(res?.data?.balanceKAS ?? null))
      .catch(() => setBalance(null));
  };

  useEffect(() => {
    if (wallet?.address) fetchBalance(wallet.address);
  }, [wallet?.address]);

  const pinConfigured = !!getStoredPinHash();
  const amt = parseFloat(amount);
  const validAmount = amt > 0 && (balance === null || amt <= balance);
  const canSign = !!wallet?.mnemonic && pinConfigured && validAmount;

  const generateWallet = async () => {
    setGenStep("generating");
    setGenError("");
    try {
      const res = await base44.functions.invoke("createKaspaWallet", {});
      if (res.data?.error) throw new Error(res.data.error);
      const w = {
        address: res.data.address,
        mnemonic: res.data.mnemonic,
        privateKey: res.data.privateKey,
      };
      saveBullWallet(w);
      setWallet(w);
      setBalance(null);
      setGenStep("idle");
      fetchBalance(w.address);
    } catch (err) {
      setGenError(err.message || "Failed to generate wallet");
      setGenStep("error");
    }
  };

  const handlePin = async (pin) => {
    setPinError("");
    const ok = await verifyStoredPin(pin);
    if (!ok) {
      setPinError("WRONG PIN — TRY AGAIN");
      return;
    }
    setStep("sending");
    try {
      const res = await base44.functions.invoke("sendKaspaTransaction", {
        mnemonic: wallet.mnemonic,
        fromAddress: wallet.address,
        toAddress: wallet.address, // self-send
        amountKas: amt,
      });
      if (res.data?.error) throw new Error(res.data.error);
      const id = String(res.data.txId || "");
      setTxId(id);
      setStep("done");
      // Record the bull entry (public data only — no seed)
      try {
        await base44.entities.BullSentimentEntry.create({
          wallet_address: wallet.address,
          tx_id: id,
          amount_kas: amt,
          sentiment: "bullish",
        });
      } catch {}
      if (onSent) onSent({ txId: id, amount: amt, to: wallet.address });
    } catch (err) {
      setErrorMsg(err.message || "Transaction failed");
      setStep("error");
    }
  };

  const cardBorder = {
    background: `linear-gradient(135deg, ${GOLD} 0%, ${GREEN} 100%)`,
    borderRadius: "1.5rem",
    padding: "1.5px",
    boxShadow: "0 0 24px rgba(212,175,55,0.12)",
  };
  const cardInner = {
    background: BLACK,
    borderRadius: "1.4rem",
    padding: "2rem",
  };
  const inputStyle = {
    background: BLACK,
    border: `1px solid ${GREEN}88`,
    color: "#fff",
    borderRadius: "0.75rem",
    outline: "none",
  };
  const labelStyle = {
    color: "rgba(255,255,255,0.5)",
    fontSize: "11px",
    marginBottom: "6px",
    display: "block",
    letterSpacing: "0.05em",
  };

  // No bull wallet yet — generate flow
  if (!wallet) {
    return (
      <div className="w-full max-w-sm" style={cardBorder}>
        <div style={cardInner}>
          {genStep === "generating" ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
              <span
                className="text-sm font-bold uppercase tracking-widest"
                style={{ color: GOLD, fontFamily: "'Fraunces', Georgia, serif" }}
              >
                Generating Bull Wallet…
              </span>
            </div>
          ) : (
            <div className="text-center py-6">
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ background: "rgba(212,175,55,0.1)", border: `1px solid ${GOLD}55` }}
              >
                <Sparkles className="w-5 h-5" style={{ color: GOLD }} />
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: GOLD, fontFamily: "'Fraunces', Georgia, serif" }}
              >
                No Bull Wallet Yet
              </h3>
              <p className="text-xs mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Generate a fresh Kaspa wallet for bullish self-sends.
                <br />
                Seed stays in your browser only.
              </p>
              <button
                onClick={generateWallet}
                className="w-full py-3 text-sm font-black uppercase tracking-widest transition-all"
                style={{
                  background: `linear-gradient(90deg, ${GOLD} 0%, ${GREEN} 100%)`,
                  color: BLACK,
                  borderRadius: "0.75rem",
                  boxShadow: "0 0 20px rgba(212,175,55,0.2)",
                }}
              >
                Generate New Bull Wallet
              </button>
              {genStep === "error" && (
                <div className="mt-3 text-xs flex items-center justify-center gap-1.5" style={{ color: "#ef4444" }}>
                  <AlertTriangle className="w-3.5 h-3.5" /> {genError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Has bull wallet — self-send form
  return (
    <div className="w-full max-w-sm" style={cardBorder}>
      <div style={cardInner}>
        {/* Header + balance */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" style={{ color: GOLD }} />
            <span
              className="text-sm font-bold tracking-widest uppercase"
              style={{ color: GOLD, fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Send KAS · Bull Wallet
            </span>
          </div>
          <div className="text-xs font-bold" style={{ color: GREEN }}>
            {balance === null
              ? "…"
              : `${Number(balance).toLocaleString("en-US", { maximumFractionDigits: 4 })} KAS`}
          </div>
        </div>

        {/* Bull wallet address */}
        <div className="mb-5">
          <label style={labelStyle}>Bull wallet address</label>
          <div className="flex items-center gap-2">
            <span
              className="flex-1 text-sm font-mono truncate px-3 py-2.5"
              style={{ ...inputStyle, border: `1px solid ${GOLD}44` }}
            >
              {shortAddr(wallet.address)}
            </span>
            <button
              onClick={generateWallet}
              disabled={genStep === "generating"}
              className="px-3 py-2.5 text-xs font-bold uppercase whitespace-nowrap transition-all"
              style={{
                border: `1px solid ${GOLD}55`,
                color: GOLD,
                background: "rgba(212,175,55,0.05)",
                borderRadius: "0.75rem",
              }}
            >
              {genStep === "generating" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Generate New"
              )}
            </button>
          </div>
        </div>

        {step === "form" && (
          <>
            {/* Recipient (self) */}
            <div className="mb-5">
              <label style={labelStyle}>Recipient (self)</label>
              <div
                className="w-full px-3 py-2.5 text-sm font-mono truncate"
                style={inputStyle}
              >
                {shortAddr(wallet.address)}
              </div>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <label style={labelStyle}>Amount</label>
              <div className="flex gap-2">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="AMOUNT KAS"
                  inputMode="decimal"
                  className="flex-1 px-3 py-2.5 text-sm font-bold"
                  style={inputStyle}
                />
                <button
                  onClick={() =>
                    balance !== null && setAmount(String(Math.max(0, balance - 0.001)))
                  }
                  className="px-4 text-xs font-bold uppercase"
                  style={{
                    ...inputStyle,
                    color: "#fff",
                    background: "rgba(118,165,130,0.08)",
                  }}
                >
                  MAX
                </button>
              </div>
            </div>

            {!pinConfigured && (
              <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: "#fbbf24" }}>
                <AlertTriangle className="w-3.5 h-3.5" /> No wallet PIN set. Open the Wallet page
                once to set your 6-digit PIN.
              </p>
            )}

            <button
              onClick={() => canSign && setStep("pin")}
              disabled={!canSign}
              className="w-full py-3 text-sm font-black uppercase tracking-widest disabled:opacity-40 transition-all"
              style={{
                background: canSign
                  ? `linear-gradient(90deg, ${GOLD} 0%, ${GREEN} 100%)`
                  : "rgba(212,175,55,0.1)",
                color: canSign ? BLACK : "rgba(212,175,55,0.5)",
                borderRadius: "0.75rem",
                boxShadow: canSign ? "0 0 20px rgba(212,175,55,0.25)" : "none",
              }}
            >
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Sign with PIN
              </span>
            </button>
          </>
        )}

        {step === "pin" && (
          <div className="py-2">
            <div
              className="text-center text-xs font-bold uppercase tracking-[0.3em] mb-4"
              style={{ color: GOLD }}
            >
              Enter 6-digit PIN to sign {amt} KAS
            </div>
            <PinPad onComplete={handlePin} />
            {pinError && (
              <div
                className="text-center text-xs font-bold mt-3"
                style={{ color: "#ef4444" }}
              >
                {pinError}
              </div>
            )}
            <button
              onClick={() => setStep("form")}
              className="w-full mt-3 py-1.5 text-xs font-bold uppercase"
              style={{ color: "rgba(212,175,55,0.5)" }}
            >
              ◀ Back
            </button>
          </div>
        )}

        {step === "sending" && (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD }} />
            <span
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: GOLD }}
            >
              Signed · Broadcasting…
            </span>
          </div>
        )}

        {step === "done" && (
          <div className="py-6 text-center">
            <div
              className="inline-flex items-center gap-2 text-base font-black uppercase tracking-widest"
              style={{ color: "#34c759" }}
            >
              <Check className="w-5 h-5" /> {amt} KAS Self-Sent
            </div>
            <div
              className="text-xs font-mono mt-3 break-all"
              style={{ color: "rgba(212,175,55,0.4)" }}
            >
              {txId}
            </div>
            <div className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.5)" }}>
              Loading bull chart…
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="py-2 space-y-3">
            <div className="text-sm flex items-center gap-1.5" style={{ color: "#ef4444" }}>
              <AlertTriangle className="w-4 h-4" /> {errorMsg}
            </div>
            <button
              onClick={() => setStep("form")}
              className="px-4 py-2 text-xs font-bold uppercase"
              style={{
                border: `1px solid ${GOLD}`,
                color: GOLD,
                borderRadius: "0.75rem",
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}