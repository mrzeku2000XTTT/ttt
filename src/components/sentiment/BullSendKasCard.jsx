import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { base44 } from "@/api/base44Client";
import PinPad from "@/components/wallet/PinPad";
import { verifyStoredPin, getStoredPinHash } from "@/components/wallet/walletLock";
import {
  Loader2, ShieldCheck, Check, Wallet, Sparkles, AlertTriangle,
  Copy, Download, Eye, EyeOff, Key, Plus, RefreshCw, QrCode as QrIcon,
} from "lucide-react";

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

// Gold Bull self-send card.
// Bull Wallet seed/private key stays in localStorage only — NEVER sent to server.
// Export is fully local (copy / download) — no network exposure.
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
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [showQr, setShowQr] = useState(false);

  const fetchBalance = (addr) => {
    if (!addr) return;
    setBalanceLoading(true);
    base44.functions
      .invoke("getKaspaBalance", { address: addr })
      .then((res) => {
        setBalance(res?.data?.balanceKAS ?? 0);
        setBalanceLoading(false);
      })
      .catch(() => {
        setBalance(0);
        setBalanceLoading(false);
      });
  };

  useEffect(() => {
    if (wallet?.address) fetchBalance(wallet.address);
  }, [wallet?.address]);

  useEffect(() => {
    if (!wallet?.address) {
      setQrUrl("");
      return;
    }
    QRCode.toDataURL(wallet.address, {
      width: 240,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [wallet?.address]);

  const pinConfigured = !!getStoredPinHash();
  const amt = parseFloat(amount);
  const isFunded = balance !== null && balance > 0;
  const validAmount = amt > 0 && (balance === null || amt <= balance);
  const canSign = !!wallet?.mnemonic && pinConfigured && validAmount && isFunded;

  const copyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyKey = () => {
    if (!wallet?.privateKey) return;
    navigator.clipboard.writeText(wallet.privateKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const downloadKey = () => {
    if (!wallet?.privateKey) return;
    const text = `Bull Wallet Private Key\n\nAddress: ${wallet.address}\nPrivate Key: ${wallet.privateKey}\n\nWARNING: Anyone with this key controls your funds. Store securely.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bull_wallet_key.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

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
      setShowKey(false);
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
        toAddress: wallet.address,
        amountKas: amt,
      });
      if (res.data?.error) throw new Error(res.data.error);
      const id = String(res.data.txId || "");
      setTxId(id);
      setStep("done");
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
    padding: "1.75rem",
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

  // Has bull wallet
  return (
    <div className="w-full max-w-sm" style={cardBorder}>
      <div style={cardInner}>
        {/* Header + balance */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" style={{ color: GOLD }} />
            <span
              className="text-sm font-bold tracking-widest uppercase"
              style={{ color: GOLD, fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Bull Wallet
            </span>
          </div>
          <div className="text-xs font-bold" style={{ color: isFunded ? GREEN : "rgba(255,255,255,0.4)" }}>
            {balanceLoading || balance === null
              ? "…"
              : `${Number(balance).toLocaleString("en-US", { maximumFractionDigits: 4 })} KAS`}
          </div>
        </div>

        {/* Full address + copy */}
        <div className="mb-4">
          <label style={labelStyle}>Kaspa Address</label>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 text-[11px] font-mono break-all px-3 py-2.5 leading-relaxed"
              style={{ ...inputStyle, border: `1px solid ${GOLD}44`, wordBreak: "break-all" }}
            >
              {wallet.address}
            </div>
            <button
              onClick={copyAddress}
              className="px-3 py-2.5 text-xs font-bold uppercase whitespace-nowrap transition-all flex-shrink-0"
              style={{
                border: `1px solid ${GOLD}55`,
                color: copied ? GREEN : GOLD,
                background: copied ? "rgba(118,165,130,0.1)" : "rgba(212,175,55,0.05)",
                borderRadius: "0.75rem",
              }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setShowQr(!showQr)}
              className="px-3 py-2.5 text-xs font-bold uppercase whitespace-nowrap transition-all flex-shrink-0"
              style={{
                border: `1px solid ${GOLD}55`,
                color: showQr ? GREEN : GOLD,
                background: showQr ? "rgba(118,165,130,0.1)" : "rgba(212,175,55,0.05)",
                borderRadius: "0.75rem",
              }}
            >
              <QrIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          {showQr && qrUrl && (
            <div className="mt-3 flex flex-col items-center">
              <img src={qrUrl} alt="Kaspa address QR" className="w-40 h-40 rounded-lg" style={{ background: "#fff", padding: "4px" }} />
              <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>Scan to fund this wallet</p>
            </div>
          )}
        </div>

        {/* Funding prompt for unfunded wallets */}
        {!isFunded && !balanceLoading && (
          <div
            className="mb-5 p-4 rounded-xl"
            style={{
              background: "rgba(212,175,55,0.06)",
              border: `1px solid ${GOLD}33`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5" style={{ color: GOLD }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                Fund Your Wallet
              </span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              Copy the address above and send KAS from any wallet (Zelcore, Kasware, exchange).
              This is your daily bull trading wallet — keep it funded for self-sends.
            </p>
          </div>
        )}

        {step === "form" && (
          <>
            {/* Recipient (self) */}
            <div className="mb-4">
              <label style={labelStyle}>Recipient (self)</label>
              <div
                className="w-full px-3 py-2.5 text-[11px] font-mono break-all"
                style={{ ...inputStyle, wordBreak: "break-all" }}
              >
                {wallet.address}
              </div>
            </div>

            {/* Amount */}
            <div className="mb-5">
              <label style={labelStyle}>Amount</label>
              <div className="flex gap-2">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="AMOUNT KAS"
                  inputMode="decimal"
                  disabled={!isFunded}
                  className="flex-1 px-3 py-2.5 text-sm font-bold disabled:opacity-40"
                  style={inputStyle}
                />
                <button
                  onClick={() => isFunded && balance !== null && setAmount(String(Math.max(0, balance - 0.001)))}
                  disabled={!isFunded}
                  className="px-4 text-xs font-bold uppercase disabled:opacity-40"
                  style={{ ...inputStyle, color: "#fff", background: "rgba(118,165,130,0.08)" }}
                >
                  MAX
                </button>
              </div>
            </div>

            {!pinConfigured && (
              <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: "#fbbf24" }}>
                <AlertTriangle className="w-3.5 h-3.5" /> No wallet PIN set. Open the Wallet page once to set your 6-digit PIN.
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
            <div className="text-center text-xs font-bold uppercase tracking-[0.3em] mb-4" style={{ color: GOLD }}>
              Enter 6-digit PIN to sign {amt} KAS
            </div>
            <PinPad onComplete={handlePin} />
            {pinError && (
              <div className="text-center text-xs font-bold mt-3" style={{ color: "#ef4444" }}>
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
            <span className="text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Signed · Broadcasting…
            </span>
          </div>
        )}

        {step === "done" && (
          <div className="py-6 text-center">
            <div className="inline-flex items-center gap-2 text-base font-black uppercase tracking-widest" style={{ color: "#34c759" }}>
              <Check className="w-5 h-5" /> {amt} KAS Self-Sent
            </div>
            <div className="text-xs font-mono mt-3 break-all" style={{ color: "rgba(212,175,55,0.4)" }}>
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
              style={{ border: `1px solid ${GOLD}`, color: GOLD, borderRadius: "0.75rem" }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="my-4" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

        {/* Export Private Key (local only) */}
        <div className="mb-3">
          <button
            onClick={() => setShowKey(!showKey)}
            className="w-full flex items-center justify-between py-2 text-xs font-bold uppercase tracking-wider transition-colors"
            style={{ color: showKey ? GOLD : "rgba(255,255,255,0.4)" }}
          >
            <span className="inline-flex items-center gap-2">
              <Key className="w-3.5 h-3.5" /> Export Private Key
            </span>
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          {showKey && (
            <div className="mt-2 p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-[10px] mb-2 flex items-center gap-1" style={{ color: "#fbbf24" }}>
                <AlertTriangle className="w-3 h-3" /> Anyone with this key controls your funds. Never share it.
              </p>
              <div className="text-[10px] font-mono break-all mb-2 p-2 rounded" style={{ background: BLACK, color: GOLD, wordBreak: "break-all" }}>
                {wallet.privateKey}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyKey}
                  className="flex-1 py-2 text-[10px] font-bold uppercase flex items-center justify-center gap-1.5"
                  style={{ border: `1px solid ${GOLD}55`, color: keyCopied ? GREEN : GOLD, borderRadius: "0.5rem" }}
                >
                  {keyCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {keyCopied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={downloadKey}
                  className="flex-1 py-2 text-[10px] font-bold uppercase flex items-center justify-center gap-1.5"
                  style={{ border: `1px solid ${GOLD}55`, color: GOLD, borderRadius: "0.5rem" }}
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Generate New */}
        <button
          onClick={generateWallet}
          disabled={genStep === "generating"}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
          style={{ color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {genStep === "generating" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Generate New Wallet
        </button>
      </div>
    </div>
  );
}