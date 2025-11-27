import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Zap, Shield, Sparkles, Users, Cpu, Wallet, TrendingUp, Heart, Gamepad2, FileText, Settings } from "lucide-react";

export default function KnowledgeBasePage() {
  const sections = [
    {
      icon: Brain,
      title: "Platform Overview",
      color: "from-purple-500 to-pink-500",
      content: "TTT is a comprehensive Web3 platform connecting HUMANS, AI, and CRYPTO through practical blockchain applications. Built on Kaspa's 1-second block time blockchain with Kasplex L2 integration."
    },
    {
      icon: Sparkles,
      title: "5 AI Assistants",
      color: "from-cyan-500 to-blue-500",
      items: [
        "Zeku AI - Personal assistant with memory, web browsing, image generation",
        "Agent ZK - Professional networking & identity platform",
        "Agent FYE - Financial trading insights",
        "Agent Ying - Knowledge base & vision analysis",
        "LIFE Assistant - Voice-powered frequency therapy"
      ]
    },
    {
      icon: Wallet,
      title: "Blockchain Features",
      color: "from-green-500 to-emerald-500",
      items: [
        "Multi-wallet support (Kasware, MetaMask, TTT, ZK)",
        "L1 ↔ L2 bridging with 1-second confirmations",
        "Smart contract deployment & interaction",
        "Real-time transaction tracking",
        "Signature verification & 3FA"
      ]
    },
    {
      icon: Users,
      title: "Social & Content",
      color: "from-pink-500 to-rose-500",
      items: [
        "Encrypted social feed with Kasware stamping",
        "TTTV - YouTube video platform integration",
        "Proof of Life - Real-time activity verification",
        "Channels - User video content creation",
        "Encrypted notepad with PIN protection"
      ]
    },
    {
      icon: TrendingUp,
      title: "Marketplaces",
      color: "from-orange-500 to-amber-500",
      items: [
        "P2P Energy Trading with escrow smart contracts",
        "Shop - Digital goods & NFT marketplace",
        "Market X - Task marketplace with proof of work",
        "Services - Professional hourly/project listings"
      ]
    },
    {
      icon: Cpu,
      title: "Professional Tools",
      color: "from-indigo-500 to-purple-500",
      items: [
        "Job board with Indeed API & AI matching",
        "HR Management - Payroll, PTO, expenses in KAS",
        "Agent ZK networking & messaging",
        "Career development tools"
      ]
    },
    {
      icon: Heart,
      title: "Wellness (LIFE)",
      color: "from-pink-500 to-purple-500",
      items: [
        "Binaural frequency therapy (1-1000Hz)",
        "10 preset frequencies (Delta, Theta, Alpha, etc.)",
        "Mood tracking with 7 mood types",
        "AI meditation script generation",
        "Voice assistant integration"
      ]
    },
    {
      icon: Gamepad2,
      title: "Gaming & NFTs",
      color: "from-yellow-500 to-orange-500",
      items: [
        "Multiplayer Bingo with prize pools",
        "Arcade game lobby",
        "AI-generated NFT minting (DALL-E)",
        "Rarity tiers (common → legendary)",
        "NFT vault storage & trading"
      ]
    }
  ];

  const stats = [
    { label: "Pages", value: "60+" },
    { label: "Data Entities", value: "50+" },
    { label: "Backend Functions", value: "75+" },
    { label: "UI Components", value: "60+" },
    { label: "AI Agents", value: "5" },
    { label: "Blockchain Integrations", value: "7" }
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
      <div className="fixed inset-0" style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)`
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full">
            <Brain className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              TTT PLATFORM
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto mb-6">
            Trust, Tasks, Transactions - Decentralized Business Platform
          </p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3">
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Glass Widget Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                {/* Gradient Glow */}
                <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />
                
                <div className="relative">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">{section.title}</h2>
                  </div>

                  {/* Content */}
                  {section.content && (
                    <p className="text-gray-300 text-sm leading-relaxed">{section.content}</p>
                  )}

                  {section.items && (
                    <ul className="space-y-2">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${section.color} mt-1.5 flex-shrink-0`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white">Platform Stats</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p>✓ Fully Operational</p>
              <p>✓ Real-time Features Active</p>
              <p>✓ Mobile Optimized PWA</p>
              <p>✓ Multi-wallet Support</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-green-400" />
              <h3 className="font-bold text-white">Security</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p>✓ Row-level Security (RLS)</p>
              <p>✓ Signature Verification</p>
              <p>✓ PIN Encryption (SHA-256)</p>
              <p>✓ 3FA Sessions</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-white">Tech Stack</h3>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              <p>✓ Kaspa 1-sec Blocks</p>
              <p>✓ Kasplex L2 (ZEKU)</p>
              <p>✓ React/TypeScript</p>
              <p>✓ Deno Edge Functions</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3">
            <p className="text-gray-400 text-sm">
              Built on Kaspa Blockchain • Powered by AI • November 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}