import React, { useState } from "react";
import QRCode from "qrcode";
import KasSignerScanner from "./KasSignerScanner";
import { parseKspt, signPayload } from "./kasSignerKeys";

export default function KasSignerSignTab() {
  const [pasteHex, setPasteHex] = useState("");
  const [tx, setTx] = useState(null);
  const [signedQr, setSignedQr] = useState(null);
  const [error, setError] = useState("");

  const handlePayload = (payload) => {
    setError("");
    setSignedQr(null);
    try {
      setTx(parseKspt(payload));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSign = async () => {
    setError("");
    try {
      const { signature, pubkey } = signPayload(tx.raw);
      const signed = JSON.stringify({ type: "kspt_signed", payload: tx.raw, signature, pubkey });
      const dataUrl = await QRCode.toDataURL(signed, { width: 512, margin: 2 });
      setSignedQr({ dataUrl, signature });
    } catch (err) {
      setError(err.message);
    }
  };

  const reset = () => {
    setTx(null);
    setSignedQr(null);
    setPasteHex("");
    setError("");
  };

  return (
    <div className="space-y-5">
      {!tx && (
        <>
          <div className="rounded-2xl bg-[#16161d] border border-white/10 p-4">
            <h3 className="text-white/80 font-semibold text-sm mb-3">Scan payment QR</h3>
            <KasSignerScanner onScan={handlePayload} />
          </div>

          <div className="rounded-2xl bg-[#16161d] border border-white/10 p-4">
            <h3 className="text-white/80 font-semibold text-sm mb-3">Or paste KSPT hex</h3>
            <textarea
              value={pasteHex}
              onChange={(e) => setPasteHex(e.target.value)}
              placeholder="Paste KSPT hex or JSON payload..."
              rows={4}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs font-mono resize-none focus:outline-none focus:border-[#6366f1]"
            />
            <button
              onClick={() => handlePayload(pasteHex)}
              disabled={!pasteHex.trim()}
              className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm mt-2 disabled:opacity-40 transition-colors"
            >
              Parse Transaction
            </button>
          </div>
        </>
      )}

      {tx && !signedQr && (
        <div className="rounded-2xl bg-[#16161d] border border-[#6366f1]/40 p-5">
          <h3 className="text-white font-bold mb-4">Review Transaction</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Amount</span>
              <span className="text-white font-bold">{tx.amount} KAS</span>
            </div>
            <div>
              <span className="text-white/50 block mb-1">To</span>
              <span className="text-white font-mono text-xs break-all">{tx.to}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Fee</span>
              <span className="text-white">{tx.fee} KAS</span>
            </div>
          </div>
          <button
            onClick={handleSign}
            className="w-full h-12 rounded-xl bg-[#6366f1] hover:bg-[#5457e0] text-white font-bold text-sm mt-5 transition-colors"
          >
            Sign & Generate QR
          </button>
          <button onClick={reset} className="w-full h-10 text-white/40 hover:text-white text-xs mt-1">
            Cancel
          </button>
        </div>
      )}

      {signedQr && (
        <div className="rounded-2xl bg-[#16161d] border border-emerald-500/40 p-5 text-center">
          <h3 className="text-emerald-400 font-bold mb-4">✓ Signed — scan with Phone A</h3>
          <img src={signedQr.dataUrl} alt="Signed transaction QR" className="w-full max-w-xs mx-auto rounded-xl bg-white p-2" />
          <p className="text-white/40 text-[10px] font-mono break-all mt-3">{signedQr.signature}</p>
          <button
            onClick={reset}
            className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm mt-4 transition-colors"
          >
            Sign Another
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-300 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}