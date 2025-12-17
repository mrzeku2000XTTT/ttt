import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft,
  Eye,
  Play
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
    { id: "oracle", name: "Oracle", icon: Eye, path: "Oracle", description: "Seek wisdom and insights" },
    { id: "truman", name: "Truman", icon: Play, path: "Truman", description: "Watch and learn" },
  ];

  const getIconComponent = (Icon) => Icon;

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-black" />
      
      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to={createPageUrl("Categories")}>
              <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </Link>
            <div className="flex items-center gap-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3b1c445ba_image.png" 
                alt="BridgeMind Logo"
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-3xl font-black text-white">
                  BridgeMind
                </h1>
                <p className="text-white/60">Community Apps & Tools</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
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
                    <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all" />
                      
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Icon className="w-8 h-8 text-purple-400" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white mb-2">{app.name}</h3>
                        <p className="text-white/60">{app.description}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}