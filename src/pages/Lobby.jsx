import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LobbyPage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      {/* Background Alien Music */}
      <audio autoPlay loop>
        <source src="https://cdn.pixabay.com/audio/2022/05/13/audio_c8c8e99d9c.mp3" type="audio/mpeg" />
      </audio>

      {/* The Lobby Room */}
      <div className="absolute inset-0">
        {/* Cosmic Portal Background - Full Screen Spinning Zoomed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, rotate: 360 }}
          transition={{ 
            opacity: { duration: 2, delay: 2 },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" }
          }}
          className="absolute inset-0"
        >
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/e91d0d293_image.png"
            alt="Cosmic Portal"
            className="w-full h-full object-cover scale-[10]"
          />
        </motion.div>

        {/* Darker Black Overlay */}
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />

        {/* Glowing Overlay Effects */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute inset-0"
        >
          {/* Gold Glow */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/30 rounded-full blur-[120px]"
          />
          {/* Teal Glow */}
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
            className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-teal-500/40 rounded-full blur-[150px]"
          />
          {/* Cyan Glow */}
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 7, repeat: Infinity, delay: 2 }}
            className="absolute bottom-1/4 left-1/2 w-[400px] h-[400px] bg-cyan-400/35 rounded-full blur-[130px]"
          />
        </motion.div>

        {/* Floating Energy Particles */}
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#14b8a6' : '#06b6d4',
              boxShadow: `0 0 15px ${i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#14b8a6' : '#06b6d4'}`,
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, Math.random() * 30 - 15, 0],
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.5 }}
          className="absolute top-6 left-6 z-50"
        >
          <Button
            onClick={() => navigate(createPageUrl("Feed"))}
            className="bg-black/70 hover:bg-black/90 border border-white/30 text-white backdrop-blur-xl"
            size="sm"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Feed
          </Button>
        </motion.div>

        {/* Ambient Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3 }}
          className="absolute bottom-20 left-0 right-0 text-center z-10"
        >
          <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-teal-400 to-cyan-400 mb-4 drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            THE LOBBY
          </h1>
          <p className="text-white/70 text-xl">A space between worlds</p>
        </motion.div>
      </div>
    </div>
  );
}