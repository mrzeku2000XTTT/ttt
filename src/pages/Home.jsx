import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Wand2, Shield, LogIn, ArrowRight, Zap, LogOut, Link as LinkIcon, Hand } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-32" style={{ zIndex: 10 }}>
        {/* Top UNCHAIN HUMANITY - Darker */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="mb-8 px-4 text-center"
        >
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-2 tracking-tight leading-tight"
            style={{
              color: '#d1d5db',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 255, 255, 0.1)',
            }}
          >
            UNCHAIN HUMANITY
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="text-white/70 text-lg md:text-xl mb-12 tracking-[0.3em] font-light"
          style={{
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          }}
        >
          KASPA L1 ←→ KASPLEX L2
        </motion.p>

        {/* Buttons - Vertical Stack Centered */}
        <div className="flex flex-col items-center gap-4 mb-16 mt-20">
          {/* Claim Agent ZK Button - Centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <Link to={createPageUrl("AgentZK")}>
              <Button
                className="h-16 px-12 text-lg font-bold bg-black/60 hover:bg-black/40 text-white border border-white/20 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <LinkIcon className="w-5 h-5 mr-2" />
                Claim Agent ZK Identity
              </Button>
            </Link>
          </motion.div>

          {/* Enter TTT Button - Below */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <Link to={createPageUrl("Feed")}>
              <Button
                className="h-14 px-10 text-base font-semibold bg-black/60 hover:bg-black/40 text-white border border-white/20 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Hand className="w-5 h-5 mr-2" />
                Enter TTT
              </Button>
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
    </div>
  );
}