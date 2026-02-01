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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Advanced animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Multiple glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }} />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-blue-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '4s', animationDuration: '12s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-pink-500/15 rounded-full blur-[110px] animate-pulse" style={{ animationDelay: '6s', animationDuration: '14s' }} />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
        
        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-flex items-center gap-3 mb-8"
          >
            <div className="relative">
              {/* Glow effect behind text */}
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-cyan-400/40 via-blue-500/40 to-purple-600/40" />
              <div className="relative text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                TTT
              </div>
            </div>
          </motion.div>
          
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 tracking-tight">
            The Kaspa <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Super-App</span>
          </h1>
          
          <p className="text-lg sm:text-2xl text-white/60 max-w-4xl mx-auto leading-relaxed mb-10 font-light">
            A comprehensive ecosystem connecting <span className="text-cyan-400/80">social networking</span>, <span className="text-purple-400/80">DeFi</span>, <span className="text-pink-400/80">AI agents</span>, <span className="text-yellow-400/80">gaming</span>, 
            and <span className="text-green-400/80">commerce</span>—all powered by the Kaspa blockchain.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={createPageUrl("Feed")}>
              <Button className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 h-14 px-10 backdrop-blur-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all">
                <Users className="w-5 h-5 mr-2" />
                Explore Feed
              </Button>
            </Link>
            <Link to={createPageUrl("Categories")}>
              <Button className="bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/30 text-white h-14 px-10 backdrop-blur-xl transition-all">
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
          <Card className="bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-cyan-500/5 hover:border-white/20 transition-all">
            <CardContent className="p-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-cyan-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">What is TTT?</h2>
              </div>
              
              <div className="space-y-6 text-white/70 leading-relaxed text-base">
                <p className="text-lg">
                  <strong className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">TTT (Tap-To-Tip)</strong> is the first all-in-one super-app for the Kaspa ecosystem, 
                  combining social networking, decentralized finance, artificial intelligence, gaming, and e-commerce into a unified platform.
                </p>
                
                <p>
                  Built on Kaspa's revolutionary <strong className="text-cyan-400 font-semibold">BlockDAG technology</strong>, TTT enables 
                  instant microtransactions, cryptographic content verification, and seamless cross-layer (L1/L2) interactions—all 
                  without compromising decentralization or security.
                </p>
                
                <p>
                  Whether you're creating content, trading KAS, building with AI agents, playing games, or exploring the ecosystem, 
                  TTT provides the tools and infrastructure to do it all in one place.
                </p>

                <div className="relative bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/30 rounded-2xl p-6 mt-8 overflow-hidden">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 blur-2xl" />
                  <div className="relative flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-cyan-300 font-semibold mb-2">Key Innovation</p>
                      <p className="text-sm text-white/70 leading-relaxed">
                        TTT is the first platform to integrate Kaspa's instant, 
                        feeless microtransactions into social interactions—allowing users to tip creators, 
                        verify content, and participate in the economy with zero friction.
                      </p>
                    </div>
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
              const gradients = [
                'from-cyan-500/20 to-blue-500/20',
                'from-orange-500/20 to-red-500/20',
                'from-purple-500/20 to-pink-500/20',
                'from-green-500/20 to-emerald-500/20'
              ];
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <Card className={`bg-gradient-to-br ${gradients[idx]} backdrop-blur-2xl border border-white/10 h-full hover:border-white/20 transition-all shadow-lg`}>
                    <CardContent className="p-8">
                      <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                        <Icon className="w-8 h-8 text-cyan-400" />
                      </div>
                      <h3 className="text-white font-bold text-xl mb-3">{value.title}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{value.desc}</p>
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
                       <motion.div whileHover={{ x: 4 }} key={item.name}>
                         <Card className="bg-black/50 backdrop-blur-xl border border-white/10 hover:border-cyan-500/30 hover:bg-black/70 transition-all group h-full">
                           <CardContent className="p-6">
                             <div className="flex items-start gap-4">
                               <div className="w-12 h-12 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition-all shadow-inner">
                                 <ItemIcon className="w-6 h-6 text-white/60 group-hover:text-cyan-400 transition-colors" />
                               </div>
                               <div>
                                 <h4 className="text-white font-bold mb-2 text-base">{item.name}</h4>
                                 <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                       </motion.div>
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
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -8 }} className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl" />
              <Card className="relative bg-black/80 backdrop-blur-2xl border border-cyan-500/30">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-cyan-500/20">
                    <span className="text-3xl font-black text-cyan-400">1</span>
                  </div>
                  <h3 className="text-white font-bold text-xl text-center mb-4">Connect Your Wallet</h3>
                  <p className="text-white/60 text-sm text-center leading-relaxed">
                    Link Kasware (L1), TTT Wallet, or MetaMask (L2) to start interacting with the platform. 
                    No signup required—your wallet is your identity.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -8 }} className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl" />
              <Card className="relative bg-black/80 backdrop-blur-2xl border border-purple-500/30">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-purple-500/20">
                    <span className="text-3xl font-black text-purple-400">2</span>
                  </div>
                  <h3 className="text-white font-bold text-xl text-center mb-4">Explore & Create</h3>
                  <p className="text-white/60 text-sm text-center leading-relaxed">
                    Post content, share ideas, trade assets, play games, or build with AI agents. 
                    Every action is secured by Kaspa's blockchain.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -8 }} className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl" />
              <Card className="relative bg-black/80 backdrop-blur-2xl border border-green-500/30">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg shadow-green-500/20">
                    <span className="text-3xl font-black text-green-400">3</span>
                  </div>
                  <h3 className="text-white font-bold text-xl text-center mb-4">Earn & Grow</h3>
                  <p className="text-white/60 text-sm text-center leading-relaxed">
                    Receive tips for quality content, complete tasks for rewards, or participate in the ecosystem 
                    to earn badges and build your reputation.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Why TTT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-3xl blur-2xl" />
            <Card className="relative bg-black/80 backdrop-blur-2xl border border-cyan-500/40 shadow-2xl shadow-cyan-500/10">
              <CardContent className="p-10">
                <h2 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                  <Zap className="w-8 h-8 text-yellow-400" />
                  Why Choose TTT?
                </h2>
              
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
          </div>
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
            <motion.div whileHover={{ y: -8, scale: 1.02 }} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Card className="relative bg-black/60 backdrop-blur-2xl border border-cyan-500/20 h-full group-hover:border-cyan-500/40 transition-all shadow-xl">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Network className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-4">Kaspa BlockDAG</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Unlike traditional blockchains, Kaspa uses a Directed Acyclic Graph (DAG) structure, 
                    enabling parallel block creation and instant confirmations without sacrificing security.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -8, scale: 1.02 }} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Card className="relative bg-black/60 backdrop-blur-2xl border border-orange-500/20 h-full group-hover:border-orange-500/40 transition-all shadow-xl">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Shield className="w-8 h-8 text-orange-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-4">Cryptographic Stamping</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    All content can be "stamped" using Kasware wallet signatures, creating an immutable 
                    proof of authenticity and ownership without requiring gas fees or smart contracts.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileHover={{ y: -8, scale: 1.02 }} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Card className="relative bg-black/60 backdrop-blur-2xl border border-purple-500/20 h-full group-hover:border-purple-500/40 transition-all shadow-xl">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Brain className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-4">AI-Native Design</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    TTT integrates advanced AI agents (Agent ZK, Zeku, Window) for content moderation, 
                    user assistance, image analysis, and automated workflows.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
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
                <Card key={category.category} className="bg-black/70 backdrop-blur-2xl border border-white/10 hover:border-white/20 transition-all shadow-xl">
                  <CardContent className="p-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <CategoryIcon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">{category.category}</h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                     {category.items.map((item) => {
                       const ItemIcon = item.icon;
                       return (
                         <motion.div whileHover={{ x: 4 }} key={item.name}>
                           <div className="flex items-start gap-4 p-5 bg-black/30 rounded-xl border border-white/10 hover:border-cyan-500/30 hover:bg-black/50 transition-all h-full">
                             <div className="w-11 h-11 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                               <ItemIcon className="w-6 h-6 text-white/60" />
                             </div>
                             <div>
                               <h4 className="text-white font-bold text-sm mb-1.5">{item.name}</h4>
                               <p className="text-white/60 text-xs leading-relaxed">{item.desc}</p>
                             </div>
                           </div>
                         </motion.div>
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
              { role: "Content Creators", desc: "Share posts, earn tips, build audience", icon: Video, gradient: "from-pink-500/20 to-purple-500/20", border: "border-pink-500/30" },
              { role: "Traders", desc: "P2P trading, marketplace, DeFi tools", icon: TrendingUp, gradient: "from-green-500/20 to-emerald-500/20", border: "border-green-500/30" },
              { role: "Developers", desc: "Build with AI agents, APIs, and tools", icon: Zap, gradient: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/30" },
              { role: "Gamers", desc: "Play-to-earn games with KAS rewards", icon: Gamepad2, gradient: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30" }
            ].map((useCase, idx) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={useCase.role}
                  whileHover={{ y: -8, scale: 1.03 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className={`bg-gradient-to-br ${useCase.gradient} backdrop-blur-2xl border ${useCase.border} hover:border-opacity-60 transition-all shadow-xl h-full`}>
                    <CardContent className="p-8 text-center">
                      <div className={`w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-white font-bold text-lg mb-3">{useCase.role}</h4>
                      <p className="text-white/70 text-sm leading-relaxed">{useCase.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
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
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-3xl blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
            <Card className="relative bg-black/80 backdrop-blur-2xl border-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/20">
              <CardContent className="p-12 text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-20 h-20 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30"
                >
                  <Sparkles className="w-10 h-10 text-cyan-400" />
                </motion.div>
                <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
                <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                  Join the growing TTT community and experience the future of decentralized social networking, 
                  finance, and AI—all on the Kaspa blockchain.
                </p>
              
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link to={createPageUrl("Feed")}>
                    <Button className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 h-14 px-10 backdrop-blur-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all">
                      <Users className="w-5 h-5 mr-2" />
                      Start Using TTT
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Docs")}>
                    <Button className="bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/30 text-white h-14 px-10 backdrop-blur-xl transition-all">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Read Documentation
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}