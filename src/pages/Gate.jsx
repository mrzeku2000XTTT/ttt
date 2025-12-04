import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Search, Share } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StarGateProvider, useStarGate } from "@/components/stargate/StarGateContext";

function GateContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { getAllSharedData, clearAllSharedData } = useStarGate();
  const sharedData = getAllSharedData();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const apps = [
    { name: "AK", path: "AK", category: "AI", color: "#A855F7" },
    { name: "TD", path: "TD", category: "App", color: "#06B6D4" },
    { name: "Builders", path: "Builders", category: "Team", color: "#06B6D4" },
    { name: "Templates", path: "TemplateBuilder", category: "Creator", color: "#EC4899" },
    { name: "Movies", path: "Movies", category: "Watch", color: "#8B5CF6" },
    { name: "Creator", path: "Creator", category: "Business", color: "#10B981" },
    { name: "Focus", path: "Focus", category: "Zen", color: "#3B82F6" },
    { name: "KASPROMO", path: "KP", category: "Vote", color: "#06B6D4" },
    { name: "Konekt", path: "Konekt", category: "Social", color: "#F97316" },
    { name: "MACHINE", path: "Machine", category: "AI", color: "#3B82F6" },
  ];

  const filteredApps = searchQuery
    ? apps.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : apps;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Nebula Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
        
        {/* Nebula clouds */}
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 left-0 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
          className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-pink-500/25 rounded-full blur-[100px]"
        />

        {/* Stars */}
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-6xl font-black text-white mb-2 tracking-tight">
            STAR <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">GATE</span>
          </h1>
          <p className="text-white/60 text-lg">Navigate the cosmic app universe</p>
          
          {Object.keys(sharedData).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-full"
            >
              <Share className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-white">
                {Object.keys(sharedData).length} app{Object.keys(sharedData).length > 1 ? "s" : ""} sharing data
              </span>
              <button
                onClick={clearAllSharedData}
                className="text-xs text-white/60 hover:text-white underline ml-2"
              >
                Clear
              </button>
            </motion.div>
          )}
        </motion.div>

        <div className="mb-12 relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the cosmos..."
            className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 backdrop-blur-xl"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredApps.map((app, i) => (
            <Link key={i} to={createPageUrl(app.path)}>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
              >
                {/* Star Gate Portal */}
                <div className="relative w-full aspect-square">
                  {/* Outer rings */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-white/20"
                    style={{
                      borderColor: `${app.color}40`,
                    }}
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 rounded-full border border-white/10"
                    style={{
                      borderColor: `${app.color}30`,
                    }}
                  />

                  {/* Portal center */}
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="absolute inset-4 rounded-full flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle, ${app.color}80 0%, ${app.color}40 30%, transparent 70%)`,
                      boxShadow: `0 0 60px ${app.color}60, inset 0 0 40px ${app.color}40`,
                    }}
                  >
                    {/* Event horizon */}
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${app.color}60 0%, transparent 70%)`,
                      }}
                    />

                    {/* App name in center */}
                    <div className="relative z-10 text-center">
                      <div className="text-white font-black text-sm mb-1">
                        {app.name}
                      </div>
                      <div className="text-white/60 text-xs">{app.category}</div>
                    </div>
                  </motion.div>

                  {/* Energy particles */}
                  {[...Array(6)].map((_, j) => (
                    <motion.div
                      key={j}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        top: "50%",
                        left: "50%",
                        background: app.color,
                        boxShadow: `0 0 10px ${app.color}`,
                      }}
                      animate={{
                        x: [0, Math.cos(j * 60 * (Math.PI / 180)) * 60],
                        y: [0, Math.sin(j * 60 * (Math.PI / 180)) * 60],
                        opacity: [1, 0],
                        scale: [0, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: (j * 2) / 6,
                      }}
                    />
                  ))}
                </div>

                {/* Glow effect on hover */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 rounded-full blur-xl"
                  style={{
                    background: `radial-gradient(circle, ${app.color}40 0%, transparent 70%)`,
                  }}
                />
              </motion.div>
            </Link>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg">No star gates found in this sector</p>
          </div>
        )}
      </div>

      {/* Interactive cursor glow */}
      <motion.div
        className="fixed w-96 h-96 rounded-full pointer-events-none z-0 blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
          left: mousePos.x - 192,
          top: mousePos.y - 192,
        }}
      />
    </div>
  );
}

export default function GatePage() {
  return (
    <StarGateProvider>
      <GateContent />
    </StarGateProvider>
  );
}