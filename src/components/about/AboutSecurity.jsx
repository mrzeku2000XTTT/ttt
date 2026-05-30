import React from "react";
import { Shield, Lock, Eye, Key } from "lucide-react";

const ITEMS = [
  { icon: Lock, title: "Non-custodial", desc: "You own your keys and your funds." },
  { icon: Eye, title: "Privacy-first", desc: "Encrypted feeds and zero-knowledge identity." },
  { icon: Key, title: "On-chain proof", desc: "Actions verifiable on the Kaspa network." },
];

export default function AboutSecurity() {
  return (
    <div className="space-y-6 max-w-lg">
      <div className="w-11 h-11 rounded-xl bg-emerald-400/15 flex items-center justify-center">
        <Shield className="w-5 h-5 text-emerald-300" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-[200] tracking-tight">Security by design</h2>
      <div className="space-y-3">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.title} className="flex items-start gap-3 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
              <Icon className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-[600]">{it.title}</h3>
                <p className="text-white/40 text-xs mt-0.5 font-[300]">{it.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}