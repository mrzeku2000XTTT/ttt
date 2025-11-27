import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, FileText, Image as ImageIcon, Sparkles } from "lucide-react";

export default function CreateServiceModal({ user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [agentProfile, setAgentProfile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Programming & Tech",
    price_from: "",
    delivery_time: 7,
    skills: [],
    cover_image: "",
    resume_url: ""
  });
  const [skillInput, setSkillInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const categories = [
    "Graphics & Design",
    "Programming & Tech",
    "Digital Marketing",
    "Video & Animation",
    "Writing & Translation",
    "Music & Audio",
    "Business",
    "AI Services"
  ];

  useEffect(() => {
    loadAgentProfile();
  }, []);

  const loadAgentProfile = async () => {
    try {
      const profiles = await base44.entities.AgentZKProfile.filter({
        user_email: user.email
      });
      if (profiles.length > 0) {
        setAgentProfile(profiles[0]);
        // Pre-fill from agent profile
        setFormData(prev => ({
          ...prev,
          description: profiles[0].bio || prev.description,
          skills: profiles[0].skills || prev.skills
        }));
      }
    } catch (err) {
      console.error("Failed to load agent profile:", err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, cover_image: file_url }));
    } catch (err) {
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, resume_url: file_url }));
    } catch (err) {
      alert("Failed to upload resume");
    } finally {
      setUploadingResume(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price_from) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.ServiceListing.create({
        user_email: user.email,
        agent_profile_id: agentProfile?.id,
        ...formData,
        price_from: parseFloat(formData.price_from)
      });
      
      onSuccess();
    } catch (err) {
      console.error("Failed to create service:", err);
      alert("Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl my-8"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-3xl blur-xl" />
        
        <div className="relative bg-black/80 backdrop-blur-3xl border border-white/20 rounded-3xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-white mb-2">Create Service Listing</h2>
              {agentProfile && (
                <p className="text-sm text-white/60 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Using Agent ZK Profile: {agentProfile.agent_name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Service Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="I will create a stunning website for you"
                  className="bg-white/5 border-white/10 text-white placeholder-white/40"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-white/30"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Starting Price (USD) *
                </label>
                <Input
                  type="number"
                  value={formData.price_from}
                  onChange={(e) => setFormData({ ...formData, price_from: e.target.value })}
                  placeholder="50"
                  className="bg-white/5 border-white/10 text-white placeholder-white/40"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your service in detail..."
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 min-h-32"
                  required
                />
              </div>

              {/* Skills */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Skills & Technologies
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="React, Node.js, Python..."
                    className="bg-white/5 border-white/10 text-white placeholder-white/40"
                  />
                  <Button type="button" onClick={addSkill} className="bg-purple-500 hover:bg-purple-600">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-sm text-cyan-400 flex items-center gap-2"
                    >
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Cover Image */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Cover Image
                </label>
                <label className="block w-full h-32 border-2 border-dashed border-white/20 rounded-lg hover:border-white/40 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="h-full flex flex-col items-center justify-center">
                    {uploadingImage ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin" />
                    ) : formData.cover_image ? (
                      <img src={formData.cover_image} alt="Cover" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-white/40 mb-2" />
                        <span className="text-sm text-white/60">Upload image</span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Resume */}
              <div>
                <label className="text-sm font-medium text-white/80 mb-2 block">
                  Resume (Optional)
                </label>
                <label className="block w-full h-32 border-2 border-dashed border-white/20 rounded-lg hover:border-white/40 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                  <div className="h-full flex flex-col items-center justify-center">
                    {uploadingResume ? (
                      <div className="w-6 h-6 border-2 border-white/20 border-t-purple-500 rounded-full animate-spin" />
                    ) : formData.resume_url ? (
                      <>
                        <FileText className="w-8 h-8 text-green-400 mb-2" />
                        <span className="text-sm text-green-400">Resume uploaded</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-white/40 mb-2" />
                        <span className="text-sm text-white/60">Upload resume</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-6 border-t border-white/10">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 border-white/10 text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {loading ? "Creating..." : "Create Service"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}