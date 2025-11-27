import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ChevronUp, ChevronDown, Volume2, VolumeX, Share2, DollarSign, Copy, Check, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";

const getTimeAgo = (timestamp) => {
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffMs = now.getTime() - postDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return `${diffSeconds}s`;
  else if (diffMinutes < 60) return `${diffMinutes}m`;
  else if (diffHours < 24) return `${diffHours}h`;
  else return `${diffDays}d`;
};

export default function ProofOfLifeReels({ videos, initialIndex = 0, onClose, profiles }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [userLikes, setUserLikes] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [mutedStates, setMutedStates] = useState({});
  const [copied, setCopied] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [volumes, setVolumes] = useState({});
  const videoRefs = useRef([]);
  const containerRef = useRef(null);

  // Initialize like counts from videos
  useEffect(() => {
    const counts = {};
    videos.forEach(v => {
      counts[v.id] = v.likes || 0;
    });
    setLikeCounts(counts);
  }, [videos]);

  // Intersection Observer for auto-play
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const index = parseInt(video.dataset.index);
          
          if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
            setCurrentIndex(index);
            video.muted = mutedStates[index] || false;
            video.play().catch(err => console.log('Auto-play prevented:', err));
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.75 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [videos, mutedStates]);

  // Scroll to initial video on mount
  useEffect(() => {
    if (containerRef.current && videoRefs.current[initialIndex]) {
      videoRefs.current[initialIndex].scrollIntoView({ behavior: 'instant' });
    }
  }, [initialIndex]);

  const handleNext = () => {
    if (currentIndex < videos.length - 1 && videoRefs.current[currentIndex + 1]) {
      videoRefs.current[currentIndex + 1].scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0 && videoRefs.current[currentIndex - 1]) {
      videoRefs.current[currentIndex - 1].scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleMute = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      video.muted = !video.muted;
      setMutedStates(prev => ({
        ...prev,
        [index]: video.muted
      }));
    }
  };

  const handleVolumeChange = (index, value) => {
    const video = videoRefs.current[index];
    if (video) {
      video.volume = value;
      setVolumes(prev => ({
        ...prev,
        [index]: value
      }));
      if (value === 0) {
        video.muted = true;
        setMutedStates(prev => ({ ...prev, [index]: true }));
      } else if (video.muted) {
        video.muted = false;
        setMutedStates(prev => ({ ...prev, [index]: false }));
      }
    }
  };

  const handleLike = async () => {
    const video = videos[currentIndex];
    if (userLikes.has(video.id)) return;

    try {
      const newCount = (likeCounts[video.id] || video.likes || 0) + 1;
      
      await base44.entities.ProofOfLife.update(video.id, {
        likes: newCount
      });
      
      setUserLikes(new Set([...userLikes, video.id]));
      setLikeCounts(prev => ({
        ...prev,
        [video.id]: newCount
      }));
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleShare = async () => {
    const video = videos[currentIndex];
    const shareUrl = `${window.location.origin}${window.location.pathname}?pol=${video.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Proof of Life - TTT',
          text: video.message || 'Check out this proof of life!',
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleCopyAddress = async () => {
    const video = videos[currentIndex];
    try {
      await navigator.clipboard.writeText(video.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') handlePrev();
      if (e.key === 'ArrowDown') handleNext();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-[100]"
      >
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-full text-white hover:bg-black transition-colors border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* TikTok-style snap scroll container */}
        <div 
          ref={containerRef}
          className="h-screen overflow-y-scroll snap-y snap-mandatory"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {videos.map((video, index) => {
            const profile = profiles[video.wallet_address];
            const aiCheck = video.ai_wellness_check;

            return (
              <div
                key={video.id}
                className="h-screen w-screen snap-start snap-always relative bg-black flex items-center justify-center"
              >
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  data-index={index}
                  src={video.media_url}
                  loop
                  playsInline
                  preload="auto"
                  className="w-full h-full object-contain"
                  onClick={(e) => {
                    // Only toggle play/pause if clicking directly on video, not on buttons
                    if (e.target === e.currentTarget) {
                      const vid = e.target;
                      if (vid.paused) {
                        vid.play();
                      } else {
                        vid.pause();
                      }
                    }
                  }}
                />

                {/* Gradient overlays - ALWAYS pointer-events-none to not block buttons */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" style={{ height: 'max(12rem, calc(12rem + env(safe-area-inset-bottom, 0px)))' }} />
                
                {/* Invisible click barrier over video to prevent it from capturing button clicks */}
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 35 }} />

                {/* Video info */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 text-white pointer-events-auto" style={{ paddingBottom: 'max(7rem, calc(7rem + env(safe-area-inset-bottom, 0px)))', zIndex: 45 }}>
                  {/* User info */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                      {profile?.agent_zk_photo ? (
                        <img src={profile.agent_zk_photo} alt={profile.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {profile?.username || truncateAddress(video.wallet_address)}
                        </span>
                        {aiCheck?.passed && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">✓ OK</span>
                        )}
                        {video.is_premium && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">PRO</span>
                        )}
                      </div>
                      <div className="text-xs text-white/60">
                        {getTimeAgo(video.created_date)}
                      </div>
                    </div>
                  </div>

                  {video.message && (
                    <p className="text-sm mb-2 line-clamp-2">{video.message}</p>
                  )}

                  {aiCheck?.concerns && aiCheck.concerns.length > 0 && (
                    <p className="text-xs text-yellow-400 mb-2">
                      ⚠️ {aiCheck.concerns.join(', ')}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                    <span className="font-mono">
                      {truncateAddress(video.wallet_address)}
                    </span>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      {copied ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    {video.tx_hash && (
                      <>
                        <span>•</span>
                        <a
                          href={`https://kas.fyi/transaction/${video.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          TX: {video.tx_hash.substring(0, 8)}...
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="absolute right-4 flex flex-col gap-3 pointer-events-auto" style={{ bottom: 'max(8rem, calc(8rem + env(safe-area-inset-bottom, 0px)))', zIndex: 50 }}>
                  {/* Up Arrow */}
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePrev();
                      }}
                      className="flex flex-col items-center gap-1 text-white lg:hidden touch-manipulation active:scale-90"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <div className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                        <ChevronUp className="w-5 h-5" />
                      </div>
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!userLikes.has(video.id)) {
                        handleLike();
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    disabled={userLikes.has(video.id)}
                    className={`flex flex-col items-center gap-1 transition-all touch-manipulation active:scale-90 ${
                      userLikes.has(video.id) ? 'text-red-500' : 'text-white'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                      <Heart className={`w-6 h-6 ${userLikes.has(video.id) ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-xs font-semibold">{likeCounts[video.id] ?? video.likes ?? 0}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleShare();
                    }}
                    className="flex flex-col items-center gap-1 text-white touch-manipulation active:scale-90"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold">Share</span>
                  </button>

                  {/* Volume Control */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.innerWidth < 1024) {
                          toggleMute(index);
                        } else {
                          setShowVolumeSlider(!showVolumeSlider);
                        }
                      }}
                      className="flex flex-col items-center gap-1 text-white touch-manipulation active:scale-90"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                        {mutedStates[index] ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </div>
                    </button>
                    
                    {/* Volume Slider for Desktop */}
                    {showVolumeSlider && window.innerWidth >= 1024 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2"
                      >
                        <VolumeX className="w-4 h-4" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volumes[index] || 1}
                          onChange={(e) => handleVolumeChange(index, parseFloat(e.target.value))}
                          className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, white ${((volumes[index] || 1) * 100)}%, rgba(255,255,255,0.2) ${((volumes[index] || 1) * 100)}%)`
                          }}
                        />
                        <Volume2 className="w-4 h-4" />
                      </motion.div>
                    )}
                  </div>

                  {/* Down Arrow */}
                  {index < videos.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNext();
                      }}
                      className="flex flex-col items-center gap-1 text-white lg:hidden touch-manipulation active:scale-90"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <div className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </button>
                  )}
                </div>

                {/* Navigation arrows - Desktop only */}
                <div className="hidden lg:flex absolute right-20 top-1/2 -translate-y-1/2 flex-col gap-3 z-30">
                  {index > 0 && (
                    <button
                      onClick={handlePrev}
                      className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  )}

                  {index < videos.length - 1 && (
                    <button
                      onClick={handleNext}
                      className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Progress indicator */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {videos.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-all ${
                        idx === index
                          ? 'w-6 bg-white'
                          : idx < index
                          ? 'w-3 bg-white/50'
                          : 'w-3 bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}