import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Send, Loader2, Trash2, DollarSign, X, Wallet, Sparkles } from "lucide-react";
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
  const [tipModal, setTipModal] = useState(null);
  const [tipAmount, setTipAmount] = useState('');
  const [isSendingTip, setIsSendingTip] = useState(false);
  const [commenterTips, setCommenterTips] = useState({});

  useEffect(() => {
    loadComments();
  }, [postId]);

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
      // Try to get AgentZK profile
      let authorName = currentUser.username;
      let authorWalletAddress = currentUser.created_wallet_address || '';

      // Only check AgentZK if no username set
      if (!authorName && currentUser.created_wallet_address) {
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

  const handleTipCommenter = (comment) => {
    if (!comment.author_wallet_address) {
      alert('This user has not connected a wallet yet');
      return;
    }
    setTipModal(comment);
  };

  const sendTipToCommenter = async () => {
    if (!tipAmount || isNaN(parseFloat(tipAmount)) || parseFloat(tipAmount) <= 0) {
      return;
    }

    setIsSendingTip(true);

    try {
      const amountSompi = Math.floor(parseFloat(tipAmount) * 100000000);
      const tipAmountKAS = parseFloat(tipAmount);

      const txId = await window.kasware.sendKaspa(
        tipModal.author_wallet_address,
        amountSompi
      );

      // Record tip transaction
      await base44.entities.TipTransaction.create({
        sender_wallet: currentUser?.created_wallet_address || '',
        sender_email: currentUser?.email || null,
        sender_name: currentUser?.username || 'Anonymous',
        recipient_wallet: tipModal.author_wallet_address,
        recipient_email: tipModal.created_by || null,
        recipient_name: tipModal.author_name || tipModal.commenter_name,
        amount: tipAmountKAS,
        tx_hash: txId,
        post_id: postId,
        source: 'feed_comment'
      });

      // Track comment tip stats by EMAIL - SENDER
      if (currentUser?.email) {
        const senderStats = await base44.entities.UserTipStats.filter({ user_email: currentUser.email });
        if (senderStats.length > 0) {
          await base44.entities.UserTipStats.update(senderStats[0].id, {
            comment_tips_sent: (senderStats[0].comment_tips_sent || 0) + tipAmountKAS,
            username: currentUser?.username || 'Anonymous'
          });
        } else {
          await base44.entities.UserTipStats.create({
            user_email: currentUser.email,
            username: currentUser?.username || 'Anonymous',
            feed_tips_sent: 0,
            feed_tips_received: 0,
            bull_tips_sent: 0,
            bull_tips_received: 0,
            comment_tips_sent: tipAmountKAS,
            comment_tips_received: 0
          });
        }
      }

      // Track comment tip stats by EMAIL - RECIPIENT
      if (tipModal.created_by) {
        const recipientStats = await base44.entities.UserTipStats.filter({ user_email: tipModal.created_by });
        if (recipientStats.length > 0) {
          await base44.entities.UserTipStats.update(recipientStats[0].id, {
            comment_tips_received: (recipientStats[0].comment_tips_received || 0) + tipAmountKAS,
            username: tipModal.author_name || tipModal.commenter_name
          });
        } else {
          await base44.entities.UserTipStats.create({
            user_email: tipModal.created_by,
            username: tipModal.author_name || tipModal.commenter_name,
            feed_tips_sent: 0,
            feed_tips_received: 0,
            bull_tips_sent: 0,
            bull_tips_received: 0,
            comment_tips_sent: 0,
            comment_tips_received: tipAmountKAS
          });
        }
      }

      setTipModal(null);
      setTipAmount('');

      // Reload tips to update display
      await loadCommenterTips();

      // Show notification
      const notification = document.createElement('div');
      notification.className = 'fixed right-4 bg-black/95 backdrop-blur-xl border border-white/20 text-white rounded-xl p-4 shadow-2xl z-[1000] max-w-xs';
      notification.style.top = 'calc(var(--sat, 0px) + 8rem)';
      notification.innerHTML = `
        <div class="flex items-center gap-2 mb-3">
          <div class="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-sm">✓</span>
          </div>
          <h3 class="font-bold text-sm">Tip sent to commenter!</h3>
        </div>
        <div class="space-y-1.5 text-xs text-white/60">
          <div class="flex justify-between gap-3">
            <span>Amount:</span>
            <span class="text-white font-semibold">${tipAmountKAS} KAS</span>
          </div>
          <div class="flex justify-between gap-3">
            <span>To:</span>
            <span class="text-white font-semibold truncate">${tipModal.author_name || tipModal.commenter_name}</span>
          </div>
        </div>
        <button onclick="this.parentElement.remove()" class="mt-3 w-full bg-white/5 hover:bg-white/10 rounded-lg py-1.5 text-xs font-medium transition-colors border border-white/10">
          OK
        </button>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);

    } catch (err) {
      console.error('Failed to send tip:', err);
    } finally {
      setIsSendingTip(false);
    }
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

      {/* Tip Modal - Matching Feed Post Tip Modal */}
      <AnimatePresence>
        {tipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={() => {
              setTipModal(null);
              setTipAmount('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-white/20 rounded-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Send Tip</h3>
                    <p className="text-white/60 text-sm">to {tipModal.author_name || tipModal.commenter_name}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setTipModal(null);
                    setTipAmount('');
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-white/60 mb-1">Recipient Wallet</div>
                  <div className="text-white font-mono text-sm break-all">
                    {tipModal.author_wallet_address}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Tip Amount (KAS)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="0.5"
                    className="bg-white/5 border-white/10 text-white text-lg text-center h-14"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    {['0.5', '1', '5', '10'].map(amount => (
                      <Button
                        key={amount}
                        onClick={() => setTipAmount(amount)}
                        size="sm"
                        variant="outline"
                        className="flex-1 border-white/20 text-white/60 hover:bg-white/10 hover:text-white"
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={sendTipToCommenter}
                  disabled={isSendingTip || !tipAmount || parseFloat(tipAmount) <= 0}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12 text-white font-bold"
                >
                  {isSendingTip ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Tip...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5 mr-2" />
                      Send KAS
                    </>
                  )}
                </Button>

                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/60">
                      Tips are sent directly from your Kasware wallet to the creator's wallet instantly.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}