import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import AestheticPuzzle from "@/components/truth/AestheticPuzzle";

export default function TruthLandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLightsOn, setIsLightsOn] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handlePuzzleSolve = () => {
    setIsLightsOn(true);
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden transition-all duration-1000 ${isLightsOn ? 'bg-white cursor-default' : 'bg-black cursor-none'}`}>
      {/* TTT Logo Top Left */}
      <div className="absolute top-6 left-6 z-50 mix-blend-difference flex items-center gap-4">
        <AnimatePresence>
          {isLightsOn && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => setIsLightsOn(false)}
              className="text-black hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-8 h-8" />
            </motion.button>
          )}
        </AnimatePresence>
        
        <Link to={createPageUrl("Home")}>
          <h1 className={`text-3xl font-black tracking-tighter transition-colors ${isLightsOn ? 'text-black' : 'text-white/50 hover:text-white'}`}>
            TTT
          </h1>
        </Link>
      </div>

      {!isLightsOn && (
        <>
          {/* Ambient Moon Light Glow */}
          <div
            className="pointer-events-none fixed inset-0 z-10 transition-colors duration-300"
            style={{
              background: `radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(226, 232, 255, 0.15) 0%, rgba(0, 0, 0, 0) 100%)`,
            }}
          />

          {/* The Light Source (Cursor) */}
          <motion.div
            className="pointer-events-none fixed z-20 w-4 h-4 rounded-full bg-blue-100/80 blur-[2px]"
            animate={{
              x: mousePosition.x - 8,
              y: mousePosition.y - 8,
            }}
            transition={{
              type: "tween",
              ease: "linear",
              duration: 0
            }}
            style={{
              boxShadow: '0 0 80px 20px rgba(200, 220, 255, 0.2)'
            }}
          />
        </>
      )}
      
      {/* Puzzle Container */}
      <AnimatePresence>
        {!isLightsOn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center z-30"
          >
            <AestheticPuzzle onSolve={handlePuzzleSolve} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revealed Content (Lights On) */}
      <AnimatePresence>
        {isLightsOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="w-full h-full flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-black font-black text-9xl tracking-tighter select-none flex flex-col items-center"
            >
              <span>TRUTH</span>
              <span className="text-xl font-normal tracking-widest mt-4 opacity-50">IS REVEALED</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background Texture */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${isLightsOn ? 'opacity-10' : 'opacity-[0.03]'}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${isLightsOn ? '000000' : 'ffffff'}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}