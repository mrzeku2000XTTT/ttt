import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Shield, Zap, Network, Lock, Globe, Users, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">About TTTz.xyz</h1>
              <p className="text-gray-500 text-sm">Trust Task Transact Zero entropy knowledge unified</p>
            </div>
          </div>
        </motion.div>

        <Card className="bg-black border-white/10 mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="prose prose-invert max-w-none">
              <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 rounded-xl p-6 mb-6">
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  <Target className="w-6 h-6 text-cyan-400" />
                  Our Mission
                </h2>
                <p className="text-gray-200 text-lg leading-relaxed">
                  TTTz.xyz (Trust Task Transact Zero entropy knowledge unified) is revolutionizing how we interact with blockchain technology by unifying trust, task management, and secure transactions through zero-knowledge cryptographic principles.
                </p>
              </div>

              <h2 className="text-xl font-bold text-white mt-8 mb-4">What Makes Us Different</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                We're not just another blockchain application - we're building a complete ecosystem where your identity, your data, and your transactions are secured by cutting-edge cryptography while remaining completely under your control.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <Shield className="w-8 h-8 text-cyan-400 mb-3" />
                  <h3 className="text-white font-semibold mb-2">Trust</h3>
                  <p className="text-xs text-gray-400">
                    Built on cryptographic verification and blockchain immutability, ensuring every interaction is trustworthy and transparent.
                  </p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <Zap className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="text-white font-semibold mb-2">Task</h3>
                  <p className="text-xs text-gray-400">
                    Decentralized task management with AI-powered automation, enabling seamless workflow execution and verification.
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <Globe className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="text-white font-semibold mb-2">Transact</h3>
                  <p className="text-xs text-gray-400">
                    Secure cross-chain transactions with minimal fees, bridging Layer 1 and Layer 2 networks seamlessly.
                  </p>
                </div>

                <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-4">
                  <Lock className="w-8 h-8 text-pink-400 mb-3" />
                  <h3 className="text-white font-semibold mb-2">Zero Knowledge</h3>
                  <p className="text-xs text-gray-400">
                    Privacy-first architecture using zero-knowledge proofs, protecting your data while maintaining verifiability.
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mt-8 mb-3">What We Offer</h2>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li><strong>Agent ZK:</strong> Your personal AI agent with verifiable identity tied to your blockchain address</li>
                <li><strong>TTT Wallet:</strong> Secure burner wallet with advanced privacy features for Kaspa transactions</li>
                <li><strong>DAGKnight Verification:</strong> Multi-wallet cryptographic verification system for enhanced security</li>
                <li><strong>Bridge Technology:</strong> Seamless asset transfers between Layer 1 and Layer 2 networks</li>
                <li><strong>Decentralized Identity:</strong> Unique TTT IDs and Agent ZK identities tied to your wallet</li>
                <li><strong>AI-Powered Tools:</strong> Advanced automation, analysis, and workflow management</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-8 mb-3">Technology Stack</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                TTTz.xyz is built on cutting-edge technology including:
              </p>
              <ul className="list-disc ml-6 text-gray-300 mb-4 space-y-2">
                <li><strong>Kaspa Blockchain:</strong> High-speed, scalable Layer 1 network with DAG architecture</li>
                <li><strong>Ethereum L2:</strong> EVM-compatible Layer 2 for smart contract functionality</li>
                <li><strong>Zero-Knowledge Proofs:</strong> Privacy-preserving cryptographic verification</li>
                <li><strong>AI Integration:</strong> Advanced language models for autonomous agent capabilities</li>
                <li><strong>WebAuthn & Biometrics:</strong> Secure authentication using Face ID and Touch ID</li>
              </ul>

              <h2 className="text-xl font-bold text-white mt-8 mb-3">Open Source & Community</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">
                We believe in transparency and community-driven development. TTTz.xyz is actively being developed in collaboration with contributors from around the world. Join our community to shape the future of decentralized applications.
              </p>

              <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-4 mt-8">
                <p className="text-sm text-cyan-300 font-semibold mb-2 flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Alpha Development Phase
                </p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  TTTz.xyz is currently in active alpha development. We're continuously improving features, fixing bugs, and adding new capabilities. Your feedback helps us build a better platform for everyone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}