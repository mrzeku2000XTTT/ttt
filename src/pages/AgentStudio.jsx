import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot } from "lucide-react";
import AgentStudioHero from "@/components/agentstudio/AgentStudioHero";
import AgentWalletCard from "@/components/agentstudio/AgentWalletCard";
import SelfSendTrainer from "@/components/agentstudio/SelfSendTrainer";
import AgentGitHubPush from "@/components/agentstudio/AgentGitHubPush";
import { getAgentWallet } from "@/lib/agentInternetWallet";

const DEFAULT_PROMPT =
  "You are an autonomous agent on the Agent Internet. You operate a native Kaspa wallet, reason about on-chain data, and act only with verifiable proof.";

export default function AgentStudioPage() {
  const [wallet, setWallet] = useState(null);
  const [agentName, setAgentName] = useState("My Agent");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [, setTick] = useState(0);

  useEffect(() => { setWallet(getAgentWallet()); }, []);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="sticky top-0 z-40 bg-[#fafafa]/85 backdrop-blur-xl border-b border-zinc-200/70">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="w-4 h-4" />
            App Store
          </Link>
          <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-900">
            <Bot className="w-4 h-4" />
            Agent Internet
          </div>
        </div>
      </div>

      <AgentStudioHero />

      <div className="max-w-5xl mx-auto px-5 pb-20 grid lg:grid-cols-2 gap-4 items-start">
        {/* Agent identity */}
        <div className="bg-white rounded-2xl ring-1 ring-zinc-200 p-6 lg:col-span-2">
          <h3 className="font-bold text-zinc-900 mb-4">Your agent</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Name</label>
              <input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full h-10 px-3 mt-1 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">System prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 mt-1 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-400 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AgentWalletCard wallet={wallet} onWallet={setWallet} />
          <AgentGitHubPush wallet={wallet} agentName={agentName} systemPrompt={systemPrompt} />
        </div>

        <SelfSendTrainer wallet={wallet} agentName={agentName} onEpoch={() => setTick((t) => t + 1)} />
      </div>
    </div>
  );
}