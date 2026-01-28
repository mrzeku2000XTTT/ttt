import React, { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

export default function KasperPayConnectButton({ onConnect, isConnecting, disabled }) {
  const handleConnect = async () => {
    if (typeof window.KasperoPay === 'undefined') {
      alert('KasperoPay widget not loaded. Please refresh the page.');
      return;
    }

    try {
      window.KasperoPay.connect({
        merchant: 'kpm_hocgtdnj',
        onConnect: async (user) => {
          if (user && user.address) {
            // Pass to parent component
            onConnect(user.address);
          }
        },
        onCancel: () => {
          console.log('KasperoPay connect cancelled');
        }
      });
    } catch (err) {
      console.error('KasperoPay error:', err);
      alert('Failed to connect KasperoPay');
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting || disabled}
      className="w-full p-4 bg-gradient-to-r from-teal-500/20 to-green-500/20 border border-teal-500/40 rounded-xl hover:from-teal-500/30 hover:to-green-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center">
          {isConnecting ? (
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
          ) : (
            <CreditCard className="w-6 h-6 text-teal-400" />
          )}
        </div>
        <div>
          <p className="text-white font-semibold">KasperoPay</p>
          <p className="text-xs text-gray-400">Connect from any wallet</p>
        </div>
      </div>
    </button>
  );
}