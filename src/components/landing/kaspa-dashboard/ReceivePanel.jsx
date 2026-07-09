import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Copy, Check, Share2, Twitter, Link as LinkIcon } from "lucide-react";
import { IOS_FONT, KASPA_LOGO, normalizeAddress, truncateAddress } from "./shared";

export default function ReceivePanel({ address, activeWallet }) {
  const [qrUrl, setQrUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const cleanAddress = normalizeAddress(address);

  useEffect(() => {
    if (!cleanAddress) return;
    QRCode.toDataURL(cleanAddress, { width: 240, margin: 1, color: { dark: "#ffffff", light: "#0a0a0a" } })
      .then(setQrUrl).catch(() => setQrUrl(null));
  }, [cleanAddress]);

  const copyAddress = () => {
    if (!cleanAddress) return;
    navigator.clipboard?.writeText(cleanAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title: "My Kaspa Address", text: `Send me KAS: ${cleanAddress}` });
    } else {
      copyAddress();
    }
  };

  if (!cleanAddress) {
    return (
      <div className="px-5 py-12 text-center" style={{ fontFamily: IOS_FONT }}>
        <p className="text-sm text-white/40">No wallet connected. Connect a wallet to receive KAS.</p>
      </div>
    );
  }

  return (
    <div className="px-5 flex flex-col items-center" style={{ fontFamily: IOS_FONT }}>
      {/* Wallet badge */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/40 mb-5">
        <img src={KASPA_LOGO} alt="" className="w-3 h-3 object-contain" />
        {activeWallet === "kasware" ? "Kasware Wallet" : "TTT Wallet"}
      </div>

      {/* QR Code */}
      <div className="rounded-3xl p-4" style={{ background: "rgba(28,28,30,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {qrUrl ? (
          <img src={qrUrl} alt="QR Code" className="w-48 h-48" />
        ) : (
          <div className="w-48 h-48 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-[#0A84FF] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Address */}
      <div className="mt-5 w-full max-w-xs">
        <div className="text-[10px] uppercase tracking-wide text-white/40 text-center mb-2">Your Kaspa Address</div>
        <div className="rounded-xl px-3.5 py-2.5 text-center" style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-white/70 font-mono break-all leading-relaxed">{cleanAddress}</p>
        </div>
      </div>

      {/* Copy button */}
      <button onClick={copyAddress}
        className="w-full max-w-xs mt-3 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        style={{ background: "#0A84FF", color: "#fff", fontFamily: IOS_FONT }}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy Address"}
      </button>

      {/* Share links */}
      <div className="flex items-center gap-3 mt-4">
        <button onClick={shareLink}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors"
          style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Share2 className="w-3.5 h-3.5" /> Share
        </button>
        <a href={`https://twitter.com/intent/tweet?text=Send%20me%20KAS%20on%20Kaspa!&url=${encodeURIComponent(cleanAddress)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors"
          style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Twitter className="w-3.5 h-3.5" /> Tweet
        </a>
        <button onClick={copyAddress}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 transition-colors"
          style={{ background: "rgba(28,28,30,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <LinkIcon className="w-3.5 h-3.5" /> Link
        </button>
      </div>
    </div>
  );
}