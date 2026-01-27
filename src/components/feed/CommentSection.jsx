import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Send, Loader2, Trash2, DollarSign, X, Wallet, Sparkles, CornerDownRight } from "lucide-react";
import { format } from "date-fns";
import TipModal from "@/components/TipModal";

export default function CommentSection({ postId, currentUser, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCommenting, setIsCommenting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});
  const [likedComments, setLikedComments] = useState(() => {
    const saved = localStorage.getItem('liked_comments');
    return saved ? JSON.parse(saved) : {};
  });
  const [tippingComment, setTippingComment] = useState(null);
  const [commenterTips, setCommenterTips] = useState({});
  const [zkIsResponding, setZkIsResponding] = useState(false);

  useEffect(() => {
    loadComments();
    if (currentUser) {
      loadUserCommentLikes();
    }
  }, [postId, currentUser?.email]);

  const loadUserCommentLikes = async () => {
    try {
      const likes = await base44.entities.CommentLike.filter({
        user_email: currentUser.email
      });
      const likesMap = {};
      likes.forEach(like => {
        likesMap[like.comment_id] = true;
      });
      setLikedComments(likesMap);
    } catch (err) {
      console.error('Failed to load comment likes:', err);
    }
  };

  useEffect(() => {
    if (comments.length > 0) {
      loadCommenterTips();
    }
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('liked_comments', JSON.stringify(likedComments));
  }, [likedComments]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const postComments = await base44.entities.PostComment.filter({
        post_id: postId
      }, '-created_date', 100);
      
      setComments(postComments);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getCommentReplies = (commentId) => {
    return comments.filter(c => c.parent_comment_id === commentId).sort((a, b) =>
      new Date(a.created_date) - new Date(b.created_date)
    );
  };

  const getMainComments = () => {
    return comments.filter(c => !c.parent_comment_id).sort((a, b) =>
      new Date(b.created_date) - new Date(a.created_date)
    );
  };

  const loadCommenterTips = async () => {
    try {
      const allTips = await base44.entities.TipTransaction.filter({
        post_id: postId,
        source: 'feed_comment'
      });

      const tipsMap = {};
      allTips.forEach(tip => {
        if (tip.recipient_wallet) {
          if (!tipsMap[tip.recipient_wallet]) {
            tipsMap[tip.recipient_wallet] = 0;
          }
          tipsMap[tip.recipient_wallet] += tip.amount || 0;
        }
      });

      setCommenterTips(tipsMap);
    } catch (err) {
      console.error('Failed to load commenter tips:', err);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    // Check if calling ZK bot
    const zkMatch = newComment.trim().match(/^@zk\s+(.+)/i);

    setIsCommenting(true);
    try {
      let authorName = '';
      let authorWalletAddress = '';

      // Try to get wallet address first
      if (window.kasware) {
        try {
          const accounts = await window.kasware.getAccounts();
          if (accounts && accounts.length > 0) {
            authorWalletAddress = accounts[0];
          }
        } catch (err) {
          console.log('Failed to get Kasware wallet:', err);
        }
      }

      // If user is logged in, use their details
      if (currentUser) {
        authorName = currentUser.username || '';
        authorWalletAddress = currentUser.created_wallet_address || authorWalletAddress;

        // Only use AgentZK username if no TTT username exists
        if (!authorName && authorWalletAddress) {
          try {
            const profiles = await base44.entities.AgentZKProfile.filter({
              wallet_address: authorWalletAddress
            });
            if (profiles.length > 0 && profiles[0].username) {
              authorName = profiles[0].username;
            }
          } catch (err) {
            console.log('No AgentZK profile found');
          }
        }

        // Fallback for logged in users
        if (!authorName) {
          authorName = authorWalletAddress 
            ? `${authorWalletAddress.slice(0, 6)}...${authorWalletAddress.slice(-4)}`
            : currentUser.email.split('@')[0];
        }
      } else {
        // Not logged in - use wallet address
        if (authorWalletAddress) {
          authorName = `${authorWalletAddress.slice(0, 6)}...${authorWalletAddress.slice(-4)}`;
        } else {
          alert('Please connect Kasware wallet to comment');
          setIsCommenting(false);
          return;
        }
      }

      const createdComment = await base44.entities.PostComment.create({
        post_id: postId,
        author_name: authorName,
        author_wallet_address: authorWalletAddress,
        comment_text: newComment.trim()
      });

      setNewComment("");
      
      if (onCommentAdded) {
        onCommentAdded();
      }

      // If @zk was mentioned anywhere, have it respond
      const zkMentioned = newComment.toLowerCase().includes('@zk');
      if (zkMentioned) {
        setZkIsResponding(true);

        try {
          // Get the post data to find images
          const post = await base44.entities.Post.filter({ id: postId });
          const imageUrls = post[0]?.media_files 
            ? post[0].media_files.filter(f => f.type === 'image').map(f => f.url)
            : (post[0]?.image_url ? [post[0].image_url] : []);

          // Call zkBot and wait for response (no polling, just wait)
          await base44.functions.invoke('zkBotRespond', { 
            post_id: postId,
            post_content: newComment.trim(),
            author_name: authorName,
            image_urls: imageUrls
          });

          // Single reload after bot completes
          await loadComments();
          if (onCommentAdded) onCommentAdded();
        } catch (err) {
          console.error('ZK bot failed:', err);
          await loadComments();
        } finally {
          setZkIsResponding(false);
        }
      } else {
        await loadComments();
      }
        } catch (err) {
        console.error('Failed to comment:', err);
        } finally {
        setIsCommenting(false);
        }
        };

        const handleReplyToComment = async (parentComment) => {
          if (!replyText.trim()) return;

          setIsCommenting(true);
          try {
            let authorName = '';
            let authorWalletAddress = '';

            // Try to get wallet address first
            if (window.kasware) {
              try {
                const accounts = await window.kasware.getAccounts();
                if (accounts && accounts.length > 0) {
                  authorWalletAddress = accounts[0];
                }
              } catch (err) {
                console.log('Failed to get Kasware wallet:', err);
              }
            }

            // If user is logged in, use their details
            if (currentUser) {
              authorName = currentUser.username || '';
              authorWalletAddress = currentUser.created_wallet_address || authorWalletAddress;

              if (!authorName && authorWalletAddress) {
                try {
                  const profiles = await base44.entities.AgentZKProfile.filter({
                    wallet_address: authorWalletAddress
                  });
                  if (profiles.length > 0 && profiles[0].username) {
                    authorName = profiles[0].username;
                  }
                } catch (err) {
                  console.log('No AgentZK profile found');
                }
              }

              if (!authorName) {
                authorName = authorWalletAddress 
                  ? `${authorWalletAddress.slice(0, 6)}...${authorWalletAddress.slice(-4)}`
                  : currentUser.email.split('@')[0];
              }
            } else {
              // Not logged in - use wallet address
              if (authorWalletAddress) {
                authorName = `${authorWalletAddress.slice(0, 6)}...${authorWalletAddress.slice(-4)}`;
              } else {
                alert('Please connect Kasware wallet to reply');
                setIsCommenting(false);
                return;
              }
            }

        await base44.entities.PostComment.create({
        post_id: postId,
        parent_comment_id: parentComment.id,
        author_name: authorName,
        author_wallet_address: authorWalletAddress,
        comment_text: replyText.trim()
        });

        // Update parent comment replies count
        await base44.entities.PostComment.update(parentComment.id, {
        replies_count: (parentComment.replies_count || 0) + 1
        });

        setReplyText("");
        setReplyingTo(null);

        if (onCommentAdded) {
        onCommentAdded();
        }

        await loadComments();
        } catch (err) {
        console.error('Failed to reply to comment:', err);
        } finally {
        setIsCommenting(false);
        }
        };

  const handleLikeComment = async (comment) => {
    if (!currentUser) {
      alert('Please login to like comments');
      return;
    }

    const isLiked = likedComments[comment.id];
    const newLikes = isLiked ? Math.max(0, (comment.likes || 0) - 1) : (comment.likes || 0) + 1;
    
    // Optimistic update
    setComments(comments.map(c => 
      c.id === comment.id ? { ...c, likes: newLikes } : c
    ));
    setLikedComments(prev => ({
      ...prev,
      [comment.id]: !isLiked
    }));
    
    try {
      if (isLiked) {
        // Unlike: delete CommentLike record
        const existingLikes = await base44.entities.CommentLike.filter({
          comment_id: comment.id,
          user_email: currentUser.email
        });
        if (existingLikes.length > 0) {
          await base44.entities.CommentLike.delete(existingLikes[0].id);
        }
      } else {
        // Like: create CommentLike record
        await base44.entities.CommentLike.create({
          comment_id: comment.id,
          user_email: currentUser.email,
          user_wallet: currentUser.created_wallet_address || ''
        });
      }

      // Update comment likes count using service role (bypasses RLS)
      const allLikes = await base44.entities.CommentLike.filter({ comment_id: comment.id });
      await base44.entities.PostComment.update(comment.id, {
        likes: allLikes.length
      });
    } catch (err) {
      console.error('Failed to like comment:', err);
      // Revert optimistic update
      setComments(comments.map(c => 
        c.id === comment.id ? { ...c, likes: comment.likes } : c
      ));
      setLikedComments(prev => ({
        ...prev,
        [comment.id]: isLiked
      }));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await base44.entities.PostComment.delete(commentId);
      await loadComments();
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleTipCommenter = (comment) => {
    if (!comment.author_wallet_address) {
      alert('This user has not connected a wallet yet');
      return;
    }
    setTippingComment(comment);
  };

  const handleTipSuccess = async () => {
    // Reload tips to update display
    await loadCommenterTips();
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      {/* ZK Responding Indicator */}
      <AnimatePresence>
        {zkIsResponding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-3 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-cyan-500/5 animate-pulse" style={{ animationDuration: '2s' }} />
            <div className="relative flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <div className="flex-1">
                <span className="text-cyan-400 text-sm font-medium">@zk analyzing...</span>
                <div className="text-white/40 text-xs mt-0.5">Searching web + processing context</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Input */}
      <div className="flex gap-2 mb-4">
        <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {currentUser?.username ? currentUser.username[0].toUpperCase() : 
           currentUser?.created_wallet_address ? currentUser.created_wallet_address.slice(-1).toUpperCase() :
           currentUser?.email ? currentUser.email[0].toUpperCase() : 'W'}
        </div>
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleComment()}
          placeholder={currentUser ? "Write a comment... (@zk to call ZK bot)" : "Connect wallet to comment..."}
          className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9"
          disabled={isCommenting}
        />
        <Button
          onClick={handleComment}
          disabled={isCommenting || !newComment.trim()}
          size="sm"
          className="bg-white/10 border border-white/20 text-white hover:bg-white/20 h-9 px-4"
        >
          {isCommenting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-4">
          <Loader2 className="w-5 h-5 text-white/40 animate-spin mx-auto" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-white/30 text-xs">No comments yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {getMainComments().map((comment) => {
              const replies = getCommentReplies(comment.id);

              return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {(comment.author_name || comment.commenter_name)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-white/80 text-sm font-semibold">{comment.author_name || comment.commenter_name || 'Anonymous'}</div>
                            {comment.author_wallet_address && (
                              <>
                                <code className="text-xs text-cyan-400">
                                  {comment.author_wallet_address.slice(0, 6)}...{comment.author_wallet_address.slice(-4)}
                                </code>
                                <button
                                  onClick={() => handleTipCommenter(comment)}
                                  className="p-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded transition-colors hover:scale-110 active:scale-95"
                                  title="Tip this commenter with KAS"
                                >
                                  <DollarSign className="w-3 h-3 text-green-400" />
                                </button>
                                {commenterTips[comment.author_wallet_address] > 0 && (
                                  <span className="text-xs text-green-400 font-semibold">
                                    {commenterTips[comment.author_wallet_address].toFixed(2)} KAS
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="text-white/30 text-xs">
                            {comment.created_date ? format(new Date(comment.created_date), 'MMM d, yyyy HH:mm') + ' UTC' : 'Unknown date'}
                          </div>
                        </div>
                        <p className="text-white text-sm mb-2">{comment.comment_text}</p>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : comment)}
                            variant="ghost"
                            size="sm"
                            className={`h-auto p-0 text-xs flex items-center gap-1 ${replyingTo?.id === comment.id ? 'text-cyan-400' : 'text-white/40 hover:text-cyan-400'}`}
                          >
                            <CornerDownRight className="w-3 h-3" />
                            Reply {comment.replies_count > 0 && `(${comment.replies_count})`}
                          </Button>
                          {comment.created_by === currentUser?.email && (
                            <Button
                              onClick={() => handleDeleteComment(comment.id)}
                              variant="ghost"
                              size="sm"
                              className="text-white/40 hover:text-red-400 h-auto p-0 text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reply Input */}
                  <AnimatePresence>
                    {replyingTo?.id === comment.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-11 mt-2"
                      >
                        <div className="bg-white/5 border border-cyan-500/30 rounded-lg p-3 border-l-2 border-l-cyan-500">
                          <div className="flex items-center gap-2 mb-2 text-xs text-cyan-400">
                            <CornerDownRight className="w-3 h-3" />
                            <span>Replying to {comment.author_name}</span>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleReplyToComment(comment)}
                              placeholder="Write a reply..."
                              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-sm"
                              disabled={isCommenting}
                              autoFocus
                            />
                            <Button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-white/40 hover:text-white h-8 px-2"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => handleReplyToComment(comment)}
                              disabled={isCommenting || !replyText.trim()}
                              size="sm"
                              className="bg-cyan-500 text-white hover:bg-cyan-600 h-8 px-3"
                            >
                              {isCommenting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Nested Replies */}
                  {replies.length > 0 && (
                    <div className="ml-11 mt-2 space-y-2 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/40 via-cyan-500/20 to-transparent" />

                      <AnimatePresence>
                        {(expandedReplies[comment.id] ? replies : replies.slice(0, 2)).map((reply) => (
                          <motion.div
                            key={reply.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="bg-white/5 border border-white/10 rounded-lg p-3 ml-3"
                          >
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {reply.author_name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="text-white/80 text-xs font-semibold">{reply.author_name || 'Anonymous'}</div>
                                  <div className="text-white/30 text-xs">
                                    {reply.created_date ? format(new Date(reply.created_date), 'MMM d, HH:mm') : ''}
                                  </div>
                                </div>
                                <p className="text-white text-xs mb-1">{reply.comment_text}</p>
                                {reply.created_by === currentUser?.email && (
                                  <Button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/30 hover:text-red-400 h-auto p-0 text-xs flex items-center gap-1"
                                  >
                                    <Trash2 className="w-2 h-2" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {replies.length > 2 && (
                        <Button
                          onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                          variant="ghost"
                          size="sm"
                          className="ml-3 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-auto p-2 text-xs"
                        >
                          {expandedReplies[comment.id] ? `Hide ${replies.length - 2} replies` : `Show ${replies.length - 2} more replies`}
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Tip Modal - Same as Feed Posts */}
      {tippingComment && (
        <TipModal
          isOpen={!!tippingComment}
          onClose={() => setTippingComment(null)}
          post={{
            author_name: tippingComment.author_name || tippingComment.commenter_name,
            author_wallet_address: tippingComment.author_wallet_address,
            created_by: tippingComment.created_by,
            id: postId
          }}
          currentUser={currentUser}
          onTipSuccess={handleTipSuccess}
          source="feed_comment"
        />
      )}
    </div>
  );
}