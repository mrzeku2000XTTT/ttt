import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Wand2, Shield, LogIn, ArrowRight, Zap, LogOut } from "lucide-react";
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
    <div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{
        backgroundImage: `url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/42598d5e5_image.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      {/* Login/Logout button - top right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-8 right-8 z-20"
      >
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity" />
          <Button
            onClick={() => user ? handleLogout() : base44.auth.redirectToLogin()}
            className="relative bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-cyan-500/30 text-white hover:border-cyan-400/50 rounded-xl"
          >
            {user ? (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </>
            )}
          </Button>
        </div>
      </motion.div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tight">
            UNCHAIN REALITY
          </h1>
          <p className="text-gray-300 text-sm md:text-base uppercase tracking-[0.3em] mb-8">
            Kaspa L1 ←→ Kasplex L2
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to={createPageUrl("Waitlist")}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white text-lg px-8 py-6 rounded-xl shadow-2xl hover:shadow-cyan-500/50 transition-all"
              >
                <Shield className="w-5 h-5 mr-2" />
                Claim Agent ZK Identity
              </Button>
            </Link>
            <Link to={createPageUrl("Browser")}>
              <Button
                size="lg"
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20 px-8 py-6 rounded-xl backdrop-blur-sm text-lg"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Enter TTT
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

    </div>
  );
}