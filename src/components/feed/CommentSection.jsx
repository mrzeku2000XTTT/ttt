import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Send, Loader2, Trash2, DollarSign, X, Wallet, Sparkles, CornerDownRight, Smartphone, AlertCircle, Download, Maximize2 } from "lucide-react";
import { format } from "date-fns";

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
  const [tipModal, setTipModal] = useState(null);
  const [tipAmount, setTipAmount] = useState('');
  const [isSendingTip, setIsSendingTip] = useState(false);
  const [commenterTips, setCommenterTips] = useState({});
  const [zkIsResponding, setZkIsResponding] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [tipTokenType, setTipTokenType] = useState("KAS");
  const [tipKrc20Ticker, setTipKrc20Ticker] = useState("PACMAN");
  const [tipError, setTipError] = useState('');

  // TTT wallet tip state
  const tttWalletAddress = currentUser?.created_wallet_address || localStorage.getItem('ttt_wallet_address');
  const tttPrivateKey = localStorage.getItem('ttt_wallet_pk');
  const pinHash = localStorage.getItem('ttt_wallet_pin_hash');
  const hasPinSet = !!pinHash;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) || (typeof window !== 'undefined' && window.innerWidth < 1024);
  const [sendMethod, setSendMethod] = useState(isMobile && tttWalletAddress ? 'ttt' : 'kasware');
  const [tipPin, setTipPin] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState('');

  const verifyTipPin = async () => {
    if (tipPin.length !== 6) { setPinError('Enter 6-digit PIN'); return; }
    const res = await base44.functions.invoke('hashPin', { pin: tipPin });
    if (res.data?.hash === pinHash) {
      setPinVerified(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN');
    }
  };

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

    const commentText = newComment.trim();
    setIsCommenting(true);
    setNewComment("");
    try {
      let authorName = '';
      let authorWalletAddress = '';

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
        const manualAddress = localStorage.getItem('manual_kaspa_address');
        if (!authorWalletAddress && manualAddress?.trim()) {
          authorWalletAddress = manualAddress.trim();
        }
        
        if (authorWalletAddress) {
          try {
            const profiles = await base44.entities.WalletProfile.filter({ wallet_address: authorWalletAddress });
            if (profiles && profiles.length > 0 && profiles[0].username) {
              authorName = profiles[0].username;
            }
          } catch (err) {
            console.log('Could not fetch username from WalletProfile');
          }
          
          if (!authorName) {
            authorName = `${authorWalletAddress.slice(0, 6)}...${authorWalletAddress.slice(-4)}`;
          }
        } else {
          alert('Please connect wallet to comment');
          setIsCommenting(false);
          return;
        }
      }

      const createdComment = await base44.entities.PostComment.create({
        post_id: postId,
        author_name: authorName,
        author_wallet_address: authorWalletAddress,
        comment_text: commentText
      });

      if (onCommentAdded) {
        onCommentAdded();
      }

      // If @zk was mentioned anywhere, have it respond
      const zkMentioned = commentText.toLowerCase().includes('@zk');
      console.log('[CommentSection] zkMentioned:', zkMentioned, 'text:', commentText);
      if (zkMentioned) {
        setZkIsResponding(true);

        try {
          const lowerMsg = commentText.toLowerCase();
          const wantsImageAnalysis = /analyz|describ|what('s| is) (this|the) (image|picture|photo)|look at|examine (this|the) (image|picture)/i.test(lowerMsg);
          let imageUrls = [];
          if (wantsImageAnalysis) {
            const post = await base44.entities.Post.filter({ id: postId });
            imageUrls = post[0]?.media_files 
              ? post[0].media_files.filter(f => f.type === 'image').map(f => f.url)
              : (post[0]?.image_url ? [post[0].image_url] : []);
          }

          console.log('[CommentSection] Calling zkBotRespond for top-level comment');
          await base44.functions.invoke('zkBotRespond', { 
            post_id: postId,
            post_content: commentText,
            author_name: authorName,
            image_urls: imageUrls,
            parent_comment_id: createdComment.id
          });

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

    // Capture values BEFORE any state changes
    const replyContent = replyText.trim();
    const repliedToComment = replyingTo;
    
    setIsCommenting(true);
    setReplyText("");
    setReplyingTo(null);
    
    try {
      let authorName = '';
      let authorWalletAddress = '';

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
        const manualAddress = localStorage.getItem('manual_kaspa_address');
        if (!authorWalletAddress && manualAddress?.trim()) {
          authorWalletAddress = manualAddress.trim();
        }

        if (authorWalletAddress) {
          try {
            const profiles = await base44.entities.WalletProfile.filter({ wallet_address: authorWalletAddress });
            if (profiles && profiles.length > 0 && profiles[0].username) {
              authorName = profiles[0].username;
            }
          } catch (err) {
            console.log('Could not fetch username from WalletProfile');
          }

          if (!authorName) {
            authorName = `${authorWalletAddress.slice(0, 6)}...${authorWalletAddress.slice(-4)}`;
          }
        } else {
          alert('Please connect wallet to reply');
          setIsCommenting(false);
          return;
        }
      }

      const createdReply = await base44.entities.PostComment.create({
        post_id: postId,
        parent_comment_id: parentComment.id,
        author_name: authorName,
        author_wallet_address: authorWalletAddress,
        comment_text: replyContent
      });

      // Update parent comment replies count (don't let this block the flow)
      try {
        await base44.entities.PostComment.update(parentComment.id, {
          replies_count: (parentComment.replies_count || 0) + 1
        });
      } catch (e) {
        console.log('Could not update replies_count:', e.message);
      }

      if (onCommentAdded) {
        onCommentAdded();
      }

      // If replying to @zk or mentioning @zk in a reply, trigger bot
      const zkInReply = replyContent.toLowerCase().includes('@zk') || parentComment.author_name === '@zk' || repliedToComment?.author_name === '@zk';
      console.log('[CommentSection] Reply zkInReply:', zkInReply, 'text:', replyContent, 'parent:', parentComment.author_name, 'repliedTo:', repliedToComment?.author_name);
      if (zkInReply) {
        setZkIsResponding(true);
        try {
          // Find the @zk comment being replied to for image iteration context
          let zkRefCommentId = null;
          if (repliedToComment && repliedToComment.author_name === '@zk') {
            zkRefCommentId = repliedToComment.id;
          } else if (parentComment.author_name === '@zk') {
            zkRefCommentId = parentComment.id;
          }

          console.log('[CommentSection] Calling zkBotRespond for reply, parent_comment_id:', createdReply.id);
          await base44.functions.invoke('zkBotRespond', {
            post_id: postId,
            post_content: replyContent,
            author_name: authorName,
            image_urls: [],
            parent_comment_id: createdReply.id,
            zk_ref_comment_id: zkRefCommentId
          });
        } catch (err) {
          console.error('ZK bot reply failed:', err);
        } finally {
          setZkIsResponding(false);
        }
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
    setTipModal(comment);
  };

  const sendTipToCommenter = async () => {
    if (!tipAmount || isNaN(parseFloat(tipAmount)) || parseFloat(tipAmount) <= 0) {
      return;
    }
    if (sendMethod === 'ttt' && hasPinSet && !pinVerified) {
      setTipError('Please verify your PIN first.');
      return;
    }

    setIsSendingTip(true);
    setTipError('');

    try {
      let txId;
      const tipAmountValue = parseFloat(tipAmount);

      if (sendMethod === 'ttt') {
        const res = await base44.functions.invoke('sendKaspaTransaction', {
          fromAddress: tttWalletAddress,
          toAddress: tipModal.author_wallet_address,
          amountKas: tipAmountValue,
          privateKey: tttPrivateKey,
        });
        if (!res.data?.success || res.data?.error) {
          throw new Error(res.data?.error || 'Transaction failed');
        }
        txId = res.data?.txId || 'ttt-tx';
      } else if (tipTokenType === "KRC20" && tipKrc20Ticker.trim()) {
        const krc20Data = {
          p: "krc-20",
          op: "transfer",
          tick: tipKrc20Ticker.toUpperCase(),
          amt: (tipAmountValue * Math.pow(10, 8)).toString(),
          to: tipModal.author_wallet_address
        };
        txId = await window.kasware.signKRC20Transaction(
          JSON.stringify(krc20Data), 4, tipModal.author_wallet_address, 0.0002
        );
      } else {
        const amountSompi = Math.floor(tipAmountValue * 100000000);
        txId = await window.kasware.sendKaspa(tipModal.author_wallet_address, amountSompi);
      }

      const tipAmountKAS = tipAmountValue;

      // Record tip transaction
      const senderWallet = sendMethod === 'ttt' ? tttWalletAddress : (currentUser?.created_wallet_address || '');
      await base44.entities.TipTransaction.create({
        sender_wallet: senderWallet,
        sender_email: currentUser?.email || null,
        sender_name: currentUser?.username || 'Anonymous',
        recipient_wallet: tipModal.author_wallet_address,
        recipient_email: tipModal.created_by || null,
        recipient_name: tipModal.author_name || tipModal.commenter_name,
        amount: tipAmountValue,
        token_type: tipTokenType,
        krc20_ticker: tipTokenType === "KRC20" ? tipKrc20Ticker : null,
        tx_hash: txId,
        post_id: postId,
        source: 'feed_comment'
      });

      // Track comment tip stats - SENDER (by email OR wallet)
      const senderIdentifier = currentUser?.email || senderWallet;

      if (senderIdentifier) {
        const senderStats = currentUser?.email 
          ? await base44.entities.UserTipStats.filter({ user_email: currentUser.email })
          : await base44.entities.UserTipStats.filter({ wallet_address: senderWallet });

        if (senderStats.length > 0) {
          await base44.entities.UserTipStats.update(senderStats[0].id, {
            comment_tips_sent: (senderStats[0].comment_tips_sent || 0) + tipAmountKAS,
            username: currentUser?.username || 'Anonymous',
            wallet_address: senderWallet
          });
        } else {
          await base44.entities.UserTipStats.create({
            user_email: currentUser?.email || null,
            wallet_address: senderWallet,
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

      // Track comment tip stats - RECIPIENT (by email OR wallet)
      const recipientIdentifier = tipModal.created_by || tipModal.author_wallet_address;

      if (recipientIdentifier) {
        const recipientStats = tipModal.created_by
          ? await base44.entities.UserTipStats.filter({ user_email: tipModal.created_by })
          : await base44.entities.UserTipStats.filter({ wallet_address: tipModal.author_wallet_address });

        if (recipientStats.length > 0) {
          await base44.entities.UserTipStats.update(recipientStats[0].id, {
            comment_tips_received: (recipientStats[0].comment_tips_received || 0) + tipAmountValue,
            username: tipModal.author_name || tipModal.commenter_name,
            wallet_address: tipModal.author_wallet_address
          });
        } else {
          await base44.entities.UserTipStats.create({
            user_email: tipModal.created_by || null,
            wallet_address: tipModal.author_wallet_address,
            username: tipModal.author_name || tipModal.commenter_name,
            feed_tips_sent: 0,
            feed_tips_received: 0,
            bull_tips_sent: 0,
            bull_tips_received: 0,
            comment_tips_sent: 0,
            comment_tips_received: tipAmountValue
          });
        }
      }

      // Update comment tips using backend function (bypasses RLS)
      await base44.functions.invoke('updateCommentTips', {
        comment_id: tipModal.id,
        amount: tipAmountValue,
        token_type: tipTokenType,
        krc20_ticker: tipTokenType === "KRC20" ? tipKrc20Ticker : null
      });

      setTipModal(null);
      setTipAmount('');
      setTipPin('');
      setPinVerified(false);

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

      const errMsg = err.response?.data?.error || err.message || 'Unknown error';
      if (errMsg.includes('User reject')) {
        setTipError('Transaction cancelled');
      } else if (errMsg.includes('storage mass') || errMsg.includes('Storage mass')) {
        setTipError('⚠️ Storage mass error: Consolidate UTXOs in your wallet settings.');
      } else if (errMsg.includes('false stack') || errMsg.includes('signature')) {
        setTipError("It's been a while — just to make sure it's you, please reimport your wallet on the Wallet page by tapping Clear and re-entering your seed phrase.");
      } else {
        setTipError('Failed to send tip: ' + errMsg);
      }
    } finally {
      setIsSendingTip(false);
    }
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
                <div className="text-white/40 text-xs mt-0.5">Real-time intelligence + fact-checking</div>
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
                        <div className="text-white text-sm mb-2 space-y-1">
                          {comment.comment_text?.split('\n').map((line, li) => {
                            const imgMatch = line.match(/^!\[.*?\]\((https?:\/\/.+)\)$/);
                            if (imgMatch) return (
                              <div key={li} className="relative group inline-block mt-1 cursor-pointer" onClick={() => setFullscreenImage(imgMatch[1])}>
                                <img src={imgMatch[1]} alt="Generated" className="rounded-lg max-h-48 object-cover border border-white/10" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <Maximize2 className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            );
                            if (/^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)/i.test(line.trim()) || (line.trim().startsWith('http') && comment.author_name === '@zk' && comment.comment_text?.includes('![Generated'))) return null;
                            return <p key={li}>{line}</p>;
                          })}
                        </div>
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
                                <div className="text-white text-xs mb-1 space-y-1">
                                  {reply.comment_text?.split('\n').map((line, li) => {
                                    const imgMatch = line.match(/^!\[.*?\]\((https?:\/\/.+)\)$/);
                                    if (imgMatch) return (
                                      <div key={li} className="relative group inline-block mt-1 cursor-pointer" onClick={() => setFullscreenImage(imgMatch[1])}>
                                        <img src={imgMatch[1]} alt="Generated" className="rounded-lg max-h-48 object-cover border border-white/10" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <Maximize2 className="w-4 h-4 text-white" />
                                        </div>
                                      </div>
                                    );
                                    if (/^https?:\/\/.+\.(png|jpg|jpeg|webp|gif)/i.test(line.trim()) || (line.trim().startsWith('http') && reply.author_name === '@zk' && reply.comment_text?.includes('![Generated'))) return null;
                                    return <p key={li}>{line}</p>;
                                  })}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Button
                                    onClick={() => {
                                      setReplyingTo(replyingTo?.id === reply.id ? null : reply);
                                      // Auto-prepend @zk if replying to @zk's reply
                                      if (reply.author_name === '@zk') {
                                        setReplyText('@zk ');
                                      } else {
                                        setReplyText('');
                                      }
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className={`h-auto p-0 text-[10px] flex items-center gap-1 ${replyingTo?.id === reply.id ? 'text-cyan-400' : 'text-white/30 hover:text-cyan-400'}`}
                                  >
                                    <CornerDownRight className="w-2.5 h-2.5" />
                                    Reply
                                  </Button>
                                  {reply.created_by === currentUser?.email && (
                                    <Button
                                      onClick={() => handleDeleteComment(reply.id)}
                                      variant="ghost"
                                      size="sm"
                                      className="text-white/30 hover:text-red-400 h-auto p-0 text-[10px] flex items-center gap-1"
                                    >
                                      <Trash2 className="w-2 h-2" />
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reply input for nested replies (including @zk conversations) */}
                            <AnimatePresence>
                              {replyingTo?.id === reply.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-2"
                                >
                                  <div className="bg-white/5 border border-cyan-500/30 rounded-lg p-2 border-l-2 border-l-cyan-500">
                                    <div className="flex items-center gap-1 mb-1 text-[10px] text-cyan-400">
                                      <CornerDownRight className="w-2.5 h-2.5" />
                                      <span>Replying to {reply.author_name}</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                      <Input
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleReplyToComment(reply.parent_comment_id ? comment : reply)}
                                        placeholder={reply.author_name === '@zk' ? 'Talk to @zk...' : 'Write a reply...'}
                                        className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-7 text-xs"
                                        disabled={isCommenting}
                                        autoFocus
                                      />
                                      <Button
                                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                        variant="ghost"
                                        size="sm"
                                        className="text-white/40 hover:text-white h-7 px-1.5"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        onClick={() => handleReplyToComment(reply.parent_comment_id ? comment : reply)}
                                        disabled={isCommenting || !replyText.trim()}
                                        size="sm"
                                        className="bg-cyan-500 text-white hover:bg-cyan-600 h-7 px-2"
                                      >
                                        {isCommenting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
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

      {/* Tip Modal - Matching Feed Post Tip Modal */}
      <AnimatePresence>
        {tipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={() => { setTipModal(null); setTipAmount(''); setTipPin(''); setPinVerified(false); }}
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
                 onClick={() => { setTipModal(null); setTipAmount(''); setTipPin(''); setPinVerified(false); }}
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

                {/* Send Method */}
                {isMobile && tttWalletAddress && (
                  <div>
                    <div className="text-xs text-white/50 mb-2">Send via</div>
                    <div className="flex gap-2">
                      <Button onClick={() => setSendMethod('ttt')} size="sm"
                        className={`flex-1 flex items-center gap-1 ${sendMethod === 'ttt' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}>
                        <Smartphone className="w-3 h-3" /> TTT Wallet
                      </Button>
                      {(window.kasware) && (
                        <Button onClick={() => setSendMethod('kasware')} size="sm"
                          className={`flex-1 ${sendMethod === 'kasware' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'}`}>
                          Kasware
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={() => setTipTokenType("KAS")}
                    variant="ghost"
                    className={`flex-1 ${
                      tipTokenType === "KAS"
                        ? "bg-white/10 text-white border border-white/20"
                        : "bg-black text-white/40 border border-white/10"
                    }`}
                  >
                    KAS
                  </Button>
                  {sendMethod === 'kasware' && (
                    <Button
                      onClick={() => setTipTokenType("KRC20")}
                      variant="ghost"
                      className={`flex-1 ${
                        tipTokenType === "KRC20"
                          ? "bg-white/10 text-white border border-white/20"
                          : "bg-black text-white/40 border border-white/10"
                      }`}
                    >
                      KRC-20
                    </Button>
                  )}
                </div>

                {tipTokenType === "KRC20" && (
                  <div className="mb-4">
                    <label className="text-sm text-white/60 mb-2 block">Token Ticker</label>
                    <Input
                      value={tipKrc20Ticker}
                      onChange={(e) => setTipKrc20Ticker(e.target.value.toUpperCase())}
                      placeholder="PACMAN"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm text-white/60 mb-2 block">
                    Tip Amount ({tipTokenType === "KRC20" ? tipKrc20Ticker : "KAS"})
                  </label>
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
                        variant="ghost"
                        className="flex-1 bg-black border border-white/20 text-white/60 hover:bg-white/10 hover:text-white"
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* PIN verification for TTT wallet */}
                {sendMethod === 'ttt' && tttPrivateKey && hasPinSet && !pinVerified && (
                  <div>
                    <label className="text-xs text-white/60 mb-1.5 block">Enter your wallet PIN to authorize</label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={tipPin}
                        onChange={e => { setTipPin(e.target.value.replace(/\D/g, '')); setPinError(''); }}
                        placeholder="6-digit PIN"
                        className="bg-white/5 border-white/10 text-white text-center tracking-widest"
                        autoFocus={false}
                      />
                      <Button onClick={verifyTipPin} size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4">Verify</Button>
                    </div>
                    {pinError && <p className="text-xs text-red-400 mt-1">{pinError}</p>}
                  </div>
                )}
                {sendMethod === 'ttt' && tttPrivateKey && hasPinSet && pinVerified && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-xs text-green-400 flex items-center gap-2">
                    <span>✓</span> PIN verified — ready to send
                  </div>
                )}

                {tipError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-xs text-red-400">{tipError}</p>
                  </div>
                )}

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
                      Send {tipTokenType === "KRC20" ? tipKrc20Ticker : "KAS"}
                    </>
                  )}
                </Button>

                <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-white/60">
                      {sendMethod === 'ttt' ? 'Sent natively via your TTT Wallet — no Kasware needed.' : 'Tips are sent directly from your Kasware wallet instantly.'}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300">Keep at least 5 KAS in your wallet to prevent storage mass errors.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={fullscreenImage}
              alt="Full size"
              className="max-w-full max-h-[80vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const res = await fetch(fullscreenImage);
                  const blob = await res.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = `zk-image-${Date.now()}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(blobUrl);
                } catch {
                  const a = document.createElement('a');
                  a.href = fullscreenImage;
                  a.download = `zk-image-${Date.now()}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }
              }}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Save Image
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}