import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, CheckCircle2, ExternalLink } from "lucide-react";
import QRCode from "qrcode";
import { base44 } from "@/api/base44Client";
import { AGENT_WALLET } from "./kccNftTiers";

export default function KCCNftPaymentModal({ open, onOpenChange, kasAmount, buyerAddress }) {
  const copyAddress = () => navigator.clipboard.writeText(AGENT_WALLET);
  const [qrUrl, setQrUrl] = useState("");
  const [detected, setDetected] = useState(null);
  const [checkError, setCheckError] = useState(null);
  const startedAtRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setDetected(null);
    setCheckError(null);
    startedAtRef.current = new Date().toISOString();
    QRCode.toDataURL(`${AGENT_WALLET}?amount=${kasAmount}`, {
      width: 320,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setQrUrl);
  }, [open, kasAmount]);

  // Poll for on-chain payment while the modal is open
  useEffect(() => {
    if (!open || detected) return;
    let cancelled = false;

    const check = async () => {
      try {
        const res = await base44.functions.invoke("kccNftMintPayment", {
          kas_amount: kasAmount,
          buyer_address: buyerAddress || undefined,
          started_at: startedAtRef.current,
        });
        if (cancelled) return;
        if (res.data?.detected) {
          setDetected(res.data);
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err?.response?.data?.error || err.message;
        // Only surface hard failures (e.g. admin-only) — keep polling on transient errors
        if (err?.response?.status === 403) setCheckError(msg);
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [open, detected, kasAmount, buyerAddress]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold">
            {detected ? "Payment Detected!" : `Send ${kasAmount} KAS to:`}
          </DialogTitle>
        </DialogHeader>

        {detected ? (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <div>
              <p className="text-emerald-300 font-bold text-lg">{detected.amount_kas} KAS received</p>
              <p className="text-white/50 text-sm mt-1">Agent ZK is deploying your KCC NFT covenant.</p>
            </div>
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 text-left">
              <p className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Transaction ID</p>
              <p className="font-mono text-xs text-white/80 break-all">{detected.tx_id}</p>
            </div>
            <a
              href={`https://explorer.kaspa.org/txs/${detected.tx_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              View on Kaspa Explorer <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-xl p-3">
              <span className="font-mono text-xs text-emerald-300 break-all flex-1">{AGENT_WALLET}</span>
              <button onClick={copyAddress} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white flex-shrink-0">
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-white/60">
              Include your Kaspa address in the memo/label so your NFT can be issued to you.
            </p>

            <div className="mx-auto w-44 h-44 rounded-2xl bg-white border border-white/10 flex items-center justify-center overflow-hidden p-2">
              {qrUrl ? (
                <img src={qrUrl} alt="Kaspa payment QR code" className="w-full h-full" />
              ) : (
                <span className="text-[10px] text-black/40">Loading QR...</span>
              )}
            </div>

            {checkError ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 text-center">
                <p className="text-xs text-red-300">{checkError}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-emerald-300 font-medium">Waiting for payment — checking chain every 10s...</span>
              </div>
            )}

            <p className="text-xs text-white/40 text-center leading-relaxed">
              Once payment is detected on-chain, Agent ZK will deploy your KCC NFT covenant automatically.
              You will receive your covenant address, redeem script, and NFT identity proof.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}