import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Shield, Layers, ArrowUpDown, CreditCard, Smartphone, BarChart3, Lock, Key } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

// Wallet apps configuration
const WALLET_APPS = [
  {
    name: "Terra",
    description: "Kaspa wallet manager",
    icon: "🟦",
    color: "from-emerald-500 to-teal-600",
    route: "Terra",
    badge: null,
  },
  {
    name: "DAGKnight",
    description: "Advanced multi-layer wallet",
    icon: "🌙",
    color: "from-blue-600 to-indigo-700",
    route: "DAGKnightWallet",
    badge: "Pro",
  },
  {
    name: "Bridge",
    description: "Send KAS cross-layer",
    icon: "🌉",
    color: "from-purple-500 to-pink-600",
    route: "Bridge",
    badge: null,
  },
  {
    name: "KC Bridge",
    description: "Cross-chain bridge",
    icon: "🔗",
    color: "from-blue-700 to-cyan-600",
    route: "KCbridge",
    badge: null,
  },
  {
    name: "TapToTip",
    description: "Quick KAS tipping",
    icon: "💸",
    color: "from-amber-500 to-orange-600",
    route: "Tip",
    badge: "Popular",
  },
  {
    name: "OnChain POS",
    description: "Point of sale",
    icon: "🏪",
    color: "from-blue-500 to-orange-500",
    route: "OnChainPOS",
    badge: null,
  },
  {
    name: "KivR",
    description: "IVR + KAS payments",
    icon: "📞",
    color: "from-red-600 to-rose-700",
    route: "KivR",
    badge: null,
  },
  {
    name: "Kurncy",
    description: "Currency exchange",
    icon: "💱",
    color: "from-amber-600 to-yellow-500",
    route: "Kurncy",
    badge: null,
  },
  {
    name: "CoinSpace",
    description: "Wallet app",
    icon: "🪙",
    color: "from-green-500 to-emerald-600",
    route: "CoinSpace",
    badge: null,
  },
  {
    name: "Kurve",
    description: "Kaspa charts",
    icon: "📊",
    color: "from-blue-600 to-purple-600",
    route: "Kurve",
    badge: null,
  },
  {
    name: "VAULT",
    description: "Secure vault",
    icon: "🔒",
    color: "from-slate-700 to-slate-900",
    route: "Vault",
    badge: "Secure",
  },
  {
    name: "Keystone",
    description: "Hardware wallet",
    icon: "🔑",
    color: "from-gray-300 to-gray-500",
    route: "Keystone",
    badge: null,
  },
];

export default function WalletHubPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [totalBalance, setTotalBalance] = useState(null);

  useEffect(() => {
    // Redirect directly to Terra wallet
    navigate("/Terra", { replace: true });
  }, []);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Load total balance from TTT wallet
      const addr = localStorage.getItem('ttt_wallet_address') || currentUser?.created_wallet_address;
      if (addr) {
        try {
          const r = await base44.functions.invoke("getKaspaBalance", { address: addr });
          const bal = r.data?.balanceKAS ?? r.data?.balance;
          if (typeof bal === 'number') setTotalBalance(bal);
        } catch {}
      }
    } catch {
      setUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-black to-slate-900/50" />
      
      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 backdrop-blur-sm bg-black/50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-sm font-bold tracking-[0.3em] uppercase text-white/60">Wallet</h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-black mb-2">
            Your <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Wallets</span>
          </h2>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Every wallet, bridge and payment app inside TTT — one beautiful home for your KAS.
          </p>
          
          {/* Total Balance Display */}
          {totalBalance !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-600/10 border border-emerald-500/20"
            >
              <p className="text-xs text-emerald-400/60 mb-1">Total Balance</p>
              <p className="text-2xl font-black text-emerald-400">{totalBalance.toFixed(4)} KAS</p>
            </motion.div>
          )}
        </motion.div>

        {/* Main Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#121212] rounded-3xl border border-white/10 p-6 backdrop-blur-xl"
        >
          {/* App Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {WALLET_APPS.map((app, i) => (
              <motion.button
                key={app.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/${app.route}`)}
                className="group relative flex flex-col items-center p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 hover:scale-105"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-2xl mb-3 shadow-lg group-hover:shadow-xl transition-shadow`}>
                  {app.icon}
                </div>
                
                {/* Name */}
                <p className="text-white font-bold text-sm text-center">{app.name}</p>
                <p className="text-white/40 text-[10px] text-center mt-0.5">{app.description}</p>
                
                {/* Badge */}
                {app.badge && (
                  <span className={`absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                    app.badge === "Pro" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                    app.badge === "Popular" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {app.badge}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-3 gap-3"
        >
          <button
            onClick={() => navigate("/Terra")}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold transition-all"
          >
            <Wallet className="w-4 h-4" />
            Send
          </button>
          <button
            onClick={() => navigate("/Terra")}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-bold transition-all"
          >
            <ArrowUpDown className="w-4 h-4" />
            Receive
          </button>
          <button
            onClick={() => navigate("/Bridge")}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-bold transition-all"
          >
            <Layers className="w-4 h-4" />
            Bridge
          </button>
        </motion.div>
      </div>
    </div>
  );
}