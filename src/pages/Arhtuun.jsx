import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Eye, Infinity } from "lucide-react";

export default function ArhtuunPage() {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

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
        {[...Array(100)].map((_, i) => {
          const initialY = Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000);
          const targetY = Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000);
          return (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: initialY,
                opacity: Math.random() * 0.5,
              }}
              animate={{
                y: targetY,
                opacity: [Math.random() * 0.5, Math.random() * 0.7, 0],
              }}
              transition={{
                duration: Math.random() * 15 + 10,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          );
        })}
      </div>

      {/* Dynamic gradient orbs */}
      <motion.div
        className="fixed w-96 h-96 rounded-full blur-[120px] opacity-30 pointer-events-none"
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
          repeatType: "loop",
        }}
      />

      <motion.div
        className="fixed w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none"
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
          repeatType: "loop",
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
              repeatType: "loop",
            }}
            className="absolute inset-0 w-full h-full"
          >
            <div className="absolute top-0 left-1/2 w-1 h-32 bg-gradient-to-b from-orange-400/50 to-transparent -translate-x-1/2" />
            <div className="absolute bottom-0 left-1/2 w-1 h-32 bg-gradient-to-t from-orange-400/50 to-transparent -translate-x-1/2" />
            <div className="absolute left-0 top-1/2 h-1 w-32 bg-gradient-to-r from-orange-400/50 to-transparent -translate-y-1/2" />
            <div className="absolute right-0 top-1/2 h-1 w-32 bg-gradient-to-l from-orange-400/50 to-transparent -translate-y-1/2" />
          </motion.div>

          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/af9093f96_image.png"
            alt="Arh'tuun"
            className="w-[600px] h-[600px] object-contain relative z-10"
          />

          <motion.div
            className="absolute inset-0 blur-3xl opacity-50 pointer-events-none"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              repeatType: "loop",
            }}
          >
            <div className="w-full h-full bg-gradient-to-r from-orange-400 via-cyan-400 to-orange-400" />
          </motion.div>
        </motion.div>
      </div>



      {/* Import Orbitron font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
}