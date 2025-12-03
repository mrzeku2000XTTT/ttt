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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showKnsModal, setShowKnsModal] = useState(false);

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
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      const devData = await base44.entities.KaspaDev.filter({ id: devId });
      if (devData.length > 0) {
        const devProfile = devData[0];
        setDev(devProfile);
        setEditedCover(devProfile.cover_photo || "");
        setEditedBio(devProfile.description || "");
        setEditedKnsId(devProfile.kns_id || "");
        
        // Check if current user owns this profile
        if (user && user.username === devProfile.username) {
          setIsOwner(true);
        }
      } else {
        navigate(createPageUrl('KP'));
      }
    } catch (err) {
      console.error('Failed to load dev:', err);
      navigate(createPageUrl('KP'));
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

  const handleSaveProfile = async () => {
    if (!isOwner) return;

    try {
      await base44.entities.KaspaDev.update(dev.id, {
        cover_photo: editedCover,
        description: editedBio,
        kns_id: editedKnsId
      });
      
      alert('✅ Profile updated successfully!');
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
      await base44.entities.KaspaDev.update(dev.id, {
        total_tips: (dev.total_tips || 0) + parseFloat(tipAmount)
      });
      
      alert(`✅ Tipped ${tipAmount} KAS to ${dev.username}! 🚀\n\nTX: ${txid.substring(0, 8)}...`);
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
    alert('Profile link copied! 🔗');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950/30 via-black to-blue-900/25 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!dev) {
    return null;
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
              className={`${
                editMode 
                  ? 'bg-green-500/80 hover:bg-green-500' 
                  : 'bg-purple-500/80 hover:bg-purple-500'
              } backdrop-blur-sm border border-white/20`}
            >
              {editMode ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleCopyLink}
            className="bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-black/80"
          >
            <Copy className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10 pb-8">
        {/* Profile Header */}
        <div className="flex items-end gap-6 mb-8">
          <div className="relative">
            <img 
              src={dev.avatar || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/53badb4f2_image.png"} 
              alt={dev.username}
              className="w-32 h-32 rounded-full border-4 border-black bg-black object-cover"
            />
            {dev.verified && (
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-4 border-black">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-black text-white">{dev.username}</h1>
              <Button
                onClick={() => setShowKnsModal(true)}
                size="sm"
                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30"
              >
                <CreditCard className="w-4 h-4 mr-1" />
                ID Card
              </Button>
            </div>
            <p className="text-cyan-400 text-sm mb-2">@{dev.twitter_handle}</p>
            {editMode ? (
              <Input
                value={editedKnsId}
                onChange={(e) => setEditedKnsId(e.target.value)}
                placeholder="your.kas"
                className="bg-white/5 border-purple-500/30 text-purple-400 h-9 rounded-lg max-w-xs text-sm font-bold"
              />
            ) : (
              dev.kns_id && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg px-3 py-1 inline-block">
                  <span className="text-purple-400 font-bold text-sm">{dev.kns_id}</span>
                </div>
              )
            )}
          </div>

          <Button
            onClick={() => setShowTipModal(true)}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Tip Dev
          </Button>
        </div>

        {/* Funding Goal */}
        {dev.funding_goal > 0 && (
          <Card className="bg-black/60 backdrop-blur-xl border-cyan-500/30 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-bold">Funding Goal</span>
                </div>
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
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {(dev.description || editMode) && (
          <Card className="bg-black/60 backdrop-blur-xl border-cyan-500/30 mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-3">About This Project</h2>
              {editMode ? (
                <Textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  placeholder="What are you building? Why do you need funding?"
                  className="bg-white/5 border-cyan-500/30 text-white rounded-xl resize-none min-h-[120px]"
                />
              ) : (
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{dev.description}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* How Funds Will Be Used */}
        {dev.how_funds_used && (
          <Card className="bg-black/60 backdrop-blur-xl border-green-500/30 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-bold text-white">How Funds Will Be Used</h2>
              </div>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{dev.how_funds_used}</p>
            </CardContent>
          </Card>
        )}

        {/* Project/App */}
        {dev.app_url && (
          <Card className="bg-black/60 backdrop-blur-xl border-purple-500/30 mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Project</h2>
              
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
        <Card className="bg-black/60 backdrop-blur-xl border-cyan-500/30">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Wallet Address</h2>
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
            className="bg-gradient-to-br from-[#1a1d2e] to-[#0a0a0a] border border-purple-500/30 rounded-3xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">KNS ID Card</h2>
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

            {dev.kns_id ? (
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/40 rounded-2xl p-6">
                <div className="text-center mb-4">
                  <img 
                    src={dev.avatar || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/53badb4f2_image.png"} 
                    alt={dev.username}
                    className="w-24 h-24 rounded-full border-4 border-purple-500/40 mx-auto mb-3 object-cover"
                  />
                  <div className="text-3xl font-black text-white mb-1">{dev.kns_id}</div>
                  <div className="text-sm text-white/60">{dev.username}</div>
                </div>

                <div className="bg-black/40 rounded-xl p-4 space-y-3">
                  <div>
                    <div className="text-xs text-white/40 mb-1">Wallet Address</div>
                    <div className="text-sm text-white/80 font-mono break-all">
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
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-white/60 mb-6">
                  {isOwner 
                    ? "You haven't set up your KNS ID yet. Click Edit to add it!"
                    : "This developer hasn't set up their KNS ID yet."
                  }
                </p>
                {isOwner && (
                  <Button
                    onClick={() => {
                      setShowKnsModal(false);
                      setEditMode(true);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Add KNS ID
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}