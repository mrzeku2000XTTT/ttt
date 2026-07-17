import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, X, Wallet } from "lucide-react";
import SlobzNav from "@/components/slobz/SlobzNav";
import SlobzBlobs from "@/components/slobz/SlobzBlobs";
import PostGigForm from "@/components/slobzmarket/PostGigForm";
import GigCard from "@/components/slobzmarket/GigCard";
import SlobzMarketWaitlist from "@/components/slobzmarket/SlobzMarketWaitlist";

export default function SlobzMarket() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [wallet, setWallet] = useState(() => localStorage.getItem("slobz_wallet") || "");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const hasAccess = user?.role === "admin" || user?.slobz_market_invited === true;

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {}).finally(() => setAuthChecked(true));
  }, []);

  const loadGigs = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("slobzEscrow", { action: "list" });
      setGigs(res.data?.gigs || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) loadGigs();
  }, [hasAccess, loadGigs]);

  const handleWallet = (e) => {
    setWallet(e.target.value);
    localStorage.setItem("slobz_wallet", e.target.value);
  };

  const normWallet = wallet.trim() ? (wallet.trim().startsWith("kaspa:") ? wallet.trim() : `kaspa:${wallet.trim()}`) : "";

  return (
    <div className="min-h-screen bg-[#DED6F2] text-[#1F1B2E] pb-20 font-body relative">
      <SlobzBlobs />
      <div className="max-w-4xl mx-auto px-4 md:px-6 relative z-10">
        <SlobzNav />

        <div className="text-center mb-6 pt-4">
          <h1 className="font-display text-3xl md:text-4xl font-black text-[#4A2FA8]">Covenant Escrow Market</h1>
          <p className="text-sm text-[#5A4B8A] mt-2">
            KAS locks in a per-gig escrow wallet on-chain. Work gets checked. Funds release automatically.
          </p>
        </div>

        {!authChecked ? (
          <div className="flex items-center justify-center py-16 text-[#7C5CFC]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !hasAccess ? (
          <SlobzMarketWaitlist user={user} />
        ) : (
        <>
        {/* Wallet identity */}
        <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-[#7C5CFC] flex items-center justify-center flex-shrink-0 shadow-[0_6px_14px_rgba(124,92,252,0.35)]">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <input
            className="flex-1 bg-transparent text-xs text-[#1F1B2E] placeholder-[#8B84A3] outline-none"
            placeholder="Your Kaspa wallet address (kaspa:…) — your identity for posting & claiming"
            value={wallet}
            onChange={handleWallet}
          />
        </div>

        {/* Post gig */}
        <div className="mb-8">
          {!showPost ? (
            <button
              onClick={() => setShowPost(true)}
              className="w-full py-4 rounded-[28px] bg-[#FDFBF7] hover:bg-white shadow-[0_16px_40px_rgba(124,92,252,0.14)] text-[#7C5CFC] text-xs font-display font-extrabold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> POST A GIG & LOCK ESCROW
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.18)] p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold text-[#1F1B2E]">New Escrow Gig</h2>
                <button onClick={() => setShowPost(false)} className="p-2 rounded-full hover:bg-[#F3F0FA] text-[#8B84A3]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <PostGigForm
                wallet={normWallet}
                onPosted={() => {
                  setShowPost(false);
                  loadGigs();
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Gig grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#7C5CFC]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : gigs.length === 0 ? (
          <div className="bg-[#FDFBF7] rounded-[28px] shadow-[0_16px_40px_rgba(124,92,252,0.14)] p-12 text-center">
            <p className="font-heading text-lg text-[#1F1B2E] mb-1">No gigs yet</p>
            <p className="text-xs text-[#8B84A3]">Be the first to post one — the escrow does the trust for you.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} wallet={normWallet} onChanged={loadGigs} />
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}