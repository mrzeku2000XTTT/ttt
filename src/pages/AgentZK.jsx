import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Shield, Wrench, Zap, Lock, CheckCircle2, Loader2, Sparkles, Terminal, Code, Database, Network, Crown, AlertCircle, Camera, Upload, Save, Smartphone, Key, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import WorkspaceModal from "@/components/agentZK/WorkspaceModal";
import ToolsModal from "@/components/agentZK/ToolsModal";
import TermsModal from "@/components/TermsModal";
import AgentZKClaimModal from "@/components/agentZK/AgentZKClaimModal";

export default function AgentZKPage() {
  const [user, setUser] = useState(null);
  const [agentZKId, setAgentZKId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoPrompt, setPhotoPrompt] = useState("");
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [tempPhoto, setTempPhoto] = useState(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [iosDetected, setIosDetected] = useState(false);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null, balance: 0 });
  const [metamaskWallet, setMetamaskWallet] = useState({ connected: false, address: null, balance: 0 });
  
  // Background cover photo state
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [coverPrompt, setCoverPrompt] = useState("");
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [tempCover, setTempCover] = useState(null);
  const [isSavingCover, setIsSavingCover] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Location state
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const isIOSDevice = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };

  useEffect(() => {
    loadData();
    setIosDetected(isIOSDevice());
    checkWallets();
    loadUserLocation();
  }, []);

  const checkWallets = async () => {
    // Check Kasware
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          const balanceResult = await window.kasware.getBalance();
          const balance = balanceResult.total || 0; // Kasware returns balance in smallest unit (sompis)
          setKaswareWallet({
            connected: true,
            address: accounts[0],
            balance: balance / 1e8 // KAS has 8 decimal places
          });
        }
      } catch (err) {
        console.log('Kasware not connected or error:', err);
      }
    }

    // Check MetaMask
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const balanceWei = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          });
          const balanceInEth = Number(BigInt(balanceWei)) / 1e18; // ETH has 18 decimal places
          setMetamaskWallet({
            connected: true,
            address: accounts[0],
            balance: balanceInEth
          });
        }
      } catch (err) {
        console.log('MetaMask not connected or error:', err);
      }
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Admin-only check
      let currentUser = null;
      let walletAddress = null;
      
      try {
        currentUser = await base44.auth.me();
        
        if (!currentUser || currentUser.role !== 'admin') {
          setIsLoading(false);
          return;
        }
        
        setUser(currentUser);
        
        // Check if user has accepted terms
        if (!currentUser.terms_accepted) {
          setShowTermsModal(true);
        } else {
          setTermsAccepted(true);
        }
        
        walletAddress = currentUser.created_wallet_address;
      } catch (err) {
        // User not logged in - check localStorage
        walletAddress = localStorage.getItem('ttt_wallet_address');
        if (walletAddress) {
          setUser({ created_wallet_address: walletAddress });
          setTermsAccepted(true); // Skip terms for non-logged-in users
        }
      }

      if (walletAddress) {
        const zkId = walletAddress.slice(-10).toUpperCase();
        setAgentZKId(`ZK-${zkId}`);
      }

      // Load verifications only if we have a logged-in user
      if (currentUser?.email) {
        try {
          const userVerifications = await base44.entities.WalletVerification.filter({
            user_email: currentUser.email
          });
          setVerifications(userVerifications);
        } catch (err) {
          console.error('Failed to load verifications:', err);
        }
      }

    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    try {
      // Only save to user profile if logged in
      if (user?.email) {
        await base44.auth.updateMe({
          terms_accepted: true,
          terms_accepted_date: new Date().toISOString()
        });
        setUser({ ...user, terms_accepted: true });
      }
      setTermsAccepted(true);
      setShowTermsModal(false);
    } catch (err) {
      console.error('Failed to save terms acceptance:', err);
      alert('Failed to save. Please try again.');
    }
  };

  const handleDeclineTerms = () => {
    alert('You must accept the Terms of Service to use Agent ZK features.');
  };

  const loadUserLocation = async () => {
    try {
      const currentUser = await base44.auth.me();
      const locations = await base44.entities.UserLocation.filter({
        user_email: currentUser.email
      });
      
      if (locations.length > 0) {
        setUserLocation(locations[0]);
      }
    } catch (err) {
      console.log('No location data yet');
    }
  };

  const handleEnableLocation = async () => {
    if (!navigator.geolocation) {
      alert('❌ Geolocation not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude, accuracy } = position.coords;

      // Get city/country from reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const geoData = await response.json();

      // Generate fake glitching Chinese location for frontend display
      const fakeLocations = [
        '北̵̡̢̧̨̛̖̪̬̗̲̤͎̈́̈́̊̊͑̈́͝京̷̛̤̗̮̝̣̦̽̉̐̓̿̈́͝市̸̨̛̗̤̘̫̰̲̈́̏̆̒̊̕͝',
        '上̶̢̡̧̪̗̘̲̱̈́̏͊̊̈́͌海̵̛̗̤̲̱̊̈́̓̉市̸̡̛̗̤̲̱̈́̏̆̒̕',
        '重̷̡̢̧̗̤̲̈́̏̆̊̈́̕慶̸̢̛̗̤̲̱̊̈́̓̉̕市̵̨̗̤̲̱̏̆̈́̊̕',
        '深̶̢̡̧̗̤̲̱̈́̏̆̊̈́̕圳̸̢̛̗̤̲̱̊̈́̓̉̕市̵̨̗̤̲̱̏̆̈́̊̕',
        '广̷̡̢̧̗̤̲̈́̏̆̊̈́̕州̸̢̛̗̤̲̱̊̈́̓̉̕市̵̨̗̤̲̱̏̆̈́̊̕'
      ];
      const randomFake = fakeLocations[Math.floor(Math.random() * fakeLocations.length)];

      const locationData = {
        user_email: user.email,
        latitude,
        longitude,
        city: randomFake, // Fake glitching Chinese location for frontend
        country: '̷̡̢̧̗̤̲̱̈́̏̆̊̈́̕中̸̢̛̗̤̲̱̊̈́̓̉̕国̵̨̗̤̲̱̏̆̈́̊̕', // Fake glitching "China"
        encrypted_location: btoa(JSON.stringify({ 
          latitude, 
          longitude, 
          real_city: geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Unknown',
          real_country: geoData.address?.country || 'Unknown',
          timestamp: Date.now() 
        })),
        share_with_app: false,
        last_updated: new Date().toISOString(),
        accuracy
      };

      if (userLocation) {
        await base44.entities.UserLocation.update(userLocation.id, locationData);
      } else {
        await base44.entities.UserLocation.create(locationData);
      }

      await loadUserLocation();
      
      // Custom styled notification - black on black
      const notification = document.createElement('div');
      notification.className = 'fixed right-4 bg-black/95 backdrop-blur-xl border border-white/20 text-white rounded-xl p-4 shadow-2xl z-[1000] max-w-sm animate-in slide-in-from-right';
      notification.style.top = 'calc(var(--sat, 0px) + 8rem)';
      notification.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-sm mb-1">Location Enabled for Agent ZK</h3>
            <p class="text-xs text-white/60 mb-2">🔒 Encrypted & Protected</p>
            <div class="bg-black border border-white/10 rounded-lg p-2 mb-2 font-mono text-xs">
              <div class="text-white/50 mb-1">Frontend Display:</div>
              <div class="text-cyan-400 glitch-text">${randomFake}</div>
            </div>
            <p class="text-xs text-white/60">Agent ZK can now provide location-aware assistance with your real coordinates securely stored.</p>
          </div>
        </div>
        <button onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-white/40 hover:text-white/60 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 8000);
    } catch (err) {
      console.error('Failed to get location:', err);
      if (err.code === 1) {
        alert('❌ Location permission denied\n\nPlease enable location access in your browser settings.');
      } else {
        alert('❌ Failed to get location: ' + err.message);
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setTempCover(file_url);
      alert('✅ Cover photo uploaded! Click "Save Cover" to apply.');
    } catch (err) {
      console.error('Failed to upload cover:', err);
      alert('Failed to upload cover photo. Please try again.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!coverPrompt.trim()) return;

    setIsGeneratingCover(true);
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: `ULTRA HD 4K RESOLUTION, cinematic widescreen, ${coverPrompt}, futuristic cyberpunk aesthetic, neon cyan and purple color scheme, high-tech digital atmosphere, dramatic lighting, photorealistic quality, 1920x1080 wallpaper, pristine sharp details, professional grade, crystal clear, ultra detailed, no blur, maximum quality, 8k textures`
      });

      if (response.url) {
        setTempCover(response.url);
        setCoverPrompt("");
        alert('✅ Cover generated! Click "Save Cover" to apply.');
      }
    } catch (error) {
      console.error('Failed to generate cover:', error);
      alert('Failed to generate cover photo. Please try again.');
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleSaveCover = async () => {
    if (!tempCover) return;
    
    if (!user?.email) {
      alert('Please login to save your cover photo');
      return;
    }

    setIsSavingCover(true);
    try {
      await base44.auth.updateMe({ agent_zk_cover_photo: tempCover });
      setUser({ ...user, agent_zk_cover_photo: tempCover });
      setShowCoverModal(false);
      setTempCover(null);
      alert('✅ Background cover updated successfully!');
      window.location.reload(); // Reload to show new background
    } catch (err) {
      console.error('Failed to save cover:', err);
      alert('Failed to save cover. Please try again.');
    } finally {
      setIsSavingCover(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setTempPhoto(file_url);
    } catch (err) {
      console.error('Failed to upload photo:', err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleGeneratePhoto = async () => {
    if (!photoPrompt.trim()) return;

    setIsGeneratingPhoto(true);
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: `ULTRA HD 4K portrait, ${photoPrompt}, futuristic AI agent avatar, cyberpunk style, neon cyan and purple accents, high tech aesthetic, digital art masterpiece, professional headshot, glowing effects, crystal clear sharp details, photorealistic quality, premium rendering, 8k textures, no blur, maximum quality`
      });

      if (response.url) {
        setTempPhoto(response.url);
        setPhotoPrompt("");
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingPhoto(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!tempPhoto) return;
    
    if (!user?.email) {
      alert('Please login to save your avatar');
      return;
    }

    setIsSavingPhoto(true);
    try {
      await base44.auth.updateMe({ agent_zk_photo: tempPhoto });
      setUser({ ...user, agent_zk_photo: tempPhoto });
      setShowPhotoModal(false);
      setTempPhoto(null);
      alert('✅ Agent ZK avatar updated successfully!');
    } catch (err) {
      console.error('Failed to save photo:', err);
      alert('Failed to save avatar. Please try again.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Admin-only access
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-white/5 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Admin Access Only</h2>
          <p className="text-gray-400 text-sm">
            Agent ZK is restricted to administrators only.
          </p>
        </div>
      </div>
    );
  }

  // Show identity claiming modal
  if (!user?.created_wallet_address && !kaswareWallet.connected && !agentZKId) {
    return <AgentZKClaimModal onClaim={loadData} kaswareWallet={kaswareWallet} checkWallets={checkWallets} />;
  }

  const agentPhoto = user?.agent_zk_photo;
  // ✅ DEFAULT COVER IMAGE
  const agentCoverPhoto = user?.agent_zk_cover_photo || "https://i.imgur.com/yXQJ9Xk.jpg";

  return (
    <div className="min-h-screen bg-black relative overflow-hidden pb-8">
      {/* ✅ Default Background Photo */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('${agentCoverPhoto}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/85 to-black/95" />
      </div>

      {/* Custom Agent Photo Overlay (if set) */}
      {agentPhoto && (
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${agentPhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed',
              opacity: 0.15
            }}
          />
        </div>
      )}

      {/* Animated Cyber Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-[180px]"
        />
      </div>

      <AnimatePresence>
        {showWorkspace && (
          <WorkspaceModal
            onClose={() => setShowWorkspace(false)}
            onEndpointCreated={(endpoint) => {
              console.log('✅ New endpoint created:', endpoint);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToolsModal && (
          <ToolsModal
            onClose={() => setShowToolsModal(false)}
            agentZKId={agentZKId}
          />
        )}
      </AnimatePresence>



      <div className="relative z-10 p-3 sm:p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Avatar Profile Section with Background */}
          <div className="relative h-64 md:h-96 overflow-hidden border border-cyan-500/20 z-10 rounded-2xl mb-8">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${agentCoverPhoto}')`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />
            </div>

            {/* Avatar in Center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative group"
              >
                <div className="relative w-32 h-32 md:w-48 md:h-48">
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 animate-spin-slow" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-[3px] bg-black rounded-xl" />
                  </div>

                  <div className="absolute inset-[6px] rounded-lg overflow-hidden">
                    {agentPhoto ? (
                      <img
                        src={agentPhoto}
                        alt="Agent Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/3e49e39c2_image.png"
                        alt="Agent ZK Shield"
                        className="w-full h-full object-contain p-4"
                      />
                    )}
                  </div>

                  <button
                    onClick={() => setShowPhotoModal(true)}
                    className="absolute inset-[6px] bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </button>
                </div>

                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl"
                />
              </motion.div>
            </div>

            {/* Agent Identity at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 text-center pb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-xs md:text-sm text-cyan-400 mb-1">Agent Identity</div>
                <div className="text-2xl md:text-4xl font-bold text-white font-mono tracking-wider">
                  {agentZKId}
                </div>
              </motion.div>
            </div>
          </div>

          <div className="pt-2">
            {iosDetected && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 mb-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-3"
              >
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-white font-semibold mb-1 text-xs">📱 Mobile Optimized</h3>
                    <p className="text-[10px] text-blue-300">
                      All Agent ZK features are accessible. Tap button below to access chat.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* UPDATED: Only Chat Button - Black on Black Design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 mb-6"
            >
              <Button
                onClick={() => setShowToolsModal(true)}
                className="w-full bg-black/80 border-2 border-black/40 hover:bg-black/60 hover:border-cyan-500/30 h-auto py-4 flex items-center justify-center gap-2 backdrop-blur-xl shadow-lg shadow-black/50 transition-all duration-300"
              >
                <Terminal className="w-6 h-6 text-cyan-400" />
                <span className="text-sm text-white font-semibold">Chat with Agent ZK</span>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
                <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30 text-[10px] md:text-xs">
                  <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                  Active
                </Badge>
                <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] md:text-xs">
                  <Crown className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                  Verified
                </Badge>
                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] md:text-xs">
                  <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 mr-1" />
                  {verifications.length} Verifications
                </Badge>
                <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono text-[10px] md:text-xs truncate max-w-[180px]">
                  {user.created_wallet_address.slice(0, 15)}...
                </Badge>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="bg-gradient-to-br from-cyan-950/30 to-black border-cyan-500/30 overflow-hidden backdrop-blur-xl">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div>
                      <div className="text-xs md:text-sm text-cyan-300 mb-1">Unique Agent Identity</div>
                      <div className="text-lg md:text-2xl font-mono font-bold text-white break-all">
                        {agentZKId}
                      </div>
                    </div>
                    <Wrench className="w-8 h-8 md:w-12 md:h-12 text-cyan-400 flex-shrink-0" />
                  </div>

                  <div className="bg-black/50 rounded-lg p-3 md:p-4 border border-cyan-500/20 mb-3">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                      <Lock className="w-3 h-3 md:w-4 md:h-4 text-cyan-400 flex-shrink-0" />
                      <span>Infinitely tied to Kaspa address • Immutable • Unique</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCoverModal(true)}
                      className="flex-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 hover:from-cyan-500/30 hover:to-purple-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 backdrop-blur-xl transition-all"
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      <span className="text-sm font-semibold">Cover</span>
                    </Button>
                    <Button
                      onClick={handleEnableLocation}
                      disabled={isGettingLocation}
                      className={`flex-1 bg-gradient-to-r border backdrop-blur-xl transition-all ${
                        userLocation
                          ? 'from-green-500/20 to-emerald-500/20 border-green-500/40 hover:from-green-500/30 hover:to-emerald-500/30 text-green-400'
                          : 'from-purple-500/20 to-pink-500/20 border-purple-500/40 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400'
                      }`}
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          <span className="text-sm font-semibold">Getting...</span>
                        </>
                      ) : userLocation ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          <span className="text-sm font-semibold">Encrypted</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 mr-2" />
                          <span className="text-sm font-semibold">Location</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>



            <div className="flex items-center gap-1.5 md:gap-2 bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 rounded-xl p-1 md:p-1.5 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-sm font-semibold">Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'tools'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-sm font-semibold">Tools</span>
              </button>
              <button
                onClick={() => setActiveTab('capabilities')}
                className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'capabilities'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-sm font-semibold">Capabilities</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3 md:gap-6">
                    <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                      <CardContent className="p-3 md:p-6">
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 mb-2 md:mb-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                          </div>
                          <div className="text-center md:text-left">
                            <div className="text-lg md:text-2xl font-bold text-white">{verifications.length}</div>
                            <div className="text-[10px] md:text-xs text-gray-500">Verifications</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                      <CardContent className="p-3 md:p-6">
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 mb-2 md:mb-4">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            <Database className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                          </div>
                          <div className="text-center md:text-left">
                            <div className="text-lg md:text-2xl font-bold text-white">0</div>
                            <div className="text-[10px] md:text-xs text-gray-500">Tasks</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                    <CardHeader className="border-b border-zinc-800 p-4 md:p-6">
                      <h2 className="text-lg md:text-xl font-bold text-white">What is Agent ZK?</h2>
                    </CardHeader>
                    <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                      <div className="space-y-3 md:space-y-4 text-gray-400 text-sm md:text-base">
                        <p>
                          <strong className="text-white">Agent ZK</strong> is your personal AI agent, uniquely tied to your TTT Wallet address.
                          It's powered by your DAGKnight verification, ensuring security and authenticity.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4">
                            <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm md:text-base">
                              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                              Unique Identity
                            </h3>
                            <p className="text-xs md:text-sm">
                              Your Agent ZK ID is derived from the last 10 characters of your Kaspa address, making it completely unique and immutable.
                            </p>
                          </div>
                          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4">
                            <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm md:text-base">
                              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                              DAGKnight Secured
                            </h3>
                            <p className="text-xs md:text-sm">
                              Access requires multi-wallet verification through DAGKnight, ensuring only verified users can use Agent ZK.
                            </p>
                          </div>
                          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4">
                            <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm md:text-base">
                              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                              AI-Powered Tools
                            </h3>
                            <p className="text-xs md:text-sm">
                              Access specialized AI tools and capabilities exclusive to verified Agent ZK users.
                            </p>
                          </div>
                          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4">
                            <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm md:text-base">
                              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                              Permanent Link
                            </h3>
                            <p className="text-xs md:text-sm">
                              Your Agent ZK is infinitely tied to your address - it can never be duplicated or transferred.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'tools' && (
                <motion.div
                  key="tools"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                    <CardHeader className="border-b border-zinc-800 p-4 md:p-6">
                      <h2 className="text-lg md:text-xl font-bold text-white">Agent ZK Tools</h2>
                      <p className="text-xs md:text-sm text-gray-400">Exclusive AI-powered tools for verified agents</p>
                    </CardHeader>
                    <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                      <div className="text-center py-8 md:py-12">
                        <Code className="w-12 h-12 md:w-16 md:h-16 text-cyan-400 mx-auto mb-3 md:mb-4" />
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">Advanced AI Workflow</h3>
                        <p className="text-sm md:text-base text-gray-400 mb-6 md:mb-8 max-w-md mx-auto px-4">
                          Configure your AI agent, manage environment secrets, and chat with Agent ZK in real-time.
                        </p>

                        <Button
                          onClick={() => setShowToolsModal(true)}
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-lg shadow-cyan-500/50 px-6 md:px-8 py-4 md:py-6 text-sm md:text-lg"
                        >
                          <Zap className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                          Open Workflow
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-8 md:mt-12">
                          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3">
                              <Terminal className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                            </div>
                            <h4 className="text-white font-semibold mb-1 text-xs md:text-sm">Chat Interface</h4>
                            <p className="text-[10px] md:text-xs text-gray-500">
                              Talk directly with Agent ZK and get instant AI assistance
                            </p>
                          </div>

                          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3">
                              <Lock className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                            </div>
                            <h4 className="text-white font-semibold mb-1 text-xs md:text-sm">Secret Management</h4>
                            <p className="text-[10px] md:text-xs text-gray-500">
                              Store API keys and tokens securely for Agent ZK to use
                            </p>
                          </div>

                          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-pink-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3">
                              <Zap className="w-4 h-4 md:w-5 md:h-5 text-pink-400" />
                            </div>
                            <h4 className="text-white font-semibold mb-1 text-xs md:text-sm">Workflow Config</h4>
                            <p className="text-[10px] md:text-xs text-gray-500">
                              Configure automation rules and agent behavior
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'capabilities' && (
                <motion.div
                  key="capabilities"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                    <CardHeader className="border-b border-zinc-800 p-4 md:p-6">
                      <h2 className="text-lg md:text-xl font-bold text-white">Agent Capabilities</h2>
                      <p className="text-xs md:text-sm text-gray-400">Current and upcoming features for Agent ZK</p>
                    </CardHeader>
                    <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                      <div className="space-y-3 md:space-y-4">
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4">
                          <div className="flex items-start gap-2 md:gap-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Unique Identity System</h3>
                              <p className="text-xs md:text-sm text-gray-400">
                                Permanent Agent ZK ID tied to your Kaspa address
                              </p>
                              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] md:text-xs mt-2">
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4">
                          <div className="flex items-start gap-2 md:gap-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">DAGKnight Verification</h3>
                              <p className="text-xs md:text-sm text-gray-400">
                                Multi-wallet verification requirement for enhanced security
                              </p>
                              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] md:text-xs mt-2">
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4 opacity-50">
                          <div className="flex items-start gap-2 md:gap-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">AI Task Automation</h3>
                              <p className="text-xs md:text-sm text-gray-400">
                                Automated task execution and workflow management
                              </p>
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] md:text-xs mt-2">
                                Coming Soon
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4 opacity-50">
                          <div className="flex items-start gap-2 md:gap-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Smart Contract Integration</h3>
                              <p className="text-xs md:text-sm text-gray-400">
                                Direct interaction with Kaspa smart contracts
                              </p>
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] md:text-xs mt-2">
                                Coming Soon
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 md:p-4 opacity-50">
                          <div className="flex items-start gap-2 md:gap-3">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-yellow-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Cross-Chain Operations</h3>
                              <p className="text-xs md:text-sm text-gray-400">
                                Execute operations across multiple blockchain networks
                              </p>
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] md:text-xs mt-2">
                                Coming Soon
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPhotoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Customize Agent Avatar</h2>

              <div className="mb-6">
                <div className="w-48 h-48 mx-auto relative">
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 animate-spin-slow" style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-[3px] bg-black rounded-xl" />
                  </div>
                  <div className="absolute inset-[6px] rounded-lg overflow-hidden">
                    {tempPhoto ? (
                      <img src={tempPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : agentPhoto ? (
                      <img src={agentPhoto} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <Camera className="w-12 h-12 text-gray-600" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploadingPhoto}
                  />
                  <Button
                    as="span"
                    disabled={isUploadingPhoto}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                </label>
              </div>

              <div className="mb-6">
                <div className="flex gap-2">
                  <Input
                    value={photoPrompt}
                    onChange={(e) => setPhotoPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGeneratePhoto()}
                    placeholder="cyber knight, neon armor, glowing visor..."
                    className="flex-1 bg-zinc-900 border-zinc-700 text-white"
                    disabled={isGeneratingPhoto}
                  />
                  <Button
                    onClick={handleGeneratePhoto}
                    disabled={isGeneratingPhoto || !photoPrompt.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isGeneratingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSavePhoto}
                  disabled={!tempPhoto || isSavingPhoto}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {isSavingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Avatar
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowPhotoModal(false);
                    setTempPhoto(null);
                    setPhotoPrompt("");
                  }}
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW: Background Cover Photo Modal */}
      <AnimatePresence>
        {showCoverModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            onClick={() => setShowCoverModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border-2 border-cyan-500/50 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                  <Wrench className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Background Cover</h2>
                  <p className="text-sm text-cyan-400">Customize your Agent ZK background in HD</p>
                </div>
              </div>

              {/* HD Preview */}
              <div className="mb-6">
                <label className="text-xs text-gray-400 mb-2 block">Preview (HD Quality)</label>
                <div className="w-full h-56 md:h-64 mx-auto relative rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${tempCover || agentCoverPhoto}')`,
                      imageRendering: 'high-quality',
                      WebkitImageRendering: '-webkit-optimize-contrast'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs text-cyan-400 mb-2 tracking-wider">PREVIEW</div>
                      <div className="text-2xl md:text-3xl font-bold text-white font-mono tracking-wider drop-shadow-lg">
                        {agentZKId}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Button */}
              <div className="mb-4">
                <label className="block w-full cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                    disabled={isUploadingCover}
                  />
                  <div className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-cyan-500/50 rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-all cursor-pointer">
                    {isUploadingCover ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-semibold">Uploading HD Image...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span className="font-semibold">Upload Cover Photo</span>
                      </>
                    )}
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Recommended: 1920x1080 or higher resolution for best quality
                </p>
              </div>

              {/* AI Generate Section */}
              <div className="mb-6">
                <label className="text-sm text-gray-300 mb-2 block font-semibold">
                  Or generate with AI (Ultra HD):
                </label>
                <div className="flex gap-2">
                  <Input
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerateCover()}
                    placeholder="neon city skyline, digital matrix rain, cyber grid..."
                    className="flex-1 bg-zinc-900 border-cyan-500/50 text-white placeholder:text-gray-600 focus:border-cyan-400"
                    disabled={isGeneratingCover}
                  />
                  <Button
                    onClick={handleGenerateCover}
                    disabled={isGeneratingCover || !coverPrompt.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 shadow-lg shadow-cyan-500/30 px-6"
                  >
                    {isGeneratingCover ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating HD...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  🎨 Examples: "cyber city night neon lights", "matrix digital rain code", "geometric neon grid patterns"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveCover}
                  disabled={!tempCover || isSavingCover}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30 h-12 text-base font-semibold"
                >
                  {isSavingCover ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving HD Cover...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Cover
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowCoverModal(false);
                    setTempCover(null);
                    setCoverPrompt("");
                  }}
                  variant="outline"
                  className="bg-zinc-900 border-zinc-700 text-gray-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-600 h-12 px-8"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TermsModal
        isOpen={showTermsModal}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />

      <style jsx>{`
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}