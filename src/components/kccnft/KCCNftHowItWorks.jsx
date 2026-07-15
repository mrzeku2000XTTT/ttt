import React from "react";
import { Link } from "react-router-dom";
import { Coins, Bot, Cpu, ArrowRight } from "lucide-react";

const STEPS = [
  { icon: Coins, title: "Choose your tier & pay in KAS" },
  { icon: Bot, title: "Agent ZK deploys your covenant on Kaspa L1" },
  { icon: Cpu, title: "Use your NFT to access TTT Supercomputer" },
];

export default function KCCNftHowItWorks() {
  return (
    <div className="mt-16">
      <h2 className="text-white text-xl font-bold mb-6 text-center">How it works</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {STEPS.map((step, i) => (
          <div key={i} className="rounded-2xl bg-zinc-900/70 border border-white/10 p-6 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <step.icon className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="text-white/40 text-xs font-bold">STEP {i + 1}</span>
            <p className="text-white/80 text-sm font-medium">{step.title}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link to="/KCC" className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 text-sm font-semibold">
          View existing KCC NFTs <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}