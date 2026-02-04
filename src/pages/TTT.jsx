import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Zap, TrendingUp, Users, Gamepad2, ShoppingBag, BookOpen, Shield, Wallet, Brain } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TTTPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [appImages, setAppImages] = useState({});
  const [hoveredApp, setHoveredApp] = useState(null);

  useEffect(() => {
    loadAppImages();
  }, []);

  const loadAppImages = async () => {
    try {
      const customizations = await base44.entities.AppIconCustomization.filter({});
      const imagesMap = {};
      customizations.forEach(c => {
        imagesMap[c.app_id] = c.icon_url;
      });
      setAppImages(imagesMap);
    } catch (err) {
      console.error('Failed to load app images:', err);
    }
  };

  const apps = [];

  const categories = ["All", "Social", "AI", "Finance", "Games", "Shop", "Education", "Security", "Tools", "Media"];

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.3,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [null, Math.random() * 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Large TTT logo background */}
      <div className="fixed inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.05 }}
          transition={{ duration: 1.5 }}
          className="text-[40rem] font-black text-white"
          style={{ fontFamily: '"Orbitron", sans-serif' }}
        >
          TTT
        </motion.div>
      </div>

      {/* Glowing orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-flex items-center gap-3 mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-cyan-400/40 via-white/40 to-cyan-400/40" />
              <div className="relative text-8xl font-black text-white" style={{ fontFamily: '"Orbitron", sans-serif' }}>
                TTT
              </div>
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-white/60"
          >
            The Ultimate Kaspa Ecosystem
          </motion.p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apps..."
              className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 text-sm rounded-full backdrop-blur-xl transition-all ${
                selectedCategory === category
                  ? "bg-white text-black font-bold"
                  : "bg-white/10 text-white/80 border border-white/10 hover:bg-white/20"
              }`}
            >
              {category}
            </motion.button>
          ))}
        </motion.div>

        {/* Apps grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredApps.map((app, i) => {
              const Icon = app.icon;
              return (
                <Link key={app.path} to={createPageUrl(app.path)}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.1, y: -10 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredApp(app.path)}
                    onHoverEnd={() => setHoveredApp(null)}
                    className="relative group"
                  >
                    <div className={`relative w-full aspect-square bg-gradient-to-br ${app.color} rounded-3xl flex items-center justify-center overflow-hidden`}>
                      {/* Glow effect on hover */}
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${app.color} blur-2xl`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: hoveredApp === app.path ? 0.6 : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                      
                      {/* Icon */}
                      <motion.div
                        animate={{
                          rotate: hoveredApp === app.path ? [0, -10, 10, -10, 0] : 0,
                        }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10"
                      >
                        {appImages[app.path] ? (
                          <img src={appImages[app.path]} alt={app.name} className="w-10 h-10 object-cover rounded-xl" />
                        ) : (
                          <Icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                        )}
                      </motion.div>

                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{
                          x: hoveredApp === app.path ? ['-100%', '200%'] : '-100%',
                        }}
                        transition={{
                          duration: 0.8,
                          ease: "easeInOut",
                        }}
                      />
                    </div>

                    {/* App name */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 + 0.1 }}
                      className="mt-3 text-center"
                    >
                      <p className="text-white font-bold text-sm">{app.name}</p>
                      <p className="text-white/40 text-xs mt-1">{app.category}</p>
                    </motion.div>

                    {/* Hover glow */}
                    <motion.div
                      className="absolute -inset-2 bg-white/10 rounded-3xl blur-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredApp === app.path ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                </Link>
              );
            })}
          </AnimatePresence>
        </div>

        {/* No results */}
        {filteredApps.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-white/40 text-lg">No apps found</p>
          </motion.div>
        )}
      </div>

      {/* Floating particles on scroll */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
}