import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Sparkles, Users, Wallet, Shield, Brain, TrendingUp, 
  Video, ShoppingBag, Gamepad2, Trophy, Network, 
  ArrowUpDown, Eye, DollarSign, Lock, Zap, BookOpen,
  MessageCircle, Star, Briefcase, Box, Crown, ArrowRight
} from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      category: "Social & Community",
      icon: Users,
      color: "from-cyan-500 to-blue-500",
      items: [
        { name: "TTT Feed", desc: "Decentralized social feed with tipping, stamping, and badges", icon: MessageCircle },
        { name: "DAG Feed", desc: "Pay-to-publish feed for premium content", icon: Network },
        { name: "User Profiles", desc: "Trust scores, badges, and contribution tracking", icon: Star },
        { name: "TTTV", desc: "Video streaming and content discovery platform", icon: Video },
      ]
    },
    {
      category: "Wallet & Finance",
      icon: Wallet,
      color: "from-green-500 to-emerald-500",
      items: [
        { name: "Multi-Wallet Support", desc: "Kasware L1, TTT Wallet, MetaMask L2 integration", icon: Wallet },
        { name: "Bridge", desc: "Transfer KAS between L1 and L2 networks", icon: ArrowUpDown },
        { name: "Tipping System", desc: "Send KAS & KRC-20 tips to creators instantly", icon: DollarSign },
        { name: "Balance Viewer", desc: "Real-time Kaspa balance and transaction tracking", icon: TrendingUp },
      ]
    },
    {
      category: "AI & Automation",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
      items: [
        { name: "Agent ZK", desc: "Personal AI agent with verification and identity", icon: Brain },
        { name: "Zeku AI", desc: "Advanced AI assistant with web search capabilities", icon: Sparkles },
        { name: "Window AI", desc: "Smartest AI assistant for complex tasks", icon: Zap },
        { name: "Agent Ying", desc: "Specialized AI for image analysis and insights", icon: Eye },
      ]
    },
    {
      category: "Security & Identity",
      icon: Shield,
      color: "from-orange-500 to-red-500",
      items: [
        { name: "TTT ID", desc: "Decentralized identity system with wallet verification", icon: Shield },
        { name: "DAGKnight Wallet", desc: "Multi-signature verification with DAG structure", icon: Network },
        { name: "Kaspa Seal", desc: "Cryptographic stamping for content authenticity", icon: Eye },
        { name: "ZK Vault", desc: "Secure encrypted storage for sensitive data", icon: Lock },
      ]
    },
    {
      category: "Marketplace & Commerce",
      icon: ShoppingBag,
      color: "from-yellow-500 to-orange-500",
      items: [
        { name: "Shop", desc: "Buy and sell digital goods with KAS payments", icon: ShoppingBag },
        { name: "Marketplace", desc: "P2P trading platform for KAS and goods", icon: Box },
        { name: "Market X", desc: "Task marketplace with escrow protection", icon: Briefcase },
        { name: "NFT Minting", desc: "Create and trade Kaspa-based NFTs", icon: Trophy },
      ]
    },
    {
      category: "Gaming & Entertainment",
      icon: Gamepad2,
      color: "from-pink-500 to-purple-500",
      items: [
        { name: "Arcade", desc: "Collection of blockchain-integrated games", icon: Gamepad2 },
        { name: "Tetris Battle", desc: "Multiplayer competitive gaming with rewards", icon: Trophy },
        { name: "Boxing Game", desc: "Post-integrated mini-game for engagement", icon: Zap },
        { name: "Proof of Bullish", desc: "Gamified bullish sentiment tracking", icon: TrendingUp },
      ]
    },
    {
      category: "Education & Tools",
      icon: BookOpen,
      color: "from-blue-500 to-cyan-500",
      items: [
        { name: "KaSkool", desc: "Learn about Kaspa through interactive courses", icon: BookOpen },
        { name: "K-University", desc: "Advanced blockchain education platform", icon: BookOpen },
        { name: "Docs & Guides", desc: "Comprehensive documentation and tutorials", icon: BookOpen },
        { name: "API Access", desc: "Developer tools and API documentation", icon: Zap },
      ]
    },
    {
      category: "Premium Features",
      icon: Crown,
      color: "from-yellow-400 to-orange-500",
      items: [
        { name: "Subscription System", desc: "Premium access to advanced features", icon: Crown },
        { name: "Whale Watch Pro", desc: "Track large KAS transactions and movements", icon: TrendingUp },
        { name: "Advanced Analytics", desc: "Deep insights into network activity", icon: TrendingUp },
        { name: "Hercules", desc: "Enterprise-grade AI automation tools", icon: Brain },
      ]
    }
  ];

  const coreValues = [
    {
      title: "Decentralization",
      desc: "Built on Kaspa's BlockDAG technology for true decentralization",
      icon: Network
    },
    {
      title: "Security First",
      desc: "Cryptographic verification and multi-wallet authentication",
      icon: Shield
    },
    {
      title: "Community Driven",
      desc: "Reward creators, tippers, and contributors with badges and recognition",
      icon: Users
    },
    {
      title: "Innovation",
      desc: "Cutting-edge AI integration with blockchain technology",
      icon: Sparkles
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              TTT
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            The Kaspa Super-App
          </h1>
          
          <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed mb-8">
            A comprehensive ecosystem connecting social networking, DeFi, AI agents, gaming, 
            and commerce—all powered by the Kaspa blockchain.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={createPageUrl("Feed")}>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white h-12 px-8">
                <Users className="w-5 h-5 mr-2" />
                Explore Feed
              </Button>
            </Link>
            <Link to={createPageUrl("Categories")}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 px-8">
                View All Apps
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* What is TTT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                What is TTT?
              </h2>
              
              <div className="space-y-4 text-white/80 leading-relaxed">
                <p>
                  <strong className="text-white">TTT (Tap-To-Tip)</strong> is the first all-in-one super-app for the Kaspa ecosystem, 
                  combining social networking, decentralized finance, artificial intelligence, gaming, and e-commerce into a unified platform.
                </p>
                
                <p>
                  Built on Kaspa's revolutionary <strong className="text-cyan-400">BlockDAG technology</strong>, TTT enables 
                  instant microtransactions, cryptographic content verification, and seamless cross-layer (L1/L2) interactions—all 
                  without compromising decentralization or security.
                </p>
                
                <p>
                  Whether you're creating content, trading KAS, building with AI agents, playing games, or exploring the ecosystem, 
                  TTT provides the tools and infrastructure to do it all in one place.
                </p>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-cyan-300">
                      <strong>Key Innovation:</strong> TTT is the first platform to integrate Kaspa's instant, 
                      feeless microtransactions into social interactions—allowing users to tip creators, 
                      verify content, and participate in the economy with zero friction.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Core Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">Core Principles</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {coreValues.map((value, idx) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                >
                  <Card className="bg-black/40 backdrop-blur-xl border-white/10 h-full hover:border-cyan-500/30 transition-all">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">{value.title}</h3>
                      <p className="text-white/60 text-sm">{value.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">Platform Features</h2>
          
          <div className="space-y-12">
            {features.map((category, idx) => {
              const CategoryIcon = category.icon;
              
              return (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center`}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{category.category}</h3>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {category.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <Card key={item.name} className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all group">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                                <ItemIcon className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                              </div>
                              <div>
                                <h4 className="text-white font-semibold mb-1">{item.name}</h4>
                                <p className="text-white/60 text-sm">{item.desc}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">How TTT Works</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-cyan-400">1</span>
                </div>
                <h3 className="text-white font-bold text-center mb-3">Connect Your Wallet</h3>
                <p className="text-white/60 text-sm text-center">
                  Link Kasware (L1), TTT Wallet, or MetaMask (L2) to start interacting with the platform. 
                  No signup required—your wallet is your identity.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-purple-400">2</span>
                </div>
                <h3 className="text-white font-bold text-center mb-3">Explore & Create</h3>
                <p className="text-white/60 text-sm text-center">
                  Post content, share ideas, trade assets, play games, or build with AI agents. 
                  Every action is secured by Kaspa's blockchain.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-bold text-green-400">3</span>
                </div>
                <h3 className="text-white font-bold text-center mb-3">Earn & Grow</h3>
                <p className="text-white/60 text-sm text-center">
                  Receive tips for quality content, complete tasks for rewards, or participate in the ecosystem 
                  to earn badges and build your reputation.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Why TTT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Why Choose TTT?</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Instant Transactions</h4>
                      <p className="text-white/70 text-sm">Kaspa's 1-block confirmation time enables real-time tipping and payments</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Minimal Fees</h4>
                      <p className="text-white/70 text-sm">Near-zero transaction costs make microtransactions practical</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Cryptographic Security</h4>
                      <p className="text-white/70 text-sm">Wallet signatures verify content authenticity and ownership</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">AI Integration</h4>
                      <p className="text-white/70 text-sm">Cutting-edge AI agents enhance user experience and automation</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Network className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Multi-Layer Support</h4>
                      <p className="text-white/70 text-sm">Bridge between Kaspa L1 and L2 networks seamlessly</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Community Rewards</h4>
                      <p className="text-white/70 text-sm">Earn badges, build reputation, and get recognized for contributions</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Technical Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">Technical Foundation</h2>
          
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <Network className="w-10 h-10 text-cyan-400 mb-4" />
                <h3 className="text-white font-bold text-lg mb-3">Kaspa BlockDAG</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Unlike traditional blockchains, Kaspa uses a Directed Acyclic Graph (DAG) structure, 
                  enabling parallel block creation and instant confirmations without sacrificing security.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <Shield className="w-10 h-10 text-orange-400 mb-4" />
                <h3 className="text-white font-bold text-lg mb-3">Cryptographic Stamping</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  All content can be "stamped" using Kasware wallet signatures, creating an immutable 
                  proof of authenticity and ownership without requiring gas fees or smart contracts.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardContent className="p-6">
                <Brain className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-white font-bold text-lg mb-3">AI-Native Design</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  TTT integrates advanced AI agents (Agent ZK, Zeku, Window) for content moderation, 
                  user assistance, image analysis, and automated workflows.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* All Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16"
        >
          <div className="space-y-8">
            {features.map((category, idx) => {
              const CategoryIcon = category.icon;
              
              return (
                <Card key={category.category} className="bg-black/40 backdrop-blur-xl border-white/10">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}>
                        <CategoryIcon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{category.category}</h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {category.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <div key={item.name} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                            <ItemIcon className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-white font-semibold text-sm mb-1">{item.name}</h4>
                              <p className="text-white/60 text-xs leading-relaxed">{item.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Use Cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">Who Uses TTT?</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: "Content Creators", desc: "Share posts, earn tips, build audience", icon: Video },
              { role: "Traders", desc: "P2P trading, marketplace, DeFi tools", icon: TrendingUp },
              { role: "Developers", desc: "Build with AI agents, APIs, and tools", icon: Zap },
              { role: "Gamers", desc: "Play-to-earn games with KAS rewards", icon: Gamepad2 }
            ].map((useCase) => {
              const Icon = useCase.icon;
              return (
                <Card key={useCase.role} className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-cyan-500/30 transition-all">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-cyan-400" />
                    </div>
                    <h4 className="text-white font-bold mb-2">{useCase.role}</h4>
                    <p className="text-white/60 text-sm">{useCase.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Getting Started */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-16 mb-12"
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-cyan-500/30">
            <CardContent className="p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
              <p className="text-white/70 mb-8 max-w-2xl mx-auto">
                Join the growing TTT community and experience the future of decentralized social networking, 
                finance, and AI—all on the Kaspa blockchain.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to={createPageUrl("Feed")}>
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white h-12 px-8">
                    <Users className="w-5 h-5 mr-2" />
                    Start Using TTT
                  </Button>
                </Link>
                <Link to={createPageUrl("Docs")}>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 px-8">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Read Documentation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}