import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Heart, Reply, Trash2, DollarSign, Upload, X, Loader2, Lock, LockOpen, AlertCircle, Shield } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function DAGCommentSection({ postId, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [user, setUser] = useState(null);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showTipModal, setShowTipModal] = useState(null);
  const [tipAmount, setTipAmount] = useState("");
  const [isSendingTip, setIsSendingTip] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [commentToPublish, setCommentToPublish] = useState(null);
  const [publishingCommentId, setPublishingCommentId] = useState(null);
  const fileInputRef = useRef(null);
  const [showZkVerification, setShowZkVerification] = useState(false);
  const [zkAmount, setZkAmount] = useState('1');
  const [zkTimestamp, setZkTimestamp] = useState(null);
  const [zkVerifying, setZkVerifying] = useState(false);
  const [zkWalletBalance, setZkWalletBalance] = useState(null);
  const [likedComments, setLikedComments] = useState(new Set());

  useEffect(() => {
    checkKasware();
    loadData();
    loadZkWalletBalance();
  }, [postId]);

  const loadZkWalletBalance = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (currentUser?.created_wallet_address) {
        const response = await base44.functions.invoke('getKaspaBalance', { address: currentUser.created_wallet_address });
        if (response.data?.balance) {
          setZkWalletBalance(response.data.balance);
        }
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const checkKasware = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          setKaswareWallet({ connected: true, address: accounts[0] });
        }
      } catch (err) {
        console.log('Kasware not connected');
      }
    }
  };

  const loadData = async () => {
    try {
      let currentUser = null;
      try {
        currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        console.log('User not logged in');
        setUser(null);
      }

      // Check current wallet for non-logged-in users
      let currentWalletAddress = null;
      if (typeof window.kasware !== 'undefined') {
        try {
          const accounts = await window.kasware.getAccounts();
          if (accounts.length > 0) {
            currentWalletAddress = accounts[0];
          }
        } catch (err) {
          console.log('Kasware not connected');
        }
      }

      const allComments = await base44.entities.DAGComment.filter({ post_id: postId });
      
      // Filter: show public comments OR user's own comments
      const visibleComments = allComments.filter(comment => {
        if (comment.is_public === true) return true;
        if (currentUser && comment.created_by === currentUser.email) return true;
        if (currentWalletAddress && comment.author_wallet_address === currentWalletAddress) return true;
        return false;
      });
      
      setComments(visibleComments);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploadingFile(true);
    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return { url: file_url, type: file.type.startsWith('image/') ? 'image' : 'file', name: file.name };
        })
      );
      setUploadedFiles([...uploadedFiles, ...uploads]);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setIsUploadingFile(true);
          try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setUploadedFiles([...uploadedFiles, { url: file_url, type: 'image', name: file.name }]);
          } catch (err) {
            console.error('Paste upload failed:', err);
          } finally {
            setIsUploadingFile(false);
          }
        }
      }
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() && uploadedFiles.length === 0) return;

    let walletAddress = '';
    if (kaswareWallet.connected) {
      walletAddress = kaswareWallet.address;
    } else if (user?.created_wallet_address) {
      walletAddress = user.created_wallet_address;
    } else {
      alert('Please connect Kasware wallet to comment');
      return;
    }

    const authorName = user?.username || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    setIsSending(true);
    try {
      const commentData = {
        post_id: postId,
        content: newComment.trim() || "Shared media",
        author_name: authorName,
        author_wallet_address: walletAddress,
        author_role: user?.role || 'user',
        is_public: false,
        likes: 0,
        replies_count: 0,
        tips_received: 0
      };

      if (replyTo) {
        commentData.parent_comment_id = replyTo.id;
        
        // Update parent comment reply count
        const updatedReplies = (replyTo.replies_count || 0) + 1;
        await base44.entities.DAGComment.update(replyTo.id, { replies_count: updatedReplies });
      }

      if (uploadedFiles.length > 0) {
        commentData.media_files = uploadedFiles;
      }

      await base44.entities.DAGComment.create(commentData);

      // Update comment count on post
      await base44.entities.DAGPost.update(postId, {
        comments_count: comments.length + 1
      });

      setNewComment("");
      setReplyTo(null);
      setUploadedFiles([]);
      await loadData();
    } catch (err) {
      console.error('Failed to comment:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleTipComment = async () => {
    if (!kaswareWallet.connected) {
      alert('Please connect Kasware wallet');
      return;
    }

    if (!tipAmount || Number(tipAmount) <= 0) {
      alert('Enter valid tip amount');
      return;
    }

    setIsSendingTip(true);
    try {
      const amountSompi = Math.floor(Number(tipAmount) * 100000000);
      const txId = await window.kasware.sendKaspa(showTipModal.author_wallet_address, amountSompi);

      await base44.entities.DAGTip.create({
        from_address: kaswareWallet.address,
        to_address: showTipModal.author_wallet_address,
        amount: Number(tipAmount),
        tx_hash: txId,
        comment_id: showTipModal.id,
        from_username: user?.username || 'Anonymous',
        to_username: showTipModal.author_name
      });

      await base44.entities.DAGComment.update(showTipModal.id, {
        tips_received: (showTipModal.tips_received || 0) + Number(tipAmount)
      });

      setShowTipModal(null);
      setTipAmount("");
      await loadData();
    } catch (err) {
      alert('Tip failed: ' + err.message);
    } finally {
      setIsSendingTip(false);
    }
  };

  const handleUnlockComment = async (comment) => {
    setCommentToPublish(comment);
    setShowPaymentModal(true);
  };

  const handleSelfPayment = async () => {
    if (!kaswareWallet.connected) {
      alert('Please connect Kasware wallet');
      return;
    }

    setPublishingCommentId(commentToPublish.id);

    try {
      const amountSompi = 100000000; // 1 KAS
      const txId = await window.kasware.sendKaspa(
        kaswareWallet.address,
        amountSompi
      );

      await base44.entities.DAGComment.update(commentToPublish.id, {
        is_public: true,
        made_public_at: new Date().toISOString(),
        self_pay_tx_hash: txId
      });

      setShowPaymentModal(false);
      setCommentToPublish(null);
      await loadData();

      const notification = document.createElement('div');
      notification.className = 'fixed right-4 bg-black/95 backdrop-blur-xl border border-white/20 text-white rounded-xl p-4 shadow-2xl z-[10000] max-w-xs';
      notification.style.top = 'calc(var(--sat, 0px) + 8rem)';
      notification.innerHTML = `
        <div class="flex items-center gap-2 mb-3">
          <div class="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-sm">✓</span>
          </div>
          <h3 class="font-bold text-sm">Comment Published!</h3>
        </div>
        <div class="space-y-1.5 text-xs text-white/60">
          <p>Your comment is now visible to everyone.</p>
        </div>
        <button onclick="this.parentElement.remove()" class="mt-3 w-full bg-white/5 hover:bg-white/10 rounded-lg py-1.5 text-xs font-medium transition-colors border border-white/10">
          OK
        </button>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);

    } catch (err) {
      console.error('Failed to publish comment:', err);
      alert('Failed to publish: ' + err.message);
    } finally {
      setPublishingCommentId(null);
    }
  };

  const handleZkCommentVerification = async () => {
    if (!user?.created_wallet_address) {
      alert('Please login first');
      return;
    }

    const timestamp = Date.now();
    setZkTimestamp(timestamp);
    setZkVerifying(true);

    try {
      const targetAmount = parseFloat(zkAmount);
      let attempts = 0;
      const maxAttempts = 200;

      const checkTransaction = async () => {
        attempts++;
        console.log(`Attempt ${attempts}/${maxAttempts} - Checking for transaction...`);

        try {
          const response = await base44.functions.invoke('verifyKaspaSelfTransaction', {
            address: user.created_wallet_address,
            expectedAmount: targetAmount,
            timestamp: timestamp
          });

          if (response.data?.verified && response.data?.transaction) {
            console.log('✅ Transaction verified!', response.data.transaction);
            setZkVerifying(false);
            setShowZkVerification(false);
            
            // Publish the comment
            await base44.entities.DAGComment.update(commentToPublish.id, {
              is_public: true,
              made_public_at: new Date().toISOString(),
              self_pay_tx_hash: response.data.transaction.id
            });

            setShowPaymentModal(false);
            setCommentToPublish(null);
            await loadData();

            const notification = document.createElement('div');
            notification.className = 'fixed right-4 bg-black/95 backdrop-blur-xl border border-white/20 text-white rounded-xl p-4 shadow-2xl z-[10000] max-w-xs';
            notification.style.top = 'calc(var(--sat, 0px) + 8rem)';
            notification.innerHTML = `
              <div class="flex items-center gap-2 mb-3">
                <div class="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span class="text-sm">✓</span>
                </div>
                <h3 class="font-bold text-sm">Comment Published!</h3>
              </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);

            return true;
          }

          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setZkVerifying(false);
            alert('Verification timeout. Transaction not detected within 10 minutes.');
          }
        } catch (err) {
          console.error('❌ Verification error:', err);
          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setZkVerifying(false);
            alert('Failed to verify transaction. Please try again or use Kasware option.');
          }
        }
      };

      checkTransaction();
    } catch (err) {
      console.error('ZK verification setup error:', err);
      setZkVerifying(false);
      alert('Verification failed to start. Please try again.');
    }
  };

  const handleLike = async (comment) => {
    if (!user) {
      alert('Please login to like comments');
      return;
    }

    // Prevent double-liking
    if (likedComments.has(comment.id)) {
      return;
    }

    // Optimistic update
    const newLikes = (comment.likes || 0) + 1;
    setComments(comments.map(c => c.id === comment.id ? { ...c, likes: newLikes } : c));
    setLikedComments(prev => new Set([...prev, comment.id]));

    try {
      await base44.entities.DAGComment.update(comment.id, { likes: newLikes });
    } catch (err) {
      console.error('Failed to like:', err);
      // Revert on error
      setComments(comments.map(c => c.id === comment.id ? { ...c, likes: comment.likes } : c));
      setLikedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(comment.id);
        return newSet;
      });
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await base44.entities.DAGComment.delete(commentId);
      await loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getMainComments = () => {
    return comments.filter(c => !c.parent_comment_id);
  };

  const getReplies = (commentId) => {
    return comments.filter(c => c.parent_comment_id === commentId);
  };

  const renderComment = (comment, isReply = false) => {
    const isMyComment = (user && comment.created_by === user.email) || 
                        (kaswareWallet.connected && comment.author_wallet_address === kaswareWallet.address);
    const replies = getReplies(comment.id);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mt-4'}`}>
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold">
                {comment.author_name[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-semibold">{comment.author_name}</span>
                  {comment.author_role === 'admin' && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 text-[10px] px-1.5 py-0">ADMIN</Badge>
                  )}
                  {!comment.is_public && isMyComment && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                      <Lock className="w-2.5 h-2.5 mr-1" />
                      PRIVATE
                    </Badge>
                  )}
                  {comment.is_public && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">
                      <LockOpen className="w-2.5 h-2.5 mr-1" />
                      PUBLIC
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-white/40">
                  {format(new Date(comment.created_date), 'MMM d, HH:mm')}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!comment.is_public && isMyComment && (
                <Button
                  onClick={() => handleUnlockComment(comment)}
                  disabled={publishingCommentId === comment.id}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 h-6 px-2 text-xs"
                >
                  {publishingCommentId === comment.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-3 h-3 mr-1" />
                      Unlock
                    </>
                  )}
                </Button>
              )}
              {isMyComment && (
                <Button
                  onClick={() => handleDelete(comment.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400/60 hover:text-red-400 h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          <p className="text-white text-sm mb-2 whitespace-pre-wrap">{comment.content}</p>

          {comment.media_files && comment.media_files.length > 0 && (
            <div className="mb-2">
              {comment.media_files.map((file, idx) => (
                <img key={idx} src={file.url} alt="" className="max-h-48 rounded" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 border-t border-white/5">
            <Button
              onClick={() => handleLike(comment)}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-red-400 h-auto p-0"
            >
              <Heart 
                className="w-4 h-4 mr-1" 
                fill={likedComments.has(comment.id) ? "currentColor" : "none"} 
              />
              <span className="text-xs">{comment.likes || 0}</span>
            </Button>

            <Button
              onClick={() => setReplyTo(comment)}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-white h-auto p-0"
            >
              <Reply className="w-4 h-4 mr-1" />
              <span className="text-xs">{comment.replies_count || 0}</span>
            </Button>

            <Button
              onClick={() => setShowTipModal(comment)}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-yellow-400 h-auto p-0"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="text-xs">{comment.tips_received ? comment.tips_received.toFixed(2) : '0.00'} KAS</span>
            </Button>
          </div>
        </div>

        {replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  const mainComments = getMainComments();

  return (
    <>
      {/* Payment Modal for Comment */}
      <AnimatePresence>
        {showPaymentModal && commentToPublish && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowPaymentModal(false);
              setCommentToPublish(null);
            }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
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
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Publish Comment</h3>
                    <p className="text-white/60 text-sm">Pay 1 KAS to unlock</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setCommentToPublish(null);
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
                  <div className="text-xs text-white/60 mb-1">Your Wallet</div>
                  <div className="text-white font-mono text-sm break-all">
                    {kaswareWallet.address}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-white/80">
                      <p className="mb-2">You will pay <span className="font-bold text-yellow-400">1 KAS</span> to yourself.</p>
                      <p className="text-white/60">This unlocks your comment for all users to see.</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSelfPayment}
                  disabled={publishingCommentId === commentToPublish.id}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12 text-black font-bold"
                >
                  {publishingCommentId === commentToPublish.id ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pay 1 KAS & Publish
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-black px-2 text-white/40">or</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setShowZkVerification(true);
                  }}
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 h-12 font-semibold"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  ZK (iOS)
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZK Verification Modal */}
      <AnimatePresence>
        {showZkVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!zkVerifying) {
                setShowZkVerification(false);
                setZkAmount('1');
              }
            }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-cyan-500/30 rounded-xl w-full max-w-md p-6"
            >
              <h3 className="text-2xl font-bold text-white mb-2">ZK Verification</h3>
              <p className="text-white/60 text-sm mb-6">
                Send KAS to yourself in Kaspium to verify this comment
              </p>

              {!zkVerifying ? (
                <div className="space-y-4">
                  {zkWalletBalance !== null && (
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-white/40 text-xs mb-1">Current Balance</p>
                      <p className="text-white text-lg font-bold">{zkWalletBalance.toFixed(2)} KAS</p>
                    </div>
                  )}

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white/40 text-xs mb-1">Your TTT Wallet Address</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-sm font-mono break-all">
                        {user?.created_wallet_address?.substring(0, 12)}...{user?.created_wallet_address?.slice(-8)}
                      </p>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(user?.created_wallet_address || '');
                          const notification = document.createElement('div');
                          notification.className = 'fixed top-4 right-4 z-[10002] bg-black border border-white/20 text-white px-4 py-3 rounded-lg shadow-lg';
                          notification.textContent = '✓ Address copied';
                          document.body.appendChild(notification);
                          setTimeout(() => notification.remove(), 2000);
                        }}
                        size="sm"
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs h-7"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">
                      Amount to send yourself (KAS)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={zkAmount}
                      onChange={(e) => setZkAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white"
                    />
                  </div>

                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                    <p className="text-cyan-400 text-xs font-semibold mb-2">Instructions:</p>
                    <ol className="text-white/60 text-xs space-y-1 list-decimal list-inside">
                      <li>Copy your wallet address above</li>
                      <li>Enter the amount (default: 1 KAS)</li>
                      <li>Click "Start Verification"</li>
                      <li>Open Kaspium and send that amount to your own address</li>
                      <li>Wait for automatic verification</li>
                    </ol>
                  </div>

                  <Button
                    onClick={handleZkCommentVerification}
                    disabled={!zkAmount || parseFloat(zkAmount) <= 0}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white h-12 font-semibold disabled:opacity-50"
                  >
                    Start Verification
                  </Button>

                  <Button
                    onClick={() => {
                      setShowZkVerification(false);
                      setShowPaymentModal(true);
                      setZkAmount('1');
                    }}
                    variant="outline"
                    className="w-full border-white/10 text-white/60"
                  >
                    Back
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-cyan-400 font-semibold mb-2">Waiting for Transaction...</p>
                  <p className="text-white/60 text-sm mb-4">
                    Send {zkAmount} KAS to yourself in Kaspium
                  </p>
                  <div className="bg-white/5 rounded-lg p-3 mb-4">
                    <p className="text-white/40 text-xs mb-1">Your Address</p>
                    <p className="text-white text-xs font-mono break-all">
                      {user?.created_wallet_address}
                    </p>
                  </div>
                  <p className="text-white/40 text-xs">
                    Verification will happen automatically when the transaction is detected
                  </p>
                  <Button
                    onClick={() => {
                      setZkVerifying(false);
                      setShowZkVerification(false);
                      setShowPaymentModal(true);
                      setZkAmount('1');
                    }}
                    variant="outline"
                    className="w-full border-white/10 text-white/60 mt-4"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tip Comment Modal */}
      <AnimatePresence>
        {showTipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTipModal(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-white/20 rounded-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-bold text-lg">Tip {showTipModal.author_name}</h3>
                  <p className="text-white/60 text-sm">Send KAS tip</p>
                </div>
                <Button onClick={() => setShowTipModal(null)} variant="ghost" size="sm">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/60 mb-2 block">Amount (KAS)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg"
                  />
                </div>

                <div className="flex gap-2">
                  {[0.1, 0.5, 1, 5].map(amount => (
                    <Button
                      key={amount}
                      onClick={() => setTipAmount(amount.toString())}
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      {amount}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleTipComment}
                  disabled={isSendingTip || !tipAmount || Number(tipAmount) <= 0}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12 text-black font-bold"
                >
                  {isSendingTip ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 mr-2" />
                      Send Tip
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-black border border-white/20 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <h3 className="text-white font-bold">Comments ({comments.length})</h3>
          <Button onClick={onClose} variant="ghost" size="sm" className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          ) : mainComments.length === 0 ? (
            <div className="text-center py-12 text-white/40">No comments yet</div>
          ) : (
            mainComments.map(comment => renderComment(comment))
          )}
        </div>

        <div className="p-4 border-t border-white/20">
          {replyTo && (
            <div className="mb-2 bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between">
              <span className="text-xs text-white/60">Replying to {replyTo.author_name}</span>
              <Button onClick={() => setReplyTo(null)} variant="ghost" size="sm" className="h-6 text-white/40">
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mb-2 flex gap-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="relative">
                  <img src={file.url} alt="" className="h-16 rounded" />
                  <button
                    onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 bg-black rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile}
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/10 text-white h-10 w-10 p-0"
            >
              {isUploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>

            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onPaste={handlePaste}
              placeholder="Write a comment..."
              className="flex-1 bg-white/5 border-white/10 text-white resize-none h-10 min-h-0"
            />

            <Button
              onClick={handleComment}
              disabled={isSending || (!newComment.trim() && uploadedFiles.length === 0)}
              className="bg-white text-black hover:bg-white/90 h-10"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}