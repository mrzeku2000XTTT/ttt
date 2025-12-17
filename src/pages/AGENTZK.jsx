import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Bot, 
  Code,
  Terminal,
  Zap,
  Database,
  Network,
  Cpu
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

  const tools = [
    { icon: Code, title: "Code Generator", description: "Generate smart contracts and dApps", color: "from-blue-500 to-cyan-500" },
    { icon: Terminal, title: "CLI Tools", description: "Command-line utilities for developers", color: "from-green-500 to-emerald-500" },
    { icon: Database, title: "Data Manager", description: "Manage blockchain data efficiently", color: "from-purple-500 to-pink-500" },
    { icon: Network, title: "Network Monitor", description: "Real-time network analytics", color: "from-orange-500 to-red-500" },
    { icon: Cpu, title: "Smart Executor", description: "Execute transactions with AI assistance", color: "from-yellow-500 to-orange-500" },
    { icon: Zap, title: "Quick Actions", description: "One-click blockchain operations", color: "from-indigo-500 to-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900/20" />
      
      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("AppStore")}>
                <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              </Link>
              <div>
                <h1 className="text-4xl font-black text-white flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  AGENT ZK
                </h1>
                <p className="text-white/60 ml-16">Developer Tools & Automation Platform</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all cursor-pointer group h-full">
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{tool.title}</h3>
                      <p className="text-white/60 text-sm">{tool.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          >
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-3">Welcome to AGENT ZK Platform</h2>
                <p className="text-white/70 mb-6">
                  A powerful suite of developer tools designed to automate blockchain operations, generate smart contracts, 
                  and manage decentralized applications with AI assistance. Build faster, deploy smarter.
                </p>
                <div className="flex gap-4">
                  <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                    Get Started
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    View Documentation
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}