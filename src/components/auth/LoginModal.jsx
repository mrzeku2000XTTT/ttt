import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LoginModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load KasperoPay script
      const script = document.createElement('script');
      script.src = 'https://kaspa-store.com/pay/widget.js';
      script.async = true;
      script.onload = () => {
        // Script loaded successfully
      };
      document.body.appendChild(script);

      // Handle Keystone OAuth callback
      const params = new URLSearchParams(window.location.search);
      const keystoneConnected = params.get('keystone_connected');
      const token = params.get('token');

      if (keystoneConnected === 'true' && token) {
        localStorage.setItem('keystone_auth_token', token);
        localStorage.setItem('keystone_connected', 'true');
        window.history.replaceState({}, '', window.location.pathname);
        
        // Authenticate with Base44 using the token
        authenticateWithKeystone(token);
      }

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isOpen]);

  const authenticateWithKeystone = async (token) => {
    try {
      setLoading(true);
      // Store the token and mark user as Keystone authenticated
      localStorage.setItem('keystone_auth_token', token);
      localStorage.setItem('auth_method', 'keystone');
      
      // Close modal and refresh
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Keystone auth error:', error);
      setLoading(false);
    }
  };

  const handleBase44Login = () => {
    base44.auth.redirectToLogin();
  };

  const handleKasperoPay = () => {
    if (typeof window !== 'undefined' && window.KasperoPay) {
      setLoading(true);
      window.KasperoPay.connect({
        merchant: 'kpm_vx7c48go',
        onConnect: async (user) => {
          try {
            // Store wallet connection info
            localStorage.setItem('wallet_address', user.address);
            localStorage.setItem('wallet_type', user.walletType);
            localStorage.setItem('auth_method', 'wallet');
            if (user.publicKey) {
              localStorage.setItem('wallet_public_key', user.publicKey);
            }
            
            // Close modal and refresh
            setTimeout(() => {
              onClose();
              window.location.reload();
            }, 500);
          } catch (error) {
            console.error('Connection error:', error);
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
        }
      });
    } else {
      console.error('KasperoPay not loaded');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Welcome to TTT</h2>
                <p className="text-sm text-gray-400 mt-1">Choose your login method</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Base44 Login */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBase44Login}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    Base44 Login
                  </div>
                  <div className="text-xs text-gray-400">Email & Password</div>
                </div>
                <LogIn className="w-5 h-5 text-cyan-400" />
              </motion.button>

              {/* KasperoPay Wallet Connection */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleKasperoPay}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/40 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white group-hover:text-orange-300 transition-colors">
                    {loading ? 'Connecting...' : 'Connect Wallet'}
                  </div>
                  <div className="text-xs text-gray-400">Kasware, Kastle, Keystone</div>
                </div>
                <Wallet className="w-5 h-5 text-orange-400" />
              </motion.button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-gray-500 text-center">
                By logging in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-4 py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg font-medium transition-colors text-sm"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}