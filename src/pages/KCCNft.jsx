import React, { useState } from "react";
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

  const tier = TIERS.find(t => t.id === form.tierId) || TIERS[0];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
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
          <KCCNftMintForm
            form={form}
            setForm={setForm}
            onMint={() => setPaymentOpen(true)}
          />
        </div>

        <KCCNftHowItWorks />
      </div>

      <KCCNftPaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        kasAmount={tier.kas}
      />
    </div>
  );
}