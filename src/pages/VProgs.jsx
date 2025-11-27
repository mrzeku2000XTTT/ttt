import React from "react";
import { motion } from "framer-motion";
import { Code, Zap, Shield, Cpu, Network, Database, Lock, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function VProgsPage() {
  const features = [
    {
      icon: Code,
      title: "Advanced Programming",
      description: "Next-generation development tools and frameworks for building decentralized applications on Kaspa."
    },
    {
      icon: Zap,
      title: "High Performance",
      description: "Optimized for speed with Kaspa's BlockDAG architecture, enabling instant transactions and scalability."
    },
    {
      icon: Shield,
      title: "Secure by Design",
      description: "Built with security-first principles, leveraging Kaspa's proven consensus mechanism and cryptographic standards."
    },
    {
      icon: Network,
      title: "Decentralized Network",
      description: "Fully distributed architecture ensuring no single point of failure and true peer-to-peer interactions."
    },
    {
      icon: Database,
      title: "Efficient Storage",
      description: "Smart data management optimized for blockchain environments with minimal overhead."
    },
    {
      icon: Cpu,
      title: "Smart Contracts",
      description: "Deploy powerful smart contracts with gas-efficient execution on the Kaspa network."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)'
        }} />
        
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-cyan-400" />
              <h1 className="text-5xl md:text-7xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  VProgs
                </span>
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-white/60 mb-8 max-w-3xl mx-auto">
              Next-Generation Development Framework for Kaspa Blockchain
            </p>
            <p className="text-base md:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
              VProgs represents the future of decentralized application development, 
              providing developers with powerful tools to build on Kaspa's revolutionary BlockDAG architecture.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="h-full bg-white/5 border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Technology Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-8 h-8 text-cyan-400" />
                <h2 className="text-3xl md:text-4xl font-bold">Built for Kaspa</h2>
              </div>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                VProgs leverages Kaspa's unique BlockDAG architecture to deliver unprecedented 
                performance in the blockchain space. With block times of just 1 second and 
                theoretical throughput of 100+ blocks per second, VProgs enables developers 
                to create applications that were previously impossible on traditional blockchains.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">1 sec</div>
                  <div className="text-white/60">Block Time</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">100+</div>
                  <div className="text-white/60">Blocks/Second</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">∞</div>
                  <div className="text-white/60">Scalability</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-16 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl blur-xl" />
          <Card className="relative bg-white/5 border-white/10">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Build the Future?
              </h2>
              <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
                Join the VProgs ecosystem and start developing next-generation applications 
                on the fastest growing blockchain network.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://vprogs.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/50"
                >
                  Visit VProgs.xyz
                </a>
                <a
                  href="https://kaspa.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all duration-300"
                >
                  Learn About Kaspa
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}