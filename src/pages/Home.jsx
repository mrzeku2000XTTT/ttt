import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Wand2, Shield, LogIn, ArrowRight, Zap, LogOut, Link as LinkIcon, Hand, ChevronRight, X, TrendingUp, Link2, ArrowUpDown, Wallet } from "lucide-react";
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

  useEffect(() => {
    loadUser();
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
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 20 }}
                          onClick={(e) => e.stopPropagation()}
                          className="relative bg-gradient-to-br from-zinc-900 to-black border-2 border-cyan-500/50 rounded-3xl w-full max-w-2xl p-8 shadow-2xl shadow-cyan-500/20"
                        >
                          {/* Close Button */}
                          <button
                            onClick={() => setShowPortal(false)}
                            className="absolute top-4 right-4 w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full flex items-center justify-center transition-all"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>

                          {/* Portal Title */}
                          <div className="text-center mb-8">
                            <motion.div
                              animate={{
                                rotate: [0, 180, 360],
                                scale: [1, 1.2, 1],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              className="w-20 h-20 mx-auto mb-4 relative"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full blur-xl opacity-60" />
                              <Link2 className="w-full h-full text-cyan-400 relative" strokeWidth={2} />
                            </motion.div>

                            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                              CHAIN PORTAL
                            </h2>
                            <p className="text-cyan-400 text-sm">
                              Bridging Kaspa L1 ↔ Kasplex L2
                            </p>
                          </div>

                          {/* Portal Options */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link to={createPageUrl("Bridge")}>
                              <button className="w-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 hover:border-cyan-400 rounded-2xl p-6 transition-all hover:scale-105 group">
                                <ArrowUpDown className="w-8 h-8 text-cyan-400 mb-3 mx-auto group-hover:rotate-180 transition-transform duration-500" />
                                <h3 className="text-white font-bold text-lg mb-2">Send KAS</h3>
                                <p className="text-gray-400 text-xs">
                                  Transfer KAS between networks
                                </p>
                              </button>
                            </Link>

                            <Link to={createPageUrl("DAGKnightWallet")}>
                              <button className="w-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 hover:border-purple-400 rounded-2xl p-6 transition-all hover:scale-105 group">
                                <Shield className="w-8 h-8 text-purple-400 mb-3 mx-auto group-hover:scale-110 transition-transform duration-300" />
                                <h3 className="text-white font-bold text-lg mb-2">DAGKnight</h3>
                                <p className="text-gray-400 text-xs">
                                  Advanced wallet verification
                                </p>
                              </button>
                            </Link>

                            <Link to={createPageUrl("Wallet")}>
                              <button className="w-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-2xl p-6 transition-all hover:scale-105 group">
                                <Wallet className="w-8 h-8 text-emerald-400 mb-3 mx-auto group-hover:scale-110 transition-transform duration-300" />
                                <h3 className="text-white font-bold text-lg mb-2">Wallet</h3>
                                <p className="text-gray-400 text-xs">
                                  View your TTT wallet
                                </p>
                              </button>
                            </Link>

                            <Link to={createPageUrl("GlobalHistory")}>
                              <button className="w-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-2 border-orange-500/50 hover:border-orange-400 rounded-2xl p-6 transition-all hover:scale-105 group">
                                <TrendingUp className="w-8 h-8 text-orange-400 mb-3 mx-auto group-hover:scale-110 transition-transform duration-300" />
                                <h3 className="text-white font-bold text-lg mb-2">Analytics</h3>
                                <p className="text-gray-400 text-xs">
                                  Network statistics & insights
                                </p>
                              </button>
                            </Link>
                          </div>

                          {/* Portal Footer */}
                          <div className="mt-8 pt-6 border-t border-white/10 text-center">
                            <p className="text-gray-500 text-xs">
                              Secured by TTT Chain Protocol
                            </p>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>
                  );
                  }