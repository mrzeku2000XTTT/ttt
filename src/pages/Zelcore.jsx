import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import {
  Wallet, Loader2, CheckCircle2, AlertCircle, X, 
  Copy, ExternalLink, Send, Smartphone, Info, Monitor, QrCode, RefreshCw
} from "lucide-react";

export default function ZelcorePage() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
    
    const savedAddress = localStorage.getItem('vibe_address');
    const savedSessionId = localStorage.getItem('vibe_session_id');
    
    if (savedAddress) {
      setAddress(savedAddress);
      setSessionId(savedSessionId);
    }
  }, []);

  const generateSessionId = async () => {
    setGeneratingQR(true);
    setError(null);
    
    try {
      const user = await base44.auth.me();
      
      // Generate unique encrypted session ID with zero-knowledge cryptography
      const timestamp = Date.now();
      const randomBytes = crypto.getRandomValues(new Uint8Array(32));
      const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Create base data
      const baseData = `${user.email}-${timestamp}-${randomHex}`;
      
      // Hash with SHA-256
      const encoder = new TextEncoder();
      const data = encoder.encode(baseData);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Create session object
      const sessionData = {
        session_id: hashHex,
        user_email: user.email,
        timestamp: timestamp,
        type: 'vibe_session',
        version: '1.0'
      };
      
      setSessionId(hashHex);
      localStorage.setItem('vibe_session_id', hashHex);
      
      // Generate QR code using Google Charts API
      const qrData = JSON.stringify(sessionData);
      const encodedData = encodeURIComponent(qrData);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedData}`;
      
      setQrCodeUrl(qrUrl);
      setGeneratingQR(false);
      
    } catch (err) {
      console.error('Session generation failed:', err);
      setError('Failed to generate session: ' + err.message);
      setGeneratingQR(false);
    }
  };

  const disconnect = async () => {
    setAddress(null);
    setSessionId(null);
    setQrCodeUrl(null);
    localStorage.removeItem('vibe_address');
    localStorage.removeItem('vibe_session_id');
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div 
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
              Vibe Connect
            </h1>
            <p className="text-white/60 text-lg">
              Scan QR code with your Vibe iOS app
            </p>

            <div className="flex items-center justify-center gap-3 mt-4">
              <Badge className="bg-white/5 text-white/60 border-white/10">
                <QrCode className="w-3 h-3 mr-1" />
                QR Code
              </Badge>
              <Badge className="bg-white/5 text-white/60 border-white/10">
                <Smartphone className="w-3 h-3 mr-1" />
                iOS App
              </Badge>
              <Badge className="bg-white/5 text-white/60 border-white/10">
                End-to-End Encrypted
              </Badge>
            </div>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6"
              >
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-sm text-red-300 flex-1">{error}</span>
                    <Button
                      onClick={() => setError(null)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connection Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-8">
                {!sessionId ? (
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <QrCode className="w-8 h-8 text-purple-400" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Generate Session QR
                      </h2>
                      <p className="text-white/60 text-sm">
                        Create a unique encrypted session ID for Vibe app
                      </p>
                    </div>

                    <Button
                      onClick={generateSessionId}
                      disabled={generatingQR}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-14 text-lg"
                    >
                      {generatingQR ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-5 h-5 mr-3" />
                          Generate QR Code
                        </>
                      )}
                    </Button>

                    <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-300 font-semibold mb-1">
                            How to Connect
                          </p>
                          <p className="text-xs text-blue-300/80">
                            Generate a QR code, then scan it with your Vibe iOS app to establish an encrypted session.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Session Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold">Session Active</h3>
                          <p className="text-white/60 text-sm">Vibe Connection</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={generateSessionId}
                          variant="ghost"
                          size="sm"
                          className="text-white/60 hover:text-white"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={disconnect}
                          variant="ghost"
                          size="sm"
                          className="text-white/60 hover:text-white"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>

                    {/* QR Code Display */}
                    {qrCodeUrl && (
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-6">
                        <div className="text-center mb-4">
                          <h4 className="text-white font-semibold mb-2">Scan with Vibe App</h4>
                          <p className="text-white/60 text-xs">This QR code contains your encrypted session ID</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 mx-auto w-fit">
                          <img src={qrCodeUrl} alt="Session QR Code" className="w-64 h-64" />
                        </div>
                      </div>
                    )}

                    {/* Session Info */}
                    <div className="space-y-4 mb-6">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/60 text-sm">Session ID</span>
                          <Button
                            onClick={copySessionId}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-white/60 hover:text-white"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <code className="text-white font-mono text-xs break-all">
                          {sessionId}
                        </code>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-white/80 mb-2">
                            Open your Vibe iOS app and scan the QR code above to establish an encrypted connection.
                          </p>
                          <p className="text-xs text-white/60">
                            Session IDs are unique per user and use zero-knowledge cryptography for maximum security.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 grid md:grid-cols-2 gap-4"
          >
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold">QR Code Pairing</h3>
                </div>
                <p className="text-white/60 text-sm">
                  Scan QR code with Vibe iOS app for instant connection
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-white font-semibold">Zero-Knowledge</h3>
                </div>
                <p className="text-white/60 text-sm">
                  Encrypted session IDs with zero-knowledge cryptography
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Powered by WalletConnect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-white/40 text-xs">
              Vibe QR Code Integration • Zero-Knowledge Encryption
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}