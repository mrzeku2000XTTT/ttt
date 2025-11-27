import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ArrowLeft, Volume2, VolumeX, Activity, X, Share2, Bookmark, Play, Pause
} from "lucide-react";
import TimeDisplay from "@/components/TimeDisplay";

export default function POLVideoViewer({ proofs, initialIndex = 0, onClose, profiles }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [likedProofs, setLikedProofs] = useState(new Set());
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const videoRefs = useRef([]);
  const containerRef = useRef(null);

  // Filter only video proofs
  const videoProofs = proofs.filter(p => p.media_type === 'video' && p.media_url);
  const currentProof = videoProofs[currentIndex];
  const profile = profiles[currentProof?.wallet_address];

  useEffect(() => {
    // Auto-play current video
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.muted = isMuted;
      if (!isPaused) {
        currentVideo.play().catch(err => console.log('Autoplay prevented:', err));
      }
    }

    // Pause other videos
    videoRefs.current.forEach((video, idx) => {
      if (video && idx !== currentIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, isMuted, isPaused]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') goToPrevious();
      else if (e.key === 'ArrowDown') goToNext();
      else if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const goToNext = () => {
    if (currentIndex < videoProofs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
    setTouchEnd(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > 100;
    const isSwipeDown = distance < -100;

    if (isSwipeUp) goToNext();
    else if (isSwipeDown) goToPrevious();

    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleWheel = (e) => {
    if (Math.abs(e.deltaY) > 10) {
      if (e.deltaY > 0) goToNext();
      else goToPrevious();
    }
  };

  const togglePlayPause = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      if (isPaused) video.play();
      else video.pause();
      setIsPaused(!isPaused);
    }
  };

  const handleLike = async (proof) => {
    if (likedProofs.has(proof.id)) return;

    try {
      await base44.entities.ProofOfLife.update(proof.id, {
        likes: (proof.likes || 0) + 1
      });

      setLikedProofs(prev => new Set([...prev, proof.id]));
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  if (videoProofs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">No video proofs to display</p>
          <Button onClick={onClose} className="bg-white/10 hover:bg-white/20">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-[100] overflow-hidden"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        touchAction: 'pan-y'
      }}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-8 px-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 h-10 w-10 p-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-white font-bold">Proof of Life</div>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Video Display */}
          <video
            ref={(el) => videoRefs.current[currentIndex] = el}
            src={currentProof.media_url}
            className="w-full h-full object-cover"
            loop
            playsInline
            onClick={togglePlayPause}
            style={{
              width: '100vw',
              height: '100vh',
              objectFit: 'cover'
            }}
          />

          {/* Play/Pause Overlay */}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-white ml-2" />
              </div>
            </div>
          )}

          {/* Bottom Info & Actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-6 px-4">
            <div className="flex items-end gap-4">
              {/* Left: User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30">
                    {profile?.agent_zk_photo ? (
                      <img src={profile.agent_zk_photo} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-base truncate">
                      {profile?.username || truncateAddress(currentProof.wallet_address)}
                    </div>
                    <div className="text-white/60 text-sm flex items-center gap-2">
                      <TimeDisplay date={currentProof.created_date} />
                      {currentProof.ai_wellness_check?.passed && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-1.5 py-0">
                          ✓ OK
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {currentProof.message && (
                  <p className="text-white text-sm mb-2 line-clamp-2 leading-relaxed">
                    {currentProof.message}
                  </p>
                )}

                {currentProof.ai_wellness_check?.concerns?.length > 0 && (
                  <p className="text-yellow-400 text-xs mb-2">
                    ⚠️ {currentProof.ai_wellness_check.concerns.join(', ')}
                  </p>
                )}
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => handleLike(currentProof)}
                  disabled={likedProofs.has(currentProof.id)}
                  className="flex flex-col items-center gap-1 text-white hover:text-pink-400 transition-colors"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Heart className={`w-6 h-6 ${likedProofs.has(currentProof.id) ? 'fill-pink-500 text-pink-500' : ''}`} />
                  </div>
                  <span className="text-xs font-bold">{currentProof.likes || 0}</span>
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex flex-col items-center gap-1 text-white hover:text-cyan-400 transition-colors"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </div>
                </button>

                <button className="flex flex-col items-center gap-1 text-white hover:text-green-400 transition-colors">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Share2 className="w-6 h-6" />
                  </div>
                </button>

                <button className="flex flex-col items-center gap-1 text-white hover:text-cyan-400 transition-colors">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Bookmark className="w-6 h-6" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="absolute top-20 left-4 right-4 flex gap-1">
            {videoProofs.map((_, idx) => (
              <div
                key={idx}
                className={`h-0.5 flex-1 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Swipe Hint on First Video */}
          {currentIndex === 0 && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -20 }}
              transition={{ delay: 2, duration: 1 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="bg-black/70 backdrop-blur-sm rounded-full px-6 py-3 text-white text-sm font-semibold">
                ↑ Swipe up for next ↑
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}