import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link as LinkIcon, ChevronUp, ChevronDown, Volume2, VolumeX, DollarSign, Copy, Check, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function ProofOfBullishReels({ videos, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [localVideos, setLocalVideos] = useState(videos);
  const [mutedStates, setMutedStates] = useState({});
  const [copied, setCopied] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [errorStates, setErrorStates] = useState({});

  const [currentUser, setCurrentUser] = useState(null);
  const videoRefs = useRef([]);
  const containerRef = useRef(null);

  useEffect(() => {
    loadUser();
  }, []);

  // Intersection Observer for auto-play
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const index = parseInt(video.dataset.index);
          
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setCurrentIndex(index);
            
            // Preload adjacent videos for smooth scrolling
            [index - 1, index, index + 1].forEach(i => {
              if (i >= 0 && i < localVideos.length && videoRefs.current[i]) {
                const adjacentVideo = videoRefs.current[i];
                if (adjacentVideo.readyState < 2) {
                  adjacentVideo.load();
                }
              }
            });
            
            video.muted = mutedStates[index] ?? false;
            video.play().catch(err => console.log('Play prevented:', err));
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [localVideos, mutedStates]);

  // Scroll to initial video on mount
  useEffect(() => {
    if (containerRef.current && videoRefs.current[initialIndex]) {
      setTimeout(() => {
        videoRefs.current[initialIndex]?.scrollIntoView({ behavior: 'instant', block: 'center' });
        const video = videoRefs.current[initialIndex];
        if (video) {
          setLoadingStates(prev => ({ ...prev, [initialIndex]: true }));
          // Mobile devices require muted autoplay
          video.muted = true;
          video.volume = 1;
          setMutedStates(prev => ({ ...prev, [initialIndex]: true }));
          video.load();
          
          // Try to play, handle mobile restrictions
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Auto-play started');
                setLoadingStates(prev => ({ ...prev, [initialIndex]: false }));
              })
              .catch(err => {
                console.log('Auto-play prevented, waiting for user interaction:', err);
                setLoadingStates(prev => ({ ...prev, [initialIndex]: false }));
                // Video will play when user scrolls/taps
              });
          }
        }
      }, 100);
    }
  }, [initialIndex]);

  const loadUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };



  const handleNext = () => {
    if (currentIndex < localVideos.length - 1 && videoRefs.current[currentIndex + 1]) {
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
      video.volume = 1;
      setMutedStates(prev => ({
        ...prev,
        [index]: video.muted
      }));
    }
  };





  const handleCopyAddress = async () => {
    const video = localVideos[currentIndex];
    try {
      await navigator.clipboard.writeText(video.kasware_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleTip = async () => {
    const video = localVideos[currentIndex];
    if (!video.kasware_address) {
      alert('No wallet address available');
      return;
    }

    if (typeof window.kasware === 'undefined') {
      alert('Kasware wallet not detected. Please install Kasware extension.');
      return;
    }

    try {
      const accounts = await window.kasware.getAccounts();
      if (accounts.length === 0) {
        await window.kasware.requestAccounts();
      }

      const amount = prompt('Enter tip amount in KAS:', '1');
      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return;
      }

      const tipAmountKAS = parseFloat(amount);
      const txid = await window.kasware.sendKaspa(
        video.kasware_address,
        Math.floor(tipAmountKAS * 100000000)
      );

      // Get tipper info
      const senderWallet = accounts[0];
      const senderName = currentUser?.username || `${senderWallet.substring(0, 8)}...`;
      const recipientName = video.kasware_address?.substring(0, 8) + '...';

      // Record tip transaction with EMAIL tracking for cross-wallet aggregation
      await base44.entities.TipTransaction.create({
        sender_wallet: senderWallet,
        sender_email: currentUser?.email || null,
        sender_name: senderName,
        recipient_wallet: video.kasware_address,
        recipient_email: video.created_by || null,
        recipient_name: recipientName,
        amount: tipAmountKAS,
        tx_hash: typeof txid === 'string' ? txid : txid?.id,
        reel_id: video.id,
        source: 'reel'
      });

      // Update local state only (no DB update to avoid permission errors)
      setLocalVideos(localVideos.map(v => 
        v.id === video.id 
          ? { ...v, tips_received: (v.tips_received || 0) + tipAmountKAS }
          : v
      ));

      // Track Bull Tips by EMAIL - SENDER and get updated total
      let totalBullTipsSent = tipAmountKAS;
      if (currentUser?.email) {
        const senderStats = await base44.entities.UserTipStats.filter({ user_email: currentUser.email });
        if (senderStats.length > 0) {
          totalBullTipsSent = (senderStats[0].bull_tips_sent || 0) + tipAmountKAS;
          await base44.entities.UserTipStats.update(senderStats[0].id, {
            bull_tips_sent: totalBullTipsSent,
            username: senderName
          });
        } else {
          await base44.entities.UserTipStats.create({
            user_email: currentUser.email,
            username: senderName,
            feed_tips_sent: 0,
            feed_tips_received: 0,
            bull_tips_sent: tipAmountKAS,
            bull_tips_received: 0
          });
        }
      }

      // Track Bull Tips by EMAIL - RECIPIENT
      if (video.created_by) {
        const recipientStats = await base44.entities.UserTipStats.filter({ user_email: video.created_by });
        if (recipientStats.length > 0) {
          await base44.entities.UserTipStats.update(recipientStats[0].id, {
            bull_tips_received: (recipientStats[0].bull_tips_received || 0) + tipAmountKAS,
            username: recipientName
          });
        } else {
          await base44.entities.UserTipStats.create({
            user_email: video.created_by,
            username: recipientName,
            feed_tips_sent: 0,
            feed_tips_received: 0,
            bull_tips_sent: 0,
            bull_tips_received: tipAmountKAS
          });
        }
      }

      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-black/95 backdrop-blur-xl border border-white/20 text-white rounded-xl p-4 shadow-2xl z-[1000] max-w-xs';
      notification.innerHTML = `
        <div class="flex items-center gap-2 mb-3">
          <div class="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-sm">✓</span>
          </div>
          <h3 class="font-bold text-sm">Bull Tip sent!</h3>
        </div>
        <div class="space-y-1.5 text-xs text-white/60">
          <div class="flex justify-between gap-3">
            <span>This Tip:</span>
            <span class="text-white font-semibold">${tipAmountKAS} KAS</span>
          </div>
          <div class="flex justify-between gap-3">
            <span>Total Bull Tips:</span>
            <span class="text-cyan-400 font-bold">${totalBullTipsSent.toFixed(2)} KAS</span>
          </div>
          <div class="flex justify-between gap-3">
            <span>To:</span>
            <span class="text-white font-semibold truncate">${recipientName}</span>
          </div>
          <div class="flex justify-between gap-3">
            <span>Tx:</span>
            <span class="text-white font-mono text-[10px] truncate">${(typeof txid === 'string' ? txid : txid?.id).substring(0, 12)}...</span>
          </div>
        </div>
        <button onclick="this.parentElement.remove()" class="mt-3 w-full bg-white/5 hover:bg-white/10 rounded-lg py-1.5 text-xs font-medium transition-colors border border-white/10">
          OK
        </button>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);
    } catch (err) {
      console.error('Tip failed:', err);
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 z-[200] bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-3 rounded-lg shadow-lg';
      notification.textContent = 'Tip failed: ' + (err.message || 'Please try again');
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
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

  useEffect(() => {
    console.log('🎥 ProofOfBullishReels mounted with', videos.length, 'videos');
    console.log('📍 Starting at index:', initialIndex);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-[100]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-full text-white hover:bg-black transition-colors border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* TikTok-style snap scroll container */}
        <div 
          ref={containerRef}
          className="h-screen overflow-y-scroll overflow-x-hidden snap-y snap-mandatory"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y'
          }}
        >
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {localVideos.map((video, index) => (
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
                preload={Math.abs(index - initialIndex) <= 1 ? "auto" : "none"}
                webkit-playsinline="true"
                x5-video-player-type="h5"
                x5-video-player-fullscreen="true"
                x5-playsinline="true"
                crossOrigin="anonymous"
                className="w-full h-full object-contain bg-black cursor-pointer"
                onLoadStart={() => {
                  setLoadingStates(prev => ({ ...prev, [index]: true }));
                }}
                onLoadedData={() => {
                  setLoadingStates(prev => ({ ...prev, [index]: false }));
                  setErrorStates(prev => ({ ...prev, [index]: false }));
                }}
                onCanPlay={() => {
                  setLoadingStates(prev => ({ ...prev, [index]: false }));
                  setErrorStates(prev => ({ ...prev, [index]: false }));
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                  setLoadingStates(prev => ({ ...prev, [index]: false }));
                  setErrorStates(prev => ({ ...prev, [index]: true }));
                }}
                onWaiting={() => {
                  setLoadingStates(prev => ({ ...prev, [index]: true }));
                }}
                onPlaying={() => {
                  setLoadingStates(prev => ({ ...prev, [index]: false }));
                }}
                onClick={(e) => {
                  const vid = e.target;
                  if (vid.paused) {
                    vid.play().catch(err => console.log('Play error:', err));
                  } else {
                    vid.pause();
                  }
                }}
              />

              {/* Loading Spinner */}
              {loadingStates[index] && !errorStates[index] && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
                  <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {/* Error State */}
              {errorStates[index] && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none">
                  <div className="text-center px-4">
                    <div className="text-white/60 text-sm mb-2">Video failed to load</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const vid = videoRefs.current[index];
                        if (vid) {
                          setErrorStates(prev => ({ ...prev, [index]: false }));
                          setLoadingStates(prev => ({ ...prev, [index]: true }));
                          vid.load();
                        }
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-xs pointer-events-auto"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}



              {/* Gradient overlays */}
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" style={{ height: 'max(12rem, calc(12rem + env(safe-area-inset-bottom, 0px)))' }} />
              
              {/* Invisible click barrier over video to prevent it from capturing button clicks */}
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 35 }} />

              {/* Video info */}
              <div className="absolute bottom-0 left-0 right-0 px-4 text-white pointer-events-auto" style={{ paddingBottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom, 0px)))', zIndex: 45 }}>
                <p className="text-sm mb-2 line-clamp-2">{video.message}</p>

                <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                  <span className="font-mono">
                    {video.kasware_address?.substring(0, 8)}...
                    {video.kasware_address?.substring(video.kasware_address.length - 6)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(video.kasware_address);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  {video.proof_link && (
                    <button
                      type="button"
                      onClick={() => setShowLinkModal(true)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="View proof link"
                    >
                      <Globe className="w-3 h-3 text-blue-400" />
                    </button>
                  )}
                  <span>•</span>
                  <span>{new Date(video.created_date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {video.transaction_hash && (
                    <a
                      href={`https://kas.fyi/transaction/${video.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:underline font-mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LinkIcon className="w-3 h-3" />
                      kas.fyi/transaction/{video.transaction_hash.substring(0, 8)}...
                    </a>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/ProofOfBullish?proof=${video.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      const notification = document.createElement('div');
                      notification.className = 'fixed top-4 left-4 z-[200] bg-black border border-cyan-500/50 text-cyan-400 px-4 py-3 rounded-lg shadow-lg';
                      notification.textContent = '🔗 Reel link copied!';
                      document.body.appendChild(notification);
                      setTimeout(() => notification.remove(), 2000);
                    }}
                    className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="absolute right-4 flex flex-col gap-3 pointer-events-auto" style={{ bottom: 'max(6rem, calc(6rem + env(safe-area-inset-bottom, 0px)))', zIndex: 50 }}>
                {/* Up Arrow - Above Heart */}
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
                  type="button"
                  onClick={handleTip}
                  className="flex flex-col items-center gap-1 text-white touch-manipulation active:scale-90"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform border border-green-500/30">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-xs font-semibold">Tip</span>
                </button>



                {/* Volume Control */}
                <button
                  type="button"
                  onClick={() => toggleMute(index)}
                  className="flex flex-col items-center gap-1 text-white touch-manipulation active:scale-90"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                    {mutedStates[index] ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </div>
                </button>

                {/* Down Arrow - Below Volume */}
                {index < localVideos.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex flex-col items-center gap-1 text-white lg:hidden touch-manipulation active:scale-90"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform">
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </button>
                )}
              </div>

              {/* Navigation arrows - Desktop only - Right side floating inside video */}
              <div className="hidden lg:flex absolute right-20 top-1/2 -translate-y-1/2 flex-col gap-3 z-30">
                {currentIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                )}

                {currentIndex < localVideos.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-8 h-8 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </div>


            </div>
          ))}
        </div>

        {/* Proof Link Modal */}
        {showLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
            onClick={() => setShowLinkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
              >
              <h3 className="text-white text-lg font-bold mb-4">Proof Link</h3>
              <a
                href={localVideos[currentIndex]?.proof_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg text-center font-semibold transition-colors mb-3"
              >
                Open Link
                </a>
                <p className="text-white/60 text-sm break-all mb-4">
                {localVideos[currentIndex]?.proof_link}
              </p>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}

      </motion.div>
    </AnimatePresence>
  );
}