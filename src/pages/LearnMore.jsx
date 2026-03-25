import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Sparkles, Shield, Globe, Lock, Zap, Network, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LearnMorePage() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      {/* Background with gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 pt-32 pb-8 md:pt-40 md:pb-12">
          {/* Back Button */}
          <Link to={createPageUrl("Home")}>
            <Button
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/5 mb-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight">
              TTTz.xyz
            </h1>
            <p className="text-xl md:text-2xl text-white/70 font-light tracking-wide">
              Tap to Tip Zero entropy knowledge unified
            </p>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/5 border border-white/20 rounded-xl p-4"
            >
              <Shield className="w-10 h-10 text-cyan-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Trust</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Built on cryptographic verification and blockchain immutability. Every interaction is trustworthy, transparent, and verifiable through zero-knowledge proofs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-white/5 border border-white/20 rounded-xl p-4"
            >
              <Zap className="w-10 h-10 text-purple-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Task</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Decentralized task management powered by AI. Automate workflows, verify completions, and execute tasks with intelligent autonomous agents.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white/5 border border-white/20 rounded-xl p-4"
            >
              <Globe className="w-10 h-10 text-blue-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Transact</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Seamless cross-chain transactions between Layer 1 and Layer 2 networks. Bridge assets securely with minimal fees and maximum speed.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-white/5 border border-white/20 rounded-xl p-4"
            >
              <Lock className="w-10 h-10 text-pink-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Zero Knowledge</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Privacy-first architecture using zero-knowledge cryptography. Protect your data while maintaining complete verifiability and transparency.
              </p>
            </motion.div>
          </div>

          {/* Key Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-8 text-center">What We Offer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Network className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Agent ZK</h4>
                  <p className="text-sm text-gray-400">Personal AI agent with verifiable blockchain identity</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">DAGKnight Verification</h4>
                  <p className="text-sm text-gray-400">Multi-wallet cryptographic verification system</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Bridge Technology</h4>
                  <p className="text-sm text-gray-400">Seamless L1/L2 asset transfers</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Decentralized Identity</h4>
                  <p className="text-sm text-gray-400">Unique TTT IDs tied to your wallet</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Technology Stack */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="bg-gradient-to-br from-zinc-900/80 to-black border border-white/10 rounded-2xl p-8 backdrop-blur-sm mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Built on Cutting-Edge Technology</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Network className="w-8 h-8 text-cyan-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Kaspa Blockchain</h4>
                <p className="text-xs text-gray-400">High-speed DAG architecture</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">Zero-Knowledge Proofs</h4>
                <p className="text-xs text-gray-400">Privacy-preserving verification</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </div>
                <h4 className="text-white font-semibold mb-2">AI Integration</h4>
                <p className="text-xs text-gray-400">Autonomous agent capabilities</p>
              </div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mb-12"
          >
            <Link to={createPageUrl("Home")}>
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/30">
                Get Started
              </Button>
            </Link>
          </motion.div>

          {/* Alpha Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center mb-8"
          >
            <p className="text-sm text-yellow-300">
              <strong>Alpha Development:</strong> TTTz.xyz is in active development. Features are continuously evolving.
            </p>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pb-8"
          >
            <Link to={createPageUrl("About")}>
              <button className="text-white/60 hover:text-white/90 text-xs md:text-sm font-medium transition-all duration-300 px-3 py-1.5 rounded-lg hover:bg-white/5">
                About
              </button>
            </Link>
            <Link to={createPageUrl("Contact")}>
              <button className="text-white/60 hover:text-white/90 text-xs md:text-sm font-medium transition-all duration-300 px-3 py-1.5 rounded-lg hover:bg-white/5">
                Contact
              </button>
            </Link>
            <Link to={createPageUrl("Terms")}>
              <button className="text-white/60 hover:text-white/90 text-xs md:text-sm font-medium transition-all duration-300 px-3 py-1.5 rounded-lg hover:bg-white/5">
                Terms
              </button>
            </Link>
            <Link to={createPageUrl("Privacy")}>
              <button className="text-white/60 hover:text-white/90 text-xs md:text-sm font-medium transition-all duration-300 px-3 py-1.5 rounded-lg hover:bg-white/5">
                Privacy
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}