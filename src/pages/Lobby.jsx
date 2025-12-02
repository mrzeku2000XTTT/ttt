import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LobbyPage() {
  const navigate = useNavigate();
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsEntering(false), 2000);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Portal Entry Animation */}
      {isEntering && (
        <motion.div
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: [0, 1.2, 1], rotate: [0, 360, 720] }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-black"
        >
          <motion.div
            className="relative w-96 h-96"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-teal-500 to-cyan-500 rounded-full blur-3xl opacity-60" />
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/8b2da12ef_image.png"
              alt="Portal"
              className="absolute inset-0 w-full h-full object-cover rounded-full animate-spin"
              style={{ animationDuration: '20s' }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* The Lobby Room */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/30 via-teal-900/40 to-cyan-900/30">
        {/* Cosmic Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80"
            alt="Cosmic Space"
            className="w-full h-full object-cover opacity-40"
          />
        </div>

        {/* Open Door POV Effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Door Frame */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1, delay: 2 }}
            className="relative w-full max-w-4xl h-full"
          >
            {/* Left Door Frame */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-yellow-600/40 to-transparent" />
            {/* Right Door Frame */}
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-yellow-600/40 to-transparent" />
            {/* Top Frame */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-yellow-600/40 to-transparent" />
            
            {/* Room Interior - Aqua/Teal/Gold Glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 2.5 }}
              className="absolute inset-20 flex items-center justify-center"
            >
              {/* Central Glow */}
              <div className="relative w-full h-full">
                {/* Gold Glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-radial from-yellow-400/40 via-transparent to-transparent blur-3xl"
                />
                {/* Teal Glow */}
                <motion.div
                  animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                  className="absolute inset-0 bg-gradient-radial from-teal-500/50 via-transparent to-transparent blur-3xl"
                />
                {/* Cyan/Aqua Glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                  className="absolute inset-0 bg-gradient-radial from-cyan-400/40 via-transparent to-transparent blur-3xl"
                />

                {/* Floating Energy Particles */}
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      background: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#14b8a6' : '#06b6d4',
                      boxShadow: `0 0 20px ${i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#14b8a6' : '#06b6d4'}`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      x: [0, Math.random() * 20 - 10, 0],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}

                {/* Center Portal */}
                <motion.div
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ 
                    scale: 1, 
                    rotate: 360,
                  }}
                  transition={{ 
                    scale: { duration: 2, delay: 3 },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64"
                >
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/8b2da12ef_image.png"
                    alt="Cosmic Portal"
                    className="w-full h-full object-cover rounded-full opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-teal-500/30 to-cyan-500/30 rounded-full blur-2xl" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Close Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="absolute top-6 right-6 z-50"
        >
          <Button
            onClick={() => navigate(createPageUrl("Feed"))}
            className="bg-black/60 hover:bg-black/80 border border-white/20 text-white backdrop-blur-xl"
            size="sm"
          >
            <X className="w-5 h-5 mr-2" />
            Exit Lobby
          </Button>
        </motion.div>

        {/* Ambient Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5 }}
          className="absolute bottom-20 left-0 right-0 text-center z-10"
        >
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-teal-400 to-cyan-400 mb-4">
            THE LOBBY
          </h1>
          <p className="text-white/60 text-lg">A space between worlds</p>
        </motion.div>
      </div>
    </div>
  );
}