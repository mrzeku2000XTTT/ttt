import React from "react";
import { EvolveProvider } from "@/lib/evolve/useEvolve";
import EvolveApp from "@/components/evolve/EvolveApp";
import EvolveErrorBoundary from "@/components/evolve/EvolveErrorBoundary";

export default function EvolvePage() {
  return (
    <EvolveErrorBoundary>
      <EvolveProvider>
        <EvolveApp />
      </EvolveProvider>
    </EvolveErrorBoundary>
  );
}