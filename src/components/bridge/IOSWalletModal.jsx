import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Loader2, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// MetaMask logo
const MetaMaskLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#F6851B"/>
    <path d="M32.5 7.5L21.5 15.5L23.5 11L32.5 7.5Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25"/>
    <path d="M7.5 7.5L18.3 15.6L16.5 11L7.5 7.5Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
    <path d="M28 26.5L25 31L31.5 32.5L33 26.5H28Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
    <path d="M7 26.5L8.5 32.5L15 31L12 26.5H7Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
    <path d="M14.5 18.5L13 21L19.5 21.25L19.25 14L14.5 18.5Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
    <path d="M25.5 18.5L20.75 13.75L20.5 21.25L27 21L25.5 18.5Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
    <path d="M15 31L18.5 29.25L15.5 26.5L15 31Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
    <path d="M21.5 29.25L25 31L24.5 26.5L21.5 29.25Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25"/>
  </svg>
);

// Kastle logo
const KastleLogo = () => (
  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
    <span className="text-white font-bold text-lg">K</span>
  </div>
);

export default function IOSWalletModal({ isOpen, onClose, onConnect }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(null);
  const [error, setError] = useState(null);
  const [wcUri, setWcUri] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if ethereum is injected (MetaMask browser)
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
      console.log('✅ MetaMask detected - can connect directly');
    }
  }, []);

  const handleConnect = async (walletType) => {
    setIsConnecting(true);
    setConnectingWallet(walletType);
    setError(null);
    setShowInstructions(false);

    try {
      if (walletType === 'metamask') {
        await connectMetaMaskMobile();
      } else if (walletType === 'kastle') {
        await connectKastle();
      }
    } catch (err) {
      console.error(`Failed to connect ${walletType}:`, err);
      setError(err.message || `Failed to connect to ${walletType}`);
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  };

  const connectMetaMaskMobile = async () => {
    console.log('🦊 Connecting to MetaMask Mobile...');

    // METHOD 1: Check if MetaMask is already injected (user opened in MetaMask browser)
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
      console.log('✅ MetaMask detected in-app browser - connecting directly');
      
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts.length > 0) {
          console.log('✅ Connected to MetaMask:', accounts[0]);
          
          localStorage.setItem('ios_metamask_connected', 'true');
          localStorage.setItem('ios_metamask_address', accounts[0]);
          
          setIsConnecting(false);
          
          if (onConnect) {
            onConnect('metamask');
          }
          
          setTimeout(() => {
            window.location.reload();
          }, 500);
          
          return;
        }
      } catch (err) {
        console.error('Failed to connect via injected provider:', err);
        throw new Error('User rejected connection');
      }
    }

    // METHOD 2: Use universal link (works from any iOS browser)
    console.log('📱 Opening MetaMask Mobile via universal link...');
    
    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    
    // MetaMask Universal Link format for iOS
    const metamaskUniversalLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}${window.location.search}`;
    
    console.log('🔗 MetaMask Link:', metamaskUniversalLink);
    
    // Show instructions for user
    setShowInstructions(true);
    
    // Try to open MetaMask
    setTimeout(() => {
      window.location.href = metamaskUniversalLink;
    }, 100);
    
    // Give user time to complete connection in MetaMask app
    setTimeout(() => {
      // Check if connection was established
      const connected = localStorage.getItem('ios_metamask_connected');
      if (connected !== 'true') {
        setError('Please complete the connection in MetaMask app, then return here.');
      }
      setIsConnecting(false);
    }, 5000);
  };

  const connectKastle = async () => {
    console.log('🏰 Connecting to Kastle Wallet...');
    
    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    
    // Kastle deep link
    const kastleLink = `kastle://connect?url=${encodedUrl}`;
    
    console.log('🔗 Kastle Link:', kastleLink);
    
    // Show instructions
    setShowInstructions(true);
    
    // Try to open Kastle
    setTimeout(() => {
      window.location.href = kastleLink;
    }, 100);
    
    // Set timeout to check connection
    setTimeout(() => {
      const connected = localStorage.getItem('ios_kastle_connected');
      if (connected !== 'true') {
        setError('Kastle app not found. Please install Kastle from the App Store.');
      }
      setIsConnecting(false);
    }, 3000);
  };

  const handleManualRefresh = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 max-h-[90vh] overflow-y-auto">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
                    <p className="text-sm text-gray-400 mt-1">Choose your wallet to connect</p>
                  </div>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-300">{error}</p>
                      <Button
                        onClick={handleManualRefresh}
                        size="sm"
                        className="mt-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 h-8"
                      >
                        Refresh Page
                      </Button>
                    </div>
                  </div>
                )}

                {showInstructions && (
                  <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-200 mb-2">📱 Opening {connectingWallet === 'metamask' ? 'MetaMask' : 'Kastle'}...</p>
                        <ol className="text-xs text-blue-300 space-y-1 list-decimal list-inside">
                          <li>Your wallet app should open automatically</li>
                          <li>Approve the connection in the wallet</li>
                          <li>Return to this page and tap "Refresh Page"</li>
                        </ol>
                      </div>
                    </div>
                    <Button
                      onClick={handleManualRefresh}
                      size="sm"
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Refresh Page After Connecting
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => handleConnect('metamask')}
                    disabled={isConnecting}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 rounded-xl p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center gap-4">
                      <MetaMaskLogo />
                      <div className="flex-1 text-left">
                        <div className="text-white font-semibold text-lg">MetaMask</div>
                        <div className="text-gray-400 text-sm">Connect to MetaMask Mobile</div>
                      </div>
                      {isConnecting && connectingWallet === 'metamask' ? (
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                          <span className="text-cyan-400 text-xl">→</span>
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => handleConnect('kastle')}
                    disabled={isConnecting}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 rounded-xl p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center gap-4">
                      <KastleLogo />
                      <div className="flex-1 text-left">
                        <div className="text-white font-semibold text-lg">Kastle</div>
                        <div className="text-gray-400 text-sm">Connect to Kastle Wallet</div>
                      </div>
                      {isConnecting && connectingWallet === 'kastle' ? (
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                          <span className="text-cyan-400 text-xl">→</span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-xs text-purple-300 mb-3">
                    <span className="font-semibold">💡 How to connect:</span>
                  </p>
                  <ol className="text-xs text-purple-300 space-y-2 list-decimal list-inside">
                    <li>Tap the wallet you want to connect</li>
                    <li>Your wallet app will open</li>
                    <li>Approve the connection in your wallet</li>
                    <li>Return here and refresh the page</li>
                  </ol>
                </div>

                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-xs text-yellow-300">
                    <span className="font-semibold">⚠️ Alternative:</span> Open this website directly in your MetaMask Mobile browser for instant connection!
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}