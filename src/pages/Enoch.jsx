import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Lock, Play, ArrowLeft, ShieldCheck, Bot, Clock, Smartphone, CheckCircle, PenTool, Flame, Droplets, Mountain, Hand } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import ZKMobileModal from "@/components/truth/ZKMobileModal";
import ElementalVisualizer from "@/components/truth/ElementalVisualizer";

export default function EnochPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [kaswareConnected, setKaswareConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [entryTime, setEntryTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showZKModal, setShowZKModal] = useState(false);
  
  // Visualizer State
  const [activeElement, setActiveElement] = useState(null);
  const [powerHandEnabled, setPowerHandEnabled] = useState(false);

  useEffect(() => {
    checkKasware();
  }, []);

  useEffect(() => {
    let interval;
    if (entryTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date() - entryTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [entryTime]);

  const checkKasware = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          setKaswareConnected(true);
          setWalletAddress(accounts[0]);
        }
      } catch (e) {
        console.error("Kasware check error", e);
      }
    }
  };

  const connectKasware = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.requestAccounts();
        if (accounts.length > 0) {
          setKaswareConnected(true);
          setWalletAddress(accounts[0]);
        }
      } catch (e) {
        console.error("Connection failed", e);
      }
    } else {
      window.open('https://kasware.xyz/', '_blank');
    }
  };

  const handleProof = async () => {
    if (!walletAddress) {
      await connectKasware();
      return;
    }

    setIsProcessing(true);
    try {
      // Send 1 KAS to self
      const amount = 1;
      const amountInSompi = Math.floor(amount * 100000000); // 1 KAS = 100,000,000 sompi
      
      const txid = await window.kasware.sendKaspa(walletAddress, amountInSompi);
      
      console.log('Proof sent:', txid);
      
      const now = new Date();
      setEntryTime(now);
      
      try {
        const user = await base44.auth.me();
        await base44.entities.TruthEntry.create({
          user_email: user?.email || 'anonymous',
          entry_time: now.toISOString(),
          tx_hash: txid
        });
      } catch (e) {
        console.error("Failed to log entry", e);
      }
      
      setIsVerified(true);
    } catch (error) {
      console.error('Proof failed:', error);
      alert('Verification failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMobileProof = () => {
    setShowZKModal(true);
  };

  const handleZKVerify = async (txHash, address) => {
    setIsProcessing(true);
    try {
      const now = new Date();
      setEntryTime(now);
      
      try {
        const user = await base44.auth.me();
        await base44.entities.TruthEntry.create({
          user_email: user?.email || 'anonymous',
          entry_time: now.toISOString(),
          tx_hash: txHash
        });
      } catch (e) {
        console.error("Failed to log entry", e);
      }
      
      setIsVerified(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishMovie = () => {
    // 1:21:48 = 1 hour, 21 minutes, 48 seconds
    // 1*3600 + 21*60 + 48 = 3600 + 1260 + 48 = 4908 seconds
    const MIN_WATCH_TIME = 4908;
    
    if (elapsedTime >= MIN_WATCH_TIME) {
      setShowStoryModal(true);
    } else {
      const remaining = MIN_WATCH_TIME - elapsedTime;
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      alert(`You haven't watched the full movie yet. Please finish watching. (${hours}h ${minutes}m ${seconds}s remaining)`);
    }
  };

  const formatElapsedTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Elemental Visualizer Background */}
      <ElementalVisualizer activeElement={activeElement} powerHandEnabled={powerHandEnabled} />
      
      {/* Visualizer Controls */}
      {isVerified && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveElement(activeElement === 'fire' ? null : 'fire')}
            className={`rounded-full transition-all ${activeElement === 'fire' ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-white/40 hover:text-red-400'}`}
            title="Fire Element"
          >
            <Flame className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveElement(activeElement === 'water' ? null : 'water')}
            className={`rounded-full transition-all ${activeElement === 'water' ? 'bg-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-white/40 hover:text-blue-400'}`}
            title="Water Element"
          >
            <Droplets className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveElement(activeElement === 'earth' ? null : 'earth')}
            className={`rounded-full transition-all ${activeElement === 'earth' ? 'bg-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'text-white/40 hover:text-green-400'}`}
            title="Earth Element"
          >
            <Mountain className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveElement(activeElement === 'lightning' ? null : 'lightning')}
            className={`rounded-full transition-all ${activeElement === 'lightning' ? 'bg-yellow-500/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'text-white/40 hover:text-yellow-400'}`}
            title="Lightning Element"
          >
            <Zap className="w-5 h-5" />
          </Button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPowerHandEnabled(!powerHandEnabled)}
            className={`rounded-full transition-all ${powerHandEnabled ? 'bg-purple-500/20 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-white/40 hover:text-purple-400'}`}
            title="Power Hand"
          >
            <Hand className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
      
      <ZKMobileModal 
        isOpen={showZKModal} 
        onClose={() => setShowZKModal(false)} 
        onVerify={handleZKVerify} 
      />

      <div className="absolute top-6 left-6 z-50">
        <Link to={createPageUrl("TruthLanding")}>
          <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Return
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl w-full z-10">
        <AnimatePresence mode="wait">
          {!isVerified ? (
            <motion.div
              key="gate"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              className="text-center space-y-8"
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Lock className="w-16 h-16 text-cyan-500 mx-auto mb-6" />
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                  The Book of Enoch
                </h1>
                <p className="text-xl text-cyan-400 font-medium">
                  You are about to watch Book of Enoch the movie!
                </p>
                <p className="text-white/40 mt-2 max-w-md mx-auto">
                  Verify your humanity to proceed. Perform a self-transaction proof using your Kasware wallet.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center"
              >
                {!kaswareConnected ? (
                  <Button 
                    onClick={connectKasware}
                    size="lg"
                    className="bg-white text-black hover:bg-gray-200 font-bold px-8 py-6 rounded-2xl text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
                  >
                    <Zap className="w-6 h-6 mr-3 text-yellow-500" />
                    Connect Wallet
                  </Button>
                ) : (
                  <Button 
                    onClick={handleProof}
                    disabled={isProcessing}
                    size="lg"
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-8 py-6 rounded-2xl text-lg shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Bot className="w-6 h-6 mr-3" />
                        ZK Verify Access
                      </>
                    )}
                  </Button>
                )}
              </motion.div>

              {/* Mobile/iOS Fallback Button */}
              {!isVerified && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex justify-center mt-4"
                >
                  <button
                    onClick={handleMobileProof}
                    disabled={isProcessing}
                    className="text-white/30 hover:text-white/80 text-sm flex items-center gap-2 transition-colors px-4 py-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    ZK Mobile Access (iOS)
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black"
            >
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/qpD97dE6T68?autoplay=1" 
                title="Book of Enoch" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                className="w-full h-full"
              ></iframe>
              
              {/* Entry Timestamp & Timer Overlay */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute top-6 right-6 flex flex-col items-end gap-2"
              >
                <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 text-white/60 font-mono text-sm">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>
                    ENTRY: {entryTime?.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 text-white font-mono text-sm">
                  <Play className="w-3 h-3 text-green-400 animate-pulse" />
                  <span>WATCHING: {formatElapsedTime(elapsedTime)}</span>
                </div>

                <Button
                  onClick={handleFinishMovie}
                  size="sm"
                  className="bg-cyan-600/80 hover:bg-cyan-500 text-white border border-cyan-400/30 backdrop-blur-md rounded-full shadow-lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I've finished!
                </Button>
              </motion.div>

              {/* Story Modal */}
              <AnimatePresence>
                {showStoryModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.9, y: 20 }}
                      className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 pointer-events-none" />
                      
                      <PenTool className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
                      
                      <h2 className="text-3xl font-black text-white mb-4">The Truth Is Revealed</h2>
                      <p className="text-gray-400 mb-8 text-lg">
                        You have witnessed the ancient knowledge. Now, are you ready to write your own story?
                      </p>
                      
                      <div className="flex flex-col gap-3">
                        <Link to={createPageUrl("OriginStory")}>
                          <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-6 text-lg rounded-xl">
                            Yes, Write My Story
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowStoryModal(false)}
                          className="text-white/40 hover:text-white"
                        >
                          Not yet, I want to reflect
                        </Button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}