import React from "react";
import { ArrowLeft, Gamepad2, Sparkles, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function PokiPage() {
  const categories = [
    { name: "Action", icon: Zap, games: 500 },
    { name: "Puzzle", icon: Sparkles, games: 300 },
    { name: "Multiplayer", icon: Users, games: 200 },
    { name: "Adventure", icon: Gamepad2, games: 400 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2332] via-[#1e2938] to-[#0f1419] relative overflow-hidden">
      {/* Background Logo Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/cd5bb49da_image.png)`,
            backgroundSize: '200px',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center',
          }}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f1419]/80" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link 
              to={createPageUrl("AppStore")} 
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/cd5bb49da_image.png"
              alt="Poki"
              className="w-32 h-32 mx-auto mb-8 drop-shadow-[0_0_40px_rgba(6,182,212,0.5)]"
            />
            
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
              Play Free Games
            </h1>
            
            <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto">
              Discover thousands of free online games on Poki. No downloads, no ads, just fun!
            </p>

            <a 
              href="https://poki.com" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-[#00a8cc] to-[#00d9ff] hover:from-[#0095b3] hover:to-[#00c4e6] text-white text-lg px-12 py-6 h-auto rounded-full shadow-[0_0_30px_rgba(0,168,204,0.4)] hover:shadow-[0_0_50px_rgba(0,168,204,0.6)] transition-all"
              >
                <Gamepad2 className="w-6 h-6 mr-3" />
                Visit Poki.com
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Categories Grid */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {categories.map((category, i) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#00a8cc]/20 to-[#00d9ff]/20 rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-[#00d9ff]" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{category.name}</h3>
                  <p className="text-white/60 text-sm">{category.games}+ games</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Features */}
        <div className="max-w-7xl mx-auto px-4 pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-3 gap-6"
          >
            <div className="text-center p-8">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-white font-bold text-xl mb-2">Play Instantly</h3>
              <p className="text-white/60">No downloads required. Start playing right away in your browser.</p>
            </div>
            <div className="text-center p-8">
              <div className="text-4xl mb-4">🆓</div>
              <h3 className="text-white font-bold text-xl mb-2">100% Free</h3>
              <p className="text-white/60">All games are completely free to play with no hidden costs.</p>
            </div>
            <div className="text-center p-8">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-white font-bold text-xl mb-2">New Daily</h3>
              <p className="text-white/60">Fresh games added every single day for endless entertainment.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}