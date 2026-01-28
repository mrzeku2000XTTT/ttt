import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LoginModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Handle Keystone OAuth callback on any page load
    const params = new URLSearchParams(window.location.search);
    const keystoneConnected = params.get('keystone_connected');
    const token = params.get('token');

    if (keystoneConnected === 'true' && token) {
      setLoading(true);
      localStorage.setItem('keystone_auth_token', token);
      localStorage.setItem('auth_method', 'keystone');
      window.history.replaceState({}, '', window.location.pathname);
      
      // Small delay to ensure localStorage is set
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !window.KasperoPay) {
      const script = document.createElement('script');
      script.src = 'https://kaspa-store.com/pay/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen]);

  const handleBase44Login = () => {
    base44.auth.redirectToLogin();
  };

  const handleKasperaConnect = () => {
    if (!window.KasperoPay) {
      console.error('KasperoPay not loaded yet');
      return;
    }

    try {
      window.KasperoPay.connect({
        merchant: 'kpm_hocgtdnj',
        onConnect: function(user) {
          if (user && user.address) {
            localStorage.setItem('kaspa_address', user.address);
            localStorage.setItem('kaspa_wallet_type', user.walletType || 'unknown');
            localStorage.setItem('auth_method', 'kaspero');
            onClose();
            setTimeout(() => {
              window.location.reload();
            }, 300);
          }
        },
        onCancel: function() {
          console.log('Connection cancelled');
        }
      });
    } catch (error) {
      console.error('KasperoPay error:', error);
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
          {/* Hidden KasperoPay widget container - MUST be in DOM */}
      <div id="kaspero-pay-button" style={{ display: 'none' }} />

      <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl z-[1001]"
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

              {/* KasperoPay Wallet Connect */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleKasperaConnect}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/40 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white group-hover:text-orange-300 transition-colors">
                    KasperoPay
                  </div>
                  <div className="text-xs text-gray-400">Kasware, Kastle, Keystone</div>
                </div>
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