import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Book, Zap, Bot, Shield, Wallet, Users, TrendingUp, Search, Crown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GuidePage() {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);

  const sections = [
    {
      id: "getting-started",
      icon: Zap,
      title: "Getting Started",
      color: "from-cyan-500 to-blue-500",
      items: [
        {
          title: "Welcome to TTT",
          description: "TTT is your gateway to the Kaspa ecosystem. Connect your wallets, explore DApps, and manage your crypto.",
          page: "Home"
        },
        {
          title: "Connect Your Wallet",
          description: "Use Kasware (L1) or MetaMask (L2) to connect. Go to Profile → Connect Wallet to get started.",
          page: "ConnectWallet"
        },
        {
          title: "Browse Apps",
          description: "Explore 100+ apps in the Categories section. Filter by category to find what you need.",
          page: "Categories"
        }
      ]
    },
    {
      id: "core-features",
      icon: Book,
      title: "Core Features",
      color: "from-purple-500 to-pink-500",
      items: [
        {
          title: "TTTV Browser",
          description: "Watch videos, streams, and content from across the web. Search YouTube, movies, and more.",
          page: "Browser"
        },
        {
          title: "Send KAS",
          description: "Transfer KAS between L1 and L2. Bridge your assets seamlessly with real-time transaction tracking.",
          page: "Bridge"
        },
        {
          title: "TTT Feed",
          description: "Post updates, share media, and interact with the community. Encrypted social networking.",
          page: "Feed"
        },
        {
          title: "Calculator",
          description: "Advanced calculator with live KAS prices, currency conversions, and AI-powered calculations.",
          page: "Calculator"
        }
      ]
    },
    {
      id: "ai-agents",
      icon: Bot,
      title: "AI Agents",
      color: "from-green-500 to-emerald-500",
      premium: true,
      items: [
        {
          title: "Agent ZK",
          description: "Your personal AI assistant. Create profiles, manage tools, and build your digital identity.",
          page: "AgentZK",
          premium: true
        },
        {
          title: "Zeku AI",
          description: "Elite crypto companion with market analysis, image recognition, and real-time intelligence.",
          page: "ZekuAI",
          premium: true
        },
        {
          title: "Agent Directory",
          description: "Discover and connect with other Agent ZK profiles. Build your network.",
          page: "AgentZKDirectory",
          premium: true
        }
      ]
    },
    {
      id: "identity",
      icon: Shield,
      title: "Identity & Security",
      color: "from-orange-500 to-red-500",
      items: [
        {
          title: "TTT ID",
          description: "Register your unique Kaspa address as a TTT ID. Verify ownership with Kasware signatures.",
          page: "RegisterTTTID"
        },
        {
          title: "DAGKnight Wallet",
          description: "Multi-signature wallet verification system using DAG consensus for enhanced security.",
          page: "DAGKnightWallet",
          premium: true
        },
        {
          title: "Sealed Wallets",
          description: "Create tamper-proof wallet backups with cryptographic seals and 2FA verification.",
          page: "SealedWalletDetails"
        }
      ]
    },
    {
      id: "trading",
      icon: TrendingUp,
      title: "Trading & Commerce",
      color: "from-yellow-500 to-amber-500",
      items: [
        {
          title: "Marketplace",
          description: "P2P marketplace for buying and selling KAS. Escrow contracts ensure safe transactions.",
          page: "Marketplace"
        },
        {
          title: "Market X",
          description: "Task marketplace where you can hire or offer services for KAS payments.",
          page: "MarketX"
        },
        {
          title: "Shop",
          description: "Browse and purchase digital goods, NFTs, and services from verified sellers.",
          page: "Shop"
        }
      ]
    },
    {
      id: "tools",
      icon: Wallet,
      title: "Wallet Tools",
      color: "from-blue-500 to-indigo-500",
      items: [
        {
          title: "Balance Viewer",
          description: "Check any Kaspa address balance and transaction history without connecting a wallet.",
          page: "KaspaBalanceViewer"
        },
        {
          title: "Wallet Manager",
          description: "Manage your connected wallets, view balances, and track portfolio performance.",
          page: "Wallet"
        },
        {
          title: "Transaction History",
          description: "View your complete transaction history across L1 and L2 networks.",
          page: "History"
        }
      ]
    },
    {
      id: "social",
      icon: Users,
      title: "Social & Community",
      color: "from-pink-500 to-rose-500",
      items: [
        {
          title: "Konekt Chat",
          description: "Real-time chat for the KASUNITY community. Share messages and Bible verses.",
          page: "Konekt"
        },
        {
          title: "Proof of Life",
          description: "Daily check-ins to prove you're active. Share wellness updates and build streaks.",
          page: "POLFeed"
        },
        {
          title: "NFT Mint",
          description: "Create and mint your own NFTs on the Kaspa network. Build your digital collection.",
          page: "NFTMint"
        }
      ]
    },
    {
      id: "premium",
      icon: Crown,
      title: "Premium Features",
      color: "from-purple-500 to-violet-500",
      premium: true,
      items: [
        {
          title: "Premium Subscription",
          description: "Unlock all premium features: AI agents, advanced tools, priority support, and more.",
          page: "Subscription"
        },
        {
          title: "Hercules Tools",
          description: "Advanced developer tools, API access, and workspace management.",
          page: "Hercules",
          premium: true
        },
        {
          title: "Analytics Dashboard",
          description: "Track your activity, portfolio performance, and engagement metrics.",
          page: "Analytics"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10" style={{ paddingTop: 'calc(var(--sat, 0px) + 7.5rem)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(createPageUrl("Categories"))}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">TTT Guide</h1>
                <p className="text-sm text-gray-400">Learn how to use TTT</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className="w-full p-6 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{section.title}</h3>
                            {section.premium && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                <Crown className="w-3 h-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{section.items.length} features</p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-6 space-y-4">
                          {section.items.map((item, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              onClick={() => navigate(createPageUrl(item.page))}
                              className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                            >
                              <div className={`w-10 h-10 bg-gradient-to-br ${section.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                <Search className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                                    {item.title}
                                  </h4>
                                  {item.premium && (
                                    <Crown className="w-4 h-4 text-yellow-400" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2">
                                  {item.description}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Tips */}
        <Card className="mt-8 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Quick Tips
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <p>• Connect your Kasware wallet to access L1 features and TTT ID registration</p>
              <p>• Use MetaMask for L2 features and EVM-compatible dApps</p>
              <p>• Subscribe to Premium to unlock AI agents, advanced tools, and priority support</p>
              <p>• Check out the Categories page to explore all available apps</p>
              <p>• Join the community in Konekt chat to stay updated and connected</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}