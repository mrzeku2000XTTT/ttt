import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, MessageCircle, Send, DollarSign, Copy, X, 
  Sparkles, Volume2, VolumeX, Pause, Play, Loader2,
  ArrowLeft, Share2, MoreVertical
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import TimeDisplay, { formatPostTime } from "@/components/TimeDisplay";

export default function ReelsViewer({ posts, user, onClose, onLike, onOpenTip, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCounts, setCommentCounts] = useState({});
  const videoRefs = useRef([]);
  const containerRef = useRef(null);

  // Filter posts with media (videos or images)
  const mediaPosts = posts.filter(p => 
    p.media_files?.some(m => m.type === 'video' || m.type === 'image') || 
    p.image_url
  );

  const currentPost = mediaPosts[currentIndex];

  useEffect(() => {
    if (showComments && currentPost) {
      loadComments();
    }
  }, [showComments, currentPost]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const postComments = await base44.entities.PostComment.filter({
        post_id: currentPost.id
      }, '-created_date');
      setComments(postComments);
      setCommentCounts(prev => ({
        ...prev,
        [currentPost.id]: postComments.length
      }));
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    if (!user) {
      alert('Please log in to comment');
      return;
    }

    try {
      const commenterName = user.username || 
                           (user.created_wallet_address 
                             ? `Agent-${user.created_wallet_address.slice(-8)}` 
                             : user.email.split('@')[0]);

      await base44.entities.PostComment.create({
        post_id: currentPost.id,
        comment_text: newComment,
        author_name: commenterName,
        commenter_name: commenterName,
        commenter_email: user.email
      });

      await base44.entities.Post.update(currentPost.id, {
        comments_count: (currentPost.comments_count || 0) + 1
      });

      setNewComment('');
      loadComments();
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment: ' + err.message);
    }
  };

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
      if (e.key === 'ArrowUp') {
        goToPrevious();
      } else if (e.key === 'ArrowDown') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const goToNext = () => {
    if (currentIndex < mediaPosts.length - 1) {
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

    if (isSwipeUp) {
      goToNext();
    } else if (isSwipeDown) {
      goToPrevious();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleWheel = (e) => {
    if (Math.abs(e.deltaY) > 10) {
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  const handleCopyLink = () => {
    const link = `https://tttz.xyz/#/Feed?post=${currentPost.id}`;
    navigator.clipboard.writeText(link);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const togglePlayPause = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      if (isPaused) {
        video.play();
      } else {
        video.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  const getMediaUrl = (post) => {
    if (post.media_files?.length > 0) {
      const media = post.media_files.find(m => m.type === 'video' || m.type === 'image');
      return media?.url;
    }
    return post.image_url;
  };

  const getMediaType = (post) => {
    if (post.media_files?.length > 0) {
      const media = post.media_files.find(m => m.type === 'video' || m.type === 'image');
      return media?.type;
    }
    return post.image_url ? 'image' : null;
  };

  if (mediaPosts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">No media posts to display</p>
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
          <div className="text-white font-bold">TTT Reels</div>
          <div className="w-10" />
        </div>
      </div>

      {/* Main Content Snap Scroll */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Media Display */}
          {getMediaType(currentPost) === 'video' ? (
            <video
              ref={(el) => videoRefs.current[currentIndex] = el}
              src={getMediaUrl(currentPost)}
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
          ) : (
            <img
              src={getMediaUrl(currentPost)}
              alt="Post"
              className="w-full h-full object-cover"
              onClick={togglePlayPause}
              style={{
                width: '100vw',
                height: '100vh',
                objectFit: 'cover'
              }}
            />
          )}

          {/* Play/Pause Overlay */}
          {isPaused && getMediaType(currentPost) === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-white ml-2" />
              </div>
            </div>
          )}

          {/* Bottom Info & Actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-6 px-4">
            <div className="flex items-end gap-4">
              {/* Left: Post Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 bg-white/10 border-2 border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {currentPost.author_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">
                      {currentPost.author_name}
                    </div>
                    <div className="text-white/60 text-xs">
                      <TimeDisplay date={currentPost.created_date} />
                    </div>
                  </div>
                </div>

                {currentPost.content && (
                  <p className="text-white text-sm mb-2 line-clamp-2 leading-relaxed">
                    {currentPost.content}
                  </p>
                )}

                {currentPost.is_stamped && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    STAMPED
                  </Badge>
                )}
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!user) {
                      alert('Please log in to like posts');
                      return;
                    }
                    onLike(currentPost, e);
                  }}
                  className="flex flex-col items-center gap-1 text-white hover:text-red-400 transition-colors"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold">{currentPost.likes || 0}</span>
                </button>

                <button 
                  onClick={() => setShowComments(true)}
                  className="flex flex-col items-center gap-1 text-white hover:text-cyan-400 transition-colors"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold">{commentCounts[currentPost.id] ?? currentPost.comments_count ?? 0}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-1 text-white hover:text-green-400 transition-colors"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    {showCopied ? <Sparkles className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                  </div>
                  <span className="text-xs font-bold">{showCopied ? '✓' : 'Copy'}</span>
                </button>

                {currentPost.author_wallet_address && currentPost.created_by !== user?.email && (
                  <button
                    onClick={() => onOpenTip(currentPost)}
                    className="flex flex-col items-center gap-1 text-white hover:text-yellow-400 transition-colors"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    {currentPost.tips_received > 0 && (
                      <span className="text-xs font-bold">{currentPost.tips_received.toFixed(1)}</span>
                    )}
                  </button>
                )}

                {getMediaType(currentPost) === 'video' && (
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="flex flex-col items-center gap-1 text-white hover:text-cyan-400 transition-colors"
                  >
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                      {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="absolute top-20 left-4 right-4 flex gap-1">
            {mediaPosts.map((_, idx) => (
              <div
                key={idx}
                className={`h-0.5 flex-1 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Swipe Hint on First Post */}
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

      {/* Comments Modal */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-0 bg-black z-[101] flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-bold text-lg">Comments</h3>
              <Button
                onClick={() => setShowComments(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: '200px', maxHeight: 'calc(100vh - 250px)' }}>
              {loadingComments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageCircle className="w-12 h-12 text-white/30 mb-3" />
                  <p className="text-white text-sm font-medium mb-1">No comments yet</p>
                  <p className="text-white/50 text-xs">Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(comment.commenter_name || comment.author_name)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-white font-semibold text-sm">
                          {comment.commenter_name || comment.author_name || 'Anonymous'}
                        </span>
                        <span className="text-white/40 text-xs">
                          <TimeDisplay date={comment.created_date} />
                        </span>
                      </div>
                      <p className="text-white/90 text-sm">{comment.comment_text || comment.comment || 'No comment text'}</p>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Input - Fixed at bottom */}
            <div className="sticky bottom-0 p-4 border-t border-white/10 bg-black" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}>
              {user ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Add a comment..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-cyan-500 text-base"
                    style={{ fontSize: '16px' }}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 h-12 px-4"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-white/60 text-sm">Log in to comment</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}