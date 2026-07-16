import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import KCCNftPreviewCard from "@/components/kccnft/KCCNftPreviewCard";
import KCCNftMintForm from "@/components/kccnft/KCCNftMintForm";
import KCCNftPaymentModal from "@/components/kccnft/KCCNftPaymentModal";
import KCCNftHowItWorks from "@/components/kccnft/KCCNftHowItWorks";
import { TIERS } from "@/components/kccnft/kccNftTiers";

export default function KCCNft() {
  const [form, setForm] = useState({
    address: "",
    name: "",
    collection: "EarthtoMars",
    tierId: "base",
  });
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(null);

  const tier = TIERS.find(t => t.id === form.tierId) || TIERS[0];
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me()
      .then(u => setIsAdmin(u?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Back button */}
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
            KCC Covenant NFTs
          </h1>
          <p className="text-white/50 mt-3 text-lg">
            Your on-chain identity key to the TTT Supercomputer
          </p>
        </div>

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <KCCNftPreviewCard
            address={form.address}
            name={form.name}
            collection={form.collection}
            tierId={form.tierId}
          />
          <div className="space-y-3">
            {isAdmin === false && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 px-4 py-3">
                <Lock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-300">KCC NFT minting is admin-only for now. Public minting opens soon.</p>
              </div>
            )}
            <KCCNftMintForm
              form={form}
              setForm={setForm}
              onMint={() => { if (isAdmin) setPaymentOpen(true); }}
              disabled={!isAdmin}
            />
          </div>
        </div>

        <KCCNftHowItWorks />
      </div>

      <KCCNftPaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        kasAmount={tier.kas}
        buyerAddress={form.address?.trim() || ""}
      />
    </div>
  );
}