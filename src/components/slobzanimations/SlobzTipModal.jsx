import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, X, Coins, Smartphone, Globe, Copy, Check } from "lucide-react";
import { verifyStoredPin } from "@/components/wallet/walletLock";

const KASTLE_LOGO = "https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/d958c7898_image.png";

function loadTerraWallets() {
  try {
    const raw = JSON.parse(localStorage.getItem("terra_wallets") || "[]");
    return raw.filter((w) => w.address && w.mnemonic);
  } catch {
    return [];
  }
}

export default function SlobzTipModal({ anim, onClose, onSuccess }) {
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const tttWalletAddress = localStorage.getItem("ttt_wallet_address");
  const tttPrivateKey = localStorage.getItem("ttt_wallet_pk");
  const pinHash = localStorage.getItem("ttt_wallet_pin_hash");
  const hasPinSet = !!pinHash;
  const hasKasware = typeof window !== "undefined" && !!window.kasware;
  const hasKastle = typeof window !== "undefined" && !!window.kastle;
  const terraWallets = loadTerraWallets();
  const hasTerra = terraWallets.length > 0;
  const [selectedTerraIdx, setSelectedTerraIdx] = useState(0);

  // Priority: Terra > TTT > Kasware > Kastle (mobile users have no extensions)
  const defaultMethod = hasTerra ? "terra" : tttWalletAddress ? "ttt" : hasKasware ? "kasware" : hasKastle ? "kastle" : "ttt";
  const [method, setMethod] = useState(defaultMethod);

  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");
  const [mnemonic, setMnemonic] = useState("");

  const noWalletAtAll = !hasTerra && !tttWalletAddress && !hasKasware && !hasKastle;

  const verifyPin = async () => {
    if (pin.length !== 6) return setPinError("Enter 6-digit PIN");
    // Verify against BOTH hash formats (wallet-lock salted + legacy unsalted)
    if (await verifyStoredPin(pin)) {
      setPinVerified(true);
      setPinError("");
    } else {
      setPinError("Incorrect PIN");
    }
  };

  const copyAddr = () => {
    navigator.clipboard.writeText(anim.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSend = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount.");
    if (method === "ttt" && !tttPrivateKey && !mnemonic.trim()) return setError("Enter your seed phrase to authorize on this device.");
    if (method === "ttt" && tttPrivateKey && hasPinSet && !pinVerified) return setError("Verify your PIN first.");
    if (method === "terra" && !terraWallets[selectedTerraIdx]?.mnemonic) return setError("Selected Terra wallet has no seed phrase.");

    setBusy(true);
    setError("");
    try {
      let txId;
      if (method === "terra") {
        const tw = terraWallets[selectedTerraIdx];
        const res = await base44.functions.invoke("sendKaspaTransaction", {
          fromAddress: tw.address,
          toAddress: anim.wallet_address,
          amountKas: amt,
          mnemonic: tw.mnemonic,
        });
        if (!res.data?.success || res.data?.error) throw new Error(res.data?.error || "Transaction failed");
        txId = res.data?.txId;
      } else if (method === "ttt") {
        const payload = { fromAddress: tttWalletAddress, toAddress: anim.wallet_address, amountKas: amt };
        if (tttPrivateKey) payload.privateKey = tttPrivateKey;
        else payload.mnemonic = mnemonic.trim();
        const res = await base44.functions.invoke("sendKaspaTransaction", payload);
        if (!res.data?.success || res.data?.error) throw new Error(res.data?.error || "Transaction failed");
        txId = res.data?.txId;
      } else if (method === "kastle") {
        try { await window.kastle.request?.("kas:connect"); } catch { /* already connected */ }
        txId = await window.kastle.sendKaspa(anim.wallet_address, Math.floor(amt * 1e8));
      } else {
        txId = await window.kasware.sendKaspa(anim.wallet_address, Math.floor(amt * 1e8));
      }

      // Bookkeeping must never fail the tip
      try {
        await base44.entities.SlobzAnimation.update(anim.id, { tips_received: (anim.tips_received || 0) + amt });
      } catch (e) {
        console.warn("Tip sent, stats update failed:", e);
      }

      onSuccess?.({ amount: amt, txId });
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Unknown error";
      if (/reject/i.test(msg)) setError("Transaction cancelled.");
      else if (/insufficient/i.test(msg)) setError(msg);
      else if (/storage mass/i.test(msg)) setError("Too many small UTXOs. Compound them in Terra → Manage, then retry.");
      else setError(`Tip failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const methodBtn = (active) =>
    `flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-display font-extrabold transition-colors ${
      active ? "bg-[#7C5CFC] text-white shadow-[0_6px_16px_rgba(124,92,252,0.35)]" : "bg-[#F3F0FA] text-[#5A4B8A] hover:bg-[#EBE6F8]"
    }`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#3D2E7C]/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FDFBF7] rounded-[28px] shadow-[0_24px_60px_rgba(61,46,124,0.35)] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E4F7EC] flex items-center justify-center">
              <Coins className="w-5 h-5 text-[#1E9E5A]" />
            </div>
            <div>
              <h3 className="font-display text-lg font-black text-[#3D2E7C]">Tip this Slob</h3>
              <p className="text-[11px] text-[#8B84A3]">"{anim.title}" by {anim.creator_name || "Anonymous Slob"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#F3F0FA] text-[#8B84A3]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recipient */}
        <button onClick={copyAddr} className="w-full bg-[#F3F0FA] rounded-[16px] px-4 py-3 mb-4 text-left group">
          <div className="text-[10px] text-[#8B84A3] mb-0.5 flex items-center gap-1.5">
            Recipient wallet {copied ? <Check className="w-3 h-3 text-[#1E9E5A]" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
          </div>
          <div className="text-[11px] font-mono text-[#3D2E7C] break-all">{anim.wallet_address}</div>
        </button>

        {/* Send from */}
        {!noWalletAtAll ? (
          <div className="mb-4">
            <div className="text-[10px] font-display font-extrabold text-[#8B84A3] uppercase tracking-wide mb-2">Send from</div>
            <div className="flex gap-2 flex-wrap">
              {hasTerra && (
                <button onClick={() => setMethod("terra")} className={methodBtn(method === "terra")}>
                  <Globe className="w-3 h-3" /> Terra
                </button>
              )}
              {tttWalletAddress && (
                <button onClick={() => setMethod("ttt")} className={methodBtn(method === "ttt")}>
                  <Smartphone className="w-3 h-3" /> TTT Wallet
                </button>
              )}
              {hasKasware && (
                <button onClick={() => setMethod("kasware")} className={methodBtn(method === "kasware")}>
                  Kasware
                </button>
              )}
              {hasKastle && (
                <button onClick={() => setMethod("kastle")} className={methodBtn(method === "kastle")}>
                  <img src={KASTLE_LOGO} alt="Kastle" className="w-3.5 h-3.5 rounded" /> Kastle
                </button>
              )}
            </div>
            {method === "terra" && terraWallets.length > 1 && (
              <div className="mt-2 space-y-1">
                {terraWallets.map((tw, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTerraIdx(i)}
                    className={`w-full text-left px-3 py-2 rounded-[12px] text-[10px] font-mono transition-colors ${
                      i === selectedTerraIdx ? "bg-[#EBE6F8] text-[#7C5CFC]" : "bg-[#F3F0FA] text-[#8B84A3] hover:bg-[#EBE6F8]"
                    }`}
                  >
                    {tw.label || `Wallet ${i + 1}`}: {tw.address?.slice(0, 12)}…{tw.address?.slice(-6)}
                  </button>
                ))}
              </div>
            )}
            {method === "ttt" && (
              <div className="mt-2 bg-[#EBE6F8] rounded-[12px] px-3 py-2">
                <div className="text-[10px] text-[#7C5CFC] font-display font-extrabold mb-0.5">TTT Main Wallet</div>
                <div className="text-[10px] font-mono text-[#5A4B8A]">{tttWalletAddress?.slice(0, 16)}…{tttWalletAddress?.slice(-6)}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4 bg-[#FFF1E9] rounded-[16px] px-4 py-3 text-[11px] text-[#F96B4C]">
            No wallet found on this device. Create your TTT Wallet (Settings → Wallet) or set one up in Terra — or copy the address above to tip manually.
          </div>
        )}

        {/* Amount */}
        <div className="mb-4">
          <div className="text-[10px] font-display font-extrabold text-[#8B84A3] uppercase tracking-wide mb-2">Amount (KAS)</div>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#F3F0FA] rounded-[16px] px-4 py-3 text-lg text-center text-[#1F1B2E] outline-none focus:ring-2 focus:ring-[#7C5CFC]/40"
          />
          <div className="flex gap-2 mt-2">
            {["0.5", "1", "5", "10"].map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className="flex-1 py-1.5 rounded-full bg-[#F3F0FA] hover:bg-[#EBE6F8] text-[10px] font-display font-extrabold text-[#5A4B8A] transition-colors"
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* TTT PIN / seed auth */}
        {method === "ttt" && tttPrivateKey && hasPinSet && !pinVerified && (
          <div className="mb-4">
            <div className="text-[10px] font-display font-extrabold text-[#8B84A3] uppercase tracking-wide mb-2">Wallet PIN</div>
            <div className="flex gap-2">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinError(""); }}
                placeholder="6-digit PIN"
                className="flex-1 bg-[#F3F0FA] rounded-full px-4 py-2.5 text-sm text-center tracking-widest text-[#1F1B2E] outline-none focus:ring-2 focus:ring-[#7C5CFC]/40"
              />
              <button onClick={verifyPin} className="px-4 rounded-full bg-[#7C5CFC] hover:bg-[#6B4BEB] text-white text-[11px] font-display font-extrabold transition-colors">
                VERIFY
              </button>
            </div>
            {pinError && <p className="text-[11px] text-[#F96B4C] mt-1">{pinError}</p>}
          </div>
        )}
        {method === "ttt" && tttPrivateKey && hasPinSet && pinVerified && (
          <div className="mb-4 bg-[#E4F7EC] rounded-[16px] px-4 py-2.5 text-[11px] text-[#1E9E5A] flex items-center gap-2">
            <Check className="w-3.5 h-3.5" /> PIN verified — ready to send
          </div>
        )}
        {method === "ttt" && !tttPrivateKey && tttWalletAddress && (
          <div className="mb-4 space-y-2">
            <div className="bg-[#FFF7E1] rounded-[16px] px-4 py-2.5 text-[11px] text-[#B8860B]">
              Wallet key not on this device — enter your seed phrase to authorize.
            </div>
            <textarea
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value)}
              placeholder="word1 word2 word3 …"
              rows={3}
              className="w-full bg-[#F3F0FA] rounded-[16px] px-4 py-3 text-xs font-mono text-[#1F1B2E] resize-none outline-none focus:ring-2 focus:ring-[#7C5CFC]/40"
            />
          </div>
        )}

        {error && <div className="mb-4 bg-[#FFF1E9] rounded-[16px] px-4 py-2.5 text-[11px] text-[#F96B4C]">{error}</div>}

        <button
          onClick={handleSend}
          disabled={busy || noWalletAtAll}
          className="w-full py-3.5 rounded-full bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] text-white text-xs font-display font-extrabold shadow-[0_8px_20px_rgba(249,107,76,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> SENDING…</> : `SEND ${amount || ""} KAS TIP`}
        </button>
        <p className="text-[10px] text-[#8B84A3] text-center mt-3">
          {method === "ttt" ? "Sent natively via your TTT Wallet — no extension needed, works on mobile." : method === "terra" ? "Sent natively via your Terra wallet — no extension needed." : "Sent directly from your wallet extension."}
        </p>
      </motion.div>
    </motion.div>
  );
}