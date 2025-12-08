import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Wallet, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const KASIA_WALLET_URL = 'https://kasia.fyi/wallet/create';

const Toast = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-black/95' : 'bg-black/95';
  const borderColor = type === 'success' ? 'border-green-500/30' : 'border-red-500/30';
  const icon = type === 'success' ? '✅' : '❌';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className="fixed bottom-6 right-6 z-[9999] max-w-xs"
    >
      <div className={`${bgColor} backdrop-blur-xl border ${borderColor} rounded-lg p-3 shadow-2xl`}>
        <div className="flex items-start gap-2">
          <span className="text-lg flex-shrink-0">{icon}</span>
          <p className="text-white text-xs leading-relaxed">{message}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default function KWPage() {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [toast, setToast] = useState(null);
  const [walletCreated, setWalletCreated] = useState(false);

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type });
    if (duration > 0) {
      setTimeout(() => setToast(null), duration);
    }
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      if (!currentUser || currentUser.role !== 'admin') {
        setIsLoading(false);
        return;
      }
      
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);



  useEffect(() => {
    // Listen for wallet unlock from KASIA
    const handleMessage = (event) => {
      if (event.origin !== 'https://kasia.fyi') return;
      
      console.log('📨 Message from KASIA:', event.data);
      
      if (event.data?.type === 'walletUnlocked' || event.data?.type === 'walletSelected') {
        console.log('✅ Wallet unlocked, redirecting to TTT');
        setIsCreating(false);
        
        // Save wallet info
        if (event.data.walletName) {
          localStorage.setItem('ttt_wallet_name', event.data.walletName);
        }
        
        // Redirect to XYZ wallet page
        navigate(createPageUrl('XYZ'));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const handleCreateWallet = () => {
    setIsCreating(true);
    showToast('Opening Kasia wallet creator...', 'success');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Admin-only access
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-white/5 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Only</h2>
          <p className="text-gray-400 text-sm">
            KASIA WALLET is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Hidden iframe for Kasia wallet - cropped to hide branding */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden">
          <div className="absolute top-4 right-4 z-[60] flex gap-2">
            <Button
              onClick={() => setIsCreating(false)}
              variant="outline"
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            >
              Cancel
            </Button>
          </div>
          <iframe 
            ref={iframeRef} 
            src={KASIA_WALLET_URL} 
            className="w-full h-full border-0"
            style={{ 
              marginTop: '-60px',
              height: 'calc(100% + 60px)'
            }}
            title="Kasia Wallet"
            allow="clipboard-write"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">KASIA WALLET</h1>
            <p className="text-gray-400 text-sm">{user?.username || user?.email}</p>
          </div>
          <Button 
            onClick={() => navigate(createPageUrl("Gate"))} 
            variant="outline" 
            className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gate
          </Button>
        </div>

        <div className="space-y-6">
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-2xl p-8 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <Wallet className="w-10 h-10 text-cyan-400" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Create KASIA Wallet</h2>
                <p className="text-gray-400 text-sm max-w-md">
                  Click below to create a new wallet using KASIA's secure wallet creation system.
                </p>
              </div>

              <Button 
                onClick={handleCreateWallet}
                disabled={isCreating}
                className="w-full max-w-sm h-14 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Opening KASIA...
                  </>
                ) : (
                  <>
                    <Wallet className="w-6 h-6 mr-2" />
                    Create Wallet
                  </>
                )}
              </Button>

              {walletCreated && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 w-full max-w-sm"
                >
                  <p className="text-green-400 text-sm">
                    ✅ Wallet created successfully!
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">🔒 Secure</h3>
              <p className="text-gray-400 text-sm">
                KASIA uses advanced cryptography to secure your wallet
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">⚡ Fast</h3>
              <p className="text-gray-400 text-sm">
                Create your wallet in seconds with KASIA's streamlined process
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}