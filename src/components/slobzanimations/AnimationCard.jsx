import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Coins, Copy, Check } from "lucide-react";

export default function AnimationCard({ anim, onTipped }) {
  const [showTip, setShowTip] = useState(false);
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  const sendTip = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setMsg({ type: "error", text: "Enter a valid amount." });
    setBusy(true);
    setMsg(null);
    try {
      const sompi = Math.floor(amt * 1e8);
      let txId;
      if (window.kasware) {
        txId = await window.kasware.sendKaspa(anim.wallet_address, sompi);
      } else if (window.kastle) {
        try { await window.kastle.request?.("kas:connect"); } catch { /* already connected */ }
        txId = await window.kastle.sendKaspa(anim.wallet_address, sompi);
      } else {
        throw new Error("No wallet extension found. Install Kasware or Kastle, or copy the address to tip manually.");
      }
      await base44.entities.SlobzAnimation.update(anim.id, { tips_received: (anim.tips_received || 0) + amt });
      setMsg({ type: "success", text: `Tipped ${amt} KAS! ${txId ? "TX: " + String(txId).slice(0, 14) + "…" : ""}` });
      onTipped?.();
    } catch (err) {
      const t = err?.message || "Tip failed";
      setMsg({ type: "error", text: /reject/i.test(t) ? "Transaction cancelled." : t });
    } finally {
      setBusy(false);
    }
  };

  const copyAddr = () => {
    navigator.clipboard.writeText(anim.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] overflow-hidden">
      <video src={anim.video_url} controls loop playsInline className="w-full aspect-video object-cover bg-[#E9E4F5]" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-heading text-base font-semibold text-[#1F1B2E] leading-snug">{anim.title}</h3>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E4F7EC] text-[#1E9E5A] text-[10px] font-display font-extrabold flex-shrink-0">
            <Coins className="w-3 h-3" /> {anim.tips_received || 0} KAS
          </span>
        </div>
        <p className="text-[11px] text-[#8B84A3] mb-3">by {anim.creator_name || "Anonymous Slob"}</p>

        {msg && (
          <div className={`text-[11px] rounded-[12px] px-3 py-2 mb-2 ${msg.type === "success" ? "bg-[#E4F7EC] text-[#1E9E5A]" : "bg-[#FFF1E9] text-[#F96B4C]"}`}>
            {msg.text}
          </div>
        )}

        {!showTip ? (
          <button
            onClick={() => setShowTip(true)}
            className="w-full py-2.5 rounded-full bg-gradient-to-b from-[#FF8A6B] to-[#F96B4C] text-white text-[11px] font-display font-extrabold shadow-[0_6px_16px_rgba(249,107,76,0.35)]"
          >
            TIP THIS ANIMATION
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-[#F3F0FA] rounded-full px-4 py-2 text-xs text-[#1F1B2E] outline-none focus:ring-2 focus:ring-[#7C5CFC]/40"
                placeholder="KAS"
              />
              <button
                onClick={sendTip}
                disabled={busy}
                className="px-4 py-2 rounded-full bg-[#7C5CFC] hover:bg-[#6B4BEB] text-white text-[11px] font-display font-extrabold disabled:opacity-60 flex items-center gap-1.5 transition-colors"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} SEND
              </button>
            </div>
            <button onClick={copyAddr} className="w-full flex items-center justify-center gap-1.5 text-[10px] text-[#8B84A3] hover:text-[#7C5CFC]">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Address copied!" : `${anim.wallet_address.slice(0, 18)}… copy to tip manually`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}