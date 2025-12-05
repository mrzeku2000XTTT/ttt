import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, Shield, Radio, Zap, Droplets, Package, Users, TrendingUp, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MachinePage() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const threats = [
    { label: "Nuclear", level: "MEDIUM", value: 45, color: "bg-yellow-500" },
    { label: "Economic", level: "HIGH", value: 78, color: "bg-red-500" },
    { label: "Prophetic", level: "ELEVATED", value: 62, color: "bg-orange-500" },
    { label: "Local", level: "SAFE", value: 15, color: "bg-green-500" },
  ];

  const readiness = [
    { icon: Droplets, label: "Water", days: 14, status: "good" },
    { icon: Package, label: "Food", days: 21, status: "good" },
    { icon: Shield, label: "Defense", days: "Minimal", status: "warning" },
    { icon: Users, label: "Community", days: "3 contacts", status: "warning" },
  ];

  const alerts = [
    { type: "WATCH", message: "Bank holiday rumors circulating. Monitor closely.", time: "2h ago" },
    { type: "INFO", message: "Solar activity elevated. Communications may be affected.", time: "5h ago" },
    { type: "ALERT", message: "Prophetic pattern detected: Digital ID mandates increasing.", time: "8h ago" },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Silver metallic overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-400/5 via-gray-500/10 to-gray-600/5" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Link to={createPageUrl("Gate")}>
          <Button variant="ghost" className="mb-8 text-gray-400 hover:text-gray-200 hover:bg-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gate
          </Button>
        </Link>

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-500/20">
            <Activity className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-300 to-gray-500 mb-3 tracking-tight">
            MACHINE
          </h1>
          <p className="text-gray-500 text-lg">EndTimes Survival AI</p>
          <p className="text-gray-600 text-sm mt-2">{time.toLocaleString()}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Threat Level Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-300">THREAT LEVEL</h2>
            </div>
            <div className="space-y-4">
              {threats.map((threat, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400 font-semibold">{threat.label}</span>
                    <span className={`text-sm font-bold ${threat.color.replace('bg-', 'text-')}`}>
                      {threat.level}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${threat.value}%` }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      className={`h-full ${threat.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Readiness Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-300">YOUR READINESS</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {readiness.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.status === 'good' ? 'bg-green-500/20' : 'bg-yellow-500/20'
                    }`}>
                      <item.icon className={`w-5 h-5 ${
                        item.status === 'good' ? 'text-green-400' : 'text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">{item.label}</p>
                      <p className="text-gray-200 font-bold">{item.days}{typeof item.days === 'number' ? ' days' : ''}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Overall Readiness</span>
                <span className="text-2xl font-bold text-gray-300">62%</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "62%" }}
                  transition={{ duration: 1 }}
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Alerts Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Radio className="w-6 h-6 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-300">ACTIVE ALERTS</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:bg-gray-800/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    alert.type === 'ALERT' ? 'bg-red-500/20 text-red-400' :
                    alert.type === 'WATCH' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {alert.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-300">{alert.message}</p>
                    <p className="text-gray-600 text-xs mt-1">{alert.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}