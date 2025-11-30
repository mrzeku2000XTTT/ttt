import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function AdminIconEditor({ app, currentIcon, onClose, onSave }) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentIcon || null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      const existing = await base44.asServiceRole.entities.AppIconCustomization.filter({ app_id: app.path });
      
      if (existing.length > 0) {
        await base44.asServiceRole.entities.AppIconCustomization.update(existing[0].id, {
          icon_url: file_url,
          icon_type: 'uploaded'
        });
      } else {
        await base44.asServiceRole.entities.AppIconCustomization.create({
          app_id: app.path,
          app_name: app.name,
          icon_url: file_url,
          icon_type: 'uploaded'
        });
      }
      
      onSave(file_url);
      onClose();
    } catch (err) {
      console.error('Failed to save icon:', err);
      alert('Failed to save icon: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
      />
      
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/20 rounded-2xl p-6 max-w-md w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Edit App Icon</h3>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-white/60 text-sm mb-4">App: {app.name}</p>
            
            {previewUrl && (
              <div className="w-32 h-32 mx-auto mb-4 border border-white/20 rounded-xl overflow-hidden">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
              <Upload className="w-4 h-4 text-white/60" />
              <span className="text-white/80 text-sm">Choose Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/10 text-white/60 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedFile || uploading}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {uploading ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}