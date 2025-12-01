import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Send, Loader2, Trash2, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function CommentSection({ postId, currentUser, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCommenting, setIsCommenting] = useState(false);
  const [likedComments, setLikedComments] = useState(() => {
    const saved = localStorage.getItem('liked_comments');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    loadComments();
  }, [postId]);

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

  const handleComment = async () => {
    if (!newComment.trim()) return;

    // Check if calling ZK bot
    const zkMatch = newComment.trim().match(/^@zk\s+(.+)/i);

    setIsCommenting(true);
    try {
      // Try to get AgentZK profile
      let authorName = currentUser.username;
      let authorWalletAddress = currentUser.created_wallet_address || '';

      if (currentUser.created_wallet_address) {
        try {
          const profiles = await base44.entities.AgentZKProfile.filter({
            wallet_address: currentUser.created_wallet_address
          });
          if (profiles.length > 0 && profiles[0].username) {
            authorName = profiles[0].username;
          }
        } catch (err) {
          console.log('No AgentZK profile found');
        }
      }

      // Fallback names
      if (!authorName) {
        authorName = currentUser.created_wallet_address 
          ? `${currentUser.created_wallet_address.slice(0, 6)}...${currentUser.created_wallet_address.slice(-4)}`
          : currentUser.email.split('@')[0];
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

      // If ZK was called, have it respond
      if (zkMatch) {
        try {
          await base44.functions.invoke('zkBotRespond', { 
            prompt: zkMatch[1], 
            post_id: postId 
          });
          // Wait a bit then reload to show ZK's response
          setTimeout(() => {
            loadComments();
            if (onCommentAdded) onCommentAdded();
          }, 1000);
        } catch (err) {
          console.error('ZK bot failed:', err);
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

  const handleLikeComment = async (comment) => {
    const isLiked = likedComments[comment.id];
    const newLikes = isLiked ? (comment.likes || 1) - 1 : (comment.likes || 0) + 1;
    
    // Optimistic update
    setComments(comments.map(c => 
      c.id === comment.id ? { ...c, likes: newLikes } : c
    ));
    setLikedComments(prev => ({
      ...prev,
      [comment.id]: !isLiked
    }));
    
    try {
      await base44.entities.PostComment.update(comment.id, {
        likes: newLikes
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

  const handleTipCommenter = (walletAddress) => {
    if (!walletAddress) {
      alert('This user has not connected a wallet yet');
      return;
    }
    
    // Open Kasware to send tip
    const kaswareUrl = `kasware://send?address=${walletAddress}`;
    window.location.href = kaswareUrl;
  };

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      {/* Comment Input */}
      <div className="flex gap-2 mb-4">
        <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {currentUser?.username ? currentUser.username[0].toUpperCase() : 
           currentUser?.created_wallet_address ? currentUser.created_wallet_address.slice(-1).toUpperCase() :
           currentUser?.email[0].toUpperCase()}
        </div>
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleComment()}
          placeholder="Write a comment... (@zk to call ZK bot)"
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
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/5 border border-white/10 rounded-lg p-3"
              >
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
                              onClick={() => handleTipCommenter(comment.author_wallet_address)}
                              className="p-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded transition-colors"
                              title="Tip this commenter"
                            >
                              <DollarSign className="w-3 h-3 text-green-400" />
                            </button>
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
                        onClick={() => handleLikeComment(comment)}
                        variant="ghost"
                        size="sm"
                        className={`h-auto p-0 text-xs transition-colors ${
                          likedComments[comment.id]
                            ? 'text-red-400 hover:text-red-300'
                            : 'text-white/40 hover:text-red-400'
                        }`}
                      >
                        <Heart 
                          className={`w-3 h-3 mr-1 ${likedComments[comment.id] ? 'fill-red-400' : ''}`}
                        />
                        {comment.likes || 0}
                      </Button>
                      {comment.created_by === currentUser?.email && (
                        <Button
                          onClick={() => handleDeleteComment(comment.id)}
                          variant="ghost"
                          size="sm"
                          className="text-white/30 hover:text-red-400 h-auto p-0 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}