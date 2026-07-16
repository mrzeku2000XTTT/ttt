import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLLECTIONS, TIERS } from "./kccNftTiers";

export default function KCCNftMintForm({ form, setForm, onMint, disabled }) {
  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="rounded-3xl bg-zinc-900/70 border border-white/10 p-6 space-y-5 backdrop-blur-xl">
      <div>
        <label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2 block">Your Kaspa Address</label>
        <Input
          value={form.address}
          onChange={(e) => set("address")(e.target.value)}
          placeholder="kaspa:q..."
          className="bg-black/50 border-white/10 text-white rounded-xl h-12 font-mono text-sm"
        />
      </div>

      <div>
        <label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2 block">NFT Name / Identity</label>
        <Input
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
          placeholder='e.g. "EarthtoMars #001"'
          className="bg-black/50 border-white/10 text-white rounded-xl h-12"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2 block">Collection</label>
          <Select value={form.collection} onValueChange={set("collection")}>
            <SelectTrigger className="bg-black/50 border-white/10 text-white rounded-xl h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-white">
              {COLLECTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2 block">Tier</label>
          <Select value={form.tierId} onValueChange={set("tierId")}>
            <SelectTrigger className="bg-black/50 border-white/10 text-white rounded-xl h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10 text-white">
              {TIERS.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <button
        onClick={onMint}
        disabled={disabled}
        className="w-full h-14 rounded-2xl bg-emerald-500/15 border-2 border-emerald-400/60 text-emerald-300 font-bold text-base shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:bg-emerald-500/25 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500/15 disabled:hover:shadow-[0_0_25px_rgba(16,185,129,0.35)]"
      >
        {disabled ? "Admin Only" : "Mint KCC NFT Identity"}
      </button>
    </div>
  );
}