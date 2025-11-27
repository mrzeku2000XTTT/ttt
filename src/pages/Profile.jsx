import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Stamp, Shield, Camera, Loader2, Save, X, CheckCircle2, AlertCircle, Calendar, ExternalLink, Copy, Wallet, RefreshCw, Crown, Sparkles, Briefcase, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DAGKnightBadge from "@/components/profile/DAGKnightBadge";
import JobSelector from "@/components/profile/JobSelector";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [editData, setEditData] = useState({ username: "", bio: "", profile_photo: "", current_job: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [stamps, setStamps] = useState([]);
  const [seals, setSeals] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [createdWallets, setCreatedWallets] = useState([]);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);
  const [dagKnightVerifications, setDagKnightVerifications] = useState([]);
  const [dagKnightCertificate, setDagKnightCertificate] = useState(null);
  const [isSharingStamp, setIsSharingStamp] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Try to get logged-in user, but don't require it
      let currentUser = null;
      
      try {
        currentUser = await base44.auth.me();
        setUser(currentUser);
        setEditData({
          username: currentUser.username || "",
          bio: currentUser.bio || "",
          profile_photo: currentUser.profile_photo || "",
          current_job: currentUser.current_job || ""
        });
        
        // Load created wallets
        if (currentUser.created_wallets && currentUser.created_wallets.length > 0) {
          setCreatedWallets(currentUser.created_wallets);
        }
      } catch (err) {
        // User not logged in - check for TTT wallet in localStorage
        const localWallet = localStorage.getItem('ttt_wallet_address');
        if (localWallet) {
          setUser({ created_wallet_address: localWallet });
          setCreatedWallets([{ address: localWallet, balance: 0 }]);
        }
      }

      // Load user-specific data only if logged in
      if (currentUser?.email) {
        try {
          const allTransactions = await base44.entities.BridgeTransaction.list('-created_date', 50);
          setTransactions(allTransactions);
        } catch (err) {
          console.error('Failed to load transactions:', err);
        }

        try {
          const saved = localStorage.getItem('subscription');
          if (saved) {
            const data = JSON.parse(saved);
            if (data.isActive && data.expiresAt < Date.now()) {
              data.isActive = false;
            }
            setSubscription(data);
          }
        } catch (subErr) {
          console.warn('Failed to load subscription:', subErr);
        }

        try {
          const userStamps = await base44.entities.StampedNews.filter({
            created_by: currentUser.email
          }, '-created_date', 100);
          setStamps(userStamps);
        } catch (err) {
          console.error('Failed to load stamps:', err);
        }

        try {
          const userSeals = await base44.entities.TTTID.filter({
            created_by: currentUser.email
          }, '-created_date', 100);
          
          const sealedWallets = await base44.entities.SealedWallet.filter({
            created_by: currentUser.email,
            is_active: true
          }, '-sealed_date', 100);
          
          const walletSeals = sealedWallets.map(wallet => ({
            ...wallet,
            type: 'wallet_seal',
            ttt_id: 'WALLET-' + wallet.wallet_address.substring(wallet.wallet_address.length - 8),
            display_name: `Wallet (${wallet.mnemonic_word_count} words)`,
            kaspa_address: wallet.wallet_address,
            seal_signature: wallet.seal_signature,
            verified_date: wallet.sealed_date,
            is_active: wallet.is_active
          }));
          
          setSeals([...userSeals, ...walletSeals]);
        } catch (err) {
          console.error('Failed to load seals:', err);
        }

        // Load DAGKnight verifications
        try {
          const verifications = await base44.entities.WalletVerification.filter({
            user_email: currentUser.email
          });
          setDagKnightVerifications(verifications);

          // Try to load existing certificate
          const certificates = await base44.entities.DAGKnightCertificate.filter({
            user_email: currentUser.email,
            is_public: true
          }, '-issued_date', 1);
          
          if (certificates.length > 0) {
            setDagKnightCertificate(certificates[0]);
          }
        } catch (err) {
          console.error('Failed to load DAGKnight data:', err);
        }
      }

    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWalletBalances = async () => {
    setIsRefreshingBalances(true);
    try {
      const updatedWallets = await Promise.all(
        createdWallets.map(async (wallet) => {
          try {
            const response = await base44.functions.invoke('getKaspaBalance', {
              address: wallet.address
            });
            const data = response.data || response;
            return {
              ...wallet,
              balance: data.balanceKAS || 0
            };
          } catch (err) {
            console.error(`Failed to fetch balance for ${wallet.address}:`, err);
            return wallet;
          }
        })
      );

      setCreatedWallets(updatedWallets);

      // Only update user profile if logged in
      if (user?.email) {
        await base44.auth.updateMe({
          created_wallets: updatedWallets
        });
      }

    } catch (err) {
      console.error('Failed to refresh balances:', err);
    } finally {
      setIsRefreshingBalances(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!user?.email) {
      alert('Please login to upload photos');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditData({ ...editData, profile_photo: file_url });
      await base44.auth.updateMe({ profile_photo: file_url });
      setUser({ ...user, profile_photo: file_url });
    } catch (err) {
      console.error('Failed to upload photo:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!user?.email) {
      setError('Please login to save profile changes');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    try {
      await base44.auth.updateMe(editData);
      setUser({ ...user, ...editData });
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleShareStampToFeed = async (stamp) => {
    setIsSharingStamp(stamp.id);
    try {
      console.log('🤖 Generating AI post for stamped news...');

      const postContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Create an engaging social media post about this stamped news:

Title: ${stamp.news_title}
Summary: ${stamp.news_summary}
Location: ${stamp.news_location || 'Unknown'}

Create a compelling post (max 280 characters) that:
- Grabs attention with a strong hook
- Summarizes the key information
- Includes relevant emojis
- Maintains a news reporting tone
- Ends with a call-to-action

Return ONLY the post text, no quotes or extra formatting.`,
      });

      console.log('🎨 Generating matching image...');

      const imagePrompt = `Breaking news illustration: ${stamp.news_title}. ${stamp.news_location || 'Global'}. Photorealistic news photography style, dramatic lighting, professional journalism aesthetic.`;
      
      const { url: imageUrl } = await base44.integrations.Core.GenerateImage({
        prompt: imagePrompt
      });

      console.log('✅ Post and image generated successfully');

      const feedDraft = {
        content: postContent.trim(),
        mediaFiles: [{
          url: imageUrl,
          type: 'image',
          name: 'ai-generated-news.png'
        }],
        newsSource: {
          title: stamp.news_title,
          url: `https://ttt.xyz`,
          timestamp: new Date().toISOString()
        }
      };

      localStorage.setItem('feed_draft', JSON.stringify(feedDraft));
      navigate(createPageUrl('Feed'));

    } catch (err) {
      console.error('❌ Failed to generate feed post:', err);
      alert('Failed to generate post. Please try again.');
    } finally {
      setIsSharingStamp(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const profilePhoto = editData.profile_photo || user?.profile_photo;
  const agentZKPhoto = user?.agent_zk_photo;
  
  // Get wallet address from user or localStorage
  const walletAddress = user?.created_wallet_address || localStorage.getItem('ttt_wallet_address');
  const agentZKId = walletAddress ? `ZK-${walletAddress.slice(-10).toUpperCase()}` : null;

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Hexagonal Grid Background Pattern */}
      <div className="fixed inset-0 z-0" style={{
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          linear-gradient(to right, rgba(6, 182, 212, 0.05) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(6, 182, 212, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 50px 50px, 50px 50px'
      }} />

      {/* Background Image from Agent ZK Photo */}
      {agentZKPhoto && (
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${agentZKPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-[#0a0e1a]/90 backdrop-blur-xl" />
        </div>
      )}

      {/* Animated Glow Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="fixed top-20 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="fixed bottom-20 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Futuristic Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="relative">
              {/* Hexagonal Frame Container */}
              <div className="relative flex flex-col items-center py-12">
                {/* Outer Hexagonal Glow */}
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 30px rgba(6, 182, 212, 0.3)',
                      '0 0 60px rgba(6, 182, 212, 0.6)',
                      '0 0 30px rgba(6, 182, 212, 0.3)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 -z-10"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
                  }}
                />

                {/* Hexagonal Border Frame */}
                <div className="relative">
                  {/* Animated Corner Accents */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
                  <div className="absolute top-1/2 -left-8 transform -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-cyan-500 to-transparent" />
                  <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-cyan-500 to-transparent" />

                  {/* Main Avatar Container with Hexagonal Effect */}
                  <div className="relative">
                    {/* Hexagonal Border Layers */}
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 -m-6"
                    >
                      <div className="w-full h-full border-2 border-cyan-500/30" style={{
                        clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                      }} />
                    </motion.div>

                    <motion.div
                      animate={{
                        rotate: [360, 0],
                      }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 -m-4"
                    >
                      <div className="w-full h-full border border-purple-500/20" style={{
                        clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                      }} />
                    </motion.div>

                    {/* Central Avatar Shield */}
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(6, 182, 212, 0.5)',
                          '0 0 40px rgba(6, 182, 212, 0.8)',
                          '0 0 20px rgba(6, 182, 212, 0.5)',
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative w-40 h-40 md:w-48 md:h-48"
                    >
                      {/* Inner Glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl" />
                      
                      {/* Avatar Frame */}
                      <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-cyan-500/50 bg-gradient-to-br from-cyan-950/50 to-purple-950/50 backdrop-blur-sm">
                        {profilePhoto ? (
                          <img 
                            src={profilePhoto} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900/30 to-purple-900/30">
                            <Shield className="w-20 h-20 text-cyan-400" />
                          </div>
                        )}
                        
                        {/* Upload Overlay */}
                        <label className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            disabled={isUploadingPhoto}
                          />
                          {isUploadingPhoto ? (
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          ) : (
                            <Camera className="w-8 h-8 text-white" />
                          )}
                        </label>

                        {/* Corner Tech Details */}
                        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-500" />
                        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-500" />
                        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-500" />
                        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-500" />
                      </div>

                      {/* Scanning Line Effect */}
                      <motion.div
                        animate={{
                          y: ['-100%', '200%'],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent h-8 pointer-events-none"
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Identity Section */}
                <div className="mt-12 text-center">
                  {agentZKId ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-3"
                      >
                        <div className="text-sm text-cyan-400 font-mono mb-2 tracking-widest uppercase">
                          Agent Identity
                        </div>
                        <div className="relative inline-block">
                          <div className="absolute inset-0 bg-cyan-500/20 blur-xl" />
                          <div className="relative text-3xl md:text-5xl font-bold text-white font-mono tracking-wider px-8 py-4 bg-gradient-to-r from-cyan-950/50 to-purple-950/50 border-2 border-cyan-500/50 rounded-lg">
                            {agentZKId}
                          </div>
                        </div>
                      </motion.div>

                      {/* Status Indicators */}
                      <div className="flex items-center gap-3 justify-center flex-wrap mt-6">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 px-4 py-1">
                          <CheckCircle2 className="w-3 h-3 mr-2" />
                          ACTIVE
                        </Badge>
                        {dagKnightVerifications.length > 0 && (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 px-4 py-1">
                            <Crown className="w-3 h-3 mr-2" />
                            VERIFIED
                          </Badge>
                        )}
                        {dagKnightVerifications.length >= 3 && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 px-4 py-1">
                            <Sparkles className="w-3 h-3 mr-2" />
                            ELITE
                          </Badge>
                        )}
                      </div>

                      {/* Tech Stats */}
                      <div className="mt-6 flex items-center gap-6 justify-center text-xs text-cyan-400 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                          <span>KASPA:L1</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                          <span>DAG:VERIFIED</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span>STATUS:ONLINE</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                        {user?.username || 'Your Profile'}
                      </h1>
                      <p className="text-cyan-400 font-mono">{user?.email}</p>
                    </>
                  )}

                  {/* Subtitle */}
                  <p className="text-gray-500 text-xs mt-4 font-mono uppercase tracking-wider">
                    {agentZKId 
                      ? "IMMUTABLE • UNIQUE • QUANTUM-SECURED"
                      : "TTT IDENTITY PROFILE"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-1.5 mb-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === "profile"
                    ? "bg-cyan-500/20 border border-cyan-500 text-cyan-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">Profile</span>
              </button>

              <button
                onClick={() => setActiveTab("dagknight")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === "dagknight"
                    ? "bg-cyan-500/20 border border-cyan-500 text-cyan-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-semibold">DAGKnight</span>
                {dagKnightVerifications.length > 0 && (
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                    <Crown className="w-3 h-3" />
                  </Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab("wallets")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === "wallets"
                    ? "bg-cyan-500/20 border border-cyan-500 text-cyan-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span className="text-sm font-semibold">Wallets</span>
                {createdWallets.length > 0 && (
                  <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full">
                    {createdWallets.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("stamps")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === "stamps"
                    ? "bg-cyan-500/20 border border-cyan-500 text-cyan-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Stamp className="w-4 h-4" />
                <span className="text-sm font-semibold">Stamps</span>
                {stamps.length > 0 && (
                  <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full">
                    {stamps.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("seals")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === "seals"
                    ? "bg-cyan-500/20 border border-cyan-500 text-cyan-400"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-semibold">Seals</span>
                {seals.length > 0 && (
                  <span className="bg-cyan-500/20 text-cyan-400 text-xs px-2 py-0.5 rounded-full">
                    {seals.length}
                  </span>
                )}
              </button>
            </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                  <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Profile Information</h2>
                    {!isEditing && (
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="ghost"
                        size="sm"
                        className="text-cyan-400"
                      >
                        Edit
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Username</label>
                      {isEditing ? (
                        <Input
                          value={editData.username}
                          onChange={(e) => setEditData({...editData, username: e.target.value})}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      ) : (
                        <div className="text-white text-lg">{user?.username || 'No username set'}</div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Bio</label>
                      {isEditing ? (
                        <Textarea
                          value={editData.bio}
                          onChange={(e) => setEditData({...editData, bio: e.target.value})}
                          className="bg-white/5 border-white/10 text-white h-24"
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <div className="text-white">{user?.bio || 'No bio yet'}</div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Current Job</label>
                      {isEditing ? (
                        <JobSelector
                          value={editData.current_job}
                          onChange={(job) => setEditData({...editData, current_job: job})}
                          disabled={isSaving}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {user?.current_job ? (
                            <>
                              <Briefcase className="w-4 h-4 text-cyan-400" />
                              <span className="text-white text-lg">{user.current_job}</span>
                            </>
                          ) : (
                            <span className="text-gray-500">No job set</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm text-gray-400">Connected Wallets</h3>
                      
                      {user?.kasware_address && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Kasware (L1)</div>
                              <div className="text-white font-mono text-sm break-all">{user.kasware_address}</div>
                            </div>
                            <Button
                              onClick={() => handleCopy(user.kasware_address)}
                              variant="ghost"
                              size="sm"
                              className="text-gray-400"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {user?.metamask_address && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-400 mb-1">MetaMask (L2 - Desktop)</div>
                              <div className="text-white font-mono text-sm break-all">{user.metamask_address}</div>
                            </div>
                            <Button
                              onClick={() => handleCopy(user.metamask_address)}
                              variant="ghost"
                              size="sm"
                              className="text-gray-400"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {user?.walletconnect_address && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Mobile Wallet Connection</div>
                              <div className="text-white font-mono text-sm break-all">{user.walletconnect_address}</div>
                            </div>
                            <Button
                              onClick={() => handleCopy(user.walletconnect_address)}
                              variant="ghost"
                              size="sm"
                              className="text-gray-400"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditing(false);
                            setEditData({
                              username: user.username || "",
                              bio: user.bio || "",
                              profile_photo: user.profile_photo || "",
                              current_job: user.current_job || ""
                            });
                          }}
                          variant="outline"
                          className="border-white/10 text-white hover:bg-white/5"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "dagknight" && (
              <motion.div
                key="dagknight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {dagKnightVerifications.length > 0 ? (
                  <>
                    <DAGKnightBadge 
                      certificate={dagKnightCertificate}
                      verifications={dagKnightVerifications}
                    />

                    <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                      <CardHeader className="border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-bold text-white">Manage Verification</h2>
                          <Link to={createPageUrl("DAGKnightWallet")}>
                            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                              <Shield className="w-4 h-4 mr-2" />
                              Go to DAGKnight
                            </Button>
                          </Link>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <p className="text-gray-400 text-sm">
                          Manage your multi-wallet verifications, view your DAG network, and enhance your security on the DAGKnight Wallet page.
                        </p>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                    <CardContent className="p-12 text-center">
                      <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">No DAGKnight Verification Yet</h3>
                      <p className="text-gray-400 mb-6">
                        Complete multi-wallet verification to earn your DAGKnight badge and unlock exclusive benefits.
                      </p>
                      <Link to={createPageUrl("DAGKnightWallet")}>
                        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                          <Shield className="w-5 h-5 mr-2" />
                          Start Verification
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === "wallets" && (
              <motion.div
                key="wallets"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                  <CardHeader className="border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white">Created Wallets</h2>
                        <p className="text-sm text-gray-400">Wallets you've created in TTT</p>
                      </div>
                      <Button
                        onClick={refreshWalletBalances}
                        disabled={isRefreshingBalances}
                        variant="ghost"
                        size="sm"
                        className="text-cyan-400"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingBalances ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {createdWallets.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                        <p>No wallets created yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {createdWallets.map((wallet, index) => (
                          <div key={wallet.address} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">Wallet #{index + 1}</div>
                                <div className="text-white font-mono text-sm break-all mb-2">{wallet.address}</div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                    {wallet.balance?.toFixed(8) || '0.00000000'} KAS
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleCopy(wallet.address)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <a
                                  href={`https://kas.fyi/address/${wallet.address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="ghost" size="sm" className="text-gray-400">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </a>
                              </div>
                            </div>
                            {wallet.createdAt && (
                              <div className="text-xs text-gray-600">
                                Created: {new Date(wallet.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "stamps" && (
              <motion.div
                key="stamps"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                  <CardHeader className="border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">My Stamped News</h2>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {stamps.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Stamp className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                        <p>No news stamped yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {stamps.map((stamp) => (
                          <div key={stamp.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                            <h3 className="text-white font-semibold mb-2">{stamp.news_title}</h3>
                            <p className="text-gray-400 text-sm mb-3">{stamp.news_summary?.substring(0, 150)}...</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-4 h-4" />
                                {new Date(stamp.stamped_date).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                  Stamped
                                </Badge>
                                <Button
                                  onClick={() => handleShareStampToFeed(stamp)}
                                  disabled={isSharingStamp === stamp.id}
                                  size="sm"
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                >
                                  {isSharingStamp === stamp.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Sharing...
                                    </>
                                  ) : (
                                    <>
                                      <Share2 className="w-3 h-3 mr-1" />
                                      Push to Feed
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "seals" && (
              <motion.div
                key="seals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                  <CardHeader className="border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">My TTT ID Seals</h2>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {seals.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Shield className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                        <p>No TTT ID seals yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {seals.map((seal) => (
                          <div key={seal.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                                    {seal.ttt_id}
                                  </Badge>
                                  {seal.type === 'wallet_seal' && (
                                    <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                      Wallet
                                    </Badge>
                                  )}
                                </div>
                                {seal.display_name && (
                                  <div className="text-white font-semibold mb-1">{seal.display_name}</div>
                                )}
                                <div className="text-gray-400 text-xs font-mono break-all">{seal.kaspa_address}</div>
                              </div>
                              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 ml-3" />
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(seal.verified_date).toLocaleDateString()}
                              </div>
                              <a
                                href={`https://kas.fyi/address/${seal.kaspa_address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                              >
                                <ExternalLink className="w-4 h-4" />
                                View
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </motion.div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(200%); }
        }
      `}</style>
    </div>
  );
}