import React from "react";
import BackToStore from "@/components/BackToStore";
import { EvolveProvider } from "@/lib/evolve/useEvolve";
import EvolveApp from "@/components/evolve/EvolveApp";

export default function EvolvePage() {
  return (
    <EvolveProvider>
      <EvolveApp />
      <BackToStore />
    </EvolveProvider>
  );
}