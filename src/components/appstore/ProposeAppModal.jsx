import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProposeAppModal({ onClose, user }) {
  const [formData, setFormData] = useState({
    app_name: "",
    app_link: "",
    description: "",
    category: "Tools"
  });
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleIconUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.app_name || !formData.app_link || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      let iconUrl = "";
      
      if (iconFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: iconFile });
        iconUrl = file_url;
      }

      await base44.entities.AppProposal.create({
        app_name: formData.app_name,
        app_link: formData.app_link,
        icon_url: iconUrl,
        description: formData.description,
        category: formData.category,
        submitter_email: user.email,
        submitter_name: user.username || user.email.split('@')[0],
        status: "pending"
      });

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to submit proposal:", err);
      alert("Failed to submit proposal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-black border border-green-500/50 rounded-2xl p-8 text-center max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Proposal Submitted!</h3>
          <p className="text-white/60">Your app proposal has been sent to the admins for review.</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Propose Your App</h2>
              <p className="text-white/60 text-sm">Submit your app for admin review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="text-white font-semibold mb-2 block">App Name *</label>
            <Input
              value={formData.app_name}
              onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
              placeholder="My Awesome App"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              required
            />
          </div>

          <div>
            <label className="text-white font-semibold mb-2 block">App Link *</label>
            <Input
              value={formData.app_link}
              onChange={(e) => setFormData({ ...formData, app_link: e.target.value })}
              placeholder="https://myapp.base44.app"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
              required
            />
          </div>

          <div>
            <label className="text-white font-semibold mb-2 block">Category</label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="Tools" className="text-white">Tools</SelectItem>
                <SelectItem value="Games" className="text-white">Games</SelectItem>
                <SelectItem value="Social" className="text-white">Social</SelectItem>
                <SelectItem value="Finance" className="text-white">Finance</SelectItem>
                <SelectItem value="Entertainment" className="text-white">Entertainment</SelectItem>
                <SelectItem value="Other" className="text-white">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-white font-semibold mb-2 block">App Icon</label>
            <div className="flex items-center gap-4">
              {iconPreview && (
                <img src={iconPreview} alt="Icon preview" className="w-16 h-16 rounded-xl object-cover border border-white/20" />
              )}
              <label className="flex-1 cursor-pointer">
                <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
                  <Upload className="w-6 h-6 text-white/60 mx-auto mb-2" />
                  <p className="text-white/60 text-sm">
                    {iconFile ? iconFile.name : "Upload icon image"}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="text-white font-semibold mb-2 block">Description *</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what your app does and why it should be in the TTT App Store..."
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[120px]"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Submit Proposal
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}