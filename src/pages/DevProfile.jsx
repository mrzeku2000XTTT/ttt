import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Copy, Wallet, Target, DollarSign, CheckCircle, X, Edit2, Save, Upload, CreditCard } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function DevProfilePage() {
  const navigate = useNavigate();
  const [dev, setDev] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [showAppPreview, setShowAppPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedCover, setEditedCover] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [editedKnsId, setEditedKnsId] = useState("");
  const [editedFundingGoal, setEditedFundingGoal] = useState("");
  const [editedHowFundsUsed, setEditedHowFundsUsed] = useState("");
  const [editedAvatar, setEditedAvatar] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showKnsModal, setShowKnsModal] = useState(false);
  const [editedKnsPhoto, setEditedKnsPhoto] = useState("");
  const [uploadingKnsPhoto, setUploadingKnsPhoto] = useState(false);

  useEffect(() => {
    loadDev();
  }, []);

  const loadDev = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const devId = urlParams.get('id');
    
    if (!devId) {
      navigate(createPageUrl('KP'));
      return;
    }

    try {
      let user = null;
      try {
        user = await base44.auth.me();
        setCurrentUser(user);
      } catch (authErr) {
        console.log('User not logged in');
      }
      
      const allDevs = await base44.entities.KaspaBuilder.list();
      const devData = allDevs.filter(d => d.id === devId);
      console.log('Found dev:', devData);
      if (devData.length > 0) {
        const devProfile = devData[0];
        setDev(devProfile);
        setEditedCover(devProfile.cover_photo || "");
        setEditedBio(devProfile.description || "");
        setEditedKnsId(devProfile.kns_id || "");
        setEditedFundingGoal(devProfile.funding_goal || "");
        setEditedHowFundsUsed(devProfile.how_funds_used || "");
        setEditedAvatar(devProfile.avatar || "");
        setEditedKnsPhoto(devProfile.kns_photo || "");
        
        // Check if current user owns this profile (by email/created_by OR username)
        console.log('Ownership check:', {
          userEmail: user?.email,
          createdBy: devProfile.created_by,
          username: user?.username,
          devUsername: devProfile.username
        });
        if (user && (user.email === devProfile.created_by || user.username === devProfile.username)) {
          setIsOwner(true);
          console.log('User IS owner');
        } else {
          console.log('User is NOT owner');
        }
      } else {
        navigate(createPageUrl('KP'));
      }
    } catch (err) {
      console.error('Failed to load dev:', err);
      alert('Failed to load developer profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditedCover(file_url);
    } catch (err) {
      console.error('Failed to upload cover:', err);
      alert('Failed to upload cover photo');
    }
    setUploadingCover(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditedAvatar(file_url);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      alert('Failed to upload avatar');
    }
    setUploadingAvatar(false);
  };

  const handleKnsPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingKnsPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditedKnsPhoto(file_url);
      
      // Auto-save if we're viewing the modal
      if (showKnsModal && isOwner) {
        await base44.entities.KaspaBuilder.update(dev.id, {
          kns_photo: file_url
        });
        toast.success('KNS ID photo uploaded');
        loadDev();
      }
    } catch (err) {
      console.error('Failed to upload KNS photo:', err);
      alert('Failed to upload KNS ID photo');
    }
    setUploadingKnsPhoto(false);
  };

  const handleSaveProfile = async () => {
    if (!isOwner) return;

    try {
      await base44.entities.KaspaBuilder.update(dev.id, {
        avatar: editedAvatar,
        cover_photo: editedCover,
        description: editedBio,
        kns_id: editedKnsId,
        kns_photo: editedKnsPhoto,
        funding_goal: editedFundingGoal ? parseFloat(editedFundingGoal) : 0,
        how_funds_used: editedHowFundsUsed
      });
      
      toast.success('Profile updated successfully');
      setEditMode(false);
      loadDev();
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to update profile');
    }
  };

  const handleTip = async () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      alert('Please enter a valid tip amount');
      return;
    }

    if (typeof window.kasware === 'undefined') {
      alert('Kasware wallet not detected. Please install Kasware extension.');
      return;
    }

    try {
      // Convert KAS to sompi (1 KAS = 100,000,000 sompi)
      const sompiAmount = Math.floor(parseFloat(tipAmount) * 100000000);
      
      // Send KAS via Kasware
      const txResponse = await window.kasware.sendKaspa(dev.kaspa_address, sompiAmount);
      
      // Extract transaction ID
      let txid;
      if (typeof txResponse === 'string') {
        try {
          const parsed = JSON.parse(txResponse);
          txid = parsed.id;
        } catch {
          txid = txResponse;
        }
      } else if (txResponse && typeof txResponse === 'object') {
        txid = txResponse.id;
      }
      
      if (!txid || !/^[a-f0-9]{64}$/i.test(txid)) {
        throw new Error('Invalid transaction ID');
      }

      // Update dev's total tips after successful transaction
      await base44.entities.KaspaBuilder.update(dev.id, {
        total_tips: (dev.total_tips || 0) + parseFloat(tipAmount)
      });
      
      toast.success(`Tipped ${tipAmount} KAS to ${dev.username}`);
      setShowTipModal(false);
      setTipAmount("");
      loadDev();
    } catch (err) {
      console.error('Failed to tip:', err);
      alert(`Failed to send tip: ${err.message || 'Transaction cancelled'}`);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(dev.kaspa_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast.success('Profile link copied');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950/30 via-black to-blue-900/25 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!dev) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950/30 via-black to-blue-900/25 flex items-center justify-center">
        <div className="text-white text-xl">Developer not found</div>
      </div>
    );
  }

  const fundingProgress = dev.funding_goal > 0 ? (dev.total_tips / dev.funding_goal) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950/30 via-black to-blue-900/25">
      {/* Cover Photo / KNS Badge */}
      <div className="relative h-64 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-b border-cyan-500/30">
        {editMode ? (
          <>
            {editedCover ? (
              <img 
                src={editedCover} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">🚀</span>
              </div>
            )}
            <label className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer">
              <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/40 rounded-xl px-6 py-3 flex items-center gap-2 hover:bg-black/90 transition-all">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-semibold">
                  {uploadingCover ? "Uploading..." : "Change Cover Photo"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
                disabled={uploadingCover}
              />
            </label>
          </>
        ) : (
          <>
            {dev.cover_photo ? (
              <img 
                src={dev.cover_photo} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">🚀</span>
              </div>
            )}
          </>
        )}

        {/* Back Button */}
        <Button
          onClick={() => navigate(createPageUrl('KP'))}
          className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-black/80"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isOwner && (
            <Button
              onClick={() => {
                if (editMode) {
                  handleSaveProfile();
                } else {
                  setEditMode(true);
                }
              }}
              size="icon"
              className={`${
                editMode 
                  ? 'bg-green-500/80 hover:bg-green-600' 
                  : 'bg-purple-500/80 hover:bg-purple-600'
              } backdrop-blur-lg text-white border-0 shadow-lg w-10 h-10 rounded-full`}
              title={editMode ? "Save Profile" : "Edit Profile"}
            >
              {editMode ? (
                <Save className="w-4 h-4" />
              ) : (
                <Edit2 className="w-4 h-4" />
              )}
            </Button>
          )}
          <Button
            onClick={handleCopyLink}
            size="icon"
            className="bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-black/80 w-10 h-10 rounded-full"
            title="Share"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10 pb-8">
        {/* Profile Header - Centered Avatar */}
        <div className="flex flex-col items-center -mt-20 mb-8">
          <div className="relative group">
            {editMode ? (
              <div className="relative">
                <img 
                  src={editedAvatar || dev.avatar || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/53badb4f2_image.png"} 
                  alt={dev.username}
                  className="w-24 h-24 rounded-full border-4 border-black bg-black object-cover shadow-xl"
                />
                <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer hover:bg-black/80 transition-all">
                  <Upload className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
            ) : (
              <>
                <img 
                  src={dev.avatar || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/53badb4f2_image.png"} 
                  alt={dev.username}
                  className="w-24 h-24 rounded-full border-4 border-black bg-black object-cover shadow-xl"
                />
                {dev.verified && (
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-4 border-black">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl px-6 py-4 mt-4 text-center shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-2xl font-black text-white bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {dev.username}
              </h1>
              <Button
                onClick={() => setShowKnsModal(true)}
                size="sm"
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/40 text-purple-400 hover:bg-purple-500/30"
              >
                <CreditCard className="w-3 h-3 mr-1" />
                ID
              </Button>
            </div>
            <p className="text-cyan-400 text-sm mb-2">@{dev.twitter_handle}</p>
            {editMode ? (
              <Input
                value={editedKnsId}
                onChange={(e) => setEditedKnsId(e.target.value)}
                placeholder="your.kas"
                className="bg-white/5 backdrop-blur-sm border-purple-500/30 text-purple-400 h-9 rounded-lg max-w-xs text-sm font-bold mx-auto"
              />
            ) : (
              dev.kns_id && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-lg px-3 py-1 inline-block">
                  <span className="text-purple-400 font-bold text-sm">{dev.kns_id}</span>
                </div>
              )
            )}
          </div>

          <Button
            onClick={() => setShowTipModal(true)}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold mt-4 shadow-xl shadow-yellow-500/30"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Tip Dev
          </Button>
        </div>



        {/* Description */}
        {(dev.description || editMode || isOwner) && (
          <Card className="bg-white/5 backdrop-blur-2xl border border-white/20 mb-6 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">About This Project</h2>
                {isOwner && !editMode && (
                  <Button
                    onClick={() => setEditMode(true)}
                    size="sm"
                    className="bg-purple-500/80 backdrop-blur-sm hover:bg-purple-600 text-white border-0"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              {editMode ? (
                <Textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  placeholder="What are you building? Why do you need funding?"
                  className="bg-white/5 backdrop-blur-sm border-cyan-500/30 text-white rounded-xl resize-none min-h-[120px]"
                />
              ) : (
                <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                  {dev.description || "No description yet. Click Edit to add one."}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Funding Goal */}
        {(dev.funding_goal > 0 || editMode) && (
          <Card className="bg-white/5 backdrop-blur-2xl border border-white/20 mb-6 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Funding Goal</h2>
              </div>
              {editMode ? (
                <Input
                  type="number"
                  value={editedFundingGoal}
                  onChange={(e) => setEditedFundingGoal(e.target.value)}
                  placeholder="1000"
                  className="bg-white/5 border-cyan-500/30 text-white h-12 rounded-xl"
                />
              ) : (
                dev.funding_goal > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-right">
                        <div className="text-2xl font-black text-white">{dev.total_tips.toFixed(2)} KAS</div>
                        <div className="text-sm text-white/60">of {dev.funding_goal.toFixed(2)} KAS</div>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(fundingProgress, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                      />
                    </div>
                    <div className="text-sm text-white/60 mt-2 text-center">
                      {fundingProgress.toFixed(1)}% funded
                    </div>
                  </>
                )
              )}
            </CardContent>
          </Card>
        )}

        {/* How Funds Will Be Used */}
        {(dev.how_funds_used || editMode) && (
          <Card className="bg-white/5 backdrop-blur-2xl border border-white/20 mb-6 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">How Funds Will Be Used</h2>
              </div>
              {editMode ? (
                <Textarea
                  value={editedHowFundsUsed}
                  onChange={(e) => setEditedHowFundsUsed(e.target.value)}
                  placeholder="Server costs, development, marketing..."
                  className="bg-white/5 border-green-500/30 text-white rounded-xl resize-none min-h-[120px]"
                />
              ) : (
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{dev.how_funds_used}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Project/App */}
        {dev.app_url && (
          <Card className="bg-white/5 backdrop-blur-2xl border border-white/20 mb-6 shadow-xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">Project</h2>
              
              <div className="flex items-center gap-3 mb-4">
                <a
                  href={dev.app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="font-semibold">{dev.app_url}</span>
                </a>

                <Button
                  onClick={() => setShowAppPreview(!showAppPreview)}
                  size="sm"
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                >
                  {showAppPreview ? 'Hide Preview' : 'Preview App'}
                </Button>
              </div>

              {showAppPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 600 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg overflow-hidden border border-purple-500/30"
                >
                  <iframe
                    src={dev.app_url}
                    className="w-full h-full"
                    title="App Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Wallet Address */}
        <Card className="bg-white/5 backdrop-blur-2xl border border-white/20 shadow-xl">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">Wallet Address</h2>
            <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
              <span className="flex-1 text-white/60 text-sm font-mono break-all">
                {dev.kaspa_address}
              </span>
              <Button
                onClick={handleCopyAddress}
                size="sm"
                className={`${
                  copied 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                } border`}
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowTipModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-[#1a1d2e] to-[#0a0a0a] border border-yellow-500/30 rounded-3xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Tip {dev.username}</h2>
                  <p className="text-xs text-yellow-400/60">Support this developer</p>
                </div>
              </div>
              <Button
                onClick={() => setShowTipModal(false)}
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-yellow-500/20">
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src={dev.avatar || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/53badb4f2_image.png"} 
                  alt={dev.username}
                  className="w-12 h-12 rounded-full border-2 border-yellow-500/40"
                />
                <div>
                  <div className="text-sm font-bold text-white">{dev.username}</div>
                  <div className="text-xs text-white/60">@{dev.twitter_handle}</div>
                </div>
              </div>
              {dev.total_tips > 0 && (
                <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                  <span className="text-xs text-white/60">Total tips received:</span>
                  <span className="text-sm font-bold text-yellow-400">{dev.total_tips.toFixed(2)} KAS</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-yellow-400 font-medium mb-2 block">Tip Amount (KAS)</label>
                <input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-yellow-500/30 text-white h-12 rounded-xl text-lg font-bold px-4 focus:outline-none focus:border-yellow-500/50"
                />
              </div>

              <div className="flex gap-2">
                {[1, 5, 10, 25].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTipAmount(amount.toString())}
                    className="flex-1 px-3 py-2 bg-white/5 border border-yellow-500/30 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-all text-sm font-medium"
                  >
                    {amount} KAS
                  </button>
                ))}
              </div>

              <Button
                onClick={handleTip}
                disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white h-12 rounded-xl font-bold shadow-lg shadow-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Tip
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* KNS Card Modal */}
      {showKnsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowKnsModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-[#1a1d2e] to-[#0a0a0a] border border-purple-500/30 rounded-3xl p-4 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">KNS ID Card</h2>
                  <p className="text-xs text-purple-400/60">Kaspa Name Service</p>
                </div>
              </div>
              <Button
                onClick={() => setShowKnsModal(false)}
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* KNS ID Photo Upload - Always visible for owner */}
              {isOwner && (
                <div>
                  {dev.kns_photo ? (
                    <div className="relative group">
                      <img 
                        src={dev.kns_photo} 
                        alt="KNS ID"
                        className="w-full h-auto rounded-2xl border-2 border-purple-500/40 object-contain max-h-96"
                      />
                      <label className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-white mx-auto mb-2" />
                          <span className="text-white text-sm font-semibold">
                            {uploadingKnsPhoto ? "Uploading..." : "Change Photo"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleKnsPhotoUpload}
                          className="hidden"
                          disabled={uploadingKnsPhoto}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="block w-full border-2 border-dashed border-purple-500/40 rounded-2xl p-12 text-center hover:border-purple-500/60 transition-colors cursor-pointer bg-purple-500/5">
                      <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <p className="text-white font-bold mb-2 text-lg">Upload KNS ID Photo</p>
                      <p className="text-sm text-purple-400/80 mb-4">
                        {uploadingKnsPhoto ? "Uploading..." : "Tap here to upload your KNS badge/card"}
                      </p>
                      <div className="bg-purple-500/20 rounded-lg px-4 py-2 inline-block">
                        <span className="text-xs text-purple-300">📸 Camera or Gallery</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleKnsPhotoUpload}
                        className="hidden"
                        disabled={uploadingKnsPhoto}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Show existing photo for non-owners */}
              {!isOwner && dev.kns_photo && (
                <img 
                  src={dev.kns_photo} 
                  alt="KNS ID"
                  className="w-full h-auto rounded-2xl border-2 border-purple-500/40 object-contain max-h-96"
                />
              )}

              {/* ID Card Info */}
              {dev.kns_id ? (
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 rounded-2xl p-4 sm:p-6">
                  <div className="text-center mb-4">
                    <img 
                      src={dev.avatar || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/53badb4f2_image.png"} 
                      alt={dev.username}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-purple-500/40 mx-auto mb-3 object-cover"
                    />
                    <div className="text-2xl sm:text-3xl font-black text-white mb-1">{dev.kns_id}</div>
                    <div className="text-sm text-white/60">{dev.username}</div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-3 sm:p-4 space-y-3">
                    <div>
                      <div className="text-xs text-white/40 mb-1">Wallet Address</div>
                      <div className="text-xs sm:text-sm text-white/80 font-mono break-all">
                        {dev.kaspa_address}
                      </div>
                    </div>
                    {dev.verified && (
                      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400 font-semibold">Verified Developer</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-white/60 text-sm px-4">
                    {isOwner 
                      ? "Set your KNS ID in Edit Profile to complete your card"
                      : "This developer hasn't set up their KNS ID yet"
                    }
                  </p>
                  {isOwner && (
                    <Button
                      onClick={() => {
                        setShowKnsModal(false);
                        setEditMode(true);
                      }}
                      size="sm"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white mt-4"
                    >
                      <Edit2 className="w-3 h-3 mr-2" />
                      Add KNS ID
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}