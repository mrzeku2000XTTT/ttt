import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, Search, Loader2, Sparkles, ChevronRight, 
  Book, Code, Zap, Shield, Users, ArrowLeft, Brain
} from "lucide-react";

const ALL_PAGES = [
  { name: "AgentFYE", category: "AI Agents", icon: "🤖", desc: "Financial advisor AI analyzing bills and finding savings" },
  { name: "AgentZK", category: "AI Agents", icon: "🔐", desc: "Zero-knowledge agent workspace with tools and integrations" },
  { name: "AgentZKChat", category: "AI Agents", icon: "💬", desc: "Chat interface for Agent ZK interactions" },
  { name: "AgentZKDirectory", category: "AI Agents", icon: "📖", desc: "Directory of verified Agent ZK profiles" },
  { name: "AgentZKProfile", category: "AI Agents", icon: "👤", desc: "Individual Agent ZK profile pages" },
  { name: "AgentMessages", category: "AI Agents", icon: "✉️", desc: "P2P encrypted messaging between agents" },
  { name: "ZekuAI", category: "AI Agents", icon: "⚡", desc: "Premium AI chat with file uploads and web search" },
  { name: "AIAnalytics", category: "Analytics", icon: "📊", desc: "AI conversation analytics dashboard" },
  { name: "Analytics", category: "Analytics", icon: "📈", desc: "Platform usage and statistics" },
  { name: "Bridge", category: "Blockchain", icon: "🌉", desc: "L1 to L2 token bridge with wallet integration" },
  { name: "Wallet", category: "Blockchain", icon: "💰", desc: "KAS wallet management" },
  { name: "Receive", category: "Blockchain", icon: "📥", desc: "Generate QR codes to receive KAS" },
  { name: "History", category: "Blockchain", icon: "📜", desc: "Transaction history viewer" },
  { name: "GlobalHistory", category: "Blockchain", icon: "🌍", desc: "Global transaction feed" },
  { name: "KaspaBalanceViewer", category: "Blockchain", icon: "💎", desc: "Check Kaspa address balances" },
  { name: "KaspaNode", category: "Blockchain", icon: "🔗", desc: "Connect to Kaspa node infrastructure" },
  { name: "DAGKnightWallet", category: "Blockchain", icon: "⚔️", desc: "Multi-wallet verification system with DAG" },
  { name: "RegisterTTTID", category: "Identity", icon: "🆔", desc: "Register unique TTT identity" },
  { name: "TTTIDProfile", category: "Identity", icon: "👨", desc: "View TTT ID profiles" },
  { name: "SealedWalletDetails", category: "Identity", icon: "🔒", desc: "View sealed wallet verifications" },
  { name: "Marketplace", category: "Trading", icon: "🛒", desc: "P2P KAS marketplace" },
  { name: "MarketX", category: "Trading", icon: "💼", desc: "Job marketplace for tasks" },
  { name: "CreateListing", category: "Trading", icon: "➕", desc: "Create marketplace listings" },
  { name: "TradeView", category: "Trading", icon: "🤝", desc: "View and manage trades" },
  { name: "Shop", category: "Commerce", icon: "🏪", desc: "NFT and digital goods shop" },
  { name: "ShopItemView", category: "Commerce", icon: "🎁", desc: "View shop item details" },
  { name: "Cart", category: "Commerce", icon: "🛍️", desc: "Shopping cart management" },
  { name: "CreateShopListing", category: "Commerce", icon: "📦", desc: "Create shop listings" },
  { name: "Feed", category: "Social", icon: "📰", desc: "TTT social feed with posts and comments" },
  { name: "POLFeed", category: "Social", icon: "❤️", desc: "Proof of Life activity feed" },
  { name: "ConnectionRequests", category: "Social", icon: "🤝", desc: "Manage Agent ZK connection requests" },
  { name: "Profile", category: "User", icon: "👤", desc: "User profile management" },
  { name: "UserProfile", category: "User", icon: "👥", desc: "View other user profiles" },
  { name: "Settings", category: "User", icon: "⚙️", desc: "App settings and preferences" },
  { name: "ConnectWallet", category: "User", icon: "🔌", desc: "Connect MetaMask and Kasware wallets" },
  { name: "Subscription", category: "Premium", icon: "👑", desc: "Premium subscription management" },
  { name: "NFTMint", category: "NFT", icon: "🎨", desc: "Mint and manage NFTs" },
  { name: "Arcade", category: "Games", icon: "🎮", desc: "Game lobby and arcade" },
  { name: "BingoLobbyBrowser", category: "Games", icon: "🎲", desc: "Browse Bingo lobbies" },
  { name: "BingoLobbyRoom", category: "Games", icon: "🏠", desc: "Bingo room interface" },
  { name: "BingoLobbyPlay", category: "Games", icon: "▶️", desc: "Play Bingo games" },
  { name: "Browser", category: "Media", icon: "📺", desc: "TTTV video browser" },
  { name: "ProofOfBullish", category: "Media", icon: "🔥", desc: "Bull Reels - proof of bullish conviction with video/image posts" },
  { name: "GlobalWar", category: "News", icon: "⚔️", desc: "Global war news monitor" },
  { name: "Countdown", category: "Events", icon: "⏱️", desc: "72-hour challenge countdown" },
  { name: "Unity", category: "3D", icon: "🎮", desc: "3D multiplayer Unity game" },
  { name: "Career", category: "Jobs", icon: "💼", desc: "Career opportunities board" },
  { name: "WorkerTask", category: "Jobs", icon: "👷", desc: "Worker task management" },
  { name: "EmployerTask", category: "Jobs", icon: "👔", desc: "Employer task management" },
  { name: "Pera", category: "Tools", icon: "🔧", desc: "Pera task management" },
  { name: "ZKVault", category: "Tools", icon: "🔐", desc: "Zero-knowledge vault storage" },
  { name: "ZKWallet", category: "Tools", icon: "💳", desc: "Zero-knowledge wallet" },
  { name: "VPImport", category: "Tools", icon: "📥", desc: "Import VP data" },
  { name: "BackgroundGenerator", category: "Tools", icon: "🎨", desc: "AI background generator" },
  { name: "ESC", category: "Tools", icon: "🚀", desc: "ESC tools and utilities" },
  { name: "Hercules", category: "Premium", icon: "💪", desc: "Hercules premium features" },
  { name: "Home", category: "Core", icon: "🏠", desc: "Landing page and app entry" },
  { name: "Categories", category: "Core", icon: "📱", desc: "App categories and navigation" },
  { name: "X", category: "Verification", icon: "✅", desc: "Agent ZK verification hub" },
  { name: "Waitlist", category: "Access", icon: "📝", desc: "Waitlist registration" },
  { name: "Hub", category: "Admin", icon: "🎛️", desc: "Admin dashboard and controls" },
  { name: "SSHManager", category: "Admin", icon: "🖥️", desc: "SSH connection manager" },
  { name: "APIDocumentation", category: "Developer", icon: "📚", desc: "API documentation" },
  { name: "TestKaspaAPI", category: "Developer", icon: "🧪", desc: "Test Kaspa API endpoints" },
  { name: "ReplitTest", category: "Developer", icon: "🔬", desc: "Development testing page" },
  { name: "MobileTest", category: "Developer", icon: "📱", desc: "Mobile testing interface" },
  { name: "ContributorHistory", category: "Stats", icon: "📊", desc: "Contributor statistics" },
  { name: "DeployContract", category: "Developer", icon: "🚀", desc: "Smart contract deployment" },
  { name: "EditListing", category: "Trading", icon: "✏️", desc: "Edit marketplace listings" },
  { name: "Terms", category: "Legal", icon: "📄", desc: "Terms of Service and legal disclaimers" },
  { name: "Docs", category: "Core", icon: "📖", desc: "AI-powered documentation for all pages" }
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [documentation, setDocumentation] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = ['all', ...new Set(ALL_PAGES.map(p => p.category))];

  const filteredPages = ALL_PAGES.filter(page => {
    const matchesSearch = page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          page.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || page.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const generateDocumentation = async (page) => {
    setIsGenerating(true);
    setDocumentation(null);
    
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a technical documentation expert. Generate comprehensive documentation for this page in the TTT application:

Page Name: ${page.name}
Category: ${page.category}
Brief Description: ${page.desc}

Generate detailed documentation with the following sections:
1. **Overview** - What this page does
2. **Key Features** - List 5-8 main features with brief explanations
3. **User Flow** - Step by step how users interact with this page
4. **Technical Details** - What entities, APIs, or integrations it uses
5. **Access Requirements** - Who can access (public, logged in, premium, admin)
6. **Related Pages** - Which other pages connect to this one

Write in clear, concise markdown format. Be specific and technical where needed.`,
        add_context_from_internet: false
      });

      const docText = typeof response === 'string' ? response : response.response || response.content || 'Documentation generated.';
      setDocumentation(docText);

    } catch (err) {
      console.error('Failed to generate documentation:', err);
      setDocumentation('Failed to generate documentation. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPage = (page) => {
    setSelectedPage(page);
    generateDocumentation(page);
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {!selectedPage ? (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                  <Book className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">Documentation</h1>
                  <p className="text-gray-500 text-sm">AI-powered docs for all {ALL_PAGES.length} pages</p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[250px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pages..."
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-black">
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-white">{ALL_PAGES.length}</p>
                  <p className="text-xs text-gray-500">Total Pages</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">{categories.length - 1}</p>
                  <p className="text-xs text-gray-500">Categories</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-cyan-400">{filteredPages.length}</p>
                  <p className="text-xs text-gray-500">Filtered</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <Brain className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">AI Powered</p>
                </CardContent>
              </Card>
            </div>

            {/* Pages Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredPages.map((page, index) => (
                  <motion.div
                    key={page.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Card 
                      className="bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 transition-all cursor-pointer group"
                      onClick={() => handleSelectPage(page)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{page.icon}</div>
                            <div>
                              <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-cyan-400 transition-colors">
                                {page.name}
                              </h3>
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                                {page.category}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{page.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredPages.length === 0 && (
              <div className="text-center py-20">
                <FileText className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500">No pages found</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Documentation View */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button
                onClick={() => {
                  setSelectedPage(null);
                  setDocumentation(null);
                }}
                size="sm"
                className="mb-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Pages
              </Button>

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-4xl">{selectedPage.icon}</div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{selectedPage.name}</h1>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {selectedPage.category}
                      </Badge>
                      <span className="text-sm text-gray-500">{selectedPage.desc}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="bg-black border-white/10">
                <CardContent className="p-6 md:p-8">
                  {isGenerating ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
                      <p className="text-gray-500">Generating AI documentation...</p>
                    </div>
                  ) : documentation ? (
                    <div className="prose prose-invert max-w-none">
                      <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                        {documentation.split('\n').map((line, idx) => {
                          if (line.startsWith('# ')) {
                            return <h1 key={idx} className="text-2xl font-bold text-white mt-6 mb-3">{line.replace('# ', '')}</h1>;
                          } else if (line.startsWith('## ')) {
                            return <h2 key={idx} className="text-xl font-bold text-white mt-5 mb-2">{line.replace('## ', '')}</h2>;
                          } else if (line.startsWith('### ')) {
                            return <h3 key={idx} className="text-lg font-semibold text-cyan-400 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                          } else if (line.startsWith('**') && line.endsWith('**')) {
                            return <p key={idx} className="font-bold text-white mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
                          } else if (line.startsWith('- ') || line.startsWith('* ')) {
                            return <li key={idx} className="text-gray-300 ml-6 mb-1">{line.substring(2)}</li>;
                          } else if (line.trim() === '') {
                            return <br key={idx} />;
                          } else {
                            return <p key={idx} className="text-gray-300 mb-2">{line}</p>;
                          }
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <p className="text-gray-500">Documentation will appear here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="mt-4 flex gap-3">
                <Button
                  onClick={() => generateDocumentation(selectedPage)}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Regenerate Documentation
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}