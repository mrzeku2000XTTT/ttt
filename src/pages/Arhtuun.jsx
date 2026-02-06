import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Eye, Infinity } from "lucide-react";

export default function ArhtuunPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.5,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [null, Math.random() * 0.7, 0],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Dynamic gradient orbs */}
      <motion.div
        className="fixed w-96 h-96 rounded-full blur-[120px] opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(251,146,60,0.4) 0%, transparent 70%)",
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="fixed w-80 h-80 rounded-full blur-[100px] opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(96,165,250,0.4) 0%, transparent 70%)",
          right: `${100 - mousePosition.x}%`,
          bottom: `${100 - mousePosition.y}%`,
          transform: "translate(50%, 50%)",
        }}
        animate={{
          scale: [1.2, 1, 1.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Central logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="relative"
        >
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 w-full h-full"
          >
            <div className="absolute top-0 left-1/2 w-1 h-32 bg-gradient-to-b from-orange-400/50 to-transparent" />
            <div className="absolute bottom-0 left-1/2 w-1 h-32 bg-gradient-to-t from-orange-400/50 to-transparent" />
            <div className="absolute left-0 top-1/2 h-1 w-32 bg-gradient-to-r from-orange-400/50 to-transparent" />
            <div className="absolute right-0 top-1/2 h-1 w-32 bg-gradient-to-l from-orange-400/50 to-transparent" />
          </motion.div>

          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/af9093f96_image.png"
            alt="Arh'tuun"
            className="w-64 h-64 object-contain relative z-10"
          />

          <motion.div
            className="absolute inset-0 blur-3xl opacity-50"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-full h-full bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-400" />
          </motion.div>
        </motion.div>
      </div>

      {/* Title */}
      <div className="fixed top-20 left-0 right-0 z-10">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-center"
        >
          <motion.h1
            className="text-7xl font-black text-white mb-4"
            style={{ fontFamily: '"Orbitron", sans-serif' }}
            animate={{
              textShadow: [
                "0 0 20px rgba(251,146,60,0.5)",
                "0 0 40px rgba(96,165,250,0.5)",
                "0 0 20px rgba(251,146,60,0.5)",
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ARH'TUUN
          </motion.h1>
          <motion.p
            className="text-xl text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            The Eternal Convergence
          </motion.p>
        </motion.div>
      </div>

      {/* Floating icons */}
      <motion.div
        className="fixed top-1/4 left-1/4 text-orange-400/30"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 360],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Infinity className="w-16 h-16" />
      </motion.div>

      <motion.div
        className="fixed top-1/3 right-1/4 text-cyan-400/30"
        animate={{
          y: [0, 20, 0],
          rotate: [360, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Sparkles className="w-12 h-12" />
      </motion.div>

      <motion.div
        className="fixed bottom-1/3 left-1/3 text-orange-400/30"
        animate={{
          y: [0, -15, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Eye className="w-14 h-14" />
      </motion.div>

      <motion.div
        className="fixed bottom-1/4 right-1/3 text-cyan-400/30"
        animate={{
          y: [0, 15, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Zap className="w-10 h-10" />
      </motion.div>

      {/* Bottom info */}
      <div className="fixed bottom-8 left-0 right-0 z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="text-center"
        >
          <p className="text-white/40 text-sm">
            Where infinity meets singularity
          </p>
        </motion.div>
      </div>

      {/* Import Orbitron font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
}