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
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me().catch(() => null);
      setUser(currentUser);
      
      const urlParams = new URLSearchParams(window.location.search);
      const targetEmail = urlParams.get('user');
      
      // If target email is provided, load that profile. Otherwise load current user's profile.
      // If no target and no user, do nothing (or show empty state)
      const emailToLoad = targetEmail || currentUser?.email;
      
      if (emailToLoad) {
        const profiles = await base44.entities.ShillProfile.filter({ user_email: emailToLoad });
        if (profiles.length > 0) {
          const p = profiles[0];
          setProfile(p);
          setDisplayName(p.display_name || "");
          setBio(p.bio || "");
          setLinks(p.links || []);
          setAvatarPreview(p.avatar_url || null);
          setBackgroundPreview(p.background_url || null);
        } else if (currentUser && emailToLoad === currentUser.email) {
          // Only enter edit mode if it's the current user's profile that's missing
          setIsEditing(true);
        }
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
      // Generate URL for this profile
      const url = `${window.location.origin}${createPageUrl("Shill")}?user=${profile.user_email}`;
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

      if (avatarFile) {
        const res = await base44.integrations.Core.UploadFile({ file: avatarFile });
        avatarUrl = res.file_url;
      }

      if (backgroundFile) {
        const res = await base44.integrations.Core.UploadFile({ file: backgroundFile });
        backgroundUrl = res.file_url;
      }

      const data = {
        user_email: user.email,
        display_name: displayName,
        bio: bio,
        links: links.filter(l => l.title && l.url),
        avatar_url: avatarUrl,
        background_url: backgroundUrl
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
                <h1 className="text-3xl font-black text-white">Shill</h1>
                <p className="text-white/60">Your link-in-bio page</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {profile && (
                <Button onClick={generateQrCode} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <QrCode className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
              {profile && user && profile.user_email === user.email && !isEditing && (
                <Button onClick={() => setIsEditing(true)} className="bg-purple-600 hover:bg-purple-700">
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {isEditing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Background Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-48 bg-white/5 rounded-xl border-2 border-dashed border-white/20 overflow-hidden">
                    {backgroundPreview ? (
                      <img src={backgroundPreview} alt="Background" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Upload className="w-8 h-8 text-white/40" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Avatar Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-32 h-32 bg-white/5 rounded-full border-2 border-dashed border-white/20 overflow-hidden mx-auto">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Upload className="w-8 h-8 text-white/40" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Profile Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-white/80 text-sm mb-2 block">Display Name</label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your Name"
                      className="bg-black/40 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white/80 text-sm mb-2 block">Bio</label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell people about yourself..."
                      className="bg-black/40 border-white/10 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white">Links</CardTitle>
                  <Button onClick={addLink} size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {links.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={link.title}
                        onChange={(e) => updateLink(index, "title", e.target.value)}
                        placeholder="Title"
                        className="bg-black/40 border-white/10 text-white"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(index, "url", e.target.value)}
                        placeholder="https://..."
                        className="bg-black/40 border-white/10 text-white flex-1"
                      />
                      <Button
                        onClick={() => removeLink(index)}
                        size="icon"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
                </Button>
                {profile && (
                  <Button onClick={() => setIsEditing(false)} variant="outline" className="border-white/10 text-white">
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
            
            <h3 className="text-xl font-bold text-white mb-6 text-center">Share Profile</h3>
            
            <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-fit">
              {qrCodeDataUrl && (
                <img src={qrCodeDataUrl} alt="Profile QR Code" className="w-48 h-48" />
              )}
            </div>

            <div className="bg-white/5 rounded-lg p-3 mb-6 text-center border border-white/10">
              <p className="text-white font-semibold">
                {profile?.display_name || "A KAS-User"}
              </p>
              <p className="text-white/40 text-xs mt-1">
                TTT App • Shill Profile
              </p>
            </div>

            <Button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}${createPageUrl("Shill")}?user=${profile?.user_email}`);
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