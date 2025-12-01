import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Wand2, Shield, LogIn, ArrowRight, Zap, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HomePage() {
  const [backgroundImage, setBackgroundImage] = useState("https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
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

  // Show landing page if not logged in
  if (loading) {
    return null;
  }

  if (!user) {
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
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tight">
              UNCHAIN REALITY
            </h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
            >
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-8 py-6 rounded-xl shadow-2xl hover:shadow-cyan-500/50 transition-all"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Enter TTT
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  const handleGenerateBackground = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: `Ultra premium futuristic ${prompt}, cinematic lighting, high quality, 8k resolution, dramatic atmosphere`
      });

      if (response.url) {
        setBackgroundImage(response.url);
        setShowGenerator(false);
        setPrompt("");
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGenerateBackground();
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Scanlines effect */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
        }} />
      </div>

      {/* Logout button - top right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-8 right-8 z-20"
      >
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity" />
          <Button
            onClick={handleLogout}
            className="relative bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 backdrop-blur-xl border border-purple-500/30 text-white hover:border-purple-400/50 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </motion.div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="max-w-7xl w-full">
          {/* TTT Logo with AI Background Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center mb-12"
          >
            {/* Custom TTT Logo with Taller Middle T */}
            <div className="relative inline-flex items-end justify-center gap-4">
              {/* Left T */}
              <div className="relative">
                <div 
                  className="absolute inset-0 transition-all duration-1000"
                  style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 300\'%3E%3Ctext x=\'50%25\' y=\'80%25\' font-family=\'Arial Black, sans-serif\' font-size=\'280\' font-weight=\'900\' text-anchor=\'middle\' fill=\'white\'%3ET%3C/text%3E%3C/svg%3E")',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 300\'%3E%3Ctext x=\'50%25\' y=\'80%25\' font-family=\'Arial Black, sans-serif\' font-size=\'280\' font-weight=\'900\' text-anchor=\'middle\' fill=\'white\'%3ET%3C/text%3E%3C/svg%3E")',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center'
                  }}
                />
                
                <div className="absolute inset-0 animate-pulse" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent)',
                  WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 300\'%3E%3Ctext x=\'50%25\' y=\'80%25\' font-family=\'Arial Black, sans-serif\' font-size=\'280\' font-weight=\'900\' text-anchor=\'middle\' stroke=\'white\' stroke-width=\'8\' fill=\'none\'%3ET%3C/text%3E%3C/svg%3E")',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 300\'%3E%3Ctext x=\'50%25\' y=\'80%25\' font-family=\'Arial Black, sans-serif\' font-size=\'280\' font-weight=\'900\' text-anchor=\'middle\' stroke=\'white\' stroke-width=\'8\' fill=\'none\'%3ET%3C/text%3E%3C/svg%3E")',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center'
                }} />

                <h1 className="text-[140px] md:text-[180px] font-black tracking-tighter leading-none text-transparent select-none">
                  T
                </h1>
              </div>

              {/* Middle T - TALLER */}
              <div className="relative">
                <div 
                  className="absolute inset-0 transition-all duration-1000"
                  style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 400\'%3E%3Ctext x=\'50%25\' y=\'75%25\' font-family=\'Arial Black, sans-serif\' font-size=\'380\' font-weight=\'900\' text-anchor=\'middle\' fill=\'white\'%3ET%3C/text%3E%3C/svg%3E")',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 400\'%3E%3Ctext x=\'50%25\' y=\'75%25\' font-family=\'Arial Black, sans-serif\' font-size=\'380\' font-weight=\'900\' text-anchor=\'middle\' fill=\'white\'%3ET%3C/text%3E%3C/svg%3E")',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center'
                  }}
                />
                
                <div className="absolute inset-0 animate-pulse" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)',
                  WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 400\'%3E%3Ctext x=\'50%25\' y=\'75%25\' font-family=\'Arial Black, sans-serif\' font-size=\'380\' font-weight=\'900\' text-anchor=\'middle\' stroke=\'white\' stroke-width=\'10\' fill=\'none\'%3ET%3C/text%3E%3C/svg%3E")',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 400\'%3E%3Ctext x=\'50%25\' y=\'75%25\' font-family=\'Arial Black, sans-serif\' font-size=\'380\' font-weight=\'900\' text-anchor=\'middle\' stroke=\'white\' stroke-width=\'10\' fill=\'none\'%3ET%3C/text%3E%3C/svg%3E")',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center'
                }} />

                <h1 className="text-[220px] md:text-[320px] font-black tracking-tighter leading-none text-transparent select-none">
                  T
                </h1>
              </div>

              {/* Right T */}
              <div className="relative">
                <div 
                  className="absolute inset-0 transition-all duration-1000"
                  style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 300\'%3E%3Ctext x=\'50%25\' y=\'80%25\' font-family=\'Arial Black, sans-serif\' font-size=\'280\' font-weight=\'900\' text-anchor=\'middle\' fill=\'white\'%3ET%3C/text%3E%3C/svg%3E")',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 300\'%3E%3Ctext x=\'50%25\' y=\'80%25\' font-family=\'Arial Black, sans-serif\' font-size=\'280\' font-weight=\'900\' text-anchor=\'middle\' fill=\'white\'%3ET%3C/text%3E%3C/svg%3E")',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center'
                  }}
                />
                
                <div className="absolute inset-0 animate-pulse" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), transparent)',
                  WebkitMaskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 300\'%3E%3Ctext x=\'50%25\' y=\'80%25\' font-family=\'Arial Black, sans-serif\' font-size=\'280\' font-weight=\'900\' text-anchor=\'middle\' stroke=\'white\' stroke-width=\'8\' fill=\'none\'%3ET%3C/text%3E%3C/svg%3E")',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 300\'%3E%3Ctext x=\'50%25\' y=\'80%25\' font-family=\'Arial Black, sans-serif\' font-size=\'280\' font-weight=\'900\' text-anchor=\'middle\' stroke=\'white\' stroke-width=\'8\' fill=\'none\'%3ET%3C/text%3E%3C/svg%3E")',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center'
                }} />

                <h1 className="text-[140px] md:text-[180px] font-black tracking-tighter leading-none text-transparent select-none">
                  T
                </h1>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="space-y-6 mt-8"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-wide">
                UNCHAIN REALITY
              </h2>
              <p className="text-gray-600 text-sm md:text-base uppercase tracking-[0.3em]">
                Kaspa L1 ←→ Kasplex L2
              </p>

              {/* Small AI Generator Icon */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowGenerator(!showGenerator)}
                  className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30 flex items-center justify-center transition-all hover:scale-110"
                  title="Transform background with AI"
                >
                  <Wand2 className="w-5 h-5 text-cyan-400" />
                </button>
              </div>

              {/* Expandable AI Generator */}
              <AnimatePresence>
                {showGenerator && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="max-w-2xl mx-auto overflow-hidden"
                  >
                    <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 mt-4">
                      <Wand2 className="w-5 h-5 text-cyan-400 ml-4" />
                      <Input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="cosmic nebula, cyberpunk city, digital matrix..."
                        className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-700 focus-visible:ring-0 focus-visible:ring-offset-0"
                        disabled={isGenerating}
                        autoFocus
                      />
                      <Button
                        onClick={handleGenerateBackground}
                        disabled={isGenerating || !prompt.trim()}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl px-6"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-2xl mt-12"
        >
          {/* REDESIGNED: Premium Glass-morphism Button */}
          {/* FIXED: Use Link instead of <a> to prevent reload */}
          <Link to={createPageUrl("Waitlist")} className="w-full sm:flex-1 group">
            <div className="relative">
              {/* Animated glow effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" />
              
              {/* Main button */}
              <button className="relative w-full h-16 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-2xl overflow-hidden group-hover:border-cyan-400/50 transition-all duration-300">
                {/* Shimmer effect overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent shimmer-animation" />
                </div>
                
                {/* Button content */}
                <div className="relative flex items-center justify-center gap-3 h-full px-6">
                  {/* Animated icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-400 blur-lg opacity-50 group-hover:opacity-100 transition-opacity" />
                    <Shield className="relative w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                  </div>
                  
                  {/* Text */}
                  <span className="relative text-lg font-bold bg-gradient-to-r from-cyan-200 via-cyan-100 to-blue-200 bg-clip-text text-transparent group-hover:from-cyan-100 group-hover:to-white transition-all">
                    Claim Agent ZK Identity
                  </span>
                  
                  {/* Animated chevron */}
                  <Zap className="w-5 h-5 text-cyan-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Bottom glow line */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
              </button>
            </div>
          </Link>

          <Link to={createPageUrl("Browser")} className="w-full sm:flex-1">
            <Button className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 h-16 text-lg font-semibold rounded-2xl backdrop-blur-sm">
              <ArrowRight className="w-5 h-5 mr-2" />
              Enter TTT
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l border-t border-zinc-900 opacity-50" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-zinc-900 opacity-50" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-zinc-900 opacity-50" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r border-b border-zinc-900 opacity-50" />
      
      {/* Enhanced keyframes */}
      <style jsx>{`
        @keyframes shimmer-animation {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .shimmer-animation {
          animation: shimmer-animation 2s infinite;
        }
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}