import React from "react";
import { Cpu, ScanLine, PackageCheck } from "lucide-react";

const STEPS = [
  { icon: Cpu, title: "Request AI Service", desc: "Pick a compute job on KasCompute. AWA generates a KAS payment request." },
  { icon: ScanLine, title: "Sign on Phone B", desc: "Scan QR with your air-gapped signer phone. Review amount + destination. Approve." },
  { icon: PackageCheck, title: "Get Your Result", desc: "Signed payment broadcasts to Kaspa. AI service runs. You get the output." },
];

export default function AWAHowItWorks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={i} className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-[10px] font-bold text-cyan-500 tracking-widest mb-1">STEP {i + 1}</div>
            <h3 className="text-white font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
          </div>
        );
      })}
    </div>
  );
}