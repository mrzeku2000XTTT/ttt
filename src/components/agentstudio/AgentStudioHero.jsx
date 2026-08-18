import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Wallet, Github, Zap } from "lucide-react";

const STEPS = [
  { icon: Wallet, title: "Generate a wallet", body: "An AgentInternet wallet is created on your device. Keys never leave it." },
  { icon: Zap, title: "Train by self-sending", body: "Each auto self-send is one training epoch, anchored by a real Kaspa txid." },
  { icon: Github, title: "Push to your GitHub", body: "Export the agent and its verifiable training log to your own repo." },
];

export default function AgentStudioHero() {
  return (
    <div className="max-w-5xl mx-auto px-5 pt-14 pb-10 text-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-bold tracking-[0.15em] uppercase mb-5">
          <Sparkles className="w-3 h-3" />
          Alpha Studio
        </span>
        <h1 className="text-4xl sm:text-6xl font-[800] tracking-tight text-zinc-900 leading-[1.05] mb-4">
          Agent Internet Studio
        </h1>
        <p className="text-zinc-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Train your own AI agent with a native Kaspa wallet. Every training epoch is a real self-send transaction — provable, non-custodial, and yours to export.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-3 mt-11 text-left">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * (i + 1) }}
              className="bg-white rounded-2xl ring-1 ring-zinc-200 p-5"
            >
              <Icon className="w-4 h-4 text-zinc-400 mb-3" />
              <h3 className="font-bold text-zinc-900 text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{s.body}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}