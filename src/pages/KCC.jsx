import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import KCCCard from "@/components/kcc/KCCCard";
import KCCMintModal from "@/components/kcc/KCCMintModal";
import { Plus, ArrowLeft, ShieldCheck } from "lucide-react";

export default function KCC() {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMint, setShowMint] = useState(false);
  const [user, setUser] = useState(null);

  const load = useCallback(async () => {
    const list = await base44.entities.KCCNft.list("-created_date", 60);
    setNfts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, [load]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link to="/SuperZK" className="inline-flex items-center gap-1 text-white/40 text-xs hover:text-white mb-6">
          <ArrowLeft className="w-3 h-3" /> SuperZK
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <h1 className="text-3xl font-black tracking-tight">KCC <span className="text-cyan-400">·</span> Kaspa Covenant Collectibles</h1>
            </div>
            <p className="text-white/50 text-sm max-w-2xl">
              NFTs beyond KRC-721: every KCC is a covenant++ P2SH UTXO on Kaspa L1 — the rules
              (soulbound, gated, escrow, vault, quantum-safe, sentinel) are baked into the script
              and enforced by consensus, not by an indexer.
            </p>
          </div>
          {user ? (
            <button onClick={() => setShowMint(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 whitespace-nowrap">
              <Plus className="w-4 h-4" /> Mint KCC
            </button>
          ) : (
            <Link to="/login" className="px-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white/70 text-sm hover:bg-white/20">
              Login to mint
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-white/10 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <p className="text-white/40">No KCC NFTs minted yet — be the first covenant collector.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {nfts.map((nft) => <KCCCard key={nft.id} nft={nft} onChanged={load} />)}
          </div>
        )}
      </div>

      {showMint && <KCCMintModal onClose={() => setShowMint(false)} onMinted={load} />}
    </div>
  );
}