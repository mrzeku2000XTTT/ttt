import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowUpRight, AlertCircle, Check, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { IOS_FONT, KASPA_LOGO, normalizeAddress, truncateAddress } from "./shared";

export default function SendPanel({ address, activeWallet, balance, price, onSwitchToReceive }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const cleanAddress = normalizeAddress(address);
  const estimatedFee = "0.0005";
  const usdValue = amount && price ? (parseFloat(amount) * price).toFixed(2) : null;

  const handleSend = async () => {
    setError(null);
    setResult(null);
    if (!recipient.trim()) { setError("Enter a recipient address"); return; }
    if (!amount || parseFloat(amount) <= 0) { setError("Enter a valid amount"); return; }

    setSending(true);
    try {
      let txResult;
      if (activeWallet === "kasware") {
        if (typeof window.kasware === "undefined") {
          throw new Error("Kasware wallet not detected. Switch to TTT wallet or install Kasware.");
        }
        const sompi = Math.floor(parseFloat(amount) * 100000000);
        const toAddr = recipient.startsWith("kaspa:") ? recipient : `kaspa:${recipient}`;
        txResult = await window.kasware.sendKaspa(toAddr, sompi, {});
        setResult({ txId: typeof txResult === "string" ? txResult : txResult?.txId || "Sent", amountKas: parseFloat(amount), fee: 0 });
      } else {
        // TTT wallet — requires mnemonic for server-side signing
        if (!mnemonic.trim()) {
          setShowMnemonic(true);
          setError("Enter your wallet seed phrase to sign this transaction.");
          setSending(false);
          return;
        }
        const toAddr = recipient.startsWith("kaspa:") ? recipient : `kaspa:${recipient}`;
        const res = await base44.functions.invoke("sendKaspaTransaction", {
          mnemonic: mnemonic.trim(),
          fromAddress: cleanAddress,
          toAddress: toAddr,
          amountKas: parseFloat(amount),
        });
        const data = res?.data || res;
        if (data?.error) throw new Error(data.error);
        setResult(data);
      }
      setRecipient("");
      setAmount("");
      setMnemonic("");
    } catch (err) {
      setError(err?.message || "Transaction failed");
    }
    setSending(false);
  };

  return (
    <div className="px-5 space-y-3" style={{ fontFamily: IOS_FONT }}>
      {/* Wallet indicator */}
      <div className="flex items-center gap-2 text-[10px] text-white/40">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(10,132,255,0.1)", border: "1px solid rgba(10,132,255,0.2)" }}>
          <img src={KASPA_LOGO} alt="" className="w-3 h-3 object-contain" />
          {activeWallet === "kasware" ? "Kasware Wallet" : "TTT Wallet"}
        </span>
        {cleanAddress && <span className="font-mono truncate">{truncateAddress(cleanAddress)}</span>}
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-3.5 flex items-center gap-2.5" style={{ background: "rgba(48,209,88,0.1)", border: "1px solid rgba(48,209,88,0.3)" }}>
          <Check className="w-4 h-4 text-[#30D158] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white">Sent {result.amountKas} KAS</div>
            <div className="text-[10px] text-white/40 font-mono truncate">TX: {result.txId}</div>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="rounded-2xl p-3 flex items-start gap-2" style={{ background: "rgba(255,69,58,0.1)" }}>
          <AlertCircle className="w-3.5 h-3.5 text-[#FF453A] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#FF453A]">{error}</p>
        </div>
      )}

      {/* Recipient Address */}
      <div>
        <label className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5 block">Recipient Address</label>
        <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)}
          placeholder="kaspa:qz..."
          className="w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none"
          style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: IOS_FONT }} />
      </div>

      {/* Amount */}
      <div>
        <label className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5 block">Amount (KAS)</label>
        <div className="relative">
          <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" step="0.01"
            className="w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none pr-16"
            style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: IOS_FONT }} />
          {balance != null && (
            <button onClick={() => setAmount(String(balance))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#0A84FF]">
              MAX
            </button>
          )}
        </div>
        {usdValue && <div className="text-[10px] text-white/30 mt-1">≈ ${usdValue} USD</div>}
      </div>

      {/* Fee */}
      <div className="flex items-center justify-between rounded-xl px-3.5 py-2.5" style={{ background: "rgba(28,28,30,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-[10px] text-white/40">Network Fee</span>
        <span className="text-xs font-medium text-white/60 tabular-nums">~{estimatedFee} KAS</span>
      </div>

      {/* Mnemonic input for TTT wallet */}
      {activeWallet === "ttt" && showMnemonic && (
        <div>
          <label className="text-[10px] uppercase tracking-wide text-white/40 mb-1.5 block">Seed Phrase (required for TTT wallet)</label>
          <textarea value={mnemonic} onChange={(e) => setMnemonic(e.target.value)}
            placeholder="Enter your 12 or 24 word seed phrase…"
            rows={3}
            className="w-full rounded-xl px-3.5 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none resize-none"
            style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: IOS_FONT }} />
          <p className="text-[10px] text-white/30 mt-1">Your seed phrase is only used to sign this transaction and is never stored.</p>
        </div>
      )}

      {/* Send button — subtle, not oversized */}
      <button onClick={handleSend} disabled={sending}
        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
        style={{ background: "#0A84FF", color: "#fff", fontFamily: IOS_FONT, boxShadow: "0 2px 12px rgba(10,132,255,0.2)" }}>
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
        {sending ? "Sending…" : "Send KAS"}
      </button>

      <button onClick={onSwitchToReceive} className="w-full py-2 text-xs text-white/40 hover:text-white/70 transition-colors flex items-center justify-center gap-1">
        Need to receive first? <span className="text-[#0A84FF]">Receive KAS</span>
      </button>
    </div>
  );
}