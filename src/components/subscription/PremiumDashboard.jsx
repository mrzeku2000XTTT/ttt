import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, Clock, Zap, TrendingUp, Shield, CheckCircle, 
  Star, Award, Sparkles, ArrowRight, Plus, Settings,
  BarChart3, Activity, RefreshCw
} from "lucide-react";
import { format } from "date-fns";

export default function PremiumDashboard({ subscription, onUpdate }) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showExtend, setShowExtend] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (subscription?.expiresAt) {
        const remaining = subscription.expiresAt - Date.now();
        if (remaining > 0) {
          setTimeRemaining(formatTimeRemaining(remaining));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [subscription]);

  const formatTimeRemaining = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const toggleAutoRenew = () => {
    const updated = {
      ...subscription,
      autoRenew: !subscription.autoRenew
    };
    localStorage.setItem('subscription', JSON.stringify(updated));
    onUpdate();
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Premium Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-black flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-black" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                      Premium Dashboard
                    </h1>
                    <Badge className="bg-white text-black font-bold px-3 py-1 border-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      ACTIVE
                    </Badge>
                  </div>
                  <p className="text-gray-500">Welcome back! Enjoy unlimited access to all premium features</p>
                </div>
              </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-zinc-950 border-zinc-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="outline" className="bg-zinc-900 text-white border-zinc-800">
                      Active
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{timeRemaining}</div>
                  <div className="text-sm text-gray-600">Time Remaining</div>
                  <div className="w-full bg-zinc-900 rounded-full h-2 mt-4 overflow-hidden">
                    <div 
                      className="bg-white h-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, ((subscription.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)) * 4)}%`
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-950 border-zinc-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <Sparkles className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">∞</div>
                  <div className="text-sm text-gray-600">Unlimited Transfers</div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-950 border-zinc-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <Star className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">VIP</div>
                  <div className="text-sm text-gray-600">Priority Support</div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-950 border-zinc-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <CheckCircle className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">100%</div>
                  <div className="text-sm text-gray-600">Protected</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Subscription Management */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-zinc-950 border-zinc-900">
                <CardHeader className="border-b border-zinc-900">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Settings className="w-6 h-6 text-gray-500" />
                      Subscription Management
                    </h2>
                    <Button
                      onClick={() => setShowExtend(!showExtend)}
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Time
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                      <div className="text-sm text-gray-600 mb-2">Status</div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                        <span className="text-2xl font-bold text-white">Active</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Your premium subscription is active and all features are unlocked
                      </p>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                      <div className="text-sm text-gray-600 mb-2">Expires</div>
                      <div className="text-2xl font-bold text-white mb-4">
                        {subscription?.expiresAt ? format(new Date(subscription.expiresAt), 'PPP p') : 'N/A'}
                      </div>
                      <p className="text-sm text-gray-600">
                        {timeRemaining} remaining
                      </p>
                    </div>
                  </div>

                  {subscription?.txId && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                      <div className="text-sm text-gray-600 mb-2">Payment Transaction</div>
                      <a
                        href={`https://kas.fyi/txs/${subscription.txId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-white hover:text-gray-300 font-mono text-sm"
                      >
                        {subscription.txId.substring(0, 16)}...{subscription.txId.substring(subscription.txId.length - 8)}
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div>
                      <div className="text-white font-semibold mb-1">Auto-Renewal</div>
                      <p className="text-sm text-gray-600">
                        Automatically renew when subscription expires
                      </p>
                    </div>
                    <button
                      onClick={toggleAutoRenew}
                      className={`relative w-16 h-8 rounded-full transition-colors ${
                        subscription?.autoRenew ? 'bg-white' : 'bg-zinc-800'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-transform ${
                          subscription?.autoRenew ? 'bg-black transform translate-x-8' : 'bg-zinc-600'
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Features Showcase */}
              <Card className="bg-zinc-950 border-zinc-900">
                <CardHeader className="border-b border-zinc-900">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-gray-500" />
                    Your Premium Features
                  </h2>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white mb-1">Unlimited Transfers</div>
                        <p className="text-xs text-gray-600">No limits on bridge transactions</p>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white mb-1">Priority Processing</div>
                        <p className="text-xs text-gray-600">Faster transaction confirmation</p>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white mb-1">Advanced Analytics</div>
                        <p className="text-xs text-gray-600">Detailed transaction insights</p>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-white mb-1">Premium Support</div>
                        <p className="text-xs text-gray-600">24/7 priority customer support</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              <Card className="bg-zinc-950 border-zinc-900">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                      <Crown className="w-10 h-10 text-black" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Premium Member</h3>
                    <p className="text-sm text-gray-600">Enjoy exclusive benefits</p>
                  </div>

                  <div className="space-y-3">
                    <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800">
                      <Activity className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                    <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Transaction History
                    </Button>
                    <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-950 border-zinc-900">
                <CardHeader className="border-b border-zinc-900">
                  <h3 className="text-lg font-bold text-white">Usage Stats</h3>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Transfers Today</span>
                      <span className="text-lg font-bold text-white">∞</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-2">
                      <div className="bg-white h-full rounded-full w-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Volume (24h)</span>
                      <span className="text-lg font-bold text-white">---</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-2">
                      <div className="bg-gray-600 h-full rounded-full w-3/4" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Features Used</span>
                      <span className="text-lg font-bold text-white">All</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-2">
                      <div className="bg-white h-full rounded-full w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}