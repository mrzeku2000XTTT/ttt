import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Wand2, Shield, LogIn, ArrowRight, Zap, LogOut, Link as LinkIcon, Hand, ChevronRight, X, TrendingUp, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showKaspaModal, setShowKaspaModal] = useState(false);
  const [kaspaPrice, setKaspaPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [clockSound, setClockSound] = useState(null);
  
  const alertWords = ["YOU", "ARE", "ABOUT", "TO", "ENTER", "THE", "ASTRAL", "REALM"];

  useEffect(() => {
    loadUser();
    
    // Initialize clock sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    setClockSound(audio);

    // Try to play (may be blocked by autoplay policy)
    const playAudio = () => {
      audio.play().catch(() => {});
      document.removeEventListener('click', playAudio);
    };
    document.addEventListener('click', playAudio);

    return () => {
      audio.pause();
      document.removeEventListener('click', playAudio);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % alertWords.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    setUser(null);
  };

  const loadKaspaPrice = async () => {
    setLoadingPrice(true);
    try {
      const response = await base44.functions.invoke('getKaspaPrice');
      if (response.data?.price) {
        setKaspaPrice(response.data.price);
      }
    } catch (err) {
      console.error('Failed to load Kaspa price:', err);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleKaspaClick = () => {
    setShowKaspaModal(true);
    loadKaspaPrice();
  };

  if (loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      {/* Water Background */}
      <div className="absolute inset-0">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/cb2f8e8f0_image.png"
          alt="Dark Water"
          className="w-full h-full object-cover"
          style={{ 
            imageRendering: 'high-quality',
            filter: 'brightness(0.7) contrast(1.1)'
          }}
        />
        
        {/* TTT Text Behind Everything - Made More Visible */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-[40vw] font-black text-white/20"
            style={{
              textShadow: '0 0 100px rgba(255, 255, 255, 0.3), 0 0 200px rgba(6, 182, 212, 0.2)',
              letterSpacing: '-0.05em'
            }}
          >
            TTT
          </motion.div>
        </div>

        {/* Alert Message Animation - Electric Sign */}
        <div className="absolute top-32 md:top-40 left-0 right-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 100 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWordIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              {/* Electric Glow Background */}
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-cyan-400 blur-3xl"
                style={{ zIndex: -1 }}
              />

              {/* Main Text with Electric Effect */}
              <div className="text-5xl md:text-7xl lg:text-8xl font-black text-white px-8 py-4 bg-black/40 backdrop-blur-sm border-2 border-cyan-400 rounded-lg"
                style={{
                  textShadow: `
                    0 0 10px rgba(6, 182, 212, 1),
                    0 0 20px rgba(6, 182, 212, 1),
                    0 0 30px rgba(6, 182, 212, 0.8),
                    0 0 40px rgba(6, 182, 212, 0.6),
                    0 0 50px rgba(6, 182, 212, 0.4),
                    0 0 60px rgba(139, 92, 246, 0.3),
                    2px 2px 4px rgba(0, 0, 0, 0.8)
                  `,
                  fontFamily: '"Orbitron", "Rajdhani", sans-serif',
                  letterSpacing: '0.1em',
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.5), inset 0 0 20px rgba(6, 182, 212, 0.1)'
                }}
              >
                {alertWords[currentWordIndex]}
              </div>

              {/* Flickering Border Effect */}
              <motion.div
                animate={{
                  opacity: [0, 1, 0, 1, 0],
                }}
                transition={{
                  duration: 0.15,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="absolute inset-0 border-2 border-cyan-300 rounded-lg pointer-events-none"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 1))'
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" style={{ zIndex: 2 }} />
      </div>
      
      {/* KASPA Button - Top Left */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-50"
      >
        <Button
          onClick={handleKaspaClick}
          className="bg-transparent hover:bg-white/5 border border-white/20 text-white backdrop-blur-sm h-8 px-3 text-xs md:h-10 md:px-4 md:text-sm font-semibold"
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/13e8ec094_image.png"
            alt="Kaspa"
            className="w-4 h-4 md:w-5 md:h-5 mr-2 rounded-full"
          />
          KASPA
        </Button>
      </motion.div>

      {/* Logout Button */}
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute top-4 right-4 md:top-6 md:right-6 z-50"
        >
          <Button
            onClick={handleLogout}
            className="bg-cyan-900/80 hover:bg-cyan-800/90 border border-cyan-400/30 text-white backdrop-blur-xl h-8 px-3 text-xs md:h-10 md:px-4 md:text-sm"
          >
            <LogOut className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </motion.div>
      )}

      {/* Main Content - Centered but Lower */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-48 md:pt-20" style={{ zIndex: 10 }}>
        {/* Top UNCHAIN HUMANITY - Darker */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="mb-4 px-4 text-center"
        >
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-2 tracking-tight leading-tight"
            style={{
              color: '#d1d5db',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 255, 255, 0.1)',
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
              fontWeight: 900
            }}
          >
            UNCHAIN HUMANITY
          </h1>
        </motion.div>

        {/* Subtitle */}
        <div className="flex items-center justify-center gap-3 mb-8 ml-8 md:ml-12">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-white/70 text-xs md:text-sm tracking-[0.2em] font-light"
            style={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
            }}
          >
            KASPA L1
          </motion.span>

          <button
            onClick={() => setShowPortal(true)}
            className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-110 transition-transform duration-300"
            title="Open Portal"
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 blur-xl"
              animate={{
                opacity: [0.1, 0.4, 0.1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="w-full h-full bg-cyan-500/20" />
            </motion.div>

            {/* Chain 1 - Forms pyramid, square, line */}
            <motion.div
              className="absolute"
              animate={{
                x: [0, 0, 8, 0],
                y: [0, -8, 0, 0],
                opacity: [0.4, 0.6, 0.5, 0.4],
                rotate: [0, 45, 90, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.5))',
              }}
            >
              <Link2 className="w-4 h-4 md:w-5 md:h-5 text-black/80" strokeWidth={2.5} />
            </motion.div>

            {/* Chain 2 - Center, morphs with others */}
            <motion.div
              className="absolute"
              animate={{
                x: [0, 0, 0, 0],
                y: [0, 0, 0, 0],
                scale: [1, 1.3, 1, 1],
                opacity: [0.5, 0.8, 0.6, 0.5],
                rotate: [0, 90, 180, 360],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                filter: 'drop-shadow(0 0 12px rgba(0, 0, 0, 0.6))',
              }}
            >
              <Link2 className="w-4 h-4 md:w-5 md:h-5 text-black/80" strokeWidth={2.5} />
            </motion.div>

            {/* Chain 3 - Completes shapes */}
            <motion.div
              className="absolute"
              animate={{
                x: [0, 0, -8, 0],
                y: [0, 8, 0, 0],
                opacity: [0.4, 0.6, 0.5, 0.4],
                rotate: [0, -45, -90, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.5))',
              }}
            >
              <Link2 className="w-4 h-4 md:w-5 md:h-5 text-black/80" strokeWidth={2.5} />
            </motion.div>

            {/* Connecting lines */}
            <motion.div
              className="absolute w-12 h-0.5 bg-gradient-to-r from-transparent via-black/30 to-transparent"
              animate={{
                opacity: [0, 0.5, 0],
                rotate: [0, 45, 90, 0],
                scaleX: [0.5, 1, 0.7, 0.5],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Energy particles */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-black/40 rounded-full"
                animate={{
                  x: [0, Math.cos(i * 72 * Math.PI / 180) * 20, 0],
                  y: [0, Math.sin(i * 72 * Math.PI / 180) * 20, 0],
                  opacity: [0, 0.6, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </button>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-white/70 text-xs md:text-sm tracking-[0.2em] font-light"
            style={{
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
              fontFamily: '"Orbitron", "Rajdhani", sans-serif',
            }}
          >
            KASPLEX L2
          </motion.span>
          </div>

        {/* Buttons - Vertical Stack Centered - Higher Position */}
        <div className="flex flex-col items-center gap-4 mb-16 mt-40 md:mt-60 lg:mt-80">
          {/* Claim Agent ZK Button - Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <Link to={createPageUrl("AgentZK")}>
              <Button
                className="h-12 px-8 text-sm md:text-base font-bold bg-black/60 hover:bg-black/40 text-white border border-white/20 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Claim Agent ZK Identity
              </Button>
            </Link>
          </motion.div>

          {/* Enter TTT Button - No Background */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <Link to={createPageUrl("Feed")}>
              <button className="text-white/90 hover:text-white text-sm md:text-base font-semibold transition-all duration-300 flex items-center gap-2">
                <Hand className="w-4 h-4" />
                Enter TTT
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Bottom UNCHAIN REALITY - Mirror/Reflection Effect (Upside Down + Glassy) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.5 }}
          className="mt-auto pb-8 px-4"
        >
          <h1 
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white/40 tracking-tight text-center"
            style={{
              transform: 'scaleY(-1)',
              textShadow: '0 -8px 32px rgba(0, 0, 0, 0.3), 0 0 60px rgba(6, 182, 212, 0.2)',
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backdropFilter: 'blur(15px)',
              filter: 'blur(1px) drop-shadow(0 0 30px rgba(255, 255, 255, 0.2))',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)',
            }}
          >
            UNCHAIN HUMANITY
          </h1>
        </motion.div>
      </div>

      {/* Kaspa Price Modal */}
      <AnimatePresence>
        {showKaspaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowKaspaModal(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 border border-white/20 rounded-2xl w-full max-w-md p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-white font-bold text-xl">Kaspa Price</h3>
                </div>
                <Button
                  onClick={() => setShowKaspaModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {loadingPrice ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              ) : kaspaPrice ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
                    <div className="text-center">
                      <p className="text-white/60 text-sm mb-2">Current Price</p>
                      <p className="text-white text-4xl font-black mb-1">
                        ${kaspaPrice.toFixed(4)}
                      </p>
                      <p className="text-white/40 text-xs">USD per KAS</p>
                    </div>
                  </div>

                  {kaspaPrice?.change24h !== undefined && (
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-sm font-semibold ${kaspaPrice.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {kaspaPrice.change24h >= 0 ? '+' : ''}{kaspaPrice.change24h?.toFixed(2)}%
                      </span>
                      <span className="text-white/40 text-xs">24h</span>
                    </div>
                  )}


                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-white/60">Unable to load price</p>
                  <Button
                    onClick={loadKaspaPrice}
                    className="mt-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400"
                  >
                    Retry
                  </Button>
                  </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-center">
                    <Link to={createPageUrl("B44Prompts")}>
                      <Button
                        className="bg-black/60 hover:bg-black/40 border border-white/20 text-white flex items-center justify-center gap-2 h-10 text-sm px-6"
                      >
                        <img 
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/bc56007fd_image.png"
                          alt="b44"
                          className="w-4 h-4 object-contain"
                        />
                        b44
                      </Button>
                    </Link>
                  </div>
                  </motion.div>
                  </motion.div>
                  )}
                  </AnimatePresence>

                  {/* Portal Modal */}
                  <AnimatePresence>
                  {showPortal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowPortal(false)}
                      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[200] flex items-center justify-center overflow-hidden"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: 0 }}
                        animate={{ scale: 1, rotate: 360 }}
                        exit={{ scale: 0, rotate: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="relative w-full h-full max-w-4xl max-h-4xl flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Optimized Wormhole Tunnel Effect */}
                        <div className="relative w-full h-full overflow-hidden" style={{ willChange: 'transform' }}>
                          {/* Opening Line to Circle Animation */}
                          <motion.div
                            initial={{ pathLength: 0 }}
                            animate={{ 
                              pathLength: 1,
                            }}
                            transition={{
                              duration: 1.5,
                              ease: "easeInOut"
                            }}
                            className="absolute inset-0 flex items-center justify-center z-20"
                          >
                            <svg width="300" height="300" viewBox="0 0 300 300" className="absolute">
                              <motion.line
                                x1="150"
                                y1="50"
                                x2="150"
                                y2="250"
                                stroke="url(#lineGradient)"
                                strokeWidth="6"
                                initial={{ pathLength: 1, opacity: 1, rotate: 0 }}
                                animate={{ 
                                  pathLength: [1, 1, 0],
                                  opacity: [1, 1, 0],
                                  rotate: [0, 360, 360]
                                }}
                                transition={{
                                  duration: 1.5,
                                  ease: "linear",
                                  times: [0, 0.7, 1]
                                }}
                                style={{
                                  filter: 'drop-shadow(0 0 15px rgba(6, 182, 212, 1)) drop-shadow(0 0 30px rgba(6, 182, 212, 1)) drop-shadow(0 0 45px rgba(255, 255, 255, 0.8))',
                                  transformOrigin: '150px 150px'
                                }}
                              />
                              <motion.circle
                                cx="150"
                                cy="150"
                                r="100"
                                stroke="url(#circleGradient)"
                                strokeWidth="4"
                                fill="none"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ 
                                  pathLength: 1,
                                  opacity: 1
                                }}
                                transition={{
                                  delay: 0.5,
                                  duration: 1.5,
                                  ease: "easeInOut"
                                }}
                                style={{
                                  filter: 'drop-shadow(0 0 12px rgba(6, 182, 212, 1)) drop-shadow(0 0 24px rgba(6, 182, 212, 0.6))',
                                  strokeDasharray: '628',
                                  transformOrigin: 'center',
                                }}
                              />
                              
                              {/* Clock Tick Marks */}
                              {[...Array(12)].map((_, i) => {
                                const angle = (i * 30 - 90) * Math.PI / 180;
                                const innerRadius = 85;
                                const outerRadius = i % 3 === 0 ? 95 : 90;
                                return (
                                  <motion.line
                                    key={`tick-${i}`}
                                    x1={150 + Math.cos(angle) * innerRadius}
                                    y1={150 + Math.sin(angle) * innerRadius}
                                    x2={150 + Math.cos(angle) * outerRadius}
                                    y2={150 + Math.sin(angle) * outerRadius}
                                    stroke="#06b6d4"
                                    strokeWidth={i % 3 === 0 ? "2" : "1"}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2 + i * 0.05 }}
                                    style={{
                                      filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.8))'
                                    }}
                                  />
                                );
                              })}
                              
                              {/* Hour Hand */}
                              <motion.line
                                x1="150"
                                y1="150"
                                x2="150"
                                y2="100"
                                stroke="#06b6d4"
                                strokeWidth="4"
                                strokeLinecap="round"
                                initial={{ opacity: 0, rotate: 0 }}
                                animate={{ 
                                  opacity: 1,
                                  rotate: 360
                                }}
                                transition={{
                                  opacity: { delay: 2.5, duration: 0.3 },
                                  rotate: { delay: 2.5, duration: 12, repeat: Infinity, ease: "linear" }
                                }}
                                style={{
                                  transformOrigin: '150px 150px',
                                  filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 1))'
                                }}
                              />
                              
                              {/* Minute Hand */}
                              <motion.line
                                x1="150"
                                y1="150"
                                x2="150"
                                y2="80"
                                stroke="#8b5cf6"
                                strokeWidth="3"
                                strokeLinecap="round"
                                initial={{ opacity: 0, rotate: 0 }}
                                animate={{ 
                                  opacity: 1,
                                  rotate: 360
                                }}
                                transition={{
                                  opacity: { delay: 2.7, duration: 0.3 },
                                  rotate: { delay: 2.7, duration: 6, repeat: Infinity, ease: "linear" }
                                }}
                                style={{
                                  transformOrigin: '150px 150px',
                                  filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 1))'
                                }}
                              />
                              
                              {/* Second Hand - Fast Rotation */}
                              <motion.line
                                x1="150"
                                y1="150"
                                x2="150"
                                y2="70"
                                stroke="#ec4899"
                                strokeWidth="2"
                                strokeLinecap="round"
                                initial={{ opacity: 0, rotate: 0 }}
                                animate={{ 
                                  opacity: 1,
                                  rotate: 360
                                }}
                                transition={{
                                  opacity: { delay: 2.8, duration: 0.3 },
                                  rotate: { delay: 2.8, duration: 3, repeat: Infinity, ease: "linear" }
                                }}
                                style={{
                                  transformOrigin: '150px 150px',
                                  filter: 'drop-shadow(0 0 8px rgba(236, 72, 153, 1))'
                                }}
                              />

                              {/* Center Dot */}
                              <motion.circle
                                cx="150"
                                cy="150"
                                r="6"
                                fill="#ffffff"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 2.9, duration: 0.3 }}
                                style={{
                                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 1))'
                                }}
                              />
                              <defs>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                                  <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                                  <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </motion.div>

                          {/* Center Bright Glow */}
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.7, 1, 0.7],
                            }}
                            transition={{
                              delay: 1.5,
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="absolute inset-0 flex items-center justify-center z-10"
                            style={{ willChange: 'transform, opacity' }}
                          >
                            <div className="w-40 h-40 bg-cyan-400 rounded-full blur-3xl opacity-80" />
                          </motion.div>

                          {/* Tunnel Rings - Reduced to 8 */}
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={`ring-${i}`}
                              animate={{
                                scale: [0.2 + i * 0.2, 3],
                                opacity: [0.8, 0],
                                rotate: [0, 360],
                              }}
                              transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 0.3,
                              }}
                              className="absolute inset-0 flex items-center justify-center"
                              style={{ willChange: 'transform, opacity' }}
                            >
                              <div 
                                className="rounded-full"
                                style={{
                                  width: `${25 + i * 12}%`,
                                  height: `${25 + i * 12}%`,
                                  border: `2px solid rgba(6, 182, 212, ${0.6 - i * 0.06})`,
                                  boxShadow: `0 0 20px rgba(6, 182, 212, 0.5)`,
                                }}
                              />
                            </motion.div>
                          ))}

                          {/* Energy Particles - Reduced to 20 */}
                          {[...Array(20)].map((_, i) => {
                            const angle = i * 18 * Math.PI / 180;
                            return (
                              <motion.div
                                key={`particle-${i}`}
                                animate={{
                                  x: [Math.cos(angle) * 80, Math.cos(angle) * 600],
                                  y: [Math.sin(angle) * 80, Math.sin(angle) * 600],
                                  opacity: [0.9, 0],
                                  scale: [0.5, 1.8],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                  delay: (i % 5) * 0.4,
                                }}
                                className="absolute top-1/2 left-1/2 w-2 h-2 bg-cyan-400 rounded-full"
                                style={{ willChange: 'transform, opacity' }}
                              />
                            );
                          })}

                          {/* Lightning Streaks - Reduced to 8 */}
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={`streak-${i}`}
                              animate={{
                                scaleX: [0, 2, 0],
                                opacity: [0, 0.7, 0],
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.5,
                              }}
                              className="absolute top-1/2 left-1/2 w-1 h-32 bg-gradient-to-b from-cyan-300 to-purple-400"
                              style={{
                                transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                                willChange: 'transform, opacity'
                              }}
                            />
                          ))}

                          {/* Swirling Energy Clouds - Reduced to 4 */}
                          {[...Array(4)].map((_, i) => (
                            <motion.div
                              key={`cloud-${i}`}
                              animate={{
                                scale: [0.6, 3.5],
                                opacity: [0.4, 0],
                                rotate: [i * 90, i * 90 + 180],
                              }}
                              transition={{
                                duration: 3.5,
                                repeat: Infinity,
                                ease: "easeOut",
                                delay: i * 0.8,
                              }}
                              className="absolute inset-0 flex items-center justify-center"
                              style={{ willChange: 'transform, opacity' }}
                            >
                              <div 
                                className="w-40 h-40 rounded-full blur-2xl"
                                style={{
                                  background: `radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, rgba(6, 182, 212, 0.2) 60%, transparent 80%)`
                                }}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                  </div>
                  );
                  }