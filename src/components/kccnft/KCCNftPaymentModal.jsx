import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import QRCode from "qrcode";
import { AGENT_WALLET } from "./kccNftTiers";

export default function KCCNftPaymentModal({ open, onOpenChange, kasAmount }) {
  const copyAddress = () => navigator.clipboard.writeText(AGENT_WALLET);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(`${AGENT_WALLET}?amount=${kasAmount}`, {
      width: 320,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setQrUrl);
  }, [open, kasAmount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold">
            Send {kasAmount} KAS to:
          </DialogTitle>
        </DialogHeader>

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

          <div className="flex items-center justify-center gap-2 py-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-300 font-medium">Waiting for payment...</span>
          </div>

          <p className="text-xs text-white/40 text-center leading-relaxed">
            Once payment is detected on-chain, Agent ZK will deploy your KCC NFT covenant automatically.
            You will receive your covenant address, redeem script, and NFT identity proof.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}