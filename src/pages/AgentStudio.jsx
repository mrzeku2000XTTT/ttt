import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AgentStudioHero from "@/components/agentstudio/AgentStudioHero";
import AgentDashboard from "@/components/agentstudio/AgentDashboard";
import AgentEditor from "@/components/agentstudio/AgentEditor";
import { getAgentWallet, saveAgentWallet } from "@/lib/agentInternetWallet";

export default function AgentStudioPage() {
  const [wallet, setWallet] = useState(null);
  const [view, setView] = useState("dashboard"); // "dashboard" | "editor"
  const [agent, setAgent] = useState(null);

  useEffect(() => { setWallet(getAgentWallet()); }, []);

  const onWallet = (w) => { saveAgentWallet(w); setWallet(w); };

  const createAgent = async (preset) => {
    const user = await base44.auth.me();
    const created = await base44.entities.AgentInternetAgent.create({
      name: preset?.name || "New Agent",
      task: preset?.task || "",
      system_prompt: preset?.system_prompt || "You are an autonomous agent on the Agent Internet. You reason about on-chain data and act only with verifiable proof.",
      user_email: user.email,
      wallet_address: wallet?.address || "",
      training_examples: [],
      epochs: 0,
      level: 0,
      is_trained: false,
    });
    setAgent(created);
    setView("editor");
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="sticky top-0 z-40 bg-[#fafafa]/85 backdrop-blur-xl border-b border-zinc-200/70">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-900">
            <ArrowLeft className="w-4 h-4" /> App Store
          </Link>
          <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-900">
            <Bot className="w-4 h-4" /> Agent Internet
          </div>
        </div>
      </div>

      {view === "dashboard" ? (
        <>
          <AgentStudioHero />
          <AgentDashboard onOpen={(a) => { setAgent(a); setView("editor"); }} onNew={createAgent} />
        </>
      ) : (
        agent && (
          <div className="pt-6">
            <AgentEditor
              agent={agent}
              wallet={wallet}
              onWallet={onWallet}
              onBack={() => { setAgent(null); setView("dashboard"); }}
              onChanged={(a) => setAgent(a)}
              onDeleted={() => { setAgent(null); setView("dashboard"); }}
            />
          </div>
        )
      )}
    </div>
  );
}