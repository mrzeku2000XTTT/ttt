import React from "react";
import KaspaWalletHeader from "@/components/KaspaWalletHeader";

export default function KaspaOnboardingPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <KaspaWalletHeader onClose={() => window.history.back()} />
      
      <div className="flex-1 bg-white">
        <iframe
          src="https://wallet.kaspa.com/onboarding"
          className="w-full h-full border-0"
          title="Kaspa Wallet Onboarding"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}