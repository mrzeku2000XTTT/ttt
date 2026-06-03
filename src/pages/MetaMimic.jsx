import React from "react";
import { motion } from "framer-motion";
import MetaMimicNav from "@/components/metamimic/MetaMimicNav";
import MetaMimicHero from "@/components/metamimic/MetaMimicHero";
import MetaMimicAbout from "@/components/metamimic/MetaMimicAbout";
import MetaMimicStudio from "@/components/metamimic/MetaMimicStudio";
import MetaMimicCards from "@/components/metamimic/MetaMimicCards";
import MetaMimicCTA from "@/components/metamimic/MetaMimicCTA";
import MetaMimicFooter from "@/components/metamimic/MetaMimicFooter";

export default function MetaMimicPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      <MetaMimicNav />
      <MetaMimicHero />
      <MetaMimicAbout />
      <MetaMimicStudio />
      <MetaMimicCards />
      <MetaMimicCTA />
      <MetaMimicFooter />
    </main>
  );
}