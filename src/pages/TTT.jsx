import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Wallet, ArrowLeft, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const KASIA_WALLET_URL = 'https://kasia.fyi';

export default function TTTPage() {
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [walletName, setWalletName] = useState('');
  const [showModal, setShowModal] = useState(false);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      if (!currentUser || currentUser.role !== 'admin') {
        setIsLoading(false);
        return;
      }
      
      setUser(currentUser);
      
      // Get wallet name from localStorage if available
      const savedWallet = localStorage.getItem('ttt_wallet_name');
      if (savedWallet) {
        setWalletName(savedWallet);
      }
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
    // Listen for messages from KASIA iframe
    const handleMessage = (event) => {
      if (event.origin !== 'https://kasia.fyi') return;
      
      console.log('📨 Message from KASIA:', event.data);
      
      if (event.data?.type === 'balanceUpdate') {
        setBalance(event.data.balance);
      } else if (event.data?.type === 'walletInfo') {
        setWalletName(event.data.name);
        localStorage.setItem('ttt_wallet_name', event.data.name);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleOpenWallet = () => {
    setShowModal(true);
    
    // Send message to iframe to open wallet
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'openWallet'
        }, 'https://kasia.fyi');
      }
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-white/5 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Only</h2>
          <p className="text-gray-400 text-sm">
            TTT WALLET is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hidden iframe for balance fetching - no modal visible */}
      <iframe 
        ref={iframeRef} 
        src={KASIA_WALLET_URL}
        style={{ display: 'none' }}
        title="KASIA Wallet Data"
        allow="clipboard-write"
      />

      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">TTT WALLET</h1>
            <p className="text-gray-400 text-sm">{walletName || 'No wallet selected'}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh}
              variant="outline" 
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => navigate(createPageUrl("KW"))} 
              variant="outline" 
              className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Balance Card */}
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
                <h2 className="text-sm text-gray-400 mb-2">BALANCE</h2>
                <p className="text-5xl font-bold text-white">
                  {balance !== null ? `${balance} KAS` : '-- KAS'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">PENDING</p>
                  <p className="text-xl font-bold text-white">0 KAS</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">OUTGOING</p>
                  <p className="text-xl font-bold text-white">0 KAS</p>
                </div>
              </div>

              <Button 
                onClick={handleOpenWallet}
                className="w-full max-w-sm h-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Open Wallet
              </Button>
            </div>
          </motion.div>

          {/* Wallet Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">🔒 Encrypted</h3>
              <p className="text-gray-400 text-sm">
                Your wallet is secured with your password
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-bold mb-2">⚡ Real-time</h3>
              <p className="text-gray-400 text-sm">
                Balance updates automatically
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full screen wallet modal when opened */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black"
        >
          <Button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 z-[60] bg-red-500 hover:bg-red-600 text-white"
          >
            Close
          </Button>
          <iframe 
            src={KASIA_WALLET_URL}
            className="w-full h-full border-0"
            style={{ 
              marginTop: '-60px',
              height: 'calc(100% + 60px)'
            }}
            title="KASIA Wallet"
            allow="clipboard-write"
          />
        </motion.div>
      )}
    </div>
  );
}