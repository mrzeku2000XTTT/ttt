import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Loader2, CheckCircle, AlertCircle, ScanLine, FlipVertical, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function QRScannerPage() {
  const [hasPermission, setHasPermission] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Auto-start scanning on mount
    startScanning();
    
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setScannedData(null);
    setScanning(true);
    
    try {
      // Request camera permission with mobile-optimized constraints
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!stream) {
        throw new Error('Failed to get camera stream');
      }

      console.log('Camera stream obtained:', stream.getVideoTracks());
      streamRef.current = stream;
      setHasPermission(true);

      // Set video source immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Force video attributes for mobile
        videoRef.current.setAttribute('playsinline', '');
        videoRef.current.setAttribute('webkit-playsinline', '');
        videoRef.current.setAttribute('autoplay', '');
        videoRef.current.muted = true;
        
        // Start playback immediately
        try {
          await videoRef.current.play();
          console.log('Video playback started');
          setTimeout(() => {
            requestAnimationFrame(tick);
          }, 500);
        } catch (playErr) {
          console.error('Play error:', playErr);
        }
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Failed to access camera: ' + err.message);
      }
      setScanning(false);
    }
  };

  const stopScanning = () => {
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
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Try BarcodeDetector API (native on Chrome/Android)
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
          barcodeDetector.detect(canvas).then(barcodes => {
            if (barcodes.length > 0 && scanning) {
              handleQRCodeDetected(barcodes[0].rawValue);
            }
          }).catch(() => {});
        } catch (e) {}
      } else {
        // Fallback: Basic QR pattern detection for iOS
        scanForQRPattern(imageData);
      }
    }

    if (scanning) {
      animationFrameRef.current = requestAnimationFrame(tick);
    }
  };

  const scanForQRPattern = (imageData) => {
    // Use jsQR library for cross-platform QR code detection
    try {
      // jsQR is loaded via CDN in index.html
      if (typeof jsQR !== 'undefined') {
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        if (code && scanning) {
          console.log('QR Code found via jsQR:', code.data);
          handleQRCodeDetected(code.data);
        }
      }
    } catch (e) {
      console.error('jsQR error:', e);
    }
  };

  const handleQRCodeDetected = async (data) => {
    if (!scanning) return;
    
    stopScanning();
    
    console.log('QR Code detected:', data);
    
    // Check if it's a TTT wallet address (kaspa address format)
    if (data.startsWith('kaspa:') || /^[a-z0-9]{61,63}$/.test(data)) {
      // This is a TTT wallet address
      try {
        const user = await base44.auth.me();
        const userWallet = user.created_wallet_address;
        
        if (!userWallet) {
          setScannedData({
            type: 'connection_error',
            error: 'No TTT wallet found',
            message: 'Please create a TTT wallet first before connecting.',
            scanned_wallet: data
          });
          return;
        }
        
        // Show connection confirmation popup
        setScannedData({
          type: 'connection_prompt',
          scanned_wallet: data,
          user_wallet: userWallet,
          message: 'Establish connection with this wallet?'
        });
        
      } catch (err) {
        console.error('Failed to get user wallet:', err);
        setScannedData({
          type: 'connection_error',
          error: 'Authentication Error',
          message: 'Please log in to connect wallets.',
          scanned_wallet: data
        });
      }
      return;
    }
    
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.type === 'vibe_session') {
        // Get current user wallet
        const user = await base44.auth.me();
        const userWallet = user.created_wallet_address;
        
        if (!userWallet) {
          setScannedData({
            type: 'vibe_error',
            error: 'No TTT wallet found',
            message: 'Please create a TTT wallet first before connecting.',
            session: parsed
          });
          return;
        }
        
        // Check if wallets match
        if (parsed.wallet_address !== userWallet) {
          setScannedData({
            type: 'vibe_mismatch',
            error: 'Wallet Mismatch',
            message: 'The QR code is linked to a different wallet. Please use the matching device or create a new session.',
            expected: parsed.wallet_address,
            current: userWallet,
            session: parsed
          });
          return;
        }
        
        // Wallets match - save connection and proceed
        const connectionData = {
          session_id: parsed.session_id,
          wallet_address: userWallet,
          user_email: user.email,
          connected_at: new Date().toISOString(),
          device_type: parsed.device_type || 'mobile',
          expires_at: parsed.expires_at
        };
        
        // Store connection locally
        localStorage.setItem('active_vibe_session', JSON.stringify(connectionData));
        localStorage.setItem(`vibe_session_${parsed.session_id}`, JSON.stringify(connectionData));
        
        setScannedData({
          type: 'vibe_success',
          session: parsed,
          message: 'Successfully connected!',
          connection: connectionData
        });
        
        console.log('✅ VIBE connection established:', connectionData);
        
        // Auto-redirect after 1 second
        setTimeout(() => {
          window.location.href = `/VibeSession?session_id=${parsed.session_id}`;
        }, 1000);
      } else {
        setScannedData({
          type: 'json',
          data: parsed,
          raw: data
        });
      }
    } catch (e) {
      setScannedData({
        type: 'text',
        data: data,
        raw: data
      });
    }
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacingMode);
    
    if (scanning) {
      stopScanning();
      setTimeout(() => {
        startScanning();
      }, 100);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-black to-blue-950/20" />

      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <Camera className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
              QR Scanner
            </h1>
            <p className="text-white/60 text-lg">
              Scan QR codes with your camera
            </p>
          </motion.div>

          {/* Error Display */}
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

          {/* Scanner Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-black border-white/10 overflow-hidden">
              <CardContent className="p-0">
                {scanning ? (
                  <div className="relative bg-black min-h-[400px]">
                    {/* Video Preview */}
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      webkit-playsinline="true"
                      autoPlay
                      muted
                      style={{ minHeight: '400px', maxHeight: '600px' }}
                    />
                    
                    {/* Hidden canvas for QR detection */}
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Loading indicator */}
                    {scanning && (
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-white text-xs font-medium">Camera Active</span>
                      </div>
                    )}

                    {/* Scanning Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-4 border-cyan-500/50 rounded-2xl relative">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />
                        
                        {/* Scanning line animation */}
                        <motion.div
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                          animate={{ top: ['0%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                      <Button
                        onClick={switchCamera}
                        className="bg-black/80 border border-white/20 text-white hover:bg-black/90"
                      >
                        <FlipVertical className="w-5 h-5 mr-2" />
                        Flip Camera
                      </Button>
                      <Button
                        onClick={stopScanning}
                        className="bg-red-500/80 border border-red-500/50 text-white hover:bg-red-500/90"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Stop
                      </Button>
                    </div>
                  </div>
                ) : scannedData ? (
                  <div className="p-8">
                    {scannedData.type === 'connection_prompt' && (
                      <>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <Wallet className="w-8 h-8 text-purple-400" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">
                            Establish Connection?
                          </h2>
                          <p className="text-white/60 text-sm">
                            Connect your device to this TTT wallet
                          </p>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
                            <div className="text-purple-400 text-xs mb-1">Scanned Wallet</div>
                            <code className="text-purple-300 font-mono text-xs break-all block">
                              {scannedData.scanned_wallet}
                            </code>
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="text-white/60 text-xs mb-1">Your Wallet</div>
                            <code className="text-white font-mono text-xs break-all block">
                              {scannedData.user_wallet}
                            </code>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => {
                              setScannedData(null);
                              startScanning();
                            }}
                            className="flex-1 bg-white/10 border border-white/20 text-white hover:bg-white/20"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={async () => {
                              // Establish connection
                              const connectionData = {
                                connected_wallet: scannedData.scanned_wallet,
                                user_wallet: scannedData.user_wallet,
                                connected_at: new Date().toISOString(),
                                device_type: 'mobile'
                              };
                              
                              localStorage.setItem('vibe_connection', JSON.stringify(connectionData));
                              localStorage.setItem('connected_wallet', scannedData.scanned_wallet);
                              
                              setScannedData({
                                type: 'connection_success',
                                connection: connectionData
                              });
                              
                              setTimeout(() => {
                                window.location.href = '/Vibe';
                              }, 2000);
                            }}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Establish Connection
                          </Button>
                        </div>
                      </>
                    )}

                    {scannedData.type === 'connection_success' && (
                      <>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">
                            Connection Established!
                          </h2>
                          <p className="text-green-400 text-sm">
                            Devices connected successfully
                          </p>
                          <p className="text-white/60 text-xs mt-2">
                            Redirecting...
                          </p>
                        </div>
                      </>
                    )}

                    {scannedData.type === 'connection_error' && (
                      <>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">
                            {scannedData.error}
                          </h2>
                          <p className="text-red-400 text-sm">
                            {scannedData.message}
                          </p>
                        </div>
                        <Button
                          onClick={() => {
                            setScannedData(null);
                            startScanning();
                          }}
                          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                        >
                          Try Again
                        </Button>
                      </>
                    )}

                    {scannedData.type === 'vibe_success' && (
                      <>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">
                            VIBE Connected!
                          </h2>
                          <p className="text-green-400 text-sm">
                            {scannedData.message}
                          </p>
                          <p className="text-white/60 text-xs mt-2">
                            Redirecting to session...
                          </p>
                        </div>
                        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
                          <div className="text-white/60 text-xs mb-1">Session ID</div>
                          <code className="text-green-300 font-mono text-xs break-all block">
                            {scannedData.session.session_id}
                          </code>
                        </div>
                      </>
                    )}

                    {scannedData.type === 'vibe_mismatch' && (
                      <>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-yellow-400" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">
                            {scannedData.error}
                          </h2>
                          <p className="text-yellow-400 text-sm">
                            {scannedData.message}
                          </p>
                        </div>
                        <div className="space-y-3 mb-6">
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="text-white/60 text-xs mb-1">QR Code Wallet</div>
                            <code className="text-white font-mono text-xs break-all block">
                              {scannedData.expected}
                            </code>
                          </div>
                          <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
                            <div className="text-yellow-400 text-xs mb-1">Your Wallet</div>
                            <code className="text-yellow-300 font-mono text-xs break-all block">
                              {scannedData.current}
                            </code>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setScannedData(null);
                            startScanning();
                          }}
                          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                        >
                          Try Different QR Code
                        </Button>
                      </>
                    )}

                    {scannedData.type === 'vibe_error' && (
                      <>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">
                            {scannedData.error}
                          </h2>
                          <p className="text-red-400 text-sm">
                            {scannedData.message}
                          </p>
                        </div>
                        <Button
                          onClick={() => window.location.href = '/Wallet'}
                          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                        >
                          Create TTT Wallet
                        </Button>
                      </>
                    )}

                    {(scannedData.type === 'vibe_session' || scannedData.type === 'json' || scannedData.type === 'text') && (
                      <>
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">
                            QR Code Scanned!
                          </h2>
                          <p className="text-white/60 text-sm">
                            Type: {scannedData.type.toUpperCase()}
                          </p>
                        </div>

                    {/* Display scanned data */}
                    <div className="space-y-4 mb-6">
                      {(scannedData.type === 'vibe_session' || scannedData.session) && (
                        <>
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="text-white/60 text-xs mb-1">Session ID</div>
                            <code className="text-white font-mono text-xs break-all block">
                              {scannedData.session_id}
                            </code>
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="text-white/60 text-xs mb-1">User Email</div>
                            <div className="text-white text-sm">{scannedData.user_email}</div>
                          </div>
                          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="text-white/60 text-xs mb-1">Timestamp</div>
                            <div className="text-white text-sm">
                              {new Date(scannedData.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </>
                      )}

                      {scannedData.type === 'json' && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <div className="text-white/60 text-xs mb-2">JSON Data</div>
                          <pre className="text-white font-mono text-xs overflow-x-auto">
                            {JSON.stringify(scannedData.data, null, 2)}
                          </pre>
                        </div>
                      )}

                      {scannedData.type === 'text' && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <div className="text-white/60 text-xs mb-2">Content</div>
                          <div className="text-white text-sm break-all">{scannedData.data}</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => copyToClipboard(scannedData.raw)}
                        className="flex-1 bg-white/10 border border-white/20 text-white hover:bg-white/20"
                      >
                        Copy Data
                      </Button>
                      <Button
                        onClick={() => {
                          setScannedData(null);
                          startScanning();
                        }}
                        className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                      >
                        Scan Again
                      </Button>
                    </div>
                    </>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>


        </div>
      </div>
    </div>
  );
}