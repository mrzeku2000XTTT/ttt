import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function TruthLandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden cursor-none">
      {/* TTT Logo Top Left */}
      <div className="absolute top-6 left-6 z-50 mix-blend-difference">
        <Link to={createPageUrl("Home")}>
          <h1 className="text-3xl font-black text-white/50 hover:text-white tracking-tighter transition-colors">
            TTT
          </h1>
        </Link>
      </div>

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
      
      {/* Subtle Texture to reveal */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}