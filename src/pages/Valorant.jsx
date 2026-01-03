import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Crosshair, Target, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ValorantPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1542751371-adc38448a05e?w=2000&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3
        }}
      />
      
      {/* Red Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/60 via-black/80 to-black z-0" />

      {/* Back Button */}
      <Link to={createPageUrl("AppStore")}>
        <Button
          variant="ghost"
          className="fixed top-20 left-4 z-20 text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Apps
        </Button>
      </Link>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* VALORANT Logo */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0aeac6876_image.png"
              alt="VALORANT"
              className="w-32 h-32 mx-auto mb-6"
            />
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight mb-4">
              VALORANT
            </h1>
            <p className="text-red-400 text-xl font-bold">
              DEFY THE LIMITS
            </p>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-xl p-6 hover:bg-white/10 transition-all">
              <Crosshair className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-white font-bold mb-2">Tactical Gameplay</h3>
              <p className="text-white/60 text-sm">Precise gunplay meets unique agent abilities</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-xl p-6 hover:bg-white/10 transition-all">
              <Users className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-white font-bold mb-2">Team Strategy</h3>
              <p className="text-white/60 text-sm">5v5 character-based tactical shooter</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-xl p-6 hover:bg-white/10 transition-all">
              <Trophy className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-white font-bold mb-2">Competitive</h3>
              <p className="text-white/60 text-sm">Ranked matches and tournaments</p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <p className="text-white/60 mb-4">
              VALORANT integration coming soon to TTT
            </p>
            <Button
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-6 text-lg font-bold"
            >
              <Target className="w-5 h-5 mr-2" />
              Enter the Arena
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}