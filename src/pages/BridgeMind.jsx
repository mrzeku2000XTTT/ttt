import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft,
  Brain,
  Users,
  MessageSquare,
  TrendingUp,
  Shield,
  Zap,
  Activity,
  BookOpen,
  Network
} from "lucide-react";

export default function BridgeMindPage() {
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

  const bridgeMindApps = [
    { id: "community", name: "Community", icon: Users, path: "Feed", description: "Connect with BridgeMind members" },
    { id: "chat", name: "Chat", icon: MessageSquare, path: "AgentZK", description: "AI-powered conversations" },
    { id: "analytics", name: "Analytics", icon: TrendingUp, path: "Analytics", description: "Track community insights" },
    { id: "knowledge", name: "Knowledge Base", icon: BookOpen, path: "KnowledgeBase", description: "Learn and grow" },
    { id: "network", name: "Network", icon: Network, path: "DAGFeed", description: "Decentralized connections" },
    { id: "security", name: "Security", icon: Shield, path: "RegisterTTTID", description: "Verify your identity" },
  ];

  const getIconComponent = (Icon) => Icon;

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
      
      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to={createPageUrl("Categories")}>
              <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                <Brain className="w-8 h-8 text-purple-400" />
                BridgeMind
              </h1>
              <p className="text-white/60">Community Apps & Tools</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bridgeMindApps.map((app, index) => {
              const Icon = getIconComponent(app.icon);
              
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={createPageUrl(app.path)}>
                    <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all" />
                      
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className="w-7 h-7 text-purple-400" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2">{app.name}</h3>
                        <p className="text-white/60 text-sm">{app.description}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to BridgeMind</h2>
                <p className="text-white/70 leading-relaxed">
                  A community-driven platform for connecting minds, sharing knowledge, and building the future together. 
                  Explore our suite of tools designed to empower collaboration and innovation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}