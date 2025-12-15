import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, Lock, Play, ArrowLeft, ShieldCheck } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function EnochPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [kaswareConnected, setKaswareConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    checkKasware();
  }, []);

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
      // Send 0.00000001 KAS to self (dust amount for proof)
      const amount = 0.00000001;
      const amountInSompi = Math.floor(amount * 100000000); // 1 KAS = 100,000,000 sompi
      
      const txid = await window.kasware.sendKaspa(walletAddress, amountInSompi);
      
      console.log('Proof sent:', txid);
      
      // Optional: Track in backend if needed, but user just said "use zk button" flow
      // We'll trust the txid generation for this frontend gate
      
      setIsVerified(true);
    } catch (error) {
      console.error('Proof failed:', error);
      alert('Verification failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none" />
      
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
                    <img src="https://kasware.xyz/logo.svg" className="w-6 h-6 mr-3" alt="Kasware" />
                    Connect Kasware
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
                        Verifying Proof...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-6 h-6 mr-3" />
                        Verify & Watch
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}