import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send, Heart, MessageCircle, Trash2, Edit2,
  Loader2, Image as ImageIcon, X, Sparkles, Eye, Users, Activity, Video, FileText, DollarSign, Wallet, Plus, CornerDownRight, Pencil, Share, AlertCircle, Palette, Trophy, Hammer, Search, CircleDot, Newspaper
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import EncryptedNotepad from "@/components/feed/EncryptedNotepad";
import CommentSection from "@/components/feed/CommentSection";
import AgentYingChat from "@/components/AgentYingChat";
import ImageEditor from "@/components/feed/ImageEditor";
import BadgeManagerModal from "@/components/feed/BadgeManagerModal";
import PostExplainerModal from "@/components/feed/PostExplainerModal";

export default function FeedPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [error, setError] = useState(null);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [stampingPostId, setStampingPostId] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [showNotepad, setShowNotepad] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [showTipModal, setShowTipModal] = useState(false);
  const [tippingPost, setTippingPost] = useState(null);
  const [tipAmount, setTipAmount] = useState('');
  const [isSendingTip, setIsSendingTip] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showGrokModal, setShowGrokModal] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [grokPrompt, setGrokPrompt] = useState('');
  const [copiedPostId, setCopiedPostId] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUsername, setProfileUsername] = useState(null);
  const [profileData, setProfileData] = useState({ posts: [], followers: 0, following: 0, trustScore: 0, isFollowing: false, zekuBalance: 0, feedTipsSent: 0, feedTipsReceived: 0, bullTipsSent: 0, bullTipsReceived: 0, commentTipsSent: 0, commentTipsReceived: 0 });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [showProfileStats, setShowProfileStats] = useState(false);
  const [showGradientModal, setShowGradientModal] = useState(false);
  const [gradientColors, setGradientColors] = useState(() => {
    const saved = localStorage.getItem('feed_gradient');
    return saved ? JSON.parse(saved) : ['#0f172a', '#1e3a8a', '#000000'];
  });
  const [tempGradientColors, setTempGradientColors] = useState(gradientColors);
  const [userLikes, setUserLikes] = useState({});
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeUsername, setBadgeUsername] = useState(null);
  const [badgeContributions, setBadgeContributions] = useState({ bullReelsCount: 0, bullReelsTips: 0, feedPosts: 0, tipsSent: 0 });
  const [loadingBadge, setLoadingBadge] = useState(false);
  const [showArchitectModal, setShowArchitectModal] = useState(false);
  const [architectUsername, setArchitectUsername] = useState(null);
  const [architectContributions, setArchitectContributions] = useState({ feedPosts: 0, feedTips: 0 });
  const [loadingArchitect, setLoadingArchitect] = useState(false);
  const [showBadgeManager, setShowBadgeManager] = useState(false);
  const [userBadges, setUserBadges] = useState({});
  const [showKingModal, setShowKingModal] = useState(false);
  const [kingUsername, setKingUsername] = useState(null);
  const [kingContributions, setKingContributions] = useState({ feedPosts: 0, feedTips: 0, bullTips: 0 });
  const [loadingKing, setLoadingKing] = useState(false);
  const [showShillerModal, setShowShillerModal] = useState(false);
  const [shillerUsername, setShillerUsername] = useState(null);
  const [shillerContributions, setShillerContributions] = useState({ feedPosts: 0, feedTips: 0 });
  const [loadingShiller, setLoadingShiller] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markUsername, setMarkUsername] = useState(null);
  const [markContributions, setMarkContributions] = useState({ feedPosts: 0, feedTips: 0 });
  const [loadingMark, setLoadingMark] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devUsername, setDevUsername] = useState(null);
  const [devContributions, setDevContributions] = useState({ feedPosts: 0, feedTips: 0 });
  const [loadingDev, setLoadingDev] = useState(false);
  const [showCustomBadgeModal, setShowCustomBadgeModal] = useState(false);
  const [customBadgeData, setCustomBadgeData] = useState(null);
  const [customBadgeContributions, setCustomBadgeContributions] = useState({ feedPosts: 0, feedTips: 0 });
  const [loadingCustomBadge, setLoadingCustomBadge] = useState(false);
  const [showOlatomiwaModal, setShowOlatomiwaModal] = useState(false);
  const [olatomiwaUsername, setOlatomiwaUsername] = useState(null);
  const [olatomiwaContributions, setOlatomiwaContributions] = useState({ feedPosts: 0, feedTips: 0 });
  const [loadingOlatomiwa, setLoadingOlatomiwa] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tickerResults, setTickerResults] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [visiblePosts, setVisiblePosts] = useState(20);
  const [tickerCache, setTickerCache] = useState({});
  const [hashtagCache, setHashtagCache] = useState({});
  const [hashtagResults, setHashtagResults] = useState([]);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const [userResults, setUserResults] = useState([]);
  const [explainerPost, setExplainerPost] = useState(null);
  const [showNewsModal, setShowNewsModal] = useState(false);

  const fileInputRef = useRef(null);
  const replyFileInputRef = useRef(null);

  useEffect(() => {
    loadData();
    checkKasware();
    loadDraftFromStorage();
    loadUserBadges();
    preloadTickerCache();
  }, []);

  useEffect(() => {
    // Update ticker cache when posts change
    if (posts.length > 0) {
      preloadTickerCache();
    }
  }, [posts]);



  const loadDraftFromStorage = () => {
    const draft = localStorage.getItem('feed_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setNewPost(parsed.content || '');
        setUploadedFiles(parsed.mediaFiles || []);
        localStorage.removeItem('feed_draft');
        setShowChatBox(true);
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }
  };

  useEffect(() => {
    if (posts.length === 0) return;

    const fullHash = window.location.hash;
    const queryString = fullHash.includes('?') ? fullHash.split('?')[1] : '';
    const urlParams = new URLSearchParams(queryString);
    const postId = urlParams.get('post');
    
    if (!postId) return;

    // Find the post
    const post = posts.find(p => String(p.id) === String(postId));
    if (!post) return;

    // Scroll to post in feed
    setTimeout(() => {
      const postElement = document.getElementById(`post-${postId}`);
      if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        postElement.classList.add('ring-2', 'ring-cyan-500', 'transition-all', 'duration-300');
        setTimeout(() => {
          postElement.classList.remove('ring-2', 'ring-cyan-500');
        }, 3000);
      }
    }, 500);
  }, [posts, window.location.hash]);

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
      // Try to get current user, but don't fail if not logged in
      let currentUser = null;
      try {
        currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        console.log('User not logged in');
        setUser(null);
      }

      // Load posts regardless of auth status (posts are publicly readable)
      const allPosts = await base44.entities.Post.list('-created_date', 200);
      setPosts(allPosts);

      // Load user's likes
      if (currentUser) {
        try {
          const likes = await base44.entities.PostLike.filter({
            user_email: currentUser.email
          });
          const likesMap = {};
          likes.forEach(like => {
            likesMap[like.post_id] = true;
          });
          setUserLikes(likesMap);
        } catch (err) {
          console.log('Failed to load user likes:', err);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEditedImage = async (blob) => {
    try {
      const file = new File([blob], 'edited-image.png', { type: 'image/png' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Replace the original image with the edited one
      const imageIndex = uploadedFiles.findIndex(f => f.type === 'image');
      if (imageIndex !== -1) {
        const newFiles = [...uploadedFiles];
        newFiles[imageIndex] = {
          url: file_url,
          type: 'image',
          name: 'edited-image.png',
          size: blob.size
        };
        setUploadedFiles(newFiles);
      }

      setShowImageEditor(false);
      setError(null);
    } catch (err) {
      console.error('Failed to save edited image:', err);
      setError('Failed to save edited image');
    }
  };

  const handleGrokImageToVideo = async () => {
    if (!grokPrompt.trim()) {
      setError('Please describe how you want the video to look');
      return;
    }

    const imageFile = uploadedFiles.find(f => f.type === 'image');
    if (!imageFile) {
      setError('Please upload an image first');
      return;
    }

    setIsGeneratingVideo(true);
    setError(null);

    try {
      // This would integrate with Grok's actual video generation API
      // For demonstration purposes, showing the flow
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Transform this image into a video description: ${grokPrompt}. Provide detailed motion, camera movement, and scene dynamics.`,
        file_urls: [imageFile.url]
      });

      alert('🎬 Grok video generation would start here!\n\nNote: Full Grok API integration requires xAI API key.');
      setShowGrokModal(false);
      setGrokPrompt('');

    } catch (err) {
      console.error('Failed to generate video:', err);
      setError('Failed to generate video: ' + err.message);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB for videos
    const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB for images
    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    console.log('📤 Starting file upload...', files.length, 'files');

    for (const file of files) {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|quicktime|m4v|mkv|avi)$/i.test(file.name);
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|heic)$/i.test(file.name);
      const limit = isVideo ? MAX_VIDEO_SIZE : isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;

      console.log('📁 File:', file.name, '| Type:', file.type, '| Size:', (file.size / (1024 * 1024)).toFixed(2), 'MB | isVideo:', isVideo);

      if (file.size > limit) {
        const limitMB = limit / (1024 * 1024);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const errorMsg = `File "${file.name}" is too large (${fileSizeMB}MB). ${isVideo ? 'Videos' : isImage ? 'Images' : 'Files'} must be under ${limitMB}MB.`;
        console.error('❌ Size error:', errorMsg);
        setError(errorMsg);
        return;
      }
    }

    setIsUploadingFile(true);
    setError(null);
    
    try {
      const uploadPromises = files.map(async (file) => {
        console.log('⬆️ Uploading:', file.name);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        console.log('✅ Upload complete:', file_url);

        let fileType = 'file';
        if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|heic)$/i.test(file.name)) {
          fileType = 'image';
        } else if (file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|quicktime|m4v|mkv|avi)$/i.test(file.name)) {
          fileType = 'video';
        }

        console.log('🏷️ File classified as:', fileType);

        return {
          url: file_url,
          type: fileType,
          name: file.name,
          size: file.size
        };
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      console.log('✅ All uploads complete:', uploadedUrls);
      setUploadedFiles([...uploadedFiles, ...uploadedUrls]);
      setError(null);
    } catch (err) {
      console.error('❌ Upload error:', err);
      console.error('Error details:', err.message, err.stack);

      if (err.message?.includes('Payload too large') || err.message?.includes('413')) {
        setError('File too large. Videos must be under 500MB, images under 20MB.');
      } else if (err.message?.includes('timeout') || err.message?.includes('Network Error')) {
        setError('Upload timed out. Try a smaller video or check your connection.');
      } else {
        setError('Failed to upload: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleReplyFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB for videos
    const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB for images
    const MAX_FILE_SIZE = 20 * 1024 * 1024;

    for (const file of files) {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|quicktime|m4v|mkv|avi)$/i.test(file.name);
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|heic)$/i.test(file.name);
      const limit = isVideo ? MAX_VIDEO_SIZE : isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;

      if (file.size > limit) {
        const limitMB = limit / (1024 * 1024);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setError(`File too large (${fileSizeMB}MB). Limit: ${limitMB}MB.`);
        return;
      }
    }

    setIsUploadingFile(true);
    setError(null);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });

        let fileType = 'file';
        if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|heic)$/i.test(file.name)) {
          fileType = 'image';
        } else if (file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|quicktime|m4v|mkv|avi)$/i.test(file.name)) {
          fileType = 'video';
        }

        return {
          url: file_url,
          type: fileType,
          name: file.name,
          size: file.size
        };
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setReplyFiles([...replyFiles, ...uploadedUrls]);
      setError(null);
    } catch (err) {
      console.error('Failed to upload reply files:', err);
      
      if (err.message?.includes('Payload too large') || err.message?.includes('413')) {
        setError('File too large. Videos must be under 200MB.');
      } else if (err.message?.includes('timeout') || err.message?.includes('Network Error')) {
        setError('Upload timed out. Try a smaller video.');
      } else {
        setError('Failed to upload: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsUploadingFile(false);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const removeReplyFile = (index) => {
    setReplyFiles(replyFiles.filter((_, i) => i !== index));
  };

  const handleStampPost = async (post) => {
    if (!kaswareWallet.connected) {
      setError('Please connect Kasware wallet first to stamp posts');
      await connectKasware();
      return;
    }

    setStampingPostId(post.id);
    setError(null);

    try {
      const message = `TTT Post Stamp\n\nPost ID: ${post.id}\nContent: ${post.content.substring(0, 50)}...\nDate: ${new Date().toISOString()}\nStamper: ${kaswareWallet.address}`;

      const signature = await window.kasware.signMessage(message);

      await base44.entities.Post.update(post.id, {
        is_stamped: true,
        stamp_signature: signature,
        stamp_message: message,
        stamper_address: kaswareWallet.address,
        stamped_date: new Date().toISOString()
      });

      setPosts(posts.map(p => p.id === post.id ? {
        ...p,
        is_stamped: true,
        stamp_signature: signature,
        stamper_address: kaswareWallet.address,
        stamped_date: new Date().toISOString()
      } : p));

      setError(null);

    } catch (error) {
      console.error('❌ Failed to stamp post:', error);

      if (error.message && error.message.includes('User reject')) {
        setError('Signature cancelled by user');
      } else {
        setError('Failed to stamp post: ' + error.message);
      }
    } finally {
      setStampingPostId(null);
    }
  };

  const handleOpenTipModal = (post) => {
    if (!kaswareWallet.connected) {
      setError('Please connect Kasware wallet to send tips');
      connectKasware();
      return;
    }

    if (!post.author_wallet_address) {
      setError('Post author needs a wallet to receive tips');
      return;
    }

    if (post.created_by === user?.email) {
      setError('You cannot tip your own post');
      return;
    }

    setTippingPost(post);
    setShowTipModal(true);
    setTipAmount('');
  };

  const handleSendTip = async () => {
    if (!tipAmount || isNaN(parseFloat(tipAmount)) || parseFloat(tipAmount) <= 0) {
      setError('Enter a valid tip amount');
      return;
    }

    setIsSendingTip(true);
    setError(null);

    try {
      const amountSompi = Math.floor(parseFloat(tipAmount) * 100000000);
      const tipAmountKAS = parseFloat(tipAmount);

      const txId = await window.kasware.sendKaspa(
        tippingPost.author_wallet_address,
        amountSompi
      );

      const senderWallet = kaswareWallet.address || user?.created_wallet_address;
      const senderName = user?.username || (senderWallet ? `${senderWallet.substring(0, 8)}...` : 'Anonymous');

      console.log('💸 Recording tip transaction:', {
        sender: senderWallet,
        recipient: tippingPost.author_wallet_address,
        amount: tipAmountKAS,
        txId
      });

      // Record tip transaction with emails for cross-wallet tracking
      await base44.entities.TipTransaction.create({
        sender_wallet: senderWallet,
        sender_email: user?.email || null,
        sender_name: senderName,
        recipient_wallet: tippingPost.author_wallet_address,
        recipient_email: tippingPost.created_by || null,
        recipient_name: tippingPost.author_name,
        amount: tipAmountKAS,
        tx_hash: txId,
        post_id: tippingPost.id,
        source: 'feed'
      });

      // Update recipient's tips_received on their post (for display only)
      await base44.entities.Post.update(tippingPost.id, {
        tips_received: (tippingPost.tips_received || 0) + tipAmountKAS
      });

      // Track tip stats by EMAIL - SENDER
      if (user?.email) {
        const senderStats = await base44.entities.UserTipStats.filter({ user_email: user.email });
        if (senderStats.length > 0) {
          await base44.entities.UserTipStats.update(senderStats[0].id, {
            feed_tips_sent: (senderStats[0].feed_tips_sent || 0) + tipAmountKAS,
            username: user?.username || senderName
          });
        } else {
          await base44.entities.UserTipStats.create({
            user_email: user.email,
            username: user?.username || senderName,
            feed_tips_sent: tipAmountKAS,
            feed_tips_received: 0,
            bull_tips_sent: 0,
            bull_tips_received: 0
          });
        }
      }

      // Track tip stats by EMAIL - RECIPIENT
      if (tippingPost.created_by) {
        const recipientStats = await base44.entities.UserTipStats.filter({ user_email: tippingPost.created_by });
        if (recipientStats.length > 0) {
          await base44.entities.UserTipStats.update(recipientStats[0].id, {
            feed_tips_received: (recipientStats[0].feed_tips_received || 0) + tipAmountKAS,
            username: tippingPost.author_name
          });
        } else {
          await base44.entities.UserTipStats.create({
            user_email: tippingPost.created_by,
            username: tippingPost.author_name,
            feed_tips_sent: 0,
            feed_tips_received: tipAmountKAS,
            bull_tips_sent: 0,
            bull_tips_received: 0
          });
        }
      }

      setPosts(posts.map(p => 
        p.id === tippingPost.id 
          ? { ...p, tips_received: (p.tips_received || 0) + tipAmountKAS }
          : p
      ));

      setShowTipModal(false);
      setTippingPost(null);
      setTipAmount('');

      // Show custom notification instead of alert
      const notification = document.createElement('div');
      notification.className = 'fixed right-4 bg-black/95 backdrop-blur-xl border border-white/20 text-white rounded-xl p-4 shadow-2xl z-[1000] max-w-xs';
      notification.style.top = 'calc(var(--sat, 0px) + 8rem)';
      notification.innerHTML = `
        <div class="flex items-center gap-2 mb-3">
          <div class="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-sm">✓</span>
          </div>
          <h3 class="font-bold text-sm">Tip sent successfully!</h3>
        </div>
        <div class="space-y-1.5 text-xs text-white/60">
          <div class="flex justify-between gap-3">
            <span>Amount:</span>
            <span class="text-white font-semibold">${tipAmountKAS} KAS</span>
          </div>
          <div class="flex justify-between gap-3">
            <span>To:</span>
            <span class="text-white font-semibold truncate">${tippingPost.author_name}</span>
          </div>
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
      console.error('Failed to send tip:', err);

      if (err.message?.includes('User reject')) {
        setError('Transaction cancelled');
      } else {
        setError('Failed to send tip: ' + err.message);
      }
    } finally {
      setIsSendingTip(false);
    }
  };

  const isDesktop = () => {
    return window.innerWidth >= 1024 && !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  const handlePost = async () => {
    if (!newPost.trim() && uploadedFiles.length === 0) {
      setError('Please enter some content or upload files');
      return;
    }

    // Get wallet from Kasware or TTT wallet
    let walletAddress = '';
    if (kaswareWallet.connected) {
      walletAddress = kaswareWallet.address;
    } else if (user?.created_wallet_address) {
      walletAddress = user.created_wallet_address;
    } else {
      // Try to get local wallet
      const localWallet = localStorage.getItem('ttt_wallet_address');
      if (localWallet) {
        walletAddress = localWallet;
      } else {
        setError('Please create a TTT wallet or connect Kasware to post');
        return;
      }
    }

    // Desktop-only: Require 1 KAS self-payment
    if (isDesktop()) {
      if (!kaswareWallet.connected) {
        setError('Desktop users: Connect Kasware to post (1 KAS self-payment required)');
        await connectKasware();
        return;
      }

      setIsPosting(true);
      setError(null);

      try {
        // Send 1 KAS to self
        const amountSompi = 100000000; // 1 KAS
        console.log('💰 Desktop: Sending 1 KAS to self...', walletAddress);
        const txHash = await window.kasware.sendKaspa(walletAddress, amountSompi);
        console.log('✅ Desktop: Payment successful, txHash:', txHash);
      } catch (err) {
        console.error('❌ Desktop: Payment failed:', err);
        setIsPosting(false);
        if (err.message?.includes('User reject')) {
          setError('Payment cancelled - post not created');
        } else {
          setError('Payment failed: ' + err.message);
        }
        return;
      }
    } else {
      setIsPosting(true);
      setError(null);
    }

    try {
      const authorName = user?.username ||
                        (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Anonymous');

      const postData = {
        content: newPost.trim(),
        author_name: authorName,
        author_wallet_address: walletAddress,
        author_agent_zk_id: user?.agent_zk_id || '',
        author_role: user?.role || 'user',
        likes: 0,
        comments_count: 0,
        replies_count: 0,
        tips_received: 0
      };

      if (uploadedFiles.length > 0) {
        postData.media_files = uploadedFiles;
      }

      let createdPost = null;

      if (editingPost) {
        await base44.entities.Post.update(editingPost.id, postData);
        setPosts(posts.map(p => p.id === editingPost.id ? { ...editingPost, ...postData, updated_date: new Date().toISOString() } : p));
        setEditingPost(null);
      } else {
        console.log('📝 Creating new post...', postData);
        createdPost = await base44.entities.Post.create(postData);
        console.log('✅ Post created:', createdPost);

        // Reload all posts to get fresh data from server
        const freshPosts = await base44.entities.Post.list('-created_date', 200);
        console.log('📋 Reloaded posts:', freshPosts.length);
        setPosts(freshPosts);
      }

      setNewPost("");
      setUploadedFiles([]);
      setError(null);
      console.log('✨ Post flow completed successfully');

      // Check if @zk is mentioned anywhere in the post (not just at start)
      const postContent = newPost.toLowerCase();
      if (postContent.includes('@zk') && createdPost) {
        console.log('[Feed] @zk mentioned, invoking backend...');

        // Expand comments immediately to show @zk is responding
        setExpandedComments(prev => ({ ...prev, [createdPost.id]: true }));

        // Gather image URLs for vision analysis
        const imageUrls = createdPost.media_files 
          ? createdPost.media_files.filter(f => f.type === 'image').map(f => f.url)
          : (createdPost.image_url ? [createdPost.image_url] : []);

        // Call backend - it will create AND update the comment
        try {
          console.log('[Feed] Invoking zkBotRespond function...');
          console.log('[Feed] Image URLs:', imageUrls);
          const response = await base44.functions.invoke('zkBotRespond', { 
            post_id: createdPost.id,
            post_content: newPost.trim(),
            author_name: authorName,
            image_urls: imageUrls
          });
          console.log('[Feed] Response received:', response.data);

          // Reload to see the comment created by backend
          if (response.data?.success) {
            console.log('[Feed] Analysis successful! Response:', response.data.analysis);
            setTimeout(() => loadData(), 500);
          } else {
            console.error('[Feed] Analysis failed. Full response:', JSON.stringify(response.data));
            console.error('[Feed] Error message:', response.data?.error);
          }
        } catch (err) {
          console.error('[Feed] ZK bot error:', err.message, err);
          setTimeout(() => loadData(), 300);
        }
      }
    } catch (err) {
      console.error('Failed to post:', err);
      setError('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleReplyPost = async (parentPost) => {
    if (!replyText.trim() && replyFiles.length === 0) {
      setError('Please enter reply content or upload files');
      return;
    }

    // Check if calling ZK bot
    const zkMatch = replyText.trim().match(/^@zk\s+(.+)/i);

    // Get wallet from Kasware or TTT wallet
    let walletAddress = '';
    if (kaswareWallet.connected) {
      walletAddress = kaswareWallet.address;
    } else if (user?.created_wallet_address) {
      walletAddress = user.created_wallet_address;
    } else {
      const localWallet = localStorage.getItem('ttt_wallet_address');
      if (localWallet) {
        walletAddress = localWallet;
      } else {
        setError('Please create a TTT wallet or connect Kasware to reply');
        return;
      }
    }

    setIsPosting(true);
    setError(null);

    try {
      const authorName = user?.username ||
                        (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Anonymous');

      const replyData = {
        content: replyText.trim(),
        author_name: authorName,
        author_wallet_address: walletAddress,
        author_agent_zk_id: user?.agent_zk_id || '',
        author_role: user?.role || 'user',
        parent_post_id: parentPost.id,
        likes: 0,
        comments_count: 0,
        replies_count: 0,
        tips_received: 0
      };

      if (replyFiles.length > 0) {
        replyData.media_files = replyFiles;
      }

      const createdReply = await base44.entities.Post.create(replyData);

      // Update parent post's replies count
      await base44.entities.Post.update(parentPost.id, {
        replies_count: (parentPost.replies_count || 0) + 1
      });

      setReplyText("");
      setReplyFiles([]);
      setReplyingTo(null);
      setError(null);

      // Automatically expand replies
      if (!expandedReplies[parentPost.id]) {
        setExpandedReplies(prev => ({ ...prev, [parentPost.id]: true }));
      }

      // Reload all posts to get fresh data
      const freshPosts = await base44.entities.Post.list('-created_date', 200);
      setPosts(freshPosts);

      // Check if @zk is mentioned anywhere in the reply
      if (replyText.toLowerCase().includes('@zk') && createdReply) {
        console.log('[Feed] @zk mentioned in reply, invoking backend...');

        // Expand comments immediately
        setExpandedComments(prev => ({ ...prev, [createdReply.id]: true }));

        // Gather image URLs for vision analysis
        const replyImageUrls = createdReply.media_files 
          ? createdReply.media_files.filter(f => f.type === 'image').map(f => f.url)
          : (createdReply.image_url ? [createdReply.image_url] : []);

        // Call backend - it will create AND update the comment
        try {
          console.log('[Feed] Invoking zkBotRespond for reply...');
          console.log('[Feed] Reply Image URLs:', replyImageUrls);
          const response = await base44.functions.invoke('zkBotRespond', { 
            post_id: createdReply.id,
            post_content: replyText.trim(),
            author_name: authorName,
            image_urls: replyImageUrls
          });
          console.log('[Feed] Reply response received:', response.data);

          // Reload to see comment created by backend
          if (response.data?.success) {
            console.log('[Feed] Reply analysis successful! Response:', response.data.analysis);
            setTimeout(() => loadData(), 500);
          } else {
            console.error('[Feed] Reply analysis failed. Full response:', JSON.stringify(response.data));
            console.error('[Feed] Error message:', response.data?.error);
          }
        } catch (err) {
          console.error('[Feed] ZK bot reply error:', err.message, err);
          setTimeout(() => loadData(), 300);
        }
      }
    } catch (err) {
      console.error('Failed to reply:', err);
      setError('Failed to post reply');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (post, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      setError('Please login to like posts');
      return;
    }

    const hasLiked = userLikes[post.id];
    const newLikes = hasLiked ? Math.max(0, (post.likes || 0) - 1) : (post.likes || 0) + 1;

    // Optimistic update - instant UI response
    setPosts(posts.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));
    if (hasLiked) {
      setUserLikes(prev => {
        const updated = {...prev};
        delete updated[post.id];
        return updated;
      });
    } else {
      setUserLikes(prev => ({...prev, [post.id]: true}));
    }

    // Background DB operations
    try {
      if (hasLiked) {
        const existingLikes = await base44.entities.PostLike.filter({
          post_id: post.id,
          user_email: user.email
        });
        if (existingLikes.length > 0) {
          await base44.entities.PostLike.delete(existingLikes[0].id);
        }
      } else {
        await base44.entities.PostLike.create({
          post_id: post.id,
          user_email: user.email,
          user_wallet: user.created_wallet_address || kaswareWallet.address || ''
        });
      }

      await base44.entities.Post.update(post.id, { likes: newLikes });
    } catch (err) {
      console.error('Failed to like:', err);
      await loadData();
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return;

    try {
      setPosts(posts.filter(p => p.id !== postId));
      await base44.entities.Post.delete(postId);
    } catch (err) {
      console.error('Failed to delete:', err);
      setError('Failed to delete post');
      await loadData(); // Reload data to sync state
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setNewPost(post.content);
    setUploadedFiles(post.media_files || []);
    setReplyingTo(null); // Close reply box if open
  };

  const handleReply = (post) => {
    setReplyingTo(replyingTo?.id === post.id ? null : post); // Toggle reply box for this post
    setEditingPost(null); // Close edit box if open
    setReplyText(""); // Clear previous reply text
    setReplyFiles([]); // Clear previous reply files
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleReplies = (postId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleFollowUser = async (targetWallet, targetName) => {
    if (!user?.created_wallet_address && !kaswareWallet.address) {
      setError('Please connect wallet to follow users');
      return;
    }

    setIsFollowingUser(true);
    try {
      const currentUserWallet = user?.created_wallet_address || kaswareWallet.address;
      const currentUserName = user?.username || kaswareWallet.address?.substring(0, 8);

      if (profileData.isFollowing) {
        // Unfollow
        const existing = await base44.entities.TTTFollow.filter({
          follower_wallet: currentUserWallet,
          following_wallet: targetWallet
        });
        
        if (existing.length > 0) {
          await base44.entities.TTTFollow.delete(existing[0].id);
        }
      } else {
        // Follow
        await base44.entities.TTTFollow.create({
          follower_wallet: currentUserWallet,
          following_wallet: targetWallet,
          follower_name: currentUserName,
          following_name: targetName
        });
      }

      // Reload profile data
      await loadProfileData(targetName);
    } catch (err) {
      console.error('Failed to follow/unfollow:', err);
      setError('Failed to update follow status');
    } finally {
      setIsFollowingUser(false);
    }
  };

  const updateCommentsCount = async (postId) => {
    const comments = await base44.entities.PostComment.filter({ post_id: postId });
    const newCount = comments.length;

    setPosts(posts.map(p => p.id === postId ? { ...p, comments_count: newCount } : p));

    await base44.entities.Post.update(postId, {
      comments_count: newCount
    });
  };

  const handleSharePost = async (postId) => {
    const shareUrl = `${window.location.origin}/#/Feed?post=${postId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedPostId(postId);
      setTimeout(() => setCopiedPostId(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const loadBadgeContributions = async (username) => {
    setLoadingBadge(true);
    try {
      // Get feed posts
      const userPosts = await base44.entities.Post.filter({ author_name: username });
      const mainPosts = userPosts.filter(p => !p.parent_post_id);
      
      // Get all tip transactions
      const allReelTransactions = await base44.entities.TipTransaction.filter({ source: 'reel' });
      const allFeedTransactions = await base44.entities.TipTransaction.filter({ source: 'feed' });
      
      // Find user's wallet address from their transactions
      const userTransaction = [...allReelTransactions, ...allFeedTransactions].find(tx => 
        tx.sender_name === username || tx.recipient_name === username
      );
      const userWallet = userTransaction?.sender_wallet || userTransaction?.recipient_wallet;

      // Count Bull Reels posts (self-transactions where sender = recipient)
      const bullReelsPosts = allReelTransactions.filter(tx => 
        tx.sender_wallet === userWallet && 
        tx.recipient_wallet === userWallet &&
        tx.sender_wallet === tx.recipient_wallet
      );

      // Get unique Bull Reels by reel_id
      const uniqueReelIds = new Set(bullReelsPosts.map(tx => tx.reel_id).filter(Boolean));
      
      // Count tips received (all sources)
      const tipsReceived = [...allReelTransactions, ...allFeedTransactions]
        .filter(tx => 
          tx.recipient_name === username &&
          tx.sender_wallet !== tx.recipient_wallet
        )
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      // Count tips sent (all sources)
      const tipsSent = [...allReelTransactions, ...allFeedTransactions]
        .filter(tx => 
          tx.sender_name === username &&
          tx.sender_wallet !== tx.recipient_wallet
        )
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);

      setBadgeContributions({
        bullReelsCount: uniqueReelIds.size || bullReelsPosts.length,
        bullReelsTips: tipsReceived,
        feedPosts: mainPosts.length,
        tipsSent: tipsSent
      });
    } catch (err) {
      console.error('Failed to load badge contributions:', err);
      setBadgeContributions({ bullReelsCount: 0, bullReelsTips: 0, feedPosts: 0, tipsSent: 0 });
    } finally {
      setLoadingBadge(false);
    }
  };

  const loadArchitectContributions = async (username) => {
    setLoadingArchitect(true);
    try {
      // Get all Feed posts by this user
      const userPosts = await base44.entities.Post.filter({
        author_name: username
      });
      const mainPosts = userPosts.filter(p => !p.parent_post_id);
      
      // Get all tips received on Feed posts
      const feedTransactions = await base44.entities.TipTransaction.filter({ 
        source: 'feed',
        recipient_name: username
      });
      
      const totalFeedTips = feedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      setArchitectContributions({
        feedPosts: mainPosts.length,
        feedTips: totalFeedTips
      });
    } catch (err) {
      console.error('Failed to load architect contributions:', err);
      setArchitectContributions({ feedPosts: 0, feedTips: 0 });
    } finally {
      setLoadingArchitect(false);
    }
  };

  const loadKingContributions = async (username) => {
    setLoadingKing(true);
    try {
      const userPosts = await base44.entities.Post.filter({ author_name: username });
      const mainPosts = userPosts.filter(p => !p.parent_post_id);
      
      // Get user's email from their posts to fetch correct tip stats
      const userEmail = mainPosts.length > 0 ? mainPosts[0].created_by : null;

      let totalFeedTips = 0;
      let totalBullTips = 0;

      if (userEmail) {
        // Fetch from UserTipStats entity using email (more reliable)
        try {
          const tipStats = await base44.entities.UserTipStats.filter({ user_email: userEmail });
          if (tipStats.length > 0) {
            totalFeedTips = tipStats[0].feed_tips_received || 0;
            totalBullTips = tipStats[0].bull_tips_received || 0;
          }
        } catch (err) {
          console.log('Failed to fetch UserTipStats, falling back to TipTransaction:', err);
          
          // Fallback to TipTransaction if UserTipStats is not accessible
          const feedTransactions = await base44.entities.TipTransaction.filter({ 
            recipient_email: userEmail,
            source: 'feed'
          });
          totalFeedTips = feedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

          const bullTransactions = await base44.entities.TipTransaction.filter({ 
            recipient_email: userEmail,
            source: 'reel'
          });
          totalBullTips = bullTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        }
      }

      setKingContributions({
        feedPosts: mainPosts.length,
        feedTips: totalFeedTips,
        bullTips: totalBullTips
      });
    } catch (err) {
      console.error('Failed to load king contributions:', err);
      setKingContributions({ feedPosts: 0, feedTips: 0, bullTips: 0 });
    } finally {
      setLoadingKing(false);
    }
  };

  const loadShillerContributions = async (username) => {
    setLoadingShiller(true);
    try {
      const userPosts = await base44.entities.Post.filter({ author_name: username });
      const mainPosts = userPosts.filter(p => !p.parent_post_id);
      
      const feedTransactions = await base44.entities.TipTransaction.filter({ 
        source: 'feed',
        recipient_name: username
      });
      const totalFeedTips = feedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      setShillerContributions({
        feedPosts: mainPosts.length,
        feedTips: totalFeedTips
      });
    } catch (err) {
      console.error('Failed to load shiller contributions:', err);
      setShillerContributions({ feedPosts: 0, feedTips: 0 });
    } finally {
      setLoadingShiller(false);
    }
  };

  const loadMarkContributions = async (username) => {
    setLoadingMark(true);
    try {
      const userPosts = await base44.entities.Post.filter({ author_name: username });
      const mainPosts = userPosts.filter(p => !p.parent_post_id);
      
      const feedTransactions = await base44.entities.TipTransaction.filter({ 
        source: 'feed',
        recipient_name: username
      });
      const totalFeedTips = feedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      setMarkContributions({
        feedPosts: mainPosts.length,
        feedTips: totalFeedTips
      });
    } catch (err) {
      console.error('Failed to load mark contributions:', err);
      setMarkContributions({ feedPosts: 0, feedTips: 0 });
    } finally {
      setLoadingMark(false);
    }
  };

  const loadDevContributions = async (username) => {
    setLoadingDev(true);
    try {
      const userPosts = await base44.entities.Post.filter({ author_name: username });
      const mainPosts = userPosts.filter(p => !p.parent_post_id);
      
      const feedTransactions = await base44.entities.TipTransaction.filter({ 
        source: 'feed',
        recipient_name: username
      });
      const totalFeedTips = feedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

      setDevContributions({
        feedPosts: mainPosts.length,
        feedTips: totalFeedTips
      });
    } catch (err) {
      console.error('Failed to load dev contributions:', err);
      setDevContributions({ feedPosts: 0, feedTips: 0 });
    } finally {
      setLoadingDev(false);
    }
  };

  const loadOlatomiwaContributions = async (username) => {
    setLoadingOlatomiwa(true);
    try {
      const userPosts = await base44.entities.Post.filter({ author_name: username });
      const mainPosts = userPosts.filter(p => !p.parent_post_id);
      
      const userEmail = mainPosts.length > 0 ? mainPosts[0].created_by : null;
      let totalFeedTips = 0;

      if (userEmail) {
        try {
          const tipStats = await base44.entities.UserTipStats.filter({ user_email: userEmail });
          if (tipStats.length > 0) {
            totalFeedTips = tipStats[0].feed_tips_received || 0;
          }
        } catch (err) {
          console.log('Failed to fetch UserTipStats, falling back to TipTransaction:', err);
          const feedTransactions = await base44.entities.TipTransaction.filter({ 
            recipient_email: userEmail,
            source: 'feed'
          });
          totalFeedTips = feedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        }
      }

      setOlatomiwaContributions({
        feedPosts: mainPosts.length,
        feedTips: totalFeedTips
      });
    } catch (err) {
      console.error('Failed to load olatomiwa contributions:', err);
      setOlatomiwaContributions({ feedPosts: 0, feedTips: 0 });
    } finally {
      setLoadingOlatomiwa(false);
    }
  };

  const loadCustomBadgeContributions = async (username) => {
    setLoadingCustomBadge(true);
    try {
      const userPosts = await base44.entities.Post.filter({ author_name: username });
      const mainPosts = userPosts.filter(p => !p.parent_post_id);
      
      let totalFeedTips = 0;
      const userEmail = mainPosts.length > 0 ? mainPosts[0].created_by : null;

      if (userEmail) {
        try {
          const tipStats = await base44.entities.UserTipStats.filter({ user_email: userEmail });
          if (tipStats.length > 0) {
            totalFeedTips = tipStats[0].feed_tips_received || 0;
          }
        } catch (err) {
          console.log('Failed to fetch UserTipStats, falling back to TipTransaction:', err);
          const feedTransactions = await base44.entities.TipTransaction.filter({ 
            recipient_email: userEmail,
            source: 'feed'
          });
          totalFeedTips = feedTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        }
      }

      setCustomBadgeContributions({
        feedPosts: mainPosts.length,
        feedTips: totalFeedTips
      });
    } catch (err) {
      console.error('Failed to load custom badge contributions:', err);
      setCustomBadgeContributions({ feedPosts: 0, feedTips: 0 });
    } finally {
      setLoadingCustomBadge(false);
    }
  };

  const handleBadgeClick = async (username, badgeType) => {
    if (badgeType === 'king') {
      setKingUsername(username);
      setShowKingModal(true);
      await loadKingContributions(username);
    } else if (badgeType === 'shiller') {
      setShillerUsername(username);
      setShowShillerModal(true);
      await loadShillerContributions(username);
    } else if (badgeType === 'mark') {
      setMarkUsername(username);
      setShowMarkModal(true);
      await loadMarkContributions(username);
    } else if (badgeType === 'pov') {
      setDevUsername(username);
      setShowDevModal(true);
      await loadDevContributions(username);
    } else if (badgeType === 'knight') {
      setBadgeUsername(username);
      setShowBadgeModal(true);
      await loadBadgeContributions(username);
    } else if (badgeType === 'olatomiwa') {
      setOlatomiwaUsername(username);
      setShowOlatomiwaModal(true);
      await loadOlatomiwaContributions(username);
    } else if (hasArchitectBadge(username)) {
      setArchitectUsername(username);
      setShowArchitectModal(true);
      await loadArchitectContributions(username);
    } else {
      setBadgeUsername(username);
      setShowBadgeModal(true);
      await loadBadgeContributions(username);
    }
  };



  const hasModzBadge = (username) => {
    const modzUsers = ['big-ayoolataiwol', 'big-ayoolataiwo1', 'ayomuiz'];
    return modzUsers.includes(username?.toLowerCase());
  };

  const hasArchitectBadge = (username) => {
    const architectUsers = [];
    return architectUsers.includes(username?.toLowerCase());
  };

  const hasPOVBadge = (username) => {
    if (!username) return false;
    const normalized = username.toLowerCase().trim().replace(/\s+/g, '');
    return normalized === 'hayphase';
  };

  const hasKnightBadge = (username) => {
    if (!username) return false;
    const normalized = username.toLowerCase().trim().replace(/\s+/g, '');
    return normalized === 'peculiar';
  };

  const hasKingBadge = (username) => {
    if (!username) return false;
    const normalized = username.toLowerCase().trim().replace(/\s+/g, '');
    return normalized === 'ayomuiz';
  };

  const hasShillerBadge = (username) => {
    if (!username) return false;
    const normalized = username.toLowerCase().trim().replace(/\s+/g, '');
    return normalized === 'brahimcrrypt' || normalized === 'brahim';
  };

  const hasMarkBadge = (username) => {
    if (!username) return false;
    const normalized = username.toLowerCase().trim().replace(/\s+/g, '');
    return normalized === 'kehinde' || normalized === 'kehindeayo';
  };

  const hasOlatmiwaBadge = (username) => {
    if (!username) return false;
    const normalized = username.toLowerCase().trim().replace(/\s+/g, '');
    return normalized === 'olatomiwa';
  };

  const loadUserBadges = async () => {
    try {
      const allBadges = await base44.entities.UserBadge.filter({ is_active: true });
      const badgesMap = {};
      allBadges.forEach(badge => {
        if (!badgesMap[badge.username]) {
          badgesMap[badge.username] = [];
        }
        badgesMap[badge.username].push(badge);
      });
      setUserBadges(badgesMap);
    } catch (err) {
      console.error('Failed to load user badges:', err);
    }
  };

  const getUserBadges = (username) => {
    return userBadges[username] || [];
  };

  const getBadgeColorClass = (color) => {
    const colorMap = {
      cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
      red: 'bg-red-500/20 text-red-400 border-red-500/40',
      green: 'bg-green-500/20 text-green-400 border-green-500/40',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      pink: 'bg-pink-500/20 text-pink-400 border-pink-500/40'
    };
    return colorMap[color] || colorMap.cyan;
  };

  const loadProfileData = async (username) => {
    setLoadingProfile(true);
    try {
      const userPosts = await base44.entities.Post.filter({
        author_name: username
      }, '-created_date', 100);
      
      const mainPosts = userPosts.filter(p => !p.parent_post_id);
      
      let followersCount = 0;
      let followingCount = 0;
      let totalTipsReceived = 0;
      let totalTipsSent = 0;
      let isFollowing = false;
      let zekuBalance = 0;
      let targetEmail = null;
      
      if (mainPosts.length > 0 && mainPosts[0].author_wallet_address) {
        const targetWallet = mainPosts[0].author_wallet_address;
        targetEmail = mainPosts[0].created_by;
        
        // Get followers/following
        const followersList = await base44.entities.TTTFollow.filter({
          following_wallet: targetWallet
        });
        const followingList = await base44.entities.TTTFollow.filter({
          follower_wallet: targetWallet
        });
        
        followersCount = followersList.length;
        followingCount = followingList.length;
        
        // Check if current user is following
        if (user?.created_wallet_address || kaswareWallet.address) {
          const currentUserWallet = user?.created_wallet_address || kaswareWallet.address;
          isFollowing = followersList.some(f => f.follower_wallet === currentUserWallet);
        }
        
        // Get Zeku token balance
        try {
          const zekuData = await base44.entities.ZekuToken.filter({
            user_email: targetEmail
          });
          if (zekuData.length > 0) {
            zekuBalance = zekuData[0].balance || 0;
          }
        } catch (err) {
          console.log('Zeku balance not accessible:', err);
          zekuBalance = 0;
        }
      }

      // Get tip stats by EMAIL (more reliable than username)
      let feedTipsSent = 0;
      let feedTipsReceived = 0;
      let bullTipsSent = 0;
      let bullTipsReceived = 0;
      let commentTipsSent = 0;
      let commentTipsReceived = 0;
      
      if (targetEmail) {
        try {
          const tipStats = await base44.entities.UserTipStats.filter({ user_email: targetEmail });
          if (tipStats.length > 0) {
            feedTipsSent = tipStats[0].feed_tips_sent || 0;
            feedTipsReceived = tipStats[0].feed_tips_received || 0;
            bullTipsSent = tipStats[0].bull_tips_sent || 0;
            bullTipsReceived = tipStats[0].bull_tips_received || 0;
            commentTipsSent = tipStats[0].comment_tips_sent || 0;
            commentTipsReceived = tipStats[0].comment_tips_received || 0;
          }
        } catch (err) {
          console.log('Tip stats not accessible:', err);
        }
      }
      
      // Advanced Trust Score Algorithm - Starts at 0, progressive difficulty with diminishing returns
      let rawScore = 0;

      // 1. Post Quality Score (weighted by engagement)
      const postQualityScore = mainPosts.reduce((score, post) => {
        const engagementValue = (post.likes || 0) * 0.3 + 
                               (post.comments_count || 0) * 0.5 + 
                               (post.replies_count || 0) * 0.4 +
                               (post.tips_received || 0) * 1.5;
        return score + Math.min(3, engagementValue);
      }, 0);
      rawScore += Math.min(30, postQualityScore);

      // 2. Activity Consistency & Inactivity Penalty
      if (mainPosts.length > 0) {
        const latestPostDate = new Date(mainPosts[0].created_date);
        const oldestPost = new Date(mainPosts[mainPosts.length - 1].created_date);
        const accountAgeDays = Math.max(1, (Date.now() - oldestPost.getTime()) / (1000 * 60 * 60 * 24));
        const twentyFourHoursAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));
        const hoursSinceLastPost = (Date.now() - latestPostDate.getTime()) / (1000 * 60 * 60);

        // Daily activity check with inactivity penalty
        if (latestPostDate > twentyFourHoursAgo) {
          rawScore += 5; // Active bonus
        } else {
          // Progressive inactivity penalty - gets harsher over time
          const daysInactive = Math.floor(hoursSinceLastPost / 24);
          const inactivityPenalty = Math.min(10, daysInactive * 0.8);
          rawScore -= inactivityPenalty;
        }

        // Posting frequency (consistency over time)
        const postsPerWeek = (mainPosts.length / accountAgeDays) * 7;
        rawScore += Math.min(15, postsPerWeek * 3);

        // Account age (diminishing returns)
        rawScore += Math.min(5, Math.sqrt(accountAgeDays) * 0.5);
      } else {
        // No posts = major penalty
        rawScore -= 15;
      }

      // 3. Network Score (social graph strength)
      const followersScore = Math.sqrt(followersCount) * 1.5;
      rawScore += Math.min(10, followersScore);

      const followingScore = Math.sqrt(followingCount) * 0.5;
      rawScore += Math.min(5, followingScore);

      // 5. Content Volume (logarithmic scaling)
      const volumeScore = Math.log10(Math.max(1, mainPosts.length)) * 2.5;
      rawScore += Math.min(6, volumeScore);

      // Apply exponential difficulty curve - harder as you climb
      let trustScore = 0;
      if (rawScore <= 0) {
        trustScore = 0;
      } else if (rawScore <= 15) {
        // Easy tier (0-15 raw = 0-15 trust)
        trustScore = rawScore;
      } else if (rawScore <= 35) {
        // Medium tier (15-35 raw = 15-30 trust)
        trustScore = 15 + (rawScore - 15) * 0.75;
      } else if (rawScore <= 60) {
        // Hard tier (35-60 raw = 30-50 trust)
        trustScore = 30 + (rawScore - 35) * 0.8;
      } else if (rawScore <= 90) {
        // Very hard tier (60-90 raw = 50-70 trust)
        trustScore = 50 + (rawScore - 60) * 0.67;
      } else {
        // Elite tier (90+ raw = 70-100 trust) - extremely hard
        trustScore = 70 + Math.min(30, (rawScore - 90) * 0.4);
      }

      // Ensure minimum 0, cap at 100, round to 1 decimal
      trustScore = Math.max(0, Math.min(100, Math.round(trustScore * 10) / 10));
      
      setProfileData({ 
        posts: mainPosts, 
        followers: followersCount, 
        following: followingCount,
        trustScore,
        isFollowing,
        zekuBalance,
        feedTipsSent,
        feedTipsReceived,
        bullTipsSent,
        bullTipsReceived,
        commentTipsSent,
        commentTipsReceived
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const getPostReplies = (postId) => {
    return posts.filter(p => p.parent_post_id === postId).sort((a, b) =>
      new Date(a.created_date) - new Date(b.created_date)
    );
  };

  const getMainPosts = () => {
    let filtered = posts.filter(p => !p.parent_post_id);
    
    if (selectedTicker) {
      // Use cached ticker posts for instant results
      filtered = tickerCache[selectedTicker] || [];
    } else if (selectedHashtag) {
      // Use cached hashtag posts for instant results
      filtered = hashtagCache[selectedHashtag] || [];
    } else if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => {
        const content = post.content?.toLowerCase() || '';
        const author = post.author_name?.toLowerCase() || '';
        
        // Search in content, author name, hashtags, mentions, and tickers
        return content.includes(query) || 
               author.includes(query) ||
               content.includes('#' + query) ||
               content.includes('@' + query) ||
               content.includes('$' + query);
      });
    }
    
    return filtered.sort((a, b) =>
      new Date(b.created_date) - new Date(a.created_date)
    );
  };

  const preloadTickerCache = () => {
    // Build ticker cache from all posts
    const tickerPattern = /\$([a-zA-Z0-9_]+)/gi;
    const hashtagPattern = /#([a-zA-Z0-9_]+)/gi;
    const tickerCacheData = {};
    const hashtagCacheData = {};
    
    posts.forEach(post => {
      if (post.parent_post_id) return; // Skip replies
      
      // Cache tickers
      const tickerMatches = post.content?.matchAll(tickerPattern);
      if (tickerMatches) {
        for (const match of tickerMatches) {
          const ticker = match[1].toUpperCase();
          if (!tickerCacheData[ticker]) {
            tickerCacheData[ticker] = [];
          }
          tickerCacheData[ticker].push(post);
        }
      }

      // Cache hashtags
      const hashtagMatches = post.content?.matchAll(hashtagPattern);
      if (hashtagMatches) {
        for (const match of hashtagMatches) {
          const hashtag = match[1].toLowerCase();
          if (!hashtagCacheData[hashtag]) {
            hashtagCacheData[hashtag] = [];
          }
          hashtagCacheData[hashtag].push(post);
        }
      }
    });
    
    setTickerCache(tickerCacheData);
    setHashtagCache(hashtagCacheData);
  };

  const searchTickers = (query) => {
    if (!query.trim()) {
      setTickerResults([]);
      setSelectedTicker(null);
      return;
    }

    const cleanQuery = query.replace('$', '').toLowerCase();
    
    // Use cached ticker data for instant results
    const matchingTickers = Object.keys(tickerCache).filter(ticker => 
      ticker.toLowerCase().includes(cleanQuery)
    );

    setTickerResults(matchingTickers.map(ticker => ({
      ticker: ticker,
      count: tickerCache[ticker].length
    })).sort((a, b) => b.count - a.count)); // Sort by post count
  };

  const searchHashtags = (query) => {
    if (!query.trim()) {
      setHashtagResults([]);
      setSelectedHashtag(null);
      return;
    }

    const cleanQuery = query.replace('#', '').toLowerCase();
    
    // Use cached hashtag data for instant results
    const matchingHashtags = Object.keys(hashtagCache).filter(hashtag => 
      hashtag.toLowerCase().includes(cleanQuery)
    );

    setHashtagResults(matchingHashtags.map(hashtag => ({
      hashtag: hashtag,
      count: hashtagCache[hashtag].length
    })).sort((a, b) => b.count - a.count)); // Sort by post count
  };

  const searchUsers = async (query) => {
    if (!query.trim() || query.startsWith('$') || query.startsWith('#')) {
      setUserResults([]);
      return;
    }

    try {
      const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
      
      // Search through posts to find users (publicly accessible)
      const allPosts = await base44.entities.Post.list('-created_date', 200);
      const uniqueUsers = new Map();
      
      allPosts.forEach(post => {
        if (post.author_name && 
            post.author_name.toLowerCase().includes(cleanQuery.toLowerCase()) &&
            !uniqueUsers.has(post.author_name)) {
          uniqueUsers.set(post.author_name, {
            id: post.id,
            username: post.author_name,
            email: post.created_by,
            role: post.author_role,
            created_wallet_address: post.author_wallet_address,
            agent_zk_id: post.author_agent_zk_id
          });
        }
      });
      
      const matchingUsers = Array.from(uniqueUsers.values()).slice(0, 8);
      setUserResults(matchingUsers);
    } catch (err) {
      console.error('Failed to search users:', err);
      setUserResults([]);
    }
  };

  useEffect(() => {
    if (searchQuery.startsWith('$')) {
      const cleanQuery = searchQuery.replace('$', '').toUpperCase();
      
      // If query changed, show dropdown again
      if (selectedTicker && cleanQuery !== selectedTicker) {
        setSelectedTicker(null);
      }
      
      searchTickers(searchQuery);
      setHashtagResults([]);
      setUserResults([]);
      
      // Auto-select if exact match
      if (tickerCache[cleanQuery] && tickerResults.length === 1) {
        setSelectedTicker(cleanQuery);
      }
    } else if (searchQuery.startsWith('#')) {
      const cleanQuery = searchQuery.replace('#', '').toLowerCase();
      
      // If query changed, show dropdown again
      if (selectedHashtag && cleanQuery !== selectedHashtag) {
        setSelectedHashtag(null);
      }
      
      searchHashtags(searchQuery);
      setTickerResults([]);
      setUserResults([]);
      
      // Auto-select if exact match
      if (hashtagCache[cleanQuery] && hashtagResults.length === 1) {
        setSelectedHashtag(cleanQuery);
      }
    } else {
      setTickerResults([]);
      setHashtagResults([]);
      setSelectedTicker(null);
      setSelectedHashtag(null);
      
      // Search users for non-ticker/hashtag queries
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery);
      } else {
        setUserResults([]);
      }
    }
  }, [searchQuery, tickerCache, hashtagCache]);

  const renderTextWithLinks = (text) => {
    if (!text) return null;
    
    // Combined regex: URLs, hashtags, cashtags, mentions
    const pattern = /(https?:\/\/[^\s]+)|(#[a-zA-Z0-9_]+)|(\$[a-zA-Z0-9_]+)|(@[a-zA-Z0-9_]+)/g;
    const parts = text.split(pattern).filter(Boolean);
    
    return parts.map((part, index) => {
      // URLs
      if (part?.match(/^https?:\/\//)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      // Hashtags
      if (part?.startsWith('#')) {
        return (
          <span
            key={index}
            className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </span>
        );
      }
      // Crypto tickers ($)
      if (part?.startsWith('$')) {
        return (
          <span
            key={index}
            className="text-green-400 hover:text-green-300 cursor-pointer font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </span>
        );
      }
      // User mentions (@)
      if (part?.startsWith('@')) {
        return (
          <span
            key={index}
            className="text-purple-400 hover:text-purple-300 cursor-pointer font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const renderPost = (post, isReply = false) => (
    <Card id={`post-${post.id}`} className={`backdrop-blur-xl bg-black border-white/10 hover:border-white/20 transition-all ${isReply ? 'ml-12' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">
              {post.author_name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setProfileUsername(post.author_name);
                    setShowProfileModal(true);
                    await loadProfileData(post.author_name);
                  }}
                  className="text-white font-semibold hover:text-cyan-400 transition-colors"
                >
                  {post.author_name}
                </button>
                {post.author_role === 'admin' && (
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px] px-2 py-0.5 font-bold">
                    ADMIN
                  </Badge>
                )}
                {getUserBadges(post.author_name).map((badge, idx) => (
                  <button
                    key={badge.id || idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCustomBadgeData({ username: post.author_name, badge });
                      setShowCustomBadgeModal(true);
                      loadCustomBadgeContributions(post.author_name);
                    }}
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 font-bold border rounded-md transition-all ${getBadgeColorClass(badge.badge_color)} hover:opacity-80`}
                  >
                    {badge.badge_name}
                  </button>
                ))}
                {!getUserBadges(post.author_name).some(b => b.badge_name === 'ARCHITECT') && hasArchitectBadge(post.author_name) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBadgeClick(post.author_name);
                    }}
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-400/50 text-[10px] px-2 py-0.5 font-bold rounded-md hover:from-blue-400 hover:to-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/50"
                    title="View Contributions"
                  >
                    <Hammer className="w-3 h-3" />
                    ARCHITECT
                  </button>
                )}
                {!getUserBadges(post.author_name).some(b => b.badge_name === 'POV') && hasPOVBadge(post.author_name) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBadgeClick(post.author_name, 'pov');
                    }}
                    className="inline-flex items-center gap-1 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 text-white border border-emerald-400/60 text-[10px] px-2 py-0.5 font-bold rounded-md hover:from-emerald-300 hover:via-green-400 hover:to-teal-500 transition-all shadow-lg hover:shadow-emerald-500/50 animate-pulse"
                    title="View Contributions"
                    style={{ animationDuration: '3s' }}
                  >
                    <span className="text-[11px]">👁️</span>
                    POV
                  </button>
                )}
                {!getUserBadges(post.author_name).some(b => b.badge_name === 'KNIGHT') && hasKnightBadge(post.author_name) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBadgeClick(post.author_name, 'knight');
                    }}
                    className="inline-flex items-center gap-1 bg-gradient-to-br from-slate-400 via-gray-500 to-zinc-600 text-white border border-slate-400/60 text-[10px] px-2 py-0.5 font-bold rounded-md hover:from-slate-300 hover:via-gray-400 hover:to-zinc-500 transition-all shadow-lg hover:shadow-slate-500/50"
                    title="View Contributions"
                  >
                    <span className="text-[11px]">⚔️</span>
                    KNIGHT
                  </button>
                )}
                {!getUserBadges(post.author_name).some(b => b.badge_name === 'KING') && hasKingBadge(post.author_name) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBadgeClick(post.author_name, 'king');
                    }}
                    className="inline-flex items-center gap-1 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 text-black border-2 border-yellow-400/80 text-[10px] px-2 py-0.5 font-bold rounded-md hover:from-amber-300 hover:via-yellow-400 hover:to-orange-500 transition-all shadow-lg shadow-yellow-500/50 hover:shadow-yellow-400/70 animate-pulse"
                    title="View Contributions"
                    style={{ animationDuration: '2s' }}
                  >
                    <span className="text-[11px]">👑</span>
                    KING
                  </button>
                )}
                {!getUserBadges(post.author_name).some(b => b.badge_name === 'SHILLER') && hasShillerBadge(post.author_name) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBadgeClick(post.author_name, 'shiller');
                    }}
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white border border-pink-400/50 text-[10px] px-2 py-0.5 font-bold rounded-md hover:from-pink-400 hover:via-purple-400 hover:to-indigo-500 transition-all shadow-lg hover:shadow-pink-500/50"
                    title="View Contributions"
                  >
                    <span className="text-[11px]">📢</span>
                    SHILLER
                  </button>
                )}
                {!getUserBadges(post.author_name).some(b => b.badge_name === 'MARK') && hasMarkBadge(post.author_name) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBadgeClick(post.author_name, 'mark');
                    }}
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white border border-emerald-400/50 text-[10px] px-2 py-0.5 font-bold rounded-md hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-500 transition-all shadow-lg hover:shadow-emerald-500/50"
                    title="View Contributions"
                  >
                    <span className="text-[11px]">🎯</span>
                    MARK
                  </button>
                )}
                {!getUserBadges(post.author_name).some(b => b.badge_name === 'FIRSTLADY') && hasOlatmiwaBadge(post.author_name) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBadgeClick(post.author_name, 'olatomiwa');
                    }}
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white border border-blue-400/50 text-[10px] px-2 py-0.5 font-bold rounded-md hover:from-blue-400 hover:via-indigo-400 hover:to-purple-500 transition-all shadow-lg hover:shadow-blue-500/50"
                    title="View Contributions"
                  >
                    <span className="text-[11px]">💎</span>
                    FIRSTLADY
                  </button>
                )}
                <div className="relative flex items-center justify-center">
                  <div className="absolute top-0 w-5 h-8 bg-gradient-to-b from-yellow-500/80 to-yellow-600/60 transform -skew-x-12 blur-[1px]" style={{ left: '-2px' }} />
                  <div className="absolute top-0 w-5 h-8 bg-gradient-to-b from-yellow-500/80 to-yellow-600/60 transform skew-x-12 blur-[1px]" style={{ right: '-2px' }} />
                  <div className="relative w-7 h-7 rounded-full overflow-hidden ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-500/30">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/360a9bc22_image.png" 
                      alt="$KAS" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {post.author_agent_zk_id && (
                  <Badge className="bg-white/5 text-white/60 border-white/20 text-[10px] px-2 py-0.5">
                    {post.author_agent_zk_id}
                  </Badge>
                )}
                {post.is_stamped && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] px-2 py-0.5">
                    <Sparkles className="w-3 h-3 mr-1" />
                    STAMPED
                  </Badge>
                )}
              </div>
              <div className="text-xs text-white/40">
                {post.created_date ? format(new Date(post.created_date), 'MMM d, yyyy HH:mm') + ' UTC' : 'Unknown date'}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setExplainerPost(post)}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-purple-400 h-8 w-8 p-0"
              title="Explain this post"
            >
              <Sparkles className="w-4 h-4" />
            </Button>
            {(post.created_by === user?.email || 
              (post.author_wallet_address && (
                post.author_wallet_address === kaswareWallet.address ||
                post.author_wallet_address === user?.created_wallet_address ||
                post.author_wallet_address === localStorage.getItem('ttt_wallet_address')
              ))) && (
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
          {renderTextWithLinks(post.content)}
        </p>

        {post.media_files && post.media_files.length > 0 && (
          <div className={`mb-4 ${post.media_files.filter(m => m.type === 'image').length > 1 ? 'grid grid-cols-2 gap-3' : ''}`}>
            {post.media_files.map((media, idx) => (
              <div key={`${post.id}-media-${idx}`} className="relative">
                {media.type === 'image' && (
                  <div className="relative bg-transparent rounded-lg overflow-hidden">
                    <img
                      src={media.url}
                      alt="Post media"
                      loading={idx === 0 ? "eager" : "lazy"}
                      decoding="async"
                      onClick={() => setFullscreenImage(media.url)}
                      className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ maxHeight: '600px', display: 'block', backgroundColor: 'transparent' }}
                    />
                  </div>
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
                {media.type === 'file' && (
                  /\.(mp4|webm|ogg|mov|quicktime|m4v|mkv|avi)$/i.test(media.name || '') ? (
                    <video
                      src={media.url}
                      controls
                      playsInline
                      className="w-full rounded-lg bg-black"
                      style={{ maxHeight: '600px' }}
                    />
                  ) : (
                    <a
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-3 hover:bg-black/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-white/60" />
                        <div>
                          <div className="text-white text-sm">{media.name}</div>
                          <div className="text-white/40 text-xs">
                            {(media.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      </div>
                    </a>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {post.image_url && !post.media_files && (
          <div 
            onClick={() => setFullscreenImage(post.image_url)}
            className="w-full bg-transparent rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity mb-4"
          >
            <img
              src={post.image_url}
              alt="Post"
              className="w-full h-auto object-contain rounded-lg"
              style={{ display: 'block', maxHeight: '600px', backgroundColor: 'transparent' }}
            />
          </div>
        )}

        <div className="flex items-center gap-6 pt-4 border-t border-white/10">
          <Button
            onClick={(e) => handleLike(post, e)}
            variant="ghost"
            size="sm"
            className={`h-auto p-0 ${userLikes[post.id] ? 'text-red-400' : 'text-white/40 hover:text-red-400'}`}
          >
            <Heart className={`w-5 h-5 mr-2 ${userLikes[post.id] ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.likes || 0}</span>
          </Button>

          <Button
            onClick={() => toggleComments(post.id)}
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white h-auto p-0"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{post.comments_count || 0}</span>
          </Button>

          {!isReply && ( // Only show reply button for main posts
            <Button
              onClick={() => handleReply(post)}
              variant="ghost"
              size="sm"
              className={`h-auto p-0 ${replyingTo?.id === post.id ? 'text-cyan-400' : 'text-white/40 hover:text-cyan-400'}`}
              title="Reply to post"
            >
              <CornerDownRight className="w-5 h-5 mr-2" />
              <span className="text-sm">{post.replies_count || 0}</span>
            </Button>
          )}

          {post.author_wallet_address && post.created_by !== user?.email && (
            <Button
              onClick={() => handleOpenTipModal(post)}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-green-400 h-auto p-0 group"
              title="Send KAS tip"
            >
              <div className="w-5 h-5 mr-2 bg-white/10 border border-white/20 rounded-full flex items-center justify-center group-hover:bg-green-500/20 group-hover:border-green-500/30 transition-all">
                <span className="text-xs font-bold">$</span>
              </div>
              {post.tips_received > 0 && (
                <span className="text-xs">{post.tips_received.toFixed(2)}</span>
              )}
            </Button>
          )}

          <Button
            onClick={() => handleSharePost(post.id)}
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-cyan-400 h-auto p-0"
            title="Share post"
          >
            <Share className="w-5 h-5 mr-2" />
            {copiedPostId === post.id && (
              <span className="text-xs text-cyan-400">Copied!</span>
            )}
          </Button>

          {!post.is_stamped && (
            <Button
              onClick={() => handleStampPost(post)}
              disabled={!kaswareWallet.connected || stampingPostId === post.id}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-orange-400 h-auto p-0 ml-auto"
            >
              {stampingPostId === post.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="text-sm">Stamping...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span className="text-sm">Stamp</span>
                </>
              )}
            </Button>
          )}

          {post.is_stamped && (
            <div className="ml-auto flex items-center gap-2 text-xs text-orange-400/60">
              <Eye className="w-4 h-4" />
              <span className="font-mono">{post.stamper_address?.substring(0, 8)}...</span>
            </div>
          )}
        </div>

        {expandedComments[post.id] && (
          <CommentSection
            postId={post.id}
            currentUser={user}
            onCommentAdded={() => updateCommentsCount(post.id)}
          />
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const mainPosts = getMainPosts();

  const gradientStyle = {
    background: `linear-gradient(to bottom right, ${gradientColors.join(', ')})`
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={gradientStyle}>
      {/* Galaxy Nebula Overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Animated Stars Layer 1 */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(2px 2px at 20px 30px, white, transparent),
                           radial-gradient(2px 2px at 60px 70px, white, transparent),
                           radial-gradient(1px 1px at 50px 50px, white, transparent),
                           radial-gradient(1px 1px at 130px 80px, white, transparent),
                           radial-gradient(2px 2px at 90px 10px, white, transparent)`,
          backgroundSize: '200px 200px',
          animation: 'twinkle 4s ease-in-out infinite'
        }} />

        {/* Animated Stars Layer 2 */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(1px 1px at 40px 60px, white, transparent),
                           radial-gradient(1px 1px at 110px 90px, white, transparent),
                           radial-gradient(2px 2px at 80px 30px, white, transparent),
                           radial-gradient(1px 1px at 150px 60px, white, transparent)`,
          backgroundSize: '250px 250px',
          animation: 'twinkle 3s ease-in-out infinite 1s'
        }} />

        {/* Nebula Clouds */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-[90px] animate-pulse" style={{ animationDuration: '7s', animationDelay: '2s' }} />
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '9s', animationDelay: '3s' }} />
        </div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(20px); }
        }
      `}</style>

      {/* Floating Notepad Button - Positioned above bottom nav */}
      {!showNotepad && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNotepad(true)}
          className="fixed left-4 md:left-6 z-[60] w-10 h-10 md:w-12 md:h-12 bg-black/80 border border-white/20 hover:border-white/40 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
          title="Encrypted Notepad"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 text-white/80" strokeWidth={2} />
        </motion.button>
      )}

      <AnimatePresence>
        {showNotepad && (
          <EncryptedNotepad onClose={() => setShowNotepad(false)} />
        )}
      </AnimatePresence>

      {/* Image Editor Modal */}
      <AnimatePresence>
        {showImageEditor && uploadedFiles.find(f => f.type === 'image') && (
          <ImageEditor
            imageUrl={uploadedFiles.find(f => f.type === 'image').url}
            onClose={() => setShowImageEditor(false)}
            onSave={handleSaveEditedImage}
          />
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProfileModal(false)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto profile-modal-scroll"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0, 0, 0, 0.8) rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/10 p-6 z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-lg font-bold text-white">
                      {profileUsername?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-white font-bold text-xl">{profileUsername}</h2>
                        {getUserBadges(profileUsername).map((badge, idx) => (
                          <button
                            key={badge.id || idx}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCustomBadgeData({ username: profileUsername, badge });
                              setShowCustomBadgeModal(true);
                              loadCustomBadgeContributions(profileUsername);
                            }}
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 font-bold border rounded-md transition-all ${getBadgeColorClass(badge.badge_color)} hover:opacity-80`}
                          >
                            {badge.badge_name}
                          </button>
                        ))}
                        {hasShillerBadge(profileUsername) && (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white border border-pink-400/50 text-[10px] px-2 py-0.5 font-bold rounded-md">
                            <span className="text-[11px]">📢</span>
                            SHILLER
                          </span>
                        )}
                        {hasKingBadge(profileUsername) && (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 text-black border-2 border-yellow-400/80 text-[10px] px-2 py-0.5 font-bold rounded-md">
                            <span className="text-[11px]">👑</span>
                            KING
                          </span>
                        )}
                        {hasPOVBadge(profileUsername) && (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 text-white border border-emerald-400/60 text-[10px] px-2 py-0.5 font-bold rounded-md">
                            <span className="text-[11px]">👁️</span>
                            POV
                          </span>
                        )}
                        {hasKnightBadge(profileUsername) && (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-br from-slate-400 via-gray-500 to-zinc-600 text-white border border-slate-400/60 text-[10px] px-2 py-0.5 font-bold rounded-md">
                            <span className="text-[11px]">⚔️</span>
                            KNIGHT
                          </span>
                        )}
                        {hasModzBadge(profileUsername) && (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-br from-yellow-400 to-yellow-600 text-black border border-yellow-500/50 text-[10px] px-2 py-0.5 font-bold rounded-md">
                            <Trophy className="w-3 h-3" />
                            MODZ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/10 text-white/80 border-white/20 text-xs">
                          Trust Score: {profileData.trustScore}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {profileData.posts.length > 0 && profileData.posts[0].author_wallet_address !== user?.created_wallet_address && 
                     profileData.posts[0].author_wallet_address !== kaswareWallet.address && (
                      <Button
                        onClick={() => handleFollowUser(profileData.posts[0].author_wallet_address, profileUsername)}
                        disabled={isFollowingUser}
                        className={`${profileData.isFollowing ? 'bg-white/10 hover:bg-white/20' : 'bg-cyan-500 hover:bg-cyan-600'} text-white`}
                      >
                        {isFollowingUser ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : profileData.isFollowing ? (
                          'Following'
                        ) : (
                          <>
                            <Users className="w-4 h-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowProfileModal(false)}
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <button
                  onClick={() => setShowProfileStats(!showProfileStats)}
                  className="w-full flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <span className="text-white/60 text-sm">View Stats</span>
                  <motion.div
                    animate={{ rotate: showProfileStats ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Activity className="w-4 h-4 text-white/60" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showProfileStats && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-2 mt-3"
                    >
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-white/40 text-xs mb-0.5">Posts</div>
                        <div className="text-white font-bold">{profileData.posts.length}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-white/40 text-xs mb-0.5">Followers</div>
                        <div className="text-white font-bold">{profileData.followers}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-white/40 text-xs mb-0.5">Following</div>
                        <div className="text-white font-bold">{profileData.following}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-white/40 text-xs mb-0.5">Feed Tips Sent</div>
                        <div className="text-green-400 font-bold text-sm">{profileData.feedTipsSent?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-white/40 text-xs mb-0.5">Feed Tips Received</div>
                        <div className="text-cyan-400 font-bold text-sm">{profileData.feedTipsReceived?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-white/40 text-xs mb-0.5">Bull Tips Sent</div>
                        <div className="text-orange-400 font-bold text-sm">{profileData.bullTipsSent?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-white/40 text-xs mb-0.5">Bull Tips Received</div>
                        <div className="text-pink-400 font-bold text-sm">{profileData.bullTipsReceived?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-white/40 text-xs mb-0.5">Comment Tips Sent</div>
                        <div className="text-purple-400 font-bold text-sm">{profileData.commentTipsSent?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-white/40 text-xs mb-0.5">Comment Tips Received</div>
                        <div className="text-yellow-400 font-bold text-sm">{profileData.commentTipsReceived?.toFixed(2) || '0.00'}</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-2 border border-purple-500/30">
                        <div className="text-purple-300 text-xs mb-0.5">Zeku Tokens</div>
                        <div className="text-white font-bold text-sm flex items-center gap-1">
                          <span className="text-lg">⚡</span>
                          {profileData.zekuBalance || 0}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6 space-y-4">
                {loadingProfile ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 text-white/40 animate-spin mx-auto" />
                  </div>
                ) : profileData.posts.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/40">No posts yet</p>
                  </div>
                ) : (
                  profileData.posts.map((post) => (
                    <Card key={post.id} className="backdrop-blur-xl bg-black border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">
                            {post.author_name[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold">{post.author_name}</div>
                            <div className="text-xs text-white/40">
                              {format(new Date(post.created_date), 'MMM d, yyyy HH:mm')}
                            </div>
                          </div>
                        </div>
                        <p className="text-white mb-3 leading-relaxed whitespace-pre-wrap break-words">
                          {post.content}
                        </p>
                        {post.media_files && post.media_files.length > 0 && post.media_files[0].type === 'image' && (
                          <img
                            src={post.media_files[0].url}
                            alt="Post media"
                            className="w-full max-h-64 object-contain rounded-lg border border-white/10"
                          />
                        )}
                        <div className="flex items-center gap-4 pt-3 border-t border-white/10">
                          <span className="text-white/40 text-sm flex items-center gap-1">
                            <Heart className="w-4 h-4" /> {post.likes || 0}
                          </span>
                          <span className="text-white/40 text-sm flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" /> {post.comments_count || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenImage(null)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fullscreenImage}
                alt="Fullscreen"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <Button
                onClick={() => setFullscreenImage(null)}
                className="absolute top-4 right-4 bg-black/80 hover:bg-black border border-white/20 text-white"
                size="sm"
              >
                <X className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTipModal && tippingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={() => {
              setShowTipModal(false);
              setTippingPost(null);
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
                    <p className="text-white/60 text-sm">to {tippingPost.author_name}</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowTipModal(false);
                    setTippingPost(null);
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
                    {tippingPost.author_wallet_address}
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
                        {amount} KAS
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSendTip}
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
                      Send {tipAmount} KAS
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

      {/* MODZ Badge Contributions Modal */}
      <AnimatePresence>
        {showBadgeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBadgeModal(false)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
            >
              {/* Gold Medal Background Effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                      <Trophy className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">MODZ Badge</h3>
                      <p className="text-yellow-400 text-sm font-semibold">{badgeUsername}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowBadgeModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-4">
                    <h4 className="text-yellow-400 font-semibold mb-3 text-sm">Platform Contributions</h4>
                    
                    {loadingBadge ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-yellow-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Posts</span>
                          </div>
                          <span className="text-white font-bold text-lg">{badgeContributions.feedPosts}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                              <Video className="w-4 h-4 text-orange-400" />
                            </div>
                            <span className="text-white/80 text-sm">Bull Reels</span>
                          </div>
                          <span className="text-white font-bold text-lg">{badgeContributions.bullReelsCount}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="text-white/80 text-sm">Tips Received (KAS)</span>
                          </div>
                          <span className="text-green-400 font-bold text-lg">{badgeContributions.bullReelsTips.toFixed(2)}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-cyan-400" />
                            </div>
                            <span className="text-white/80 text-sm">Tips Sent (KAS)</span>
                          </div>
                          <span className="text-cyan-400 font-bold text-lg">{badgeContributions.tipsSent.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/80 leading-relaxed">
                        MODZ badge holders are recognized contributors to the Kaspa community through Bull Reels and network engagement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ARCHITECT Badge Contributions Modal */}
      <AnimatePresence>
        {showArchitectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowArchitectModal(false)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
            >
              {/* Blue Glow Background Effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                      <Hammer className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">ARCHITECT Badge</h3>
                      <p className="text-cyan-400 text-sm font-semibold">{architectUsername}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowArchitectModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-blue-500/20 rounded-xl p-4">
                    <h4 className="text-cyan-400 font-semibold mb-3 text-sm">Platform Contributions</h4>
                    
                    {loadingArchitect ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-white/80 text-sm">TTT Feed Posts</span>
                          </div>
                          <span className="text-white font-bold text-lg">{architectContributions.feedPosts}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-cyan-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Tips Received (KAS)</span>
                          </div>
                          <span className="text-cyan-400 font-bold text-lg">{architectContributions.feedTips.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/80 leading-relaxed">
                        ARCHITECT badge holders are core contributors building and shaping the TTT platform through active engagement and content creation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KING Badge Contributions Modal */}
      <AnimatePresence>
        {showKingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowKingModal(false)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg animate-pulse" style={{ animationDuration: '2s' }}>
                      <span className="text-3xl">👑</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">KING Badge</h3>
                      <p className="text-yellow-400 text-sm font-semibold">{kingUsername}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowKingModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-4">
                    <h4 className="text-yellow-400 font-semibold mb-3 text-sm">Platform Contributions</h4>
                    
                    {loadingKing ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-yellow-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Posts</span>
                          </div>
                          <span className="text-white font-bold text-lg">{kingContributions.feedPosts}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-cyan-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Tips Received (KAS)</span>
                          </div>
                          <span className="text-cyan-400 font-bold text-lg">{kingContributions.feedTips.toFixed(2)}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-orange-400" />
                            </div>
                            <span className="text-white/80 text-sm">Bull Tips Received (KAS)</span>
                          </div>
                          <span className="text-orange-400 font-bold text-lg">{kingContributions.bullTips.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/80 leading-relaxed">
                        KING badge holders are the royalty of TTT - recognized for exceptional contributions and leadership in the community.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHILLER Badge Contributions Modal */}
      <AnimatePresence>
        {showShillerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShillerModal(false)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-pink-500/10 to-indigo-500/10 border border-pink-500/30 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-3xl">📢</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">SHILLER Badge</h3>
                      <p className="text-pink-400 text-sm font-semibold">{shillerUsername}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowShillerModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-pink-500/20 rounded-xl p-4">
                    <h4 className="text-pink-400 font-semibold mb-3 text-sm">Platform Contributions</h4>
                    
                    {loadingShiller ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-pink-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Posts</span>
                          </div>
                          <span className="text-white font-bold text-lg">{shillerContributions.feedPosts}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Tips Received (KAS)</span>
                          </div>
                          <span className="text-purple-400 font-bold text-lg">{shillerContributions.feedTips.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-pink-500/10 to-indigo-500/10 border border-pink-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/80 leading-relaxed">
                        SHILLER badge holders are master promoters who spread the word about TTT and drive community growth.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MARK Badge Contributions Modal */}
      <AnimatePresence>
        {showMarkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMarkModal(false)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-3xl">🎯</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">MARK Badge</h3>
                      <p className="text-emerald-400 text-sm font-semibold">{markUsername}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowMarkModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-4">
                    <h4 className="text-emerald-400 font-semibold mb-3 text-sm">Platform Contributions</h4>
                    
                    {loadingMark ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Posts</span>
                          </div>
                          <span className="text-white font-bold text-lg">{markContributions.feedPosts}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-teal-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Tips Received (KAS)</span>
                          </div>
                          <span className="text-teal-400 font-bold text-lg">{markContributions.feedTips.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/80 leading-relaxed">
                        MARK badge holders are precision builders who hit the mark with exceptional quality and impact.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Badge Contributions Modal */}
      <AnimatePresence>
        {showCustomBadgeModal && customBadgeData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCustomBadgeModal(false)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${getBadgeColorClass(customBadgeData.badge.badge_color).replace('text-', 'bg-').replace('/20', '/30')}`}>
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">{customBadgeData.badge.badge_name} Badge</h3>
                      <p className="text-purple-400 text-sm font-semibold">{customBadgeData.username}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowCustomBadgeModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-purple-500/20 rounded-xl p-4">
                    <h4 className="text-purple-400 font-semibold mb-3 text-sm">Platform Contributions</h4>
                    
                    {loadingCustomBadge ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Posts</span>
                          </div>
                          <span className="text-white font-bold text-lg">{customBadgeContributions.feedPosts}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Tips Received (KAS)</span>
                          </div>
                          <span className="text-purple-400 font-bold text-lg">{customBadgeContributions.feedTips.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/80 leading-relaxed">
                        {customBadgeData.badge.badge_name} badge holders are recognized for their valuable contributions to the TTT community.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DEV Badge Contributions Modal */}
      <AnimatePresence>
        {showDevModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDevModal(false)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-3xl">💻</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">DEV Badge</h3>
                      <p className="text-green-400 text-sm font-semibold">{devUsername}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowDevModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-green-500/20 rounded-xl p-4">
                    <h4 className="text-green-400 font-semibold mb-3 text-sm">Platform Contributions</h4>
                    
                    {loadingDev ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Posts</span>
                          </div>
                          <span className="text-white font-bold text-lg">{devContributions.feedPosts}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Tips Received (KAS)</span>
                          </div>
                          <span className="text-emerald-400 font-bold text-lg">{devContributions.feedTips.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/80 leading-relaxed">
                        DEV badge holders are official Kaspa engineers who build and maintain the core infrastructure that powers the network.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OLATOMIWA Badge Contributions Modal */}
      <AnimatePresence>
        {showOlatomiwaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOlatomiwaModal(false)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-3xl">💎</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">FIRSTLADY Badge</h3>
                      <p className="text-blue-400 text-sm font-semibold">{olatomiwaUsername}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowOlatomiwaModal(false)}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/40 border border-blue-500/20 rounded-xl p-4">
                    <h4 className="text-blue-400 font-semibold mb-3 text-sm">Platform Contributions</h4>
                    
                    {loadingOlatomiwa ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Posts</span>
                          </div>
                          <span className="text-white font-bold text-lg">{olatomiwaContributions.feedPosts}</span>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-white/80 text-sm">Feed Tips Received (KAS)</span>
                          </div>
                          <span className="text-purple-400 font-bold text-lg">{olatomiwaContributions.feedTips.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-white/80 leading-relaxed">
                        FIRSTLADY carries the strong woman of TTT communities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient Customizer Modal */}
      <AnimatePresence>
        {showGradientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGradientModal(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-white/20 rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Background Gradient</h3>
                    <p className="text-white/60 text-xs">Customize your feed colors</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowGradientModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Gradient Preview */}
              <div 
                className="w-full h-32 rounded-xl border border-white/20 mb-6"
                style={{ background: `linear-gradient(to bottom right, ${tempGradientColors.join(', ')})` }}
              />

              {/* Color Pickers */}
              <div className="space-y-3 mb-6">
                {tempGradientColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-white/60 text-sm w-16">Color {index + 1}</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newColors = [...tempGradientColors];
                        newColors[index] = e.target.value;
                        setTempGradientColors(newColors);
                      }}
                      className="w-16 h-16 rounded-lg cursor-pointer border-2 border-white/20"
                    />
                    <Input
                      type="text"
                      value={color}
                      onChange={(e) => {
                        const newColors = [...tempGradientColors];
                        newColors[index] = e.target.value;
                        setTempGradientColors(newColors);
                      }}
                      placeholder="#000000"
                      className="flex-1 bg-white/5 border-white/10 text-white h-10 font-mono"
                    />
                    {tempGradientColors.length > 2 && (
                      <Button
                        onClick={() => setTempGradientColors(tempGradientColors.filter((_, i) => i !== index))}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 h-10 w-10 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Color Button */}
              {tempGradientColors.length < 5 && (
                <Button
                  onClick={() => setTempGradientColors([...tempGradientColors, '#1e293b'])}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 mb-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Color
                </Button>
              )}

              {/* Preset Gradients */}
              <div className="mb-6">
                <p className="text-white/60 text-xs mb-3">Presets</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: 'Ocean', colors: ['#0f172a', '#1e3a8a', '#000000'] },
                    { name: 'Sunset', colors: ['#1e1b4b', '#7c2d12', '#000000'] },
                    { name: 'Forest', colors: ['#14532d', '#052e16', '#000000'] },
                    { name: 'Purple', colors: ['#3b0764', '#581c87', '#000000'] },
                    { name: 'Fire', colors: ['#7f1d1d', '#991b1b', '#000000'] },
                    { name: 'Dark', colors: ['#0a0a0a', '#1a1a1a', '#000000'] },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setTempGradientColors(preset.colors)}
                      className="h-12 rounded-lg border border-white/20 hover:border-white/40 transition-all overflow-hidden"
                      style={{ background: `linear-gradient(to bottom right, ${preset.colors.join(', ')})` }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <Button
                onClick={() => {
                  setGradientColors(tempGradientColors);
                  localStorage.setItem('feed_gradient', JSON.stringify(tempGradientColors));
                  setShowGradientModal(false);
                }}
                className="w-full bg-white text-black hover:bg-white/90 h-11"
              >
                Apply Gradient
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Ying Chat - Floating on Right */}
      <AgentYingChat />

      {/* Badge Manager Modal (Admin Only) */}
      <AnimatePresence>
        {showBadgeManager && (
          <BadgeManagerModal 
            onClose={() => {
              setShowBadgeManager(false);
              loadUserBadges();
            }} 
          />
        )}
      </AnimatePresence>

      {/* Post Explainer Modal */}
      <AnimatePresence>
        {explainerPost && (
          <PostExplainerModal
            post={explainerPost}
            currentUser={user}
            onClose={() => setExplainerPost(null)}
          />
        )}
      </AnimatePresence>

      {/* Kaspa News Modal */}
      <AnimatePresence>
        {showNewsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewsModal(false)}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-white/20 rounded-2xl w-full max-w-6xl h-[85vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/80 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                    <Newspaper className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Kaspa News</h3>
                    <p className="text-white/60 text-xs">Latest updates from kaspa.news</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowNewsModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Iframe */}
              <div className="flex-1 bg-white">
                <iframe
                  src="https://kaspa.news"
                  className="w-full h-full border-0"
                  title="Kaspa News"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-white tracking-tight">TTT Feed</h1>
                  <Button
                    onClick={() => navigate(createPageUrl("Lobby"))}
                    size="sm"
                    variant="ghost"
                    className="relative text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 p-0 group"
                    title="Enter The Lobby"
                  >
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity },
                      }}
                      className="w-4 h-4"
                    >
                      <CircleDot className="w-4 h-4 text-cyan-400 group-hover:text-yellow-400 transition-colors" />
                    </motion.div>
                  </Button>
                  <Button
                    onClick={() => setShowNewsModal(true)}
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                    title="Kaspa News"
                  >
                    <Newspaper className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      setTempGradientColors(gradientColors);
                      setShowGradientModal(true);
                    }}
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                    title="Customize background"
                  >
                    <Palette className="w-4 h-4" />
                  </Button>
                  {user?.role === 'admin' && (
                    <Button
                      onClick={() => setShowBadgeManager(true)}
                      size="sm"
                      variant="ghost"
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 h-8 px-2"
                      title="Manage Badges"
                    >
                      <Trophy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-white/40 text-sm">Community Posts</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, @mentions, #hashtags, $tokens..."
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 h-10"
              />
              {searchQuery && (
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTicker(null);
                    setSelectedHashtag(null);
                    setVisiblePosts(20);
                  }}
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              {/* Ticker Dropdown */}
              <AnimatePresence>
                {tickerResults.length > 0 && !selectedTicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-black/95 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden shadow-2xl z-50"
                  >
                    <div className="p-2">
                      <div className="text-xs text-white/40 px-3 py-2">Tickers</div>
                      {tickerResults.map((result, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchQuery(`$${result.ticker}`);
                            setSelectedTicker(result.ticker);
                            setTickerResults([]);
                            setVisiblePosts(20);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="text-white font-semibold">${result.ticker}</span>
                          </div>
                          <span className="text-white/40 text-xs">{result.count} posts</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hashtag Dropdown */}
              <AnimatePresence>
                {hashtagResults.length > 0 && !selectedHashtag && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-black/95 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden shadow-2xl z-50"
                  >
                    <div className="p-2">
                      <div className="text-xs text-white/40 px-3 py-2">Hashtags</div>
                      {hashtagResults.map((result, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchQuery(`#${result.hashtag}`);
                            setSelectedHashtag(result.hashtag);
                            setHashtagResults([]);
                            setVisiblePosts(20);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                              <span className="text-cyan-400 font-bold">#</span>
                            </div>
                            <span className="text-white font-semibold">#{result.hashtag}</span>
                          </div>
                          <span className="text-white/40 text-xs">{result.count} posts</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* User Search Dropdown */}
              <AnimatePresence>
                {userResults.length > 0 && !searchQuery.startsWith('$') && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-black/95 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden shadow-2xl z-50"
                  >
                    <div className="p-2">
                      <div className="text-xs text-white/40 px-3 py-2">Users</div>
                      {userResults.map((result) => {
                        const badges = getUserBadges(result.username);
                        return (
                          <button
                            key={result.id}
                            onClick={async () => {
                              setProfileUsername(result.username || result.email);
                              setShowProfileModal(true);
                              setUserResults([]);
                              setSearchQuery('');
                              await loadProfileData(result.username || result.email);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">
                              {(result.username || result.email)[0].toUpperCase()}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-white font-semibold text-sm">{result.username || 'Anonymous'}</span>
                                {result.role === 'admin' && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded font-bold">ADMIN</span>
                                )}
                                {badges.slice(0, 2).map((badge) => (
                                  <span key={badge.id} className={`text-[9px] px-1.5 py-0.5 border rounded font-bold ${getBadgeColorClass(badge.badge_color)}`}>
                                    {badge.badge_name}
                                  </span>
                                ))}
                              </div>
                              <div className="text-white/40 text-xs truncate">@{result.username || result.email.split('@')[0]}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Active Ticker Filter Badge */}
            {selectedTicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2 mb-4"
              >
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-semibold">{selectedTicker}</span>
                <span className="text-sm text-white/40">• {tickerCache[selectedTicker]?.length || 0} posts</span>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTicker(null);
                    setVisiblePosts(20);
                  }}
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 w-6 p-0 text-white/40 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </Button>
              </motion.div>
            )}

            {/* Active Hashtag Filter Badge */}
            {selectedHashtag && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-4 py-2 mb-4"
              >
                <span className="text-cyan-400 font-bold">#</span>
                <span className="text-sm text-cyan-400 font-semibold">{selectedHashtag}</span>
                <span className="text-sm text-white/40">• {hashtagCache[selectedHashtag]?.length || 0} posts</span>
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedHashtag(null);
                    setVisiblePosts(20);
                  }}
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 w-6 p-0 text-white/40 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </Button>
              </motion.div>
            )}

            {!kaswareWallet.connected && (
              <Button
                onClick={connectKasware}
                size="sm"
                className="bg-white/10 border border-white/20 text-white hover:bg-white/20"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Connect Kasware to Post & Tip
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-8"
                >
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
                          <p className="text-white/60 text-xs line-clamp-2">{editingPost.content}</p>
                        </div>
                      )}

                      <div className="flex gap-4 mb-4">
                        <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-lg font-bold text-white">
                          {user?.username ? user.username[0].toUpperCase() :
                           user?.created_wallet_address ? user.created_wallet_address.slice(-1).toUpperCase() :
                           user?.email ? user.email[0].toUpperCase() :
                           kaswareWallet.connected ? kaswareWallet.address.slice(0, 1).toUpperCase() :
                           localStorage.getItem('ttt_wallet_address')?.slice(0, 1).toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1">
                          <Textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            onPaste={async (e) => {
                              const items = e.clipboardData?.items;
                              if (!items) return;

                              for (const item of items) {
                                // Handle pasted images
                                if (item.type.indexOf('image') !== -1) {
                                  e.preventDefault();
                                  const file = item.getAsFile();
                                  if (file) {
                                    setIsUploadingFile(true);
                                    try {
                                      const { file_url } = await base44.integrations.Core.UploadFile({ file });
                                      setUploadedFiles([...uploadedFiles, {
                                        url: file_url,
                                        type: 'image',
                                        name: file.name || 'pasted-image.png',
                                        size: file.size
                                      }]);
                                    } catch (err) {
                                      console.error('Failed to upload pasted image:', err);
                                      setError('Failed to upload pasted image');
                                    } finally {
                                      setIsUploadingFile(false);
                                    }
                                  }
                                }
                                // Text is handled automatically by the textarea
                              }
                            }}
                            placeholder={editingPost ? "Edit your post..." : "What's on your mind? (@zk to call ZK bot)"}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px] resize-none"
                          />
                        </div>
                      </div>

                      {uploadedFiles.length > 0 && (
                        <div className="mb-4 space-y-3">
                          {uploadedFiles.map((file, index) => (
                           <div key={index} className="relative">
                             {file.type === 'image' && (
                               <div className="relative bg-transparent rounded-lg overflow-hidden">
                                 <img
                                   src={file.url}
                                   alt="Upload preview"
                                   className="w-full max-h-64 object-contain rounded-lg"
                                   style={{ backgroundColor: 'transparent' }}
                                 />
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
                                  <video
                                    src={file.url}
                                    controls
                                    playsInline
                                    className="w-full max-h-96 rounded-lg bg-black"
                                  />
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
                              {file.type === 'file' && (
                                /\.(mp4|webm|ogg|mov|quicktime|m4v|mkv|avi)$/i.test(file.name || '') ? (
                                  <div className="relative">
                                    <video
                                      src={file.url}
                                      controls
                                      playsInline
                                      className="w-full max-h-96 rounded-lg bg-black"
                                    />
                                    <Button
                                      onClick={() => removeFile(index)}
                                      size="sm"
                                      variant="ghost"
                                      className="absolute top-2 right-2 bg-black/80 hover:bg-black border border-white/20"
                                    >
                                      <X className="w-4 h-4 text-white" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-5 h-5 text-white/60" />
                                      <div>
                                        <div className="text-white text-sm">{file.name}</div>
                                        <div className="text-white/40 text-xs">
                                          {(file.size / 1024).toFixed(2)} KB
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      onClick={() => removeFile(index)}
                                      size="sm"
                                      variant="ghost"
                                      className="text-white/60 hover:text-white"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 items-center">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          
                          {/* Combined Media Upload Button */}
                          <div className="relative z-[1]">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMediaMenu(!showMediaMenu);
                              }}
                              disabled={isUploadingFile}
                              variant="outline"
                              size="sm"
                              className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-9 w-9 p-0"
                              title="Upload media"
                            >
                              {isUploadingFile ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </Button>
                            
                            <AnimatePresence>
                              {showMediaMenu && (
                                <>
                                  <div
                                    className="fixed inset-0 z-[100]"
                                    onClick={() => setShowMediaMenu(false)}
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-white/20 rounded-xl p-1.5 shadow-xl z-[200] min-w-[140px]"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.setAttribute('accept', 'image/*');
                                        fileInputRef.current?.click();
                                        setShowMediaMenu(false);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors text-sm"
                                    >
                                      <ImageIcon className="w-4 h-4" />
                                      <span>Photo</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.setAttribute('accept', 'video/*');
                                        fileInputRef.current?.click();
                                        setShowMediaMenu(false);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors text-sm"
                                    >
                                      <Video className="w-4 h-4" />
                                      <span>Video</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.setAttribute('accept', '.pdf,.doc,.docx,.txt');
                                        fileInputRef.current?.click();
                                        setShowMediaMenu(false);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors text-sm"
                                    >
                                      <FileText className="w-4 h-4" />
                                      <span>File</span>
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Grok Image to Video Button - Fully Clickable */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🎬 Grok button clicked!');
                              const imageFile = uploadedFiles.find(f => f.type === 'image');
                              if (!imageFile) {
                                setError('Please upload an image first');
                                return;
                              }
                              setShowMediaMenu(false);
                              setShowGrokModal(true);
                            }}
                            disabled={uploadedFiles.length === 0 || !uploadedFiles.some(f => f.type === 'image')}
                            className="flex items-center gap-2 px-3 h-9 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-[1]"
                            title="Grok: Image to Video"
                          >
                            <img 
                              src="https://pbs.twimg.com/profile_images/1983681414370619392/oTT3nm5Z.jpg" 
                              alt="Grok" 
                              className="w-4 h-4 rounded-sm"
                            />
                            <span className="hidden sm:inline text-sm">Grok</span>
                          </button>

                          {/* Photo Editor Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const imageFile = uploadedFiles.find(f => f.type === 'image');
                              if (!imageFile) {
                                setError('Please upload an image first');
                                return;
                              }
                              setShowMediaMenu(false);
                              setShowImageEditor(true);
                            }}
                            disabled={uploadedFiles.length === 0 || !uploadedFiles.some(f => f.type === 'image')}
                            className="flex items-center gap-2 px-3 h-9 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative z-[1]"
                            title="Edit Photo"
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="hidden sm:inline text-sm">Edit</span>
                          </button>
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

                      <div className="mt-3 text-xs text-white/30">
                        Max size: Videos 200MB (5+ min) • Images 20MB • Files 20MB
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <div className="space-y-6">
                  <AnimatePresence>
                    {mainPosts.slice(0, visiblePosts).map((post, index) => {
                      const replies = getPostReplies(post.id);

                      return (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: Math.min(index * 0.05, 0.3) }}
                        >
                          {renderPost(post, false)}

                          {/* Inline Reply Box */}
                          <AnimatePresence>
                            {replyingTo?.id === post.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 ml-12 relative"
                              >
                                {/* Visual Connection Line */}
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-cyan-500/30 to-transparent" />
                                
                                <Card className="backdrop-blur-xl bg-black border-cyan-500/30 border-l-2 border-l-cyan-500/50">
                                  <CardContent className="p-4">
                                    {/* Reply Header */}
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                                      <CornerDownRight className="w-3 h-3 text-cyan-400" />
                                      <span className="text-xs text-cyan-400">Replying to {post.author_name}</span>
                                    </div>
                                    
                                    <div className="flex gap-3 mb-3">
                                      <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                       {user?.username ? user.username[0].toUpperCase() :
                                        user?.created_wallet_address ? user.created_wallet_address.slice(-1).toUpperCase() :
                                        user?.email ? user.email[0].toUpperCase() :
                                        kaswareWallet.connected ? kaswareWallet.address.slice(0, 1).toUpperCase() :
                                        localStorage.getItem('ttt_wallet_address')?.slice(0, 1).toUpperCase() || 'A'}
                                      </div>
                                      <Textarea
                                       value={replyText}
                                       onChange={(e) => setReplyText(e.target.value)}
                                       onPaste={async (e) => {
                                         const items = e.clipboardData?.items;
                                         if (!items) return;

                                         for (const item of items) {
                                           // Handle pasted images
                                           if (item.type.indexOf('image') !== -1) {
                                             e.preventDefault();
                                             const file = item.getAsFile();
                                             if (file) {
                                               setIsUploadingFile(true);
                                               try {
                                                 const { file_url } = await base44.integrations.Core.UploadFile({ file });
                                                 setReplyFiles([...replyFiles, {
                                                   url: file_url,
                                                   type: 'image',
                                                   name: file.name || 'pasted-image.png',
                                                   size: file.size
                                                 }]);
                                               } catch (err) {
                                                 console.error('Failed to upload pasted image:', err);
                                                 setError('Failed to upload pasted image');
                                               } finally {
                                                 setIsUploadingFile(false);
                                               }
                                             }
                                           }
                                         }
                                       }}
                                       placeholder="Write your reply... (@zk to call ZK bot)"
                                       className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px] resize-none"
                                       autoFocus
                                      />
                                    </div>

                                    {replyFiles.length > 0 && (
                                      <div className="mb-3 space-y-2">
                                        {replyFiles.map((file, idx) => (
                                          <div key={idx} className="relative">
                                            {file.type === 'image' && (
                                              <div className="relative">
                                                <img
                                                  src={file.url}
                                                  alt="Reply media"
                                                  className="w-full max-h-48 object-contain rounded-lg border border-white/10"
                                                />
                                                <Button
                                                  onClick={() => removeReplyFile(idx)}
                                                  size="sm"
                                                  variant="ghost"
                                                  className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 border border-white/20"
                                                >
                                                  <X className="w-3 h-3 text-white" />
                                                </Button>
                                              </div>
                                            )}
                                            {file.type === 'video' && (
                                              <div className="relative">
                                                <video
                                                  src={file.url}
                                                  controls
                                                  playsInline
                                                  className="w-full max-h-96 rounded-lg bg-black"
                                                />
                                                <Button
                                                  onClick={() => removeReplyFile(idx)}
                                                  size="sm"
                                                  variant="ghost"
                                                  className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 border border-white/20"
                                                >
                                                  <X className="w-3 h-3 text-white" />
                                                </Button>
                                              </div>
                                            )}
                                            {file.type === 'file' && (
                                              /\.(mp4|webm|ogg|mov|quicktime|m4v|mkv|avi)$/i.test(file.name || '') ? (
                                                <div className="relative">
                                                  <video
                                                    src={file.url}
                                                    controls
                                                    playsInline
                                                    className="w-full max-h-96 rounded-lg bg-black"
                                                  />
                                                  <Button
                                                    onClick={() => removeReplyFile(idx)}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 border border-white/20"
                                                  >
                                                    <X className="w-3 h-3 text-white" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-white/60" />
                                                    <div>
                                                      <div className="text-white text-sm">{file.name}</div>
                                                      <div className="text-white/40 text-xs">
                                                        {(file.size / 1024).toFixed(2)} KB
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <Button
                                                    onClick={() => removeReplyFile(idx)}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-white/60 hover:text-white"
                                                  >
                                                    <X className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                      <div className="flex gap-2">
                                        <input
                                          ref={replyFileInputRef}
                                          type="file"
                                          accept="image/*,video/*"
                                          multiple
                                          onChange={handleReplyFileUpload}
                                          className="hidden"
                                        />
                                        <Button
                                          onClick={() => {
                                            replyFileInputRef.current?.setAttribute('accept', 'image/*');
                                            replyFileInputRef.current?.click();
                                          }}
                                          disabled={isUploadingFile}
                                          variant="outline"
                                          size="sm"
                                          className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white h-8 px-2"
                                        >
                                          <ImageIcon className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            replyFileInputRef.current?.setAttribute('accept', 'video/*');
                                            replyFileInputRef.current?.click();
                                          }}
                                          disabled={isUploadingFile}
                                          variant="outline"
                                          size="sm"
                                          className="bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white h-8 px-2"
                                        >
                                          <Video className="w-3 h-3" />
                                        </Button>
                                      </div>

                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => {
                                            setReplyingTo(null);
                                            setReplyText("");
                                            setReplyFiles([]);
                                          }}
                                          variant="ghost"
                                          size="sm"
                                          className="text-white/40 hover:text-white h-8"
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={() => handleReplyPost(post)}
                                          disabled={isPosting || (!replyText.trim() && replyFiles.length === 0)}
                                          size="sm"
                                          className="bg-cyan-500 text-white hover:bg-cyan-600 h-8"
                                        >
                                          {isPosting ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <>
                                              <Send className="w-3 h-3 mr-1" />
                                              Reply
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="mt-3 text-xs text-white/30">
                                      Max size: Videos 200MB (5+ min) • Images 20MB
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Replies Thread */}
                          {replies.length > 0 && (
                            <div className="mt-4 space-y-4 relative">
                              {/* Visual Connection Line from Post to Replies */}
                              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/40 via-cyan-500/20 to-transparent" />
                              
                              <AnimatePresence>
                                {/* Limit to 2 replies initially if not expanded */}
                                {(expandedReplies[post.id] ? replies : replies.slice(0, 2)).map((reply) => (
                                  <motion.div
                                    key={reply.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                  >
                                    {renderPost(reply, true)}
                                  </motion.div>
                                ))}
                              </AnimatePresence>

                              {replies.length > 2 && ( // Only show "Show more" if there are more than 2 replies
                                <Button
                                  onClick={() => toggleReplies(post.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="ml-12 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                >
                                  {expandedReplies[post.id] ? (
                                    <>Hide {replies.length - 2} replies</>
                                  ) : (
                                    <>Show {replies.length - 2} more replies</>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {mainPosts.length === 0 && (
                  <div className="text-center py-20">
                    <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 text-lg">No posts yet</p>
                    <p className="text-white/20 text-sm">Be the first to share something!</p>
                  </div>
                )}

                {/* Load More Button */}
                {mainPosts.length > visiblePosts && (
                  <div className="text-center py-6">
                    <Button
                      onClick={() => setVisiblePosts(prev => prev + 20)}
                      className="bg-white/10 border border-white/20 text-white hover:bg-white/20"
                    >
                      Load More Posts ({mainPosts.length - visiblePosts} remaining)
                    </Button>
                  </div>
                )}
                    </motion.div>
        </div>
      </div>
    </div>
  );
}