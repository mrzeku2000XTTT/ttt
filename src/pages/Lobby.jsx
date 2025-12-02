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
            loading="eager"
            style={{ imageRendering: 'high-quality' }}
          />
        </motion.div>

        {/* Darker Black Overlay */}
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />

        {/* Glowing Overlay Effects - Trippy Mushroom Vibes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="absolute inset-0"
        >
          {/* Magenta Mushroom Glow */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/40 rounded-full blur-[120px]"
          />
          {/* Purple Dream Glow */}
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.4, 0.7, 0.4],
              x: [0, -40, 0],
            }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-purple-600/50 rounded-full blur-[150px]"
          />
          {/* Lime Green Psychedelic */}
          <motion.div
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.3, 0.5, 0.3],
              y: [0, 40, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, delay: 2 }}
            className="absolute bottom-1/4 left-1/2 w-[400px] h-[400px] bg-lime-400/40 rounded-full blur-[130px]"
          />
          {/* Orange Mushroom Cap */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.25, 0.5, 0.25],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 0.5 }}
            className="absolute top-1/3 right-1/3 w-[600px] h-[600px] bg-orange-500/35 rounded-full blur-[140px]"
          />
          {/* Electric Blue Trip */}
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.3, 0.6, 0.3],
              x: [0, 60, 0],
            }}
            transition={{ duration: 7, repeat: Infinity, delay: 3 }}
            className="absolute bottom-1/3 right-1/2 w-[450px] h-[450px] bg-blue-400/45 rounded-full blur-[160px]"
          />
        </motion.div>

        {/* White and Black Stars */}
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 3}px`,
              height: `${1 + Math.random() * 3}px`,
              background: i % 2 === 0 ? '#ffffff' : '#000000',
              boxShadow: i % 2 === 0 ? '0 0 4px #ffffff' : '0 0 2px #000000',
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear",
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
          <h1 className="text-7xl md:text-8xl font-black text-black/80 mb-4 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            THE LOBBY
          </h1>
          <p className="text-black/60 text-xl">A space between worlds</p>
        </motion.div>
      </div>
    </div>
  );
}