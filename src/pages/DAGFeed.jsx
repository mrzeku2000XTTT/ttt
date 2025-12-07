import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send, Heart, MessageCircle, Trash2, Edit2,
  Loader2, Image as ImageIcon, X, Lock, LockOpen, Users, Video, FileText, DollarSign, Plus, AlertCircle, Sparkles, Shield, Reply
} from "lucide-react";
import DAGCommentSection from "../components/feed/DAGCommentSection";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DAGFeedPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [error, setError] = useState(null);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [publishingPostId, setPublishingPostId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [postToPublish, setPostToPublish] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [showTipModal, setShowTipModal] = useState(null);
  const [tipAmount, setTipAmount] = useState("");
  const [isSendingTip, setIsSendingTip] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    loadData();
    checkKasware();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const connectKasware = async () => {
    if (typeof window.kasware === 'undefined') {
      setError('Kasware wallet not found. Please install Kasware extension.');
      return;
    }

    try {
      const accounts = await window.kasware.requestAccounts();
      setKaswareWallet({ connected: true, address: accounts[0] });
      setError(null);
    } catch (err) {
      setError('Failed to connect Kasware: ' + err.message);
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

      const allPosts = await base44.entities.DAGPost.list('-created_date', 200);

      // Client-side filter: show public posts OR user's own posts
      const visiblePosts = allPosts.filter(post => {
        if (post.is_public === true) return true;
        if (currentUser && post.created_by === currentUser.email) return true;
        if (currentWalletAddress && post.author_wallet_address === currentWalletAddress) return true;
        return false;
      });

      setPosts(visiblePosts);
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_VIDEO_SIZE = 500 * 1024 * 1024;
    const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const limit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

      if (file.size > limit) {
        setError(`File too large. Max: ${limit / (1024 * 1024)}MB`);
        return;
      }
    }

    setIsUploadingFile(true);
    setError(null);
    
    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          
          let fileType = 'file';
          if (file.type.startsWith('image/')) fileType = 'image';
          else if (file.type.startsWith('video/')) fileType = 'video';

          return { url: file_url, type: fileType, name: file.name, size: file.size };
        })
      );

      setUploadedFiles([...uploadedFiles, ...uploads]);
      setError(null);
    } catch (err) {
      setError('Failed to upload: ' + err.message);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
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
            setUploadedFiles([...uploadedFiles, { url: file_url, type: 'image', name: file.name, size: file.size }]);
          } catch (err) {
            setError('Paste upload failed: ' + err.message);
          } finally {
            setIsUploadingFile(false);
          }
        }
      }
    }
  };

  const handleStamp = async (post) => {
    if (!kaswareWallet.connected) {
      setError('Please connect Kasware wallet to stamp');
      return;
    }

    try {
      const message = `Stamping DAG Post: ${post.id} - ${post.content.substring(0, 50)}`;
      const signature = await window.kasware.signMessage(message);

      await base44.entities.DAGPost.update(post.id, {
        is_stamped: true,
        stamp_signature: signature,
        stamp_message: message,
        stamper_address: kaswareWallet.address,
        stamped_date: new Date().toISOString()
      });

      await loadData();
      setError(null);
    } catch (err) {
      setError('Failed to stamp: ' + err.message);
    }
  };

  const handleTip = async () => {
    if (!kaswareWallet.connected) {
      setError('Please connect Kasware wallet');
      return;
    }

    if (!tipAmount || Number(tipAmount) <= 0) {
      setError('Enter valid tip amount');
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
        post_id: showTipModal.id,
        from_username: user?.username || 'Anonymous',
        to_username: showTipModal.author_name
      });

      await base44.entities.DAGPost.update(showTipModal.id, {
        tips_received: (showTipModal.tips_received || 0) + Number(tipAmount)
      });

      setShowTipModal(null);
      setTipAmount("");
      await loadData();
    } catch (err) {
      setError('Tip failed: ' + err.message);
    } finally {
      setIsSendingTip(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() && uploadedFiles.length === 0) {
      setError('Please enter content or upload files');
      return;
    }

    let walletAddress = '';
    if (kaswareWallet.connected) {
      walletAddress = kaswareWallet.address;
    } else if (user?.created_wallet_address) {
      walletAddress = user.created_wallet_address;
    } else {
      setError('Please connect Kasware wallet to post');
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      const authorName = user?.username || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

      const postData = {
        content: newPost.trim() || "Shared media",
        author_name: authorName,
        author_wallet_address: walletAddress,
        author_agent_zk_id: user?.agent_zk_id || '',
        author_role: user?.role || 'user',
        is_public: false,
        likes: 0,
        comments_count: 0,
        replies_count: 0,
        tips_received: 0
      };

      if (uploadedFiles.length > 0) {
        postData.media_files = uploadedFiles;
      }

      if (editingPost) {
        await base44.entities.DAGPost.update(editingPost.id, postData);
        setEditingPost(null);
      } else {
        await base44.entities.DAGPost.create(postData);
      }

      setNewPost("");
      setUploadedFiles([]);
      setError(null);
      
      await loadData();
    } catch (err) {
      console.error('Failed to post:', err);
      setError('Failed to create post: ' + (err.message || 'Unknown error'));
    } finally {
      setIsPosting(false);
    }
  };

  const handleUnlockPost = async (post) => {
    setPostToPublish(post);
    setShowPaymentModal(true);
  };

  const handleSelfPayment = async () => {
    if (!kaswareWallet.connected) {
      setError('Please connect Kasware wallet');
      return;
    }

    setPublishingPostId(postToPublish.id);
    setError(null);

    try {
      const amountSompi = 100000000; // 1 KAS
      const txId = await window.kasware.sendKaspa(
        kaswareWallet.address,
        amountSompi
      );

      await base44.entities.DAGPost.update(postToPublish.id, {
        is_public: true,
        made_public_at: new Date().toISOString(),
        self_pay_tx_hash: txId
      });

      const freshPosts = await base44.entities.DAGPost.list('-created_date', 200);
      setPosts(freshPosts);

      setShowPaymentModal(false);
      setPostToPublish(null);

      const notification = document.createElement('div');
      notification.className = 'fixed right-4 bg-black/95 backdrop-blur-xl border border-white/20 text-white rounded-xl p-4 shadow-2xl z-[1000] max-w-xs';
      notification.style.top = 'calc(var(--sat, 0px) + 8rem)';
      notification.innerHTML = `
        <div class="flex items-center gap-2 mb-3">
          <div class="w-6 h-6 bg-green-500/30 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-sm">✓</span>
          </div>
          <h3 class="font-bold text-sm">Post Published!</h3>
        </div>
        <div class="space-y-1.5 text-xs text-white/60">
          <p>Your post is now visible to everyone.</p>
          <div class="flex justify-between gap-3">
            <span>Tx:</span>
            <span class="text-white font-mono text-[10px] truncate">${txId.substring(0, 12)}...</span>
          </div>
        </div>
        <button onclick="this.parentElement.remove()" class="mt-3 w-full bg-white/5 hover:bg-white/10 rounded-lg py-1.5 text-xs font-medium transition-colors border border-white/10">
          OK
        </button>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);

    } catch (err) {
      console.error('Failed to publish post:', err);
      if (err.message?.includes('User reject')) {
        setError('Payment cancelled by user');
      } else {
        setError('Failed to publish post: ' + err.message);
      }
    } finally {
      setPublishingPostId(null);
    }
  };

  const handleLike = async (post) => {
    const newLikes = (post.likes || 0) + 1;
    setPosts(posts.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));

    try {
      await base44.entities.DAGPost.update(post.id, { likes: newLikes });
      setError(null);
    } catch (err) {
      console.error('Failed to like:', err);
      setError(null); // Don't show error for likes
      await loadData();
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return;

    try {
      setPosts(posts.filter(p => p.id !== postId));
      await base44.entities.DAGPost.delete(postId);
    } catch (err) {
      console.error('Failed to delete:', err);
      setError('Failed to delete post');
      await loadData();
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setNewPost(post.content);
    setUploadedFiles(post.media_files || []);
  };

  const getMainPosts = () => {
    return posts.filter(p => !p.parent_post_id).sort((a, b) =>
      new Date(b.created_date) - new Date(a.created_date)
    );
  };

  const renderPost = (post) => {
    // Check ownership by email, wallet address
    const isMyPost = (user && post.created_by === user.email) || 
                     (kaswareWallet.connected && post.author_wallet_address === kaswareWallet.address) ||
                     (user?.created_wallet_address && post.author_wallet_address === user.created_wallet_address);

    return (
      <Card className="backdrop-blur-xl bg-black border-white/10 hover:border-white/20 transition-all">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">
                {post.author_name[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold">{post.author_name}</span>
                  {post.author_role === 'admin' && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] px-2 py-0.5 font-bold">
                      ADMIN
                    </Badge>
                  )}
                  {!post.is_public && isMyPost && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-2 py-0.5 font-bold">
                      <Lock className="w-3 h-3 mr-1" />
                      PRIVATE
                    </Badge>
                  )}
                  {post.is_public && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-2 py-0.5 font-bold">
                      <LockOpen className="w-3 h-3 mr-1" />
                      PUBLIC
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-white/40">
                  {post.created_date ? format(new Date(post.created_date), 'MMM d, yyyy HH:mm') + ' UTC' : 'Unknown date'}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!post.is_public && isMyPost && (
                <Button
                  onClick={() => handleUnlockPost(post)}
                  disabled={publishingPostId === post.id}
                  variant="ghost"
                  size="sm"
                  className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 h-8 px-3"
                  title="Pay 1 KAS to publish to all users"
                >
                  {publishingPostId === post.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      <span className="text-sm">Unlock</span>
                    </>
                  )}
                </Button>
              )}
              {isMyPost && (
                <>
                  <Button
                    onClick={() => handleEdit(post)}
                    variant="ghost"
                    size="sm"
                    className="text-white/40 hover:text-white h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(post.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400/60 hover:text-red-400 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <p className="text-white mb-4 leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {post.media_files && post.media_files.length > 0 && (
            <div className="mb-4 space-y-3">
              {post.media_files.map((media, idx) => (
                <div key={idx}>
                  {media.type === 'image' && (
                    <img
                      src={media.url}
                      alt="Post media"
                      className="w-full rounded-lg"
                      style={{ maxHeight: '600px' }}
                    />
                  )}
                  {media.type === 'video' && (
                    <video
                      src={media.url}
                      controls
                      playsInline
                      className="w-full rounded-lg bg-black"
                      style={{ maxHeight: '600px' }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 pt-4 border-t border-white/10">
            <Button
              onClick={() => handleLike(post)}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-red-400 h-auto p-0"
            >
              <Heart className="w-5 h-5 mr-2" />
              <span className="text-sm">{post.likes || 0}</span>
            </Button>

            <Button
              onClick={() => setShowComments(post.id)}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-white h-auto p-0"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">{post.comments_count || 0}</span>
            </Button>

            <Button
              onClick={() => setShowTipModal(post)}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-yellow-400 h-auto p-0"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              <span className="text-sm">{post.tips_received ? post.tips_received.toFixed(2) : 0} KAS</span>
            </Button>

            {!post.is_stamped && (
              <Button
                onClick={() => handleStamp(post)}
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-purple-400 h-auto p-0"
              >
                <Shield className="w-5 h-5 mr-2" />
                <span className="text-sm">Stamp</span>
              </Button>
            )}

            {post.is_stamped && (
              <div className="flex items-center gap-1 text-purple-400 text-xs">
                <Shield className="w-4 h-4" />
                <span>Stamped</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const mainPosts = getMainPosts();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-black to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(2px 2px at 20px 30px, white, transparent),
                           radial-gradient(2px 2px at 60px 70px, white, transparent),
                           radial-gradient(1px 1px at 50px 50px, white, transparent)`,
          backgroundSize: '200px 200px',
          animation: 'twinkle 4s ease-in-out infinite'
        }} />
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && postToPublish && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowPaymentModal(false);
              setPostToPublish(null);
            }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
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
                    <h3 className="text-white font-bold text-lg">Publish Post</h3>
                    <p className="text-white/60 text-sm">Pay 1 KAS to unlock</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPostToPublish(null);
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
                      <p className="text-white/60">This unlocks your post for all users to see.</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSelfPayment}
                  disabled={publishingPostId === postToPublish.id}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12 text-black font-bold"
                >
                  {publishingPostId === postToPublish.id ? (
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tip Modal */}
      <AnimatePresence>
        {showTipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTipModal(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
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
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Tip {showTipModal.author_name}</h3>
                    <p className="text-white/60 text-sm">Send KAS tip</p>
                  </div>
                </div>
                <Button onClick={() => setShowTipModal(null)} variant="ghost" size="sm" className="text-white/60 hover:text-white">
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
                      {amount} KAS
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleTip}
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

      {/* Comments Modal */}
      {showComments && (
        <DAGCommentSection
          postId={showComments}
          onClose={() => {
            setShowComments(null);
            loadData();
          }}
        />
      )}

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold text-white tracking-tight">DAG Feed</h1>
              <Button
                onClick={() => navigate(createPageUrl("Feed"))}
                size="sm"
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10 h-8 px-3"
                title="Back to TTT Feed"
              >
                <Users className="w-4 h-4 mr-2" />
                TTT Feed
              </Button>
            </div>
            <p className="text-white/40 text-sm mb-4">Pay-to-Publish Feed • 1 KAS to unlock your post</p>

            {!kaswareWallet.connected && (
              <Button
                onClick={connectKasware}
                size="sm"
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Connect Kasware to Post
              </Button>
            )}

            {kaswareWallet.connected && (
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white/60" />
                <span className="text-sm text-white/60 font-mono">
                  {kaswareWallet.address.substring(0, 10)}... Connected
                </span>
              </div>
            )}
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="backdrop-blur-xl bg-red-500/10 border-red-500/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-sm text-red-300">{error}</span>
                  <Button
                    onClick={() => setError(null)}
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-8 text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div className="mb-8">
              <Card className="backdrop-blur-xl bg-black border-white/10">
                <CardContent className="p-6">
                  {editingPost && (
                    <div className="mb-4 bg-white/5 border border-white/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Edit2 className="w-3 h-3" />
                          <span>Editing Post</span>
                        </div>
                        <Button
                          onClick={() => {setEditingPost(null); setNewPost(""); setUploadedFiles([]);}}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-white/40 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-lg font-bold text-white">
                      {user?.username?.[0]?.toUpperCase() || kaswareWallet.address?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        ref={textareaRef}
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        onPaste={handlePaste}
                        placeholder="What's on your mind? (Paste images directly)"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px] resize-none"
                      />
                    </div>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mb-4 space-y-3">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="relative">
                          {file.type === 'image' && (
                            <div className="relative">
                              <img src={file.url} alt="Upload" className="w-full max-h-64 object-contain rounded-lg" />
                              <Button
                                onClick={() => removeFile(index)}
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2 bg-black/80 hover:bg-black border border-white/20"
                              >
                                <X className="w-4 h-4 text-white" />
                              </Button>
                            </div>
                          )}
                          {file.type === 'video' && (
                            <div className="relative">
                              <video src={file.url} controls playsInline className="w-full max-h-96 rounded-lg bg-black" />
                              <Button
                                onClick={() => removeFile(index)}
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2 bg-black/80 hover:bg-black border border-white/20"
                              >
                                <X className="w-4 h-4 text-white" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingFile}
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-9 w-9 p-0"
                      >
                        {isUploadingFile ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    <Button
                      onClick={handlePost}
                      disabled={isPosting || (!newPost.trim() && uploadedFiles.length === 0)}
                      className="bg-white text-black hover:bg-white/90"
                    >
                      {isPosting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {editingPost ? 'Update' : 'Post'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="space-y-6">
              {mainPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {renderPost(post)}
                </motion.div>
              ))}
            </div>

            {mainPosts.length === 0 && (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 text-lg">No posts yet</p>
                <p className="text-white/20 text-sm">Be the first to share!</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}