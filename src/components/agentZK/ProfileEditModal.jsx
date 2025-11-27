import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import { X, Upload, Loader2, Plus, Trash2, Twitter, Github, Globe, CheckCircle2, MessageCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProfileEditModal({ profile, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    username: profile.username || '',
    bio: profile.bio || '',
    role: profile.role || '',
    skills: profile.skills || [],
    hourly_rate_kas: profile.hourly_rate_kas || '',
    availability: profile.availability || 'available',
    is_hireable: profile.is_hireable || false,
    kns_domain: profile.kns_domain || '',
    social_links: profile.social_links || {
      twitter: '',
      reddit: '',
      discord: '',
      github: '',
      website: ''
    },
    work_type: profile.work_type || [],
    tech_background: profile.tech_background || '',
    portfolio: profile.portfolio || []
  });

  const [newSkill, setNewSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const roles = [
    "Backend Developer",
    "Frontend Developer",
    "Full Stack Developer",
    "Smart Contract Developer",
    "UI/UX Designer",
    "Product Manager",
    "Marketing Specialist",
    "Content Creator",
    "Community Manager",
    "Data Scientist",
    "DevOps Engineer",
    "Security Researcher",
    "Blockchain Analyst",
    "Business Strategist",
    "Other"
  ];

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      
      await base44.entities.AgentZKProfile.update(profile.id, {
        agent_zk_photo: uploadResponse.file_url
      });

      alert('✅ Photo updated!');
      onUpdate();
    } catch (err) {
      console.error('Photo upload failed:', err);
      alert('❌ Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const toggleWorkType = (type) => {
    const current = formData.work_type || [];
    if (current.includes(type)) {
      setFormData({
        ...formData,
        work_type: current.filter(t => t !== type)
      });
    } else {
      setFormData({
        ...formData,
        work_type: [...current, type]
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const updateData = {
        ...formData,
        hourly_rate_kas: formData.hourly_rate_kas === '' ? null : (typeof formData.hourly_rate_kas === 'number' ? formData.hourly_rate_kas : parseFloat(formData.hourly_rate_kas) || null),
        id_card_generated: true,
        last_active: new Date().toISOString()
      };

      await base44.entities.AgentZKProfile.update(profile.id, updateData);

      alert('✅ Profile updated! ID Card generated.');
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
      alert('❌ Failed to save profile: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-950 border border-zinc-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <CardHeader className="border-b border-zinc-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                <p className="text-sm text-gray-500 mt-1">Update your Agent ZK profile and generate ID card</p>
              </div>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Profile Photo</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-cyan-500/30">
                  {profile.agent_zk_photo ? (
                    <img src={profile.agent_zk_photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  {isUploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload Photo
                </Button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Username</label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Your username"
                  className="bg-black border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-white mb-2 block">KNS Domain</label>
                <Input
                  value={formData.kns_domain}
                  onChange={(e) => setFormData({...formData, kns_domain: e.target.value})}
                  placeholder="yourdomain.kas"
                  className="bg-black border-zinc-800 text-white font-mono"
                />
                <a
                  href="https://app.knsdomains.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 inline-block"
                >
                  Get your KNS domain →
                </a>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Bio</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell us about yourself..."
                className="bg-black border-zinc-800 text-white h-24"
              />
            </div>

            {/* Role & Availability */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Role</label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger className="bg-black border-zinc-800 text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {roles.map(role => (
                      <SelectItem key={role} value={role} className="text-white">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-white mb-2 block">Availability</label>
                <Select value={formData.availability} onValueChange={(value) => setFormData({...formData, availability: value})}>
                  <SelectTrigger className="bg-black border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="available" className="text-white">Available</SelectItem>
                    <SelectItem value="busy" className="text-white">Busy</SelectItem>
                    <SelectItem value="unavailable" className="text-white">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Work Type */}
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Work Type</label>
              <div className="flex gap-3">
                <button
                  onClick={() => toggleWorkType('worker')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    formData.work_type?.includes('worker')
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-black border-zinc-800 text-gray-400 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">Worker</div>
                  <div className="text-xs opacity-70">Available for hire</div>
                </button>
                <button
                  onClick={() => toggleWorkType('employer')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    formData.work_type?.includes('employer')
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-black border-zinc-800 text-gray-400 hover:border-purple-500/50'
                  }`}
                >
                  <div className="text-sm font-semibold mb-1">Employer</div>
                  <div className="text-xs opacity-70">Hiring workers</div>
                </button>
              </div>
            </div>

            {/* Worker-specific fields */}
            {formData.work_type?.includes('worker') && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-white mb-2 block">Hourly Rate (KAS)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.hourly_rate_kas}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({...formData, hourly_rate_kas: val === '' ? '' : parseFloat(val) || 0});
                      }}
                      placeholder="100"
                      className="bg-black border-zinc-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-white mb-2 block">Hireable Status</label>
                    <button
                      onClick={() => setFormData({...formData, is_hireable: !formData.is_hireable})}
                      className={`w-full h-10 rounded-lg border-2 transition-all ${
                        formData.is_hireable
                          ? 'bg-green-500/20 border-green-500 text-green-300'
                          : 'bg-black border-zinc-800 text-gray-400'
                      }`}
                    >
                      {formData.is_hireable ? '✨ Open for Hire' : 'Not Hireable'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">Tech Background</label>
                  <Textarea
                    value={formData.tech_background}
                    onChange={(e) => setFormData({...formData, tech_background: e.target.value})}
                    placeholder="Describe your technical expertise..."
                    className="bg-black border-zinc-800 text-white h-20"
                  />
                </div>
              </>
            )}

            {/* Skills */}
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">Skills</label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add a skill..."
                  className="bg-black border-zinc-800 text-white"
                />
                <Button onClick={handleAddSkill} className="bg-cyan-500 hover:bg-cyan-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, idx) => (
                  <Badge key={idx} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="ml-2 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div>
              <label className="text-sm font-semibold text-white mb-3 block">Social Links</label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border border-zinc-800">
                    <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                  </div>
                  <Input
                    value={formData.social_links.twitter}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_links: {...formData.social_links, twitter: e.target.value}
                    })}
                    placeholder="@username or profile URL"
                    className="bg-black border-zinc-800 text-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border border-zinc-800">
                    <span className="text-[#FF4500] text-xl font-bold">r/</span>
                  </div>
                  <Input
                    value={formData.social_links.reddit}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_links: {...formData.social_links, reddit: e.target.value}
                    })}
                    placeholder="u/username or profile URL"
                    className="bg-black border-zinc-800 text-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border border-zinc-800">
                    <MessageCircle className="w-5 h-5 text-[#5865F2]" />
                  </div>
                  <Input
                    value={formData.social_links.discord}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_links: {...formData.social_links, discord: e.target.value}
                    })}
                    placeholder="username#1234"
                    className="bg-black border-zinc-800 text-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border border-zinc-800">
                    <Github className="w-5 h-5 text-white" />
                  </div>
                  <Input
                    value={formData.social_links.github}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_links: {...formData.social_links, github: e.target.value}
                    })}
                    placeholder="github.com/username"
                    className="bg-black border-zinc-800 text-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border border-zinc-800">
                    <Globe className="w-5 h-5 text-cyan-400" />
                  </div>
                  <Input
                    value={formData.social_links.website}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_links: {...formData.social_links, website: e.target.value}
                    })}
                    placeholder="https://yourwebsite.com"
                    className="bg-black border-zinc-800 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-zinc-900">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-12 text-base font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Save & Generate ID Card
                  </>
                )}
              </Button>
              <Button onClick={onClose} variant="outline" className="border-zinc-800 text-white">
                Cancel
              </Button>
            </div>
          </CardContent>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}