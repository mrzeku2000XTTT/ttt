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
  const [showingKaspaQr, setShowingKaspaQr] = useState(false);

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
      }
    } catch (err) {
      console.error("Load failed:", err);
    } finally {
      setIsLoading(false);
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
        kaspa_qr_url: kaspaQrUrl
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
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-black" />
      
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
                <Button onClick={generateQrCode} className="bg-white text-black hover:bg-gray-200 font-bold border-none">
                  <QrCode className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
              {profile && user && profile.user_email === user.email && !isEditing && (
                <Button onClick={() => setIsEditing(true)} className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/50">
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {isEditing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Compact Layout for Images */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-black/40 border-white/10 overflow-hidden">
                  <div className="relative h-32 w-full group cursor-pointer bg-white/5">
                    {backgroundPreview ? (
                      <img src={backgroundPreview} alt="Background" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
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

                <Card className="bg-black/40 border-white/10 overflow-hidden flex items-center justify-center">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden group cursor-pointer bg-white/5 border-2 border-white/10">
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
              <Card className="bg-black/40 border-white/10 p-4 space-y-3">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display Name"
                  className="bg-white/5 border-white/10 text-white h-9 text-sm"
                />
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short Bio..."
                  className="bg-white/5 border-white/10 text-white min-h-[60px] text-sm resize-none"
                />
              </Card>

              {/* Kaspa QR Code */}
               <Card className="bg-black/40 border-white/10 p-4">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white/80">Kaspa QR Code</span>
                    {kaspaQrPreview && <span className="text-xs text-green-400">Uploaded</span>}
                 </div>
                 <div className="relative h-12 bg-white/5 rounded-lg border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="text-xs text-white/40 flex items-center gap-2">
                       <QrCode className="w-3 h-3" /> {kaspaQrPreview ? "Change QR Image" : "Upload Kaspa QR"}
                    </span>
                    <input type="file" accept="image/*" onChange={handleKaspaQrSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>
              </Card>

              {/* Links */}
              <Card className="bg-black/40 border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white/80">Links</span>
                  <Button onClick={addLink} size="sm" variant="ghost" className="h-6 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30">
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
                        className="bg-white/5 border-white/10 text-white h-8 text-xs w-1/3"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(index, "url", e.target.value)}
                        placeholder="URL"
                        className="bg-white/5 border-white/10 text-white h-8 text-xs flex-1"
                      />
                      <Button
                        onClick={() => removeLink(index)}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30"
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
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-10"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
                {profile && (
                  <Button onClick={() => setIsEditing(false)} variant="outline" className="border-white/10 text-white hover:bg-white/5 h-10">
                    Cancel
                  </Button>
                )}
              </div>
            </motion.div>
          ) : profile ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {profile.background_url && (
                <div className="w-full h-64 rounded-2xl overflow-hidden">
                  <img src={profile.background_url} alt="Background" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex flex-col items-center">
                {profile.avatar_url && (
                  <img src={profile.avatar_url} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-white/10 mb-4" />
                )}
                <h2 className="text-3xl font-bold text-white mb-2">{profile.display_name}</h2>
                {profile.bio && <p className="text-white/60 text-center max-w-md">{profile.bio}</p>}
              </div>

              {profile.links && profile.links.length > 0 && (
                <div className="space-y-3 max-w-md mx-auto">
                  {profile.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all group">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{link.title}</span>
                          <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                        </div>
                      </div>
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
            
            <h3 className="text-xl font-bold text-white mb-2 text-center">
              {showingKaspaQr ? "Kaspa Address" : "Share Profile"}
            </h3>
            <p className="text-white/40 text-xs text-center mb-6">
              {profile?.kaspa_qr_url ? "Tap QR code to switch" : "Scan to visit profile"}
            </p>
            
            <div 
              className="bg-white p-4 rounded-xl mb-6 mx-auto w-fit cursor-pointer transition-transform hover:scale-105 active:scale-95"
              onClick={() => {
                if (profile?.kaspa_qr_url) {
                  setShowingKaspaQr(!showingKaspaQr);
                }
              }}
            >
              {showingKaspaQr && profile?.kaspa_qr_url ? (
                <img src={profile.kaspa_qr_url} alt="Kaspa QR Code" className="w-48 h-48 object-contain" />
              ) : (
                qrCodeDataUrl && <img src={qrCodeDataUrl} alt="Profile QR Code" className="w-48 h-48" />
              )}
            </div>

            <div className="bg-white/5 rounded-lg p-3 mb-6 text-center border border-white/10">
              <p className="text-white font-semibold">
                {profile?.display_name || "A KAS-User"}
              </p>
              <p className="text-white/40 text-xs mt-1">
                {showingKaspaQr ? "Kaspa QR Code" : "TTT App • Shill Profile"}
              </p>
            </div>

            <Button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}${createPageUrl("Shill")}?id=${profile?.id}`);
                alert("Link copied!");
              }}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}