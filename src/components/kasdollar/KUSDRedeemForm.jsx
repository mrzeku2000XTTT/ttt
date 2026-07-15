import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownUp } from "lucide-react";
import { KAS_USD_PRICE, REDEMPTION_FEE } from "./kusdConfig";

export default function KUSDRedeemForm() {
  const [kusdAmount, setKusdAmount] = useState("");
  const [redeemed, setRedeemed] = useState(false);

  const kusd = parseFloat(kusdAmount) || 0;
  const kasOut = (kusd / KAS_USD_PRICE) * (1 - REDEMPTION_FEE);

  return (
    <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
      <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
        <ArrowDownUp className="w-4 h-4 text-cyan-400" /> Redeem kUSD
      </h2>

      <label className="text-xs text-zinc-400 font-semibold mb-2 block tracking-wide">kUSD AMOUNT TO REDEEM</label>
      <Input
        type="number"
        min="0"
        value={kusdAmount}
        onChange={(e) => { setKusdAmount(e.target.value); setRedeemed(false); }}
        placeholder="0.00"
        className="bg-black/60 border-white/10 text-white rounded-2xl h-12 text-lg"
      />

      <div className="mt-5 flex items-center justify-between bg-black/40 rounded-2xl px-4 py-3">
        <span className="text-sm text-zinc-400">You will receive <span className="text-zinc-600">(−0.5% fee)</span></span>
        <span className="text-cyan-400 font-bold font-mono">{kasOut.toFixed(4)} KAS</span>
      </div>

      <Button
        onClick={() => setRedeemed(true)}
        disabled={kusd <= 0}
        className="w-full h-12 mt-5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold"
      >
        Redeem
      </Button>

      {redeemed && (
        <p className="text-sm text-green-400 mt-3 text-center">
          ✓ {kusd} kUSD burned — {kasOut.toFixed(4)} KAS collateral released to your address.
        </p>
      )}
    </div>
  );
}