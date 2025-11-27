import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Heart, Activity, Clock, ExternalLink, Zap, Plus, Loader2, X, Send, Camera, Video, Image, Play, Scissors, Check, Crown, Moon, AlertCircle, Pill, Maximize2, MessageCircle, Share2, Bookmark } from "lucide-react";
import ProofOfLifeReels from "./ProofOfLifeReels";

// ✅ REAL-TIME TRACKING - UTC based
const getTimeAgo = (timestamp) => {
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffMs = now.getTime() - postDate.getTime(); // Use .getTime() for reliable comparison
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return `${diffSeconds}s`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else {
    return `${diffDays}d`;
  }
};

export default function ProofOfLifeFeed() {
  const [proofs, setProofs] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [likedProofs, setLikedProofs] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('none');
  const [videoDuration, setVideoDuration] = useState(0);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimmedBlob, setTrimmedBlob] = useState(null);
  const [createData, setCreateData] = useState({
    amount: 1.0,
    message: '',
    feeling: 3,
    sleep: true,
    pain: false,
    medication: true
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [fullscreenVideo, setFullscreenVideo] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now()); // ✅ Force re-render for live updates
  const [showReels, setShowReels] = useState(false);
  const [reelStartIndex, setReelStartIndex] = useState(0);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const trimmerVideoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);

  useEffect(() => {
    loadData();
    checkSubscription();
    const interval = setInterval(loadData, 5000); // Real-time 5s updates

    // ✅ Update current time every 10 seconds for live "time ago" updates
    const timeInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const checkSubscription = () => {
    const saved = localStorage.getItem('subscription');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.isActive && data.expiresAt > Date.now()) {
        setSubscription(data);
      }
    }
  };

  const loadData = async () => {
    try {
      const user = await base44.auth.me().catch(() => null);
      setCurrentUser(user);

      const allProofs = await base44.entities.ProofOfLife.list('-created_date', 50);
      setProofs(allProofs);

      const uniqueAddresses = [...new Set(allProofs.map(p => p.wallet_address))];
      const profilesMap = {};

      for (const address of uniqueAddresses) {
        try {
          const agentProfiles = await base44.entities.AgentZKProfile.filter({
            wallet_address: address
          });
          if (agentProfiles.length > 0) {
            profilesMap[address] = agentProfiles[0];
          }
        } catch (err) {
          console.log(`No profile for ${address}`);
        }
      }

      setProfiles(profilesMap);
    } catch (error) {
      console.error('Failed to load proofs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (type) => {
    if (type === 'photo') {
      fileInputRef.current?.click();
    } else {
      videoInputRef.current?.click();
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setMediaFile(file);
    setMediaType('photo');
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleVideoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.floor(video.duration);

      setVideoDuration(duration);
      setMediaFile(file);
      setMediaType('video');
      setMediaPreview(URL.createObjectURL(file));

      const isAdmin = currentUser?.role === 'admin';

      if (isAdmin) {
        setTrimStart(0);
        setTrimEnd(duration);
        setShowTrimmer(false);
      } else {
        const maxDuration = subscription?.isActive ? 10 : 5;
        if (duration > maxDuration) {
          setTrimStart(0);
          setTrimEnd(maxDuration);
          setShowTrimmer(true);
        } else {
          setTrimStart(0);
          setTrimEnd(duration);
          setShowTrimmer(false);
        }
      }
    };

    video.src = URL.createObjectURL(file);
  };

  const handleTrimVideo = async () => {
    if (!trimmerVideoRef.current || !mediaFile) return;

    const maxDuration = subscription?.isActive ? 10 : 5;
    const duration = trimEnd - trimStart;

    if (duration > maxDuration) {
      alert(`Video must be ${maxDuration}s or less!`);
      return;
    }

    setUploadingMedia(true);

    try {
      const video = trimmerVideoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const stream = canvas.captureStream();

      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination);

      const audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setTrimmedBlob(blob);
        setMediaPreview(URL.createObjectURL(blob));
        setVideoDuration(trimEnd - trimStart);
        setShowTrimmer(false);
        setUploadingMedia(false);
        audioContext.close();
      };

      video.currentTime = trimStart;
      await new Promise(resolve => video.onseeked = resolve);

      mediaRecorder.start();
      video.play();

      const drawFrame = () => {
        if (video.currentTime >= trimEnd) {
          video.pause();
          mediaRecorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      };

      drawFrame();

    } catch (err) {
      console.error('Trim failed:', err);
      alert('Failed to trim video: ' + err.message);
      setUploadingMedia(false);
    }
  };

  const handleCreateProof = async () => {
    if (!window.kasware) {
      alert('❌ Please install Kasware wallet extension first');
      return;
    }

    if (!createData.amount || createData.amount <= 0) {
      alert('❌ Please enter a valid amount');
      return;
    }

    const isAdmin = currentUser?.role === 'admin';

    if (!isAdmin && mediaType === 'video' && !trimmedBlob) {
      const maxDuration = subscription?.isActive ? 10 : 5;
      if (videoDuration > maxDuration) {
        alert(`❌ Please trim your video to ${maxDuration}s or less`);
        return;
      }
    }

    setIsCreating(true);

    try {
      const accounts = await window.kasware.getAccounts();
      if (accounts.length === 0) {
        await window.kasware.requestAccounts();
        const newAccounts = await window.kasware.getAccounts();
        if (newAccounts.length === 0) {
          throw new Error('No Kasware accounts found');
        }
      }

      const walletAddress = accounts[0] || (await window.kasware.getAccounts())[0];

      const amountInSompi = Math.floor(createData.amount * 100000000);

      const txid = await window.kasware.sendKaspa(walletAddress, amountInSompi);

      if (!txid) {
        throw new Error('Transaction cancelled or failed');
      }

      let mediaUrl = null;

      if (mediaFile || trimmedBlob) {
        setUploadingMedia(true);

        try {
          const fileToUpload = trimmedBlob || mediaFile;

          const finalFile = fileToUpload instanceof Blob && !(fileToUpload instanceof File)
            ? new File([fileToUpload], `pol-video-${Date.now()}.webm`, { type: 'video/webm' })
            : fileToUpload;

          const uploadResponse = await base44.integrations.Core.UploadFile({
            file: finalFile
          });

          mediaUrl = uploadResponse.file_url;

        } catch (err) {
          console.error('Upload failed:', err);
          alert('❌ Failed to upload media: ' + err.message);
          setIsCreating(false);
          setUploadingMedia(false);
          return;
        }
        setUploadingMedia(false);
      }

      const aiCheck = {
        feeling: createData.feeling,
        sleep: createData.sleep,
        pain: createData.pain,
        medication: createData.medication,
        passed: createData.feeling >= 3 && !createData.pain && createData.medication,
        concerns: []
      };

      if (createData.feeling < 3) aiCheck.concerns.push('Low mood');
      if (!createData.sleep) aiCheck.concerns.push('Poor sleep');
      if (createData.pain) aiCheck.concerns.push('Pain reported');
      if (!createData.medication) aiCheck.concerns.push('Medication missed');

      // ✅ CRITICAL: Store UTC timestamp from server
      await base44.entities.ProofOfLife.create({
        user_email: currentUser?.email || 'anonymous',
        wallet_address: walletAddress,
        wallet_type: 'kasware_l1',
        tx_hash: txid,
        amount: createData.amount,
        message: createData.message || null,
        network: 'L1',
        proof_timestamp: new Date().toISOString(), // ✅ UTC timestamp
        likes: 0,
        is_verified: false,
        mood: createData.feeling,
        ai_wellness_check: aiCheck,
        streak_day: 1,
        media_type: mediaType,
        media_url: mediaUrl,
        video_duration: mediaType === 'video' ? videoDuration : null,
        ai_moderation: null,
        is_premium: subscription?.isActive || false
      });

      alert('✅ Proof of Life posted successfully!');

      setCreateData({
        amount: 1.0,
        message: '',
        feeling: 3,
        sleep: true,
        pain: false,
        medication: true
      });
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType('none');
      setVideoDuration(0);
      setTrimmedBlob(null);
      setShowTrimmer(false);
      setShowCreateModal(false);

      await loadData();

    } catch (err) {
      console.error('Creation failed:', err);

      if (err.message && err.message.toLowerCase().includes('reject')) {
        alert('❌ Transaction cancelled by user');
      } else {
        alert('❌ Failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsCreating(false);
      setUploadingMedia(false);
    }
  };

  const handleLike = async (proof, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (likedProofs.has(proof.id) || isCreating) return;

    try {
      await base44.entities.ProofOfLife.update(proof.id, {
        likes: (proof.likes || 0) + 1
      });

      setLikedProofs(prev => new Set([...prev, proof.id]));
      setProofs(prev => prev.map(p =>
        p.id === proof.id ? { ...p, likes: (p.likes || 0) + 1 } : p
      ));
    } catch (error) {
      console.error('Failed to like proof:', error);
    }
  };

  const openFullscreen = (proof) => {
    const videoProofs = proofs.filter(p => p.media_type === 'video' && p.media_url);
    const index = videoProofs.findIndex(p => p.id === proof.id);
    setReelStartIndex(index >= 0 ? index : 0);
    setShowReels(true);
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Activity className="w-8 h-8 text-gray-700 animate-pulse" />
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';
  const isPremium = subscription?.isActive;
  const maxDuration = isAdmin ? 999 : (isPremium ? 10 : 5);

  return (
    <>
      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .smooth-scroll {
          scroll-behavior: smooth;
        }
      `}</style>

      <div className="bg-black">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3" style={{ top: 'calc(var(--sat, 0px) + 7.5rem)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-white" />
              <h3 className="text-lg font-bold text-white">Proof of Life</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10 text-xs">
                {proofs.length} posts
              </Badge>
              {currentUser && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  size="sm"
                  className="bg-white text-black hover:bg-gray-200 h-8 px-3 text-xs font-semibold"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Post
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Feed - Hidden Scrollbar */}
        <div 
          className="overflow-y-auto hide-scrollbar smooth-scroll"
          style={{
            height: 'calc(100vh - 16rem)',
            marginTop: 'calc(var(--sat, 0px) + 7.5rem)',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {proofs.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Activity className="w-12 h-12 text-gray-800 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No posts yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {proofs.map((proof) => {
                const profile = profiles[proof.wallet_address];
                const aiCheck = proof.ai_wellness_check;

                return (
                  <article key={proof.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                    {/* User Header */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                          {profile?.agent_zk_photo ? (
                            <img src={profile.agent_zk_photo} alt={profile.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                              <Activity className="w-5 h-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {profile?.username ? (
                            <span className="font-bold text-white text-sm hover:underline cursor-pointer">
                              {profile.username}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-gray-400">
                              {truncateAddress(proof.wallet_address)}
                            </span>
                          )}
                          {aiCheck?.passed && (
                            <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10 text-xs px-1.5 py-0">
                              ✓ OK
                            </Badge>
                          )}
                          {proof.is_premium && (
                            <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10 text-xs px-1.5 py-0">
                              PRO
                            </Badge>
                          )}
                          <span className="text-gray-600 text-xs">·</span>
                          <span className="text-gray-600 text-xs">
                            {getTimeAgo(proof.created_date)}
                          </span>
                        </div>

                        {/* Message */}
                        {proof.message && (
                          <p className="text-white text-sm mb-3 break-words">
                            {proof.message}
                          </p>
                        )}

                        {/* Media */}
                        {proof.media_type === 'photo' && proof.media_url && (
                          <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 mb-3">
                            <img src={proof.media_url} alt="Proof" className="w-full max-h-[500px] object-cover" />
                          </div>
                        )}

                        {proof.media_type === 'video' && proof.media_url && (
                          <div
                            className="relative w-full rounded-2xl overflow-hidden border border-white/10 mb-3 group cursor-pointer bg-black"
                            onClick={() => openFullscreen(proof)}
                          >
                            <video
                              src={proof.media_url}
                              className="w-full max-h-[500px] object-contain bg-black"
                              preload="metadata"
                              playsInline
                              muted
                              poster=""
                              onLoadedMetadata={(e) => {
                                e.target.currentTime = 1;
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-all">
                              <Play className="w-16 h-16 text-white drop-shadow-lg" />
                            </div>
                            <div className="absolute top-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                              {proof.video_duration}s
                            </div>
                          </div>
                        )}

                        {/* Wellness Concerns */}
                        {aiCheck?.concerns && aiCheck.concerns.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-600">{aiCheck.concerns.join(', ')}</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between max-w-md -ml-2">
                          <button
                            className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-cyan-500/10 transition-colors group"
                            title="Comments"
                          >
                            <MessageCircle className="w-4 h-4 text-gray-600 group-hover:text-cyan-400" />
                            <span className="text-xs text-gray-600 group-hover:text-cyan-400">0</span>
                          </button>

                          <button
                            className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-green-500/10 transition-colors group"
                            title="Share"
                          >
                            <Share2 className="w-4 h-4 text-gray-600 group-hover:text-green-400" />
                          </button>

                          <button
                            onClick={(e) => handleLike(proof, e)}
                            disabled={likedProofs.has(proof.id)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-pink-500/10 transition-colors group touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            title="Like"
                          >
                            <Heart className={`w-4 h-4 ${likedProofs.has(proof.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-600 group-hover:text-pink-500'}`} />
                            <span className={`text-xs ${likedProofs.has(proof.id) ? 'text-pink-500' : 'text-gray-600 group-hover:text-pink-500'}`}>
                              {proof.likes || 0}
                            </span>
                          </button>

                          <button
                            className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-cyan-500/10 transition-colors group"
                            title="Bookmark"
                          >
                            <Bookmark className="w-4 h-4 text-gray-600 group-hover:text-cyan-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Proof of Life Reels */}
      <AnimatePresence>
        {showReels && (
          <ProofOfLifeReels
            videos={proofs.filter(p => p.media_type === 'video' && p.media_url)}
            initialIndex={reelStartIndex}
            onClose={() => setShowReels(false)}
            profiles={profiles}
          />
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => !isCreating && !showTrimmer && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar"
            >
              {/* Video Trimmer */}
              {showTrimmer && mediaPreview && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Trim Video</h3>
                      <p className="text-xs text-gray-600">Adjust to {maxDuration}s or less</p>
                    </div>
                    <Button
                      onClick={() => setShowTrimmer(false)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="bg-black rounded-lg p-4 mb-4">
                    <video
                      ref={trimmerVideoRef}
                      src={mediaPreview}
                      className="w-full rounded-lg mb-4"
                      controls
                    />

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-gray-500">Start Time</label>
                          <span className="text-xs text-white">{trimStart.toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={videoDuration}
                          step="0.1"
                          value={trimStart}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setTrimStart(val);
                            if (trimmerVideoRef.current) {
                              trimmerVideoRef.current.currentTime = val;
                            }
                          }}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-gray-500">End Time</label>
                          <span className="text-xs text-white">{trimEnd.toFixed(1)}s</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={videoDuration}
                          step="0.1"
                          value={trimEnd}
                          onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Duration:</span>
                          <span className={`font-bold ${
                            (trimEnd - trimStart) > maxDuration ? 'text-red-400' : 'text-white'
                          }`}>
                            {(trimEnd - trimStart).toFixed(1)}s / {maxDuration}s
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleTrimVideo}
                        disabled={uploadingMedia || (trimEnd - trimStart) > maxDuration}
                        className="w-full bg-white text-black hover:bg-gray-200 h-10"
                      >
                        {uploadingMedia ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Apply Trim
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Main Form */}
              {!showTrimmer && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Proof of Life
                        {isAdmin && (
                          <Crown className="w-4 h-4 text-white" />
                        )}
                      </h2>
                      <p className="text-xs text-gray-600">
                        {isAdmin ? 'Admin: Unlimited duration' : 'Daily check-in'}
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowCreateModal(false)}
                      disabled={isCreating}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Media Upload */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">
                        Photo or Video (optional)
                      </label>

                      {mediaPreview ? (
                        <div className="relative">
                          {mediaType === 'photo' ? (
                            <img src={mediaPreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                          ) : (
                            <>
                              <video src={mediaPreview} controls className="w-full h-40 object-cover rounded-lg" />
                              {!isAdmin && videoDuration > maxDuration && !trimmedBlob && (
                                <Button
                                  onClick={() => setShowTrimmer(true)}
                                  className="absolute top-2 right-2 bg-black/80 text-white hover:bg-black"
                                  size="sm"
                                >
                                  <Scissors className="w-4 h-4 mr-1" />
                                  Trim ({videoDuration}s → {maxDuration}s)
                                </Button>
                              )}
                              {isAdmin && videoDuration > 10 && (
                                <Badge className="absolute top-2 right-2 bg-white/20 text-white border-white/30">
                                  {videoDuration}s
                                </Badge>
                              )}
                            </>
                          )}
                          <Button
                            onClick={() => {
                              setMediaPreview(null);
                              setMediaFile(null);
                              setMediaType('none');
                              setTrimmedBlob(null);
                            }}
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 left-2 bg-black/80"
                          >
                            <X className="w-4 h-4 text-white" />
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleFileSelect('photo')}
                            className="flex flex-col items-center justify-center p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <Camera className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Photo</span>
                          </button>
                          <button
                            onClick={() => handleFileSelect('video')}
                            className="flex flex-col items-center justify-center p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <Video className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Video</span>
                            <span className="text-xs text-gray-600 mt-1">
                              {isAdmin ? 'Any duration' : `${maxDuration}s max`}
                            </span>
                          </button>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="hidden"
                      />
                    </div>

                    {/* Wellness Check */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Wellness Check</label>

                      <div className="bg-white/5 rounded-lg p-3 space-y-3">
                        <div>
                          <div className="text-xs text-gray-400 mb-2">How are you feeling? (1-5)</div>
                          <div className="flex gap-2">
                            {[1,2,3,4,5].map(val => (
                              <button
                                key={val}
                                onClick={() => setCreateData({...createData, feeling: val})}
                                className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all ${
                                  createData.feeling === val
                                    ? 'bg-white text-black scale-105'
                                    : 'bg-black border border-white/20 text-gray-500 hover:border-white/40'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setCreateData({...createData, sleep: !createData.sleep})}
                            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium transition-all ${
                              createData.sleep
                                ? 'bg-white text-black'
                                : 'bg-black border border-white/20 text-gray-500 hover:border-white/40'
                            }`}
                          >
                            <Moon className="w-3.5 h-3.5" />
                            Sleep
                          </button>

                          <button
                            onClick={() => setCreateData({...createData, pain: !createData.pain})}
                            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium transition-all ${
                              !createData.pain
                                ? 'bg-white text-black'
                                : 'bg-red-500/20 border border-red-500/50 text-red-300 hover:border-red-500/70'
                            }`}
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            {createData.pain ? 'Pain' : 'No Pain'}
                          </button>

                          <button
                            onClick={() => setCreateData({...createData, medication: !createData.medication})}
                            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium transition-all ${
                              createData.medication
                                ? 'bg-white text-black'
                                : 'bg-black border border-white/20 text-gray-500 hover:border-white/40'
                            }`}
                          >
                            <Pill className="w-3.5 h-3.5" />
                            Meds
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Amount (KAS)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={createData.amount}
                        onChange={(e) => setCreateData({...createData, amount: parseFloat(e.target.value) || 0})}
                        className="bg-black border-white/10 text-white h-10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Message</label>
                      <Input
                        value={createData.message}
                        onChange={(e) => setCreateData({...createData, message: e.target.value})}
                        placeholder="What's happening?"
                        className="bg-black border-white/10 text-white h-10"
                      />
                    </div>

                    <Button
                      onClick={handleCreateProof}
                      disabled={isCreating || uploadingMedia || (!isAdmin && mediaType === 'video' && videoDuration > maxDuration && !trimmedBlob)}
                      className="w-full bg-white text-black hover:bg-gray-200 h-10"
                    >
                      {uploadingMedia ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Post
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}