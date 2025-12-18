import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, Plus, X, ExternalLink, Loader2, QrCode, Share2 } from "lucide-react";
import QRCode from "qrcode";

export default function ShillPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [kaspaQrFile, setKaspaQrFile] = useState(null);
  const [kaspaQrPreview, setKaspaQrPreview] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [kaspaQrDataUrl, setKaspaQrDataUrl] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [kaspaAddress, setKaspaAddress] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me().catch(() => null);
      setUser(currentUser);
      
      const urlParams = new URLSearchParams(window.location.search);
      const targetId = urlParams.get('id');
      const targetEmail = urlParams.get('user');
      
      let loadedProfile = null;

      // 1. Try loading by ID
      if (targetId) {
        try {
          loadedProfile = await base44.entities.ShillProfile.get(targetId);
        } catch (e) {
          console.log("Profile not found by ID");
        }
      } 
      
      // 2. Try loading by Email if not found by ID
      if (!loadedProfile && targetEmail) {
        const profiles = await base44.entities.ShillProfile.filter({ user_email: targetEmail });
        if (profiles.length > 0) loadedProfile = profiles[0];
      }
      
      // 3. Fallback to current user if no target params provided
      if (!loadedProfile && !targetId && !targetEmail && currentUser) {
         const profiles = await base44.entities.ShillProfile.filter({ user_email: currentUser.email });
         if (profiles.length > 0) {
           loadedProfile = profiles[0];
         } else {
           setIsEditing(true);
         }
      }

      if (loadedProfile) {
          setProfile(loadedProfile);
          setDisplayName(loadedProfile.display_name || "");
          setBio(loadedProfile.bio || "");
          setLinks(loadedProfile.links || []);
          setAvatarPreview(loadedProfile.avatar_url || null);
          setBackgroundPreview(loadedProfile.background_url || null);
          setKaspaQrPreview(loadedProfile.kaspa_qr_url || null);
          setKaspaAddress(loadedProfile.kaspa_address || "");
          
          // Generate Kaspa QR if address exists
          if (loadedProfile.kaspa_address) {
            generateKaspaQr(loadedProfile.kaspa_address);
          }
      }
    } catch (err) {
      console.error("Load failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateKaspaQr = async (address) => {
    if (!address) return;
    try {
      // Ensure proper URI scheme for wallets
      const uri = address.startsWith("kaspa:") ? address : `kaspa:${address}`;
      const dataUrl = await QRCode.toDataURL(uri, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setKaspaQrDataUrl(dataUrl);
    } catch (err) {
      console.error("Kaspa QR Generation failed", err);
    }
  };

  const generateQrCode = async () => {
    if (!profile) return;
    try {
      // Generate URL for this profile using ID to hide email
      const url = `${window.location.origin}${createPageUrl("Shill")}?id=${profile.id}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(dataUrl);
      
      if (profile.kaspa_address) {
        generateKaspaQr(profile.kaspa_address);
      }
      
      setIsFlipped(false);
      setShowQrModal(true);
    } catch (err) {
      console.error("QR Generation failed", err);
    }
  };

  const handleAvatarSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBackgroundSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBackgroundFile(file);
      setBackgroundPreview(URL.createObjectURL(file));
    }
  };

  const handleKaspaQrSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setKaspaQrFile(file);
      setKaspaQrPreview(URL.createObjectURL(file));
    }
  };

  const addLink = () => {
    setLinks([...links, { title: "", url: "", icon: "ExternalLink" }]);
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      let avatarUrl = profile?.avatar_url || null;
      let backgroundUrl = profile?.background_url || null;
      let kaspaQrUrl = profile?.kaspa_qr_url || null;

      if (avatarFile) {
        const res = await base44.integrations.Core.UploadFile({ file: avatarFile });
        avatarUrl = res.file_url;
      }

      if (backgroundFile) {
        const res = await base44.integrations.Core.UploadFile({ file: backgroundFile });
        backgroundUrl = res.file_url;
      }

      if (kaspaQrFile) {
        const res = await base44.integrations.Core.UploadFile({ file: kaspaQrFile });
        kaspaQrUrl = res.file_url;
      }

      const data = {
        user_email: user.email,
        display_name: displayName,
        bio: bio,
        links: links.filter(l => l.title && l.url),
        avatar_url: avatarUrl,
        background_url: backgroundUrl,
        kaspa_qr_url: kaspaQrUrl,
        kaspa_address: kaspaAddress
      };

      if (profile) {
        await base44.entities.ShillProfile.update(profile.id, data);
      } else {
        await base44.entities.ShillProfile.create(data);
      }

      await loadData();
      setIsEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Full Screen Background */}
      <div className="fixed inset-0 z-0">
        {(profile?.background_url || backgroundPreview) ? (
          <img 
            src={backgroundPreview || profile.background_url} 
            alt="Background" 
            className="w-full h-full object-cover opacity-60" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
      </div>
      
      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("BridgeMind")}>
                <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              </Link>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tighter">
                  <span className="text-cyan-400">Shill</span>Profile
                </h1>
                <p className="text-white/40 text-xs font-medium tracking-widest uppercase">Your digital identity</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {profile && (
                <Button 
                  onClick={generateQrCode} 
                  className="bg-black border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
              {profile && user && profile.user_email === user.email && !isEditing && (
                <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:from-cyan-500 hover:to-purple-500 border-none">
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {isEditing ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-lg mx-auto">
            {/* Compact Layout for Images */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden shadow-xl">
                <div className="relative h-32 w-full group cursor-pointer hover:bg-white/5 transition-colors">
                  {backgroundPreview ? (
                    <img src={backgroundPreview} alt="Background" className="w-full h-full object-cover group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/20">
                      <Upload className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-white">Change Banner</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleBackgroundSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </Card>

              <Card className="bg-white/5 backdrop-blur-xl border-white/10 overflow-hidden flex items-center justify-center shadow-xl">
                <div className="relative h-24 w-24 rounded-full overflow-hidden group cursor-pointer border-2 border-white/10">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/20">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-white">Avatar</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleAvatarSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </Card>
            </div>

            {/* Compact Info */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4 space-y-3 shadow-xl">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
                className="bg-black/20 border-white/10 text-white h-9 text-sm focus:bg-black/40 transition-colors"
              />
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Short Bio..."
                className="bg-black/20 border-white/10 text-white min-h-[60px] text-sm resize-none focus:bg-black/40 transition-colors"
              />
            </Card>

            {/* Kaspa Address */}
             <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4 shadow-xl space-y-3">
               <div>
                  <span className="text-sm font-medium text-white/80 block mb-2">Kaspa Address</span>
                  <Input
                    value={kaspaAddress}
                    onChange={(e) => setKaspaAddress(e.target.value)}
                    placeholder="kaspa:..."
                    className="bg-black/20 border-white/10 text-white h-9 text-xs font-mono focus:bg-black/40 transition-colors"
                  />
                  <p className="text-[10px] text-white/40 mt-1">Enter address to auto-generate scannable QR code</p>
               </div>

               <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white/80">Custom QR Image (Optional)</span>
                      {kaspaQrPreview && <span className="text-xs text-green-400">Uploaded</span>}
                  </div>
                  <div className="relative h-12 bg-black/20 rounded-lg border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:bg-black/30 transition-colors">
                      <span className="text-xs text-white/40 flex items-center gap-2">
                      <QrCode className="w-3 h-3" /> {kaspaQrPreview ? "Change Image" : "Upload Custom QR"}
                      </span>
                      <input type="file" accept="image/*" onChange={handleKaspaQrSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
               </div>
            </Card>

            {/* Links */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white/80">Links</span>
                <Button onClick={addLink} size="sm" variant="ghost" className="h-6 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={link.title}
                      onChange={(e) => updateLink(index, "title", e.target.value)}
                      placeholder="Title"
                      className="bg-black/20 border-white/10 text-white h-8 text-xs w-1/3 focus:bg-black/40"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => updateLink(index, "url", e.target.value)}
                      placeholder="URL"
                      className="bg-black/20 border-white/10 text-white h-8 text-xs flex-1 focus:bg-black/40"
                    />
                    <Button
                      onClick={() => removeLink(index)}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {links.length === 0 && <div className="text-center text-xs text-white/20 py-2">No links added</div>}
              </div>
            </Card>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold h-10 shadow-lg"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
              {profile && (
                <Button onClick={() => setIsEditing(false)} variant="outline" className="border-white/10 text-white bg-black/40 hover:bg-black/60 h-10">
                  Cancel
                </Button>
              )}
            </div>
          </motion.div>
          ) : profile ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-lg mx-auto pt-8">
              <div className="flex flex-col items-center">
                {profile.avatar_url && (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="relative w-32 h-32 rounded-full border-4 border-white/10 mb-4 shadow-2xl object-cover" 
                    />
                  </div>
                )}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 w-full border border-white/10 shadow-xl">
                    <h2 className="text-3xl font-black text-white mb-2 text-center tracking-tight">{profile.display_name}</h2>
                    {profile.bio && <p className="text-white/70 text-center text-sm leading-relaxed">{profile.bio}</p>}
                </div>
              </div>

              {profile.links && profile.links.length > 0 && (
                <div className="space-y-3">
                  {profile.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 transition-all group shadow-lg flex items-center justify-between"
                      >
                          <span className="text-white font-bold">{link.title}</span>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            <ExternalLink className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                          </div>
                      </motion.div>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}
        </div>
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 p-6 rounded-2xl max-w-sm w-full relative"
          >
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-white mb-2 text-center tracking-tight">
              {isFlipped ? "KASPA ADDRESS" : "SHARE PROFILE"}
            </h3>
            <p className="text-cyan-400 text-xs text-center mb-6 font-mono uppercase tracking-wider">
              {(profile?.kaspa_address || profile?.kaspa_qr_url) ? "TAP CARD TO FLIP" : "SCAN TO VISIT"}
            </p>
            
            {/* Flip Card Container */}
            <div 
              className="relative w-56 h-56 mx-auto mb-8 cursor-pointer perspective-[1000px] group"
              onClick={() => {
                if (profile?.kaspa_address || profile?.kaspa_qr_url) {
                  setIsFlipped(!isFlipped);
                }
              }}
            >
               <motion.div
                 className="w-full h-full relative preserve-3d"
                 initial={false}
                 animate={{ rotateY: isFlipped ? 180 : 0 }}
                 transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                 style={{ transformStyle: "preserve-3d" }}
               >
                 {/* Front Face (Profile QR) */}
                 <div 
                   className="absolute inset-0 backface-hidden bg-white rounded-2xl p-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center border-2 border-white/20"
                   style={{ backfaceVisibility: "hidden" }}
                 >
                   {qrCodeDataUrl && (
                     <img src={qrCodeDataUrl} alt="Profile QR" className="w-full h-full object-contain" />
                   )}
                   <div className="absolute bottom-2 left-0 right-0 text-center">
                      <span className="text-[8px] font-bold text-black uppercase tracking-widest">TTT Profile</span>
                   </div>
                 </div>

                 {/* Back Face (Kaspa QR) */}
                 <div 
                   className="absolute inset-0 backface-hidden bg-gradient-to-br from-cyan-900 to-black rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center border-2 border-cyan-500/50"
                   style={{ 
                     backfaceVisibility: "hidden",
                     transform: "rotateY(180deg)" 
                   }}
                 >
                   {kaspaQrDataUrl ? (
                     <img src={kaspaQrDataUrl} alt="Kaspa QR" className="w-full h-full object-contain rounded-lg" />
                   ) : profile?.kaspa_qr_url ? (
                     <img src={profile.kaspa_qr_url} alt="Kaspa QR" className="w-full h-full object-contain rounded-lg" />
                   ) : (
                     <div className="text-center text-cyan-400">
                       <p className="text-xs">No Kaspa Address</p>
                     </div>
                   )}
                   <div className="absolute bottom-2 left-0 right-0 text-center">
                      <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Kaspa Wallet</span>
                   </div>
                 </div>
               </motion.div>
            </div>

            <div className="bg-white/5 rounded-lg p-3 mb-6 text-center border border-white/10 backdrop-blur-md">
              <p className="text-white font-bold text-lg tracking-tight">
                {profile?.display_name || "A KAS-User"}
              </p>
              <p className="text-white/40 text-xs mt-1 font-mono uppercase">
                {isFlipped ? "Kaspa Network" : "TTT App • Shill"}
              </p>
            </div>

            <Button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}${createPageUrl("Shill")}?id=${profile?.id}`);
                alert("Link copied!");
              }}
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold h-12 rounded-xl shadow-[0_4px_20px_rgba(6,182,212,0.3)]"
            >
              <Share2 className="w-5 h-5 mr-2" />
              COPY LINK
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}