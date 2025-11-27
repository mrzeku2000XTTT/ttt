
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Shield, CheckCircle2, Loader2, Eye, Settings, LayoutDashboard, FileText } from "lucide-react";
import SubscriptionSystem from "../components/subscription/SubscriptionSystem";
import WhaleWatchPro from "../components/subscription/WhaleWatchPro";

export default function SubscriptionPage() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [glitchText, setGlitchText] = useState("Portal");

  useEffect(() => {
    loadData();
    
    // Glitch animation
    const glitchInterval = setInterval(() => {
      const random = Math.random();
      if (random > 0.95) {
        setGlitchText("传送门"); // Chinese for "Portal"
        setTimeout(() => setGlitchText("Portal"), 100);
      } else if (random > 0.92) {
        setGlitchText("P̴o̴r̴t̴a̴l̴");
        setTimeout(() => setGlitchText("Portal"), 50);
      }
    }, 200);

    return () => clearInterval(glitchInterval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const isAdmin = currentUser.role === 'admin';

      if (isAdmin) {
        setSubscription({ isActive: true, isAdmin: true, expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) });
        setActiveTab("dashboard");
      } else {
        const saved = localStorage.getItem('subscription');
        if (saved) {
          const data = JSON.parse(saved);
          if (data.isActive && data.expiresAt < Date.now()) {
            data.isActive = false;
          }
          setSubscription(data);
          
          if (data.isActive) {
            setActiveTab("dashboard");
          }
        }
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "plans", label: "Plans", icon: Settings, requiresActive: false },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, requiresActive: true },
    { id: "whale-watch", label: "Whale Watch", icon: Eye, requiresActive: true },
  ];

  const filteredTabs = (subscription?.isActive || user?.role === 'admin')
    ? tabs 
    : tabs.filter(tab => !tab.requiresActive);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header with Glitch Effect */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="mb-6">
              <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight mb-2 glitch-text">
                {glitchText}
              </h1>
              <p className="text-gray-500 text-sm">
                {user?.role === 'admin' ? 'Admin - Full Access' : 'Access premium features & whale intelligence'}
              </p>
            </div>

            {/* Admin Badge */}
            {user?.role === 'admin' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/30">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white mb-1">Admin Access</div>
                    <div className="text-sm text-gray-400">
                      Full access to all premium features
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Subscription Status Banner */}
            {subscription?.isActive && !subscription?.isAdmin && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 backdrop-blur-xl bg-white/5 border border-green-500/20 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white mb-1">Premium Active</div>
                      <div className="text-sm text-gray-400">
                        Expires: {new Date(subscription.expiresAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Time Remaining</div>
                    <div className="text-2xl font-bold text-white">
                      {formatTimeRemaining(subscription.expiresAt - Date.now())}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-2">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && (
                <OverviewTab subscription={subscription} user={user} />
              )}

              {activeTab === "plans" && (
                <div className="space-y-8">
                  <SubscriptionSystem />
                </div>
              )}

              {activeTab === "dashboard" && subscription?.isActive && (
                <DashboardTab subscription={subscription} user={user} setActiveTab={setActiveTab} />
              )}

              {activeTab === "whale-watch" && subscription?.isActive && (
                <WhaleWatchPro />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style jsx>{`
        .glitch-text {
          animation: glitch 3s infinite;
        }

        @keyframes glitch {
          0%, 90%, 100% {
            text-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
          }
          95% {
            text-shadow: 
              -2px 0 0 rgba(255, 0, 0, 0.7),
              2px 0 0 rgba(0, 255, 255, 0.7),
              0 0 20px rgba(6, 182, 212, 0.8);
            transform: translate(-2px, 2px);
          }
        }
      `}</style>
    </div>
  );

  function formatTimeRemaining(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `<1m`;
    }
  }
}

function OverviewTab({ subscription, user }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid - Smaller, compact */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
          <Zap className="w-6 h-6 text-cyan-400 mb-2" />
          <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'ui-monospace, monospace' }}>
            Unlimited
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">KAS Transfers</div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
          <TrendingUp className="w-6 h-6 text-cyan-400 mb-2" />
          <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'ui-monospace, monospace' }}>
            Live
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Whale Tracking</div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
          <Shield className="w-6 h-6 text-cyan-400 mb-2" />
          <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'ui-monospace, monospace' }}>
            Priority
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Processing</div>
        </div>
      </div>

      {/* Features List - Better Typography */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-black text-white mb-6" style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '0.05em' }}>
          PREMIUM FEATURES
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { title: "Unlimited Transfers", desc: "Send unlimited KAS between L1 and L2 with no restrictions" },
            { title: "Priority Processing", desc: "Your transactions get processed first in the queue" },
            { title: "Whale Watch Pro", desc: "Track large KAS movements and whale activity in real-time" },
            { title: "AI Predictions", desc: "Get AI-powered market insights and predictions" },
            { title: "Real-Time Alerts", desc: "Instant notifications for whale movements and market changes" },
            { title: "Enhanced Security", desc: "Additional security features and transaction monitoring" }
          ].map((feature, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg backdrop-blur-xl bg-white/5 border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white text-sm mb-1" style={{ fontFamily: 'ui-monospace, monospace' }}>
                  {feature.title}
                </div>
                <div className="text-xs text-gray-500 leading-relaxed">{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardTab({ subscription, user, setActiveTab }) {
  const [premiumFeatures] = useState([
    { icon: "🚀", name: "Unlimited Transfers", desc: "No limits on KAS bridging", active: true },
    { icon: "⚡", name: "Priority Processing", desc: "Jump the queue on all transactions", active: true },
    { icon: "🐋", name: "Whale Watch Pro", desc: "Track top 10 KAS holders in real-time", active: true },
    { icon: "🤖", name: "Zeku AI Assistant", desc: "24/7 AI crypto intelligence", active: true },
    { icon: "📊", name: "Advanced Analytics", desc: "Deep market insights & predictions", active: true },
    { icon: "🔔", name: "Real-Time Alerts", desc: "Instant notifications for whale movements", active: true },
    { icon: "🎯", name: "Price Predictions", desc: "AI-powered KAS price forecasts", active: true },
    { icon: "📈", name: "Trading Signals", desc: "Buy/sell signals based on AI analysis", active: true },
    { icon: "🗺️", name: "Global War Monitor", desc: "Real-time conflict tracking", active: true },
    { icon: "🛡️", name: "Enhanced Security", desc: "Advanced transaction monitoring", active: true },
    { icon: "💎", name: "VIP Support", desc: "Priority customer support", active: true },
    { icon: "🎮", name: "Arcade Access", desc: "Exclusive premium games", active: true },
    { icon: "📰", name: "News Stamping", desc: "Blockchain-verified news posts", active: true },
    { icon: "🔍", name: "Deep Search", desc: "Advanced blockchain search tools", active: true },
    { icon: "📱", name: "Mobile Optimized", desc: "Full mobile app experience", active: true },
    { icon: "🌐", name: "P2P Marketplace", desc: "Access to global KAS marketplace", active: true },
    { icon: "💬", name: "Encrypted Feed", desc: "Private TTT social network", active: true },
    { icon: "⏱️", name: "Transaction History", desc: "Unlimited history & exports", active: true },
    { icon: "🎨", name: "Custom Themes", desc: "Personalize your TTT experience", active: true },
    { icon: "🔐", name: "TTT ID Seals", desc: "Create verified identity seals", active: true }
  ]);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-400 mb-2">Transfers</div>
          <div className="text-4xl font-bold text-white">Unlimited</div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-cyan-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-400 mb-2">Active Since</div>
          <div className="text-2xl font-bold text-white">
            {subscription?.isAdmin ? 'Admin' : new Date(subscription.expiresAt - calculateDuration(subscription)).toLocaleDateString()}
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-green-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-400 mb-2">Status</div>
          <div className="text-3xl font-bold text-green-400">{subscription?.isAdmin ? 'Admin' : 'Active'}</div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-2xl p-6">
          <div className="text-sm text-gray-400 mb-2">Features Unlocked</div>
          <div className="text-4xl font-bold text-purple-400">20</div>
        </div>
      </div>

      {/* Premium Features Grid */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Your Premium Features</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {premiumFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{feature.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-sm mb-1">{feature.name}</div>
                  <div className="text-xs text-gray-400">{feature.desc}</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {!subscription?.isAdmin && (
            <Button
              onClick={() => setActiveTab("plans")}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 h-14"
            >
              Extend Subscription
            </Button>
          )}
          
          <Button
            onClick={() => setActiveTab("whale-watch")}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 h-14"
          >
            <Eye className="w-5 h-5 mr-2" />
            Open Whale Watch
          </Button>

          {subscription.txId && (
            <a
              href={`https://explorer.kasplex.org/tx/${subscription.txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                variant="outline"
                className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 h-14"
              >
                <Shield className="w-5 h-5 mr-2" />
                View Payment Proof
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );

  function calculateDuration(sub) {
    if (sub?.isAdmin) return 0;
    return 30 * 24 * 60 * 60 * 1000;
  }
}

