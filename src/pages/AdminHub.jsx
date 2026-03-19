import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Activity, Brain, Settings, FileText, Users, BarChart3, Shield, Network, Bot, TrendingUp } from "lucide-react";

const adminApps = [
  { name: "Hub", icon: Activity, path: "Hub", description: "Main admin dashboard", color: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/30" },
  { name: "AI Analytics", icon: Brain, path: "AIAnalytics", description: "AI usage & analytics", color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/30" },
  { name: "SSH Manager", icon: Settings, path: "SSHManager", description: "Manage SSH connections", color: "from-green-500/20 to-emerald-500/20", border: "border-green-500/30" },
  { name: "API Docs", icon: FileText, path: "APIDocumentation", description: "Internal API documentation", color: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/30" },
  { name: "TTT Audit", icon: Shield, path: "TTTAudit", description: "Platform audit logs", color: "from-red-500/20 to-rose-500/20", border: "border-red-500/30" },
  { name: "Analytics", icon: BarChart3, path: "Analytics", description: "App analytics", color: "from-blue-500/20 to-indigo-500/20", border: "border-blue-500/30" },
  { name: "Agent FYE", icon: TrendingUp, path: "AgentFYE", description: "Agent FYE dashboard", color: "from-teal-500/20 to-cyan-500/20", border: "border-teal-500/30" },
  { name: "ZK Directory", icon: Users, path: "AgentZKDirectory", description: "Agent ZK user directory", color: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/30" },
  { name: "Kaspa Node", icon: Network, path: "KaspaNode", description: "Node management", color: "from-emerald-500/20 to-green-500/20", border: "border-emerald-500/30" },
  { name: "Hercules", icon: Bot, path: "Hercules", description: "Hercules AI tools", color: "from-orange-500/20 to-red-500/20", border: "border-orange-500/30" },
];

export default function AdminHubPage() {
  return (
    <div className="min-h-screen bg-black">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.08) 0%, transparent 70%)',
        }}
      />
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
            <Shield className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-xs font-semibold tracking-widest uppercase">Admin Only</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Admin Hub</h1>
          <p className="text-white/50 text-sm">Central access to all administrative tools</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {adminApps.map((app, i) => {
            const Icon = app.icon;
            return (
              <Link key={app.path} to={createPageUrl(app.path)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`bg-gradient-to-br ${app.color} border ${app.border} rounded-xl p-4 flex flex-col items-center gap-3 text-center cursor-pointer transition-all`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{app.name}</div>
                    <div className="text-white/40 text-xs mt-0.5">{app.description}</div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}