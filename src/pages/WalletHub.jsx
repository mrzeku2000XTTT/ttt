import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

import { WALLET_APPS } from "@/components/wallethub/walletApps";
import WalletAppTile from "@/components/wallethub/WalletAppTile";

export default function WalletHubPage() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          setLoading(false);
          return;
        }
        const user = await base44.auth.me();
        if (user?.created_wallet_address) {
          const balanceData = await base44.integrations.Core.InvokeLLM({
            prompt: `Get the KAS balance for wallet address: ${user.created_wallet_address}`,
            add_context_from_internet: true,
          });
          const match = balanceData?.match(/(\d+\.?\d*)\s*KAS/i);
          setBalance(match ? parseFloat(match[1]) : 0);
        }
      } catch (err) {
        console.error('Balance load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBalance();
  }, []);

  return (
    <div className="min-h-screen bg-[#06090C] text-white relative overflow-x-hidden">
      {/* Dark gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[520px] h-[520px] bg-emerald-500/12 blur-[130px] rounded-full" />
        <div className="absolute top-1/2 -right-40 w-[480px] h-[480px] bg-teal-500/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-0 -left-32 w-[440px] h-[440px] bg-cyan-500/8 blur-[130px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 h-14 border-b border-white/5" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <Link to="/AppStoreV2" className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-[300]">Back</span>
        </Link>
        <span className="text-sm font-[600] tracking-[0.3em]">WALLET</span>
        <div className="w-12" />
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="w-16 h-16 rounded-2xl mb-5 overflow-hidden shadow-lg">
            <img src="https://media.base44.com/images/public/6901295fa9bcfaa0f5ba2c2a/3bab8f8ae_generated_image.png" alt="Wallet" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-[200] tracking-tight">
            Your <span className="font-[700] bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">Wallets</span>
          </h1>
          <p className="text-white/40 text-sm font-[300] mt-3 max-w-md">
            Every wallet, bridge and payment app inside TTT — one beautiful home for your KAS.
          </p>
        </motion.div>

        {/* Main Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <a href="https://tttz.xyz/wallet" target="_blank" rel="noopener noreferrer" className="block">
            <div className="rounded-[28px] bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-emerald-900/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Main Wallet</h2>
                  <p className="text-xs text-emerald-300/70">Primary KAS Wallet</p>
                </div>
              </div>
              <div className="mt-2">
                {loading ? (
                  <div className="h-10 w-40 bg-white/5 rounded-lg animate-pulse" />
                ) : (
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                    {balance !== null ? `${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} KAS` : '-- KAS'}
                  </div>
                )}
              </div>
            </div>
          </a>
        </motion.div>

        {/* iPad-style glass dock holding all apps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[32px] bg-white/[0.03] border border-white/10 backdrop-blur-2xl p-7 sm:p-10 shadow-2xl shadow-black/50"
        >
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-8">
            {WALLET_APPS.map((app, i) => (
              <WalletAppTile key={app.name} app={app} index={i} />
            ))}
          </div>
        </motion.div>

        <p className="text-center text-white/20 text-[11px] font-[300] tracking-wide mt-16">
          TTT Wallets · Secured by Kaspa
        </p>
      </div>
    </div>
  );
}