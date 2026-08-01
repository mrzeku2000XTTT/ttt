import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Coins } from "lucide-react";
import { KAS_USD_PRICE, COLLATERAL_RATIO, LIQUIDATION_RATIO, VAULT_COVENANT_ADDRESS } from "./kusdConfig";

export default function KUSDMintForm() {
  const [collateral, setCollateral] = useState("");
  const [receiver, setReceiver] = useState("");
  const [showModal, setShowModal] = useState(false);

  const receiverValid = /^kaspa:[a-z0-9]{50,}$/.test(receiver.trim());

  const kas = parseFloat(collateral) || 0;
  const kusdMinted = (kas * KAS_USD_PRICE) / COLLATERAL_RATIO;
  const liquidationPrice = kusdMinted > 0 ? (kusdMinted * LIQUIDATION_RATIO) / kas : 0;

  return (
    <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
        <Coins className="w-4 h-4 text-emerald-400" /> Mint kUSD
      </h2>

      <label className="text-xs text-zinc-400 font-semibold mb-2 block tracking-wide">COLLATERAL AMOUNT (KAS)</label>
      <Input
        type="number"
        min="0"
        value={collateral}
        onChange={(e) => setCollateral(e.target.value)}
        placeholder="0.00"
        className="bg-black/60 border-white/10 text-white rounded-2xl h-12 text-lg"
      />

      <label className="text-xs text-zinc-400 font-semibold mb-2 mt-4 block tracking-wide">RECEIVER KASPA ADDRESS</label>
      <Input
        value={receiver}
        onChange={(e) => setReceiver(e.target.value)}
        placeholder="kaspa:..."
        className="bg-black/60 border-white/10 text-white rounded-2xl h-12 font-mono text-sm"
      />
      {receiver && !receiverValid && (
        <p className="text-xs text-amber-400 mt-1">Enter a valid Kaspa address (starts with kaspa:)</p>
      )}

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between bg-black/40 rounded-2xl px-4 py-3">
          <span className="text-sm text-zinc-400">You will receive</span>
          <span className="text-emerald-400 font-bold font-mono">{kusdMinted.toFixed(4)} kUSD</span>
        </div>
        <div className="flex items-center justify-between bg-black/40 rounded-2xl px-4 py-3">
          <span className="text-sm text-zinc-400">Liquidation price</span>
          <span className="text-amber-400 font-bold font-mono">${liquidationPrice.toFixed(5)}</span>
        </div>
        <div className="flex items-center justify-between bg-black/40 rounded-2xl px-4 py-3">
          <span className="text-sm text-zinc-400">Current KAS/USD</span>
          <span className="text-white font-bold font-mono">${KAS_USD_PRICE.toFixed(3)}</span>
        </div>
      </div>

      <Button
        onClick={() => setShowModal(true)}
        disabled={kas <= 0 || !receiverValid}
        className="w-full h-12 mt-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold"
      >
        Mint kUSD
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white rounded-3xl">
          <DialogHeader>
            <DialogTitle>Mint {kusdMinted.toFixed(4)} kUSD</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Send <span className="text-white font-bold">{kas} KAS</span> to the vault covenant address below to mint kUSD.
              Your kUSD will be sent to your receiver address.
            </p>
            <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
              <div className="text-[10px] text-zinc-500 font-bold tracking-widest mb-1">RECEIVER ADDRESS</div>
              <div className="text-xs font-mono text-white break-all">{receiver.trim()}</div>
            </div>
            <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4">
              <div className="text-[10px] text-emerald-500 font-bold tracking-widest mb-1">VAULT COVENANT ADDRESS</div>
              <div className="text-xs font-mono text-white break-all">{VAULT_COVENANT_ADDRESS}</div>
            </div>
            <Button onClick={() => setShowModal(false)} className="w-full rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}