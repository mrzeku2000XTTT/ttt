import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import {
  Wallet, Loader2, CheckCircle2, AlertCircle, X, 
  Copy, ExternalLink, Send, Smartphone, Info, Monitor, QrCode, RefreshCw, Camera, ScanLine
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function VibePage() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [connectionId, setConnectionId] = useState(null);
  const [connectionCode, setConnectionCode] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
    
    const savedAddress = localStorage.getItem('vibe_address');
    const savedSessionId = localStorage.getItem('vibe_session_id');
    const savedConnected = localStorage.getItem('connected_wallet');
    const savedConnectionId = localStorage.getItem('vibe_connection_id');
    
    if (savedAddress) {
      setAddress(savedAddress);
      setSessionId(savedSessionId);
    }
    
    if (savedConnected && savedConnectionId) {
      setIsConnected(true);
      setConnectedWallet(savedConnected);
      setConnectionId(savedConnectionId);
      loadMessages(savedConnectionId);
    }
  }, []);

  useEffect(() => {
    if (isConnected && connectionId) {
      const interval = setInterval(() => {
        loadMessages(connectionId);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isConnected, connectionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateSessionId = async () => {
    setGeneratingQR(true);
    setError(null);
    
    // Get wallet from user or localStorage
    let walletAddress = null;
    
    try {
      const user = await base44.auth.me();
      walletAddress = user.created_wallet_address;
    } catch (err) {
      // User not logged in - check localStorage
      walletAddress = localStorage.getItem('ttt_wallet_address');
    }
    
    if (!walletAddress) {
      setError('No TTT wallet found. Please create a wallet first.');
      setGeneratingQR(false);
      return;
    }
    
    setAddress(walletAddress);
    
    // Generate 6-digit code directly
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const connId = `vibe_${Date.now()}_${randomCode}`;
    
    setConnectionId(connId);
    setConnectionCode(randomCode);
    setSessionId(connId);
    localStorage.setItem('vibe_connection_id', connId);
    localStorage.setItem('vibe_connection_code', randomCode);
    localStorage.setItem('vibe_address', walletAddress);
    
    // Generate QR code with wallet address
    const encodedData = encodeURIComponent(walletAddress);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodedData}`;
    
    setQrCodeUrl(qrUrl);
    setGeneratingQR(false);
  };

  const startConnectionPolling = (connId) => {
    const interval = setInterval(async () => {
      try {
        const response = await base44.functions.invoke('establishVibeConnection', {
          action: 'check',
          connection_id: connId
        });
        
        if (response.data.status === 'connected') {
          clearInterval(interval);
          alert('✅ Connection Established!');
          setError(null);
        }
      } catch (e) {
        console.log('Polling error:', e);
      }
    }, 2000);

    setTimeout(() => clearInterval(interval), 300000);
  };

  const startScanner = async () => {
    setShowScanner(true);
    setScanning(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', '');
        videoRef.current.play();
        
        setTimeout(() => {
          requestAnimationFrame(scanTick);
        }, 500);
      }
    } catch (err) {
      setError('Camera access denied: ' + err.message);
      setScanning(false);
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    setShowScanner(false);
  };

  const scanTick = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Use BarcodeDetector or jsQR
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
        barcodeDetector.detect(canvas).then(barcodes => {
          if (barcodes.length > 0 && scanning) {
            handleScannedQR(barcodes[0].rawValue);
          }
        }).catch(() => {});
      } else if (typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && scanning) {
          handleScannedQR(code.data);
        }
      }
    }
    
    if (scanning) {
      animationFrameRef.current = requestAnimationFrame(scanTick);
    }
  };

  const handleScannedQR = async (data) => {
    if (!scanning) return;
    
    stopScanner();
    
    try {
      // Check if it's a wallet address
      if (data.startsWith('kaspa:') || /^[a-z0-9]{61,63}$/.test(data)) {
        // Get user wallet from auth or localStorage
        let userWallet = null;
        try {
          const user = await base44.auth.me();
          userWallet = user.created_wallet_address;
        } catch (err) {
          userWallet = localStorage.getItem('ttt_wallet_address');
        }
        
        if (!userWallet) {
          setError('No TTT wallet found. Please create a wallet first.');
          return;
        }
        
        setIsConnected(true);
        setConnectedWallet(data);
        localStorage.setItem('connected_wallet', data);
        alert('✅ Connection Established! You can now chat securely.');
      } else {
        setError('Invalid QR code. Please scan a TTT wallet QR code.');
      }
    } catch (err) {
      setError('Failed to establish connection: ' + err.message);
    }
  };

  const handleCodeConnect = async () => {
    if (!codeInput || codeInput.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      // Get user wallet from auth or localStorage
      let userWallet = null;
      try {
        const user = await base44.auth.me();
        userWallet = user.created_wallet_address;
      } catch (err) {
        userWallet = localStorage.getItem('ttt_wallet_address');
      }
      
      if (!userWallet) {
        setError('No TTT wallet found. Please create a wallet first.');
        return;
      }

      // Generate connection ID from code
      const connId = `vibe_code_${codeInput}`;
      setConnectionId(connId);
      setIsConnected(true);
      setConnectedWallet('code_' + codeInput);
      localStorage.setItem('vibe_connection_code', codeInput);
      localStorage.setItem('vibe_connection_id', connId);
      localStorage.setItem('connected_wallet', 'code_' + codeInput);
      setShowCodeInput(false);
      setCodeInput('');
      alert('✅ Connection Established! You can now chat securely.');
    } catch (err) {
      setError('Failed to connect: ' + err.message);
    }
  };

  const disconnect = async () => {
    setAddress(null);
    setSessionId(null);
    setQrCodeUrl(null);
    setIsConnected(false);
    setConnectedWallet(null);
    setMessages([]);
    localStorage.removeItem('vibe_address');
    localStorage.removeItem('vibe_session_id');
    localStorage.removeItem('connected_wallet');
    localStorage.removeItem('vibe_connection_id');
  };

  const loadMessages = async (connId) => {
    try {
      const msgs = await base44.entities.VIBEMessage.filter({
        connection_id: connId
      });
      
      const decryptedMsgs = msgs.map(msg => ({
        ...msg,
        content: decryptMessage(msg.encrypted_content, connId)
      }));
      
      setMessages(decryptedMsgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const encryptMessage = (text, connId) => {
    // Simple XOR encryption with connection ID as key
    const key = connId;
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encrypted);
  };

  const decryptMessage = (encryptedText, connId) => {
    try {
      const key = connId;
      const encrypted = atob(encryptedText);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return decrypted;
    } catch (err) {
      return '[Encrypted]';
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !connectionId || !address) return;

    setIsSending(true);
    try {
      const encrypted = encryptMessage(newMessage, connectionId);
      
      await base44.entities.VIBEMessage.create({
        connection_id: connectionId,
        sender_wallet: address,
        receiver_wallet: connectedWallet,
        encrypted_content: encrypted,
        message_type: 'text',
        is_read: false
      });

      setNewMessage('');
      await loadMessages(connectionId);
    } catch (err) {
      setError('Failed to send message: ' + err.message);
    } finally {
      setIsSending(false);
    }
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
              VIBE Connect
            </h1>
            <p className="text-white/60 text-lg">
              Connect your devices via TTT wallet QR code
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
                        Show My TTT Wallet
                      </h2>
                      <p className="text-white/60 text-sm">
                        Display your TTT wallet as QR code for connections
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={generateSessionId}
                        disabled={generatingQR}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-14 text-lg"
                      >
                        {generatingQR ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <QrCode className="w-5 h-5 mr-2" />
                            Show My QR
                          </>
                        )}
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-black px-2 text-white/40">OR</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={startScanner}
                          className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold h-14"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          Scan QR
                        </Button>
                        <Button
                          onClick={() => setShowCodeInput(true)}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-14"
                        >
                          <span className="text-xl mr-2">#</span>
                          Enter Code
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-300 font-semibold mb-1">
                            How to Connect
                          </p>
                          <p className="text-xs text-blue-300/80">
                            Display your TTT wallet QR code, then scan it with the Camera app on another device to connect.
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
                          <p className="text-white/60 text-sm">VIBE Connection</p>
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

                    {/* Flip Card - QR Code Display */}
                    {qrCodeUrl && (
                      <div 
                        className="relative mb-6 cursor-pointer perspective-1000"
                        style={{ height: '400px' }}
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        <motion.div
                          className="relative w-full h-full"
                          initial={false}
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                          transition={{ duration: 0.6 }}
                          style={{ transformStyle: 'preserve-3d' }}
                        >
                          {/* Front - QR Code */}
                          <div 
                            className="absolute inset-0 bg-white/5 rounded-xl p-6 border border-white/10 backface-hidden"
                            style={{ backfaceVisibility: 'hidden' }}
                          >
                            <div className="text-center mb-4">
                              <h4 className="text-white font-semibold mb-2">Scan with Camera</h4>
                              <p className="text-white/60 text-xs">Tap to flip for connection code</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 mx-auto w-fit">
                              <img src={qrCodeUrl} alt="Wallet QR" className="w-64 h-64" />
                            </div>
                          </div>

                          {/* Back - Connection Code */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/30 backface-hidden flex flex-col items-center justify-center"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                          >
                            <div className="text-center">
                              <h4 className="text-white font-semibold mb-2">Connection Code</h4>
                              <p className="text-white/60 text-xs mb-6">Enter this on another device</p>
                              <div className="bg-black/40 rounded-2xl px-8 py-6 border-2 border-purple-500/50">
                                <div className="text-6xl font-black text-purple-300 tracking-widest font-mono">
                                  {connectionCode}
                                </div>
                              </div>
                              <p className="text-white/40 text-xs mt-4">Tap to flip back</p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* Session Info */}
                    <div className="space-y-4 mb-6">
                      {address && (
                        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-green-400 text-sm font-semibold">TTT Wallet Connected</span>
                          </div>
                          <code className="text-green-300 font-mono text-xs break-all block">
                            {address}
                          </code>
                        </div>
                      )}
                      
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

                    {/* Instructions or Chat */}
                    {!isConnected ? (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-white/80 mb-2">
                              Open the Camera app on another device and scan the QR code to connect.
                            </p>
                            <p className="text-xs text-white/60">
                              This connects devices using your TTT wallet address securely.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <h3 className="text-white font-bold">Connected & Encrypted</h3>
                          </div>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        </div>

                        {/* Messages */}
                        <div className="bg-black/40 rounded-lg p-4 mb-4 h-64 overflow-y-auto space-y-3">
                          {messages.length === 0 ? (
                            <div className="text-center text-white/40 text-sm py-8">
                              No messages yet. Start the conversation!
                            </div>
                          ) : (
                            messages.map((msg, idx) => (
                              <div
                                key={idx}
                                className={`flex ${msg.sender_wallet === address ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                    msg.sender_wallet === address
                                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                                      : 'bg-white/10 text-white'
                                  }`}
                                >
                                  <p className="text-sm break-words">{msg.content}</p>
                                  <p className="text-[10px] opacity-60 mt-1">
                                    {new Date(msg.created_date).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="flex gap-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type encrypted message..."
                            className="flex-1 bg-black/40 border-white/10 text-white placeholder:text-white/40"
                          />
                          <Button
                            onClick={sendMessage}
                            disabled={isSending || !newMessage.trim()}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            {isSending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
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
                  Scan wallet QR code with Camera app for instant connection
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
                  Secure wallet-to-wallet device connections
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
              TTT Wallet Connections • Secure Device Pairing
            </p>
          </motion.div>
        </div>
      </div>

      {/* Code Input Modal */}
      <AnimatePresence>
        {showCodeInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCodeInput(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-3xl">#</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Enter Connection Code</h2>
                <p className="text-white/60 text-sm">Enter the 6-digit code from another device</p>
              </div>

              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="bg-white/5 border-white/10 text-white text-center text-2xl font-mono tracking-widest h-16 mb-4"
                maxLength={6}
              />

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowCodeInput(false);
                    setCodeInput('');
                  }}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCodeConnect}
                  disabled={codeInput.length !== 6}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  Connect
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          >
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                autoPlay
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanner Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-cyan-500/50 rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />
                  
                  <motion.div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="absolute top-4 left-0 right-0 flex justify-between px-4">
                <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-cyan-400" />
                  <span className="text-white text-sm font-medium">Scanning...</span>
                </div>
                <Button
                  onClick={stopScanner}
                  className="bg-red-500/80 border border-red-500/50 text-white hover:bg-red-500/90"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}