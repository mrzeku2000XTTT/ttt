import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Copy, CheckCircle2, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

export default function ReceivePage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWalletAddress();
  }, []);

  const loadWalletAddress = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await base44.auth.me();
      
      if (!user) {
        throw new Error('Please login first');
      }

      if (user.created_wallet_address) {
        setAddress(user.created_wallet_address);
      } else {
        setError('No wallet found. Please create a wallet first.');
      }
      
    } catch (err) {
      console.error('Failed to load wallet address:', err);
      setError(err.message || 'Failed to load wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!address) return;
    
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !address) {
    return (
      <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => navigate(createPageUrl("Wallet"))}
            variant="outline"
            className="mb-6 bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wallet
          </Button>

          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No Wallet Found</h2>
              <p className="text-red-300 mb-6">
                {error || 'Please create or import a wallet first.'}
              </p>
              <Button
                onClick={() => navigate(createPageUrl("Wallet"))}
                className="bg-white text-black hover:bg-gray-200"
              >
                Go to Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(address)}`;

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          onClick={() => navigate(createPageUrl("Wallet"))}
          variant="outline"
          className="mb-6 bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Wallet
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader className="border-b border-zinc-800">
              <h2 className="text-2xl font-bold text-white">Receive KAS</h2>
              <p className="text-sm text-gray-400">Share this address or QR code to receive Kaspa</p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl">
                  <img 
                    src={qrCodeUrl} 
                    alt="Wallet QR Code" 
                    className="w-64 h-64"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      console.error('Failed to load QR code');
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Your Kaspa Address</label>
                <div className="bg-black border border-zinc-800 rounded-lg p-4">
                  <code className="text-cyan-400 text-sm break-all font-mono block mb-3">
                    {address}
                  </code>
                  <Button
                    onClick={handleCopy}
                    className="w-full bg-white text-black hover:bg-gray-200"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Address
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Card className="bg-blue-500/10 border-blue-500/30">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-blue-300 mb-2">How to Receive KAS</h3>
                  <ol className="text-xs text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Share this address with the sender</li>
                    <li>Or let them scan the QR code above</li>
                    <li>Wait for the transaction to be confirmed (~1 minute)</li>
                    <li>Your balance will update automatically</li>
                  </ol>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate(createPageUrl("Wallet"))}
                  variant="outline"
                  className="bg-zinc-950 border-zinc-800 text-white hover:bg-zinc-900"
                >
                  View Wallet
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl("Bridge"))}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  Send KAS
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}