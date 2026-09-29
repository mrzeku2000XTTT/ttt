import React from "react";
import BackToStore from "@/components/BackToStore";
import { EvolveProvider } from "@/lib/evolve/useEvolve";
import EvolveApp from "@/components/evolve/EvolveApp";
import EvolveErrorBoundary from "@/components/evolve/EvolveErrorBoundary";

export default function EvolvePage() {
  return (
    <EvolveErrorBoundary>
      <EvolveProvider>
        <EvolveApp />
        <BackToStore />
      </EvolveProvider>
    </EvolveErrorBoundary>
  );
}