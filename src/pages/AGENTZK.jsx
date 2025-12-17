import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { 
  ArrowLeft, 
  Bot, 
  Zap, 
  Brain,
  Wallet,
  MessageSquare,
  Shield,
  Sparkles
} from "lucide-react";

export default function AGENTZKPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
      setUser(null);
    }
  };

  const features = [
    { icon: Brain, title: "AI Intelligence", description: "Advanced AI-powered insights", path: "ZekuAI" },
    { icon: Wallet, title: "Wallet Connect", description: "Connect your Agent ZK wallet", path: "AgentZK" },
    { icon: MessageSquare, title: "Chat Interface", description: "Talk with your AI agent", path: "ZekuAI" },
    { icon: Shield, title: "Secure & Private", description: "Your data is protected", path: "DAGKnightWallet" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
      
      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <Link to={createPageUrl("Categories")}>
              <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div>
              <h1 className="text-4xl font-black text-white flex items-center gap-3">
                <Bot className="w-10 h-10 text-purple-400" />
                AGENT ZK
              </h1>
              <p className="text-white/60">Next-Generation AI Agent Platform</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={createPageUrl(feature.path)}>
                    <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden h-full">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all" />
                      
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className="w-8 h-8 text-purple-400" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-white/60">{feature.description}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center"
          >
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to Agent ZK</h2>
            <p className="text-white/60 max-w-2xl mx-auto mb-8">
              Experience the future of AI-powered blockchain interactions. Agent ZK combines advanced artificial intelligence with secure wallet technology to give you unprecedented control and insights.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to={createPageUrl("AgentZK")}>
                <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors">
                  Get Started
                </button>
              </Link>
              <Link to={createPageUrl("ZekuAI")}>
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-colors">
                  Try Zeku AI
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}