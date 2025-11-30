import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Gamepad2, Zap } from "lucide-react";

export default function AYOMUIZHubPage() {
  const apps = [
    {
      name: "AYOMUIZ",
      icon: Gamepad2,
      path: "AYOMUIZ",
      description: "Original Game",
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "AYOMUIZ 2",
      icon: Zap,
      path: "AYOMUIZ2",
      description: "Next Generation",
      color: "from-cyan-500 to-blue-500"
    }
  ];

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f1f03d3d6_CreateanimageofhikingupMtEverest.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.4)'
        }}
      />
      <div className="max-w-4xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black text-white mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              AYOMUIZ
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Choose your game</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {apps.map((app, i) => {
            const Icon = app.icon;
            return (
              <Link key={i} to={createPageUrl(app.path)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-20 rounded-2xl blur-xl transition-opacity group-hover:opacity-40"
                    style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                  />
                  
                  <div className={`relative bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:border-white/30 transition-all shadow-2xl`}>
                    <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${app.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white text-center mb-2">
                      {app.name}
                    </h2>
                    <p className="text-gray-400 text-sm text-center">
                      {app.description}
                    </p>
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