import React from "react";
import { ArrowLeft, ExternalLink, Wallet, Shield, Globe, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function CoinSpacePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("AppStore")}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold">CoinSpace</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl shadow-orange-500/20">
              <Wallet className="w-12 h-12 text-white" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                Your Universal <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                  Crypto Wallet
                </span>
              </h2>
              <p className="text-lg text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Secure, non-custodial wallet for Bitcoin, Ethereum, Kaspa, and more. 
                Buy, sell, and exchange cryptocurrencies instantly.
              </p>
            </div>

            <a 
              href="https://coin.space/wallet/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button className="w-full sm:w-auto px-8 py-6 text-lg font-bold bg-white text-black hover:bg-zinc-200 rounded-full shadow-xl shadow-white/10 transition-all hover:scale-105">
                Launch Wallet
                <ExternalLink className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8"
          >
            {[
              { icon: Shield, title: "Non-Custodial", desc: "You control your private keys" },
              { icon: Globe, title: "Universal", desc: "Access anywhere, any device" },
              { icon: Zap, title: "Instant", desc: "Fast exchanges & transfers" }
            ].map((feature, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <feature.icon className="w-6 h-6 text-orange-400 mx-auto mb-3" />
                <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                <p className="text-xs text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}