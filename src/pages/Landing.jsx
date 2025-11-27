import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, Users, Shield, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      if (currentUser.created_wallet_address) {
        // Already has wallet, redirect to feed
        window.location.href = createPageUrl('Feed');
      }
    } catch (err) {
      // Not logged in, check for local wallet
      const localWallet = localStorage.getItem('ttt_wallet_address');
      if (localWallet) {
        setHasWallet(true);
        // Has wallet, go to feed
        window.location.href = createPageUrl('Feed');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-7xl md:text-9xl font-black text-white mb-4 tracking-tight">
              TTT
            </h1>
            <p className="text-xl md:text-2xl text-white/60">
              The Truth Terminal
            </p>
          </motion.div>

          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Post, Connect, Trade
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              A decentralized social platform powered by Kaspa. No email required - just your wallet.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-4 gap-4 mb-12"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <Wallet className="w-8 h-8 text-cyan-400 mb-3 mx-auto" />
              <h3 className="text-white font-semibold mb-2">Wallet First</h3>
              <p className="text-white/60 text-sm">Create a wallet, start posting</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <Users className="w-8 h-8 text-purple-400 mb-3 mx-auto" />
              <h3 className="text-white font-semibold mb-2">Social Feed</h3>
              <p className="text-white/60 text-sm">Share thoughts, tips, media</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <Shield className="w-8 h-8 text-green-400 mb-3 mx-auto" />
              <h3 className="text-white font-semibold mb-2">Encrypted</h3>
              <p className="text-white/60 text-sm">End-to-end security</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <Zap className="w-8 h-8 text-yellow-400 mb-3 mx-auto" />
              <h3 className="text-white font-semibold mb-2">Fast Trades</h3>
              <p className="text-white/60 text-sm">Instant KAS transfers</p>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              onClick={() => window.location.href = createPageUrl('Wallet')}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold h-14 px-8 text-lg"
            >
              Create Wallet & Start
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 h-14 px-8 text-lg"
            >
              Login with Email
            </Button>
          </motion.div>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-white/40 text-sm"
          >
            Email login optional • Full features with wallet only
          </motion.p>
        </div>
      </div>
    </div>
  );
}