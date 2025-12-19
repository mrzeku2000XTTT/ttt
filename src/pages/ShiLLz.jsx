import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
// import BlockWorld from '@/components/shillz/BlockWorld';

export default function ShiLLzPage() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Try to detect existing connection
    const checkConnection = async () => {
      if (window.kasware) {
        try {
          const accounts = await window.kasware.getAccounts();
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (e) {
          console.error("Silent connect failed", e);
        }
      }
    };

    // Check immediately and after a short delay for injection
    checkConnection();
    const timer = setTimeout(checkConnection, 1000);
    return () => clearTimeout(timer);
  }, []);

  const connectWallet = async () => {
    if (!window.kasware) {
      window.open('https://www.kasware.xyz/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.kasware.requestAccounts();
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch (e) {
      console.error("Connection failed", e);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="absolute top-4 left-4 z-[200] flex gap-2">
        <Link 
          to={createPageUrl("AppStore")} 
          className="opacity-50 hover:opacity-100 transition-opacity duration-300"
        >
          <Button variant="ghost" size="icon" className="text-white bg-black/50 hover:bg-black/80 rounded-full border border-white/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>

        {!walletAddress && (
          <Button 
            onClick={connectWallet}
            disabled={isConnecting}
            className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/50 backdrop-blur-sm"
          >
            <Wallet className="w-4 h-4 mr-2" />
            {isConnecting ? "Connecting..." : "Connect Kasware"}
          </Button>
        )}
        
        {walletAddress && (
          <div className="bg-green-500/20 text-green-400 border border-green-500/50 px-3 py-2 rounded-md backdrop-blur-sm font-mono text-xs flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
          </div>
        )}
      </div>
      
      <div className="flex-1 w-full h-full">
        <iframe 
          src={`https://shillzzz.base44.app${walletAddress ? `?wallet=${walletAddress}` : ''}`} 
          className="w-full h-full border-0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}