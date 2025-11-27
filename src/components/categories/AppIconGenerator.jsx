import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function AppIconGenerator({ onClose, onUpdate }) {
  const [selectedApp, setSelectedApp] = useState("");
  const [mode, setMode] = useState("ai"); // 'ai' or 'upload'
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const apps = [
    { id: "BRAHIM", name: "BRAHIM" },
    { id: "AgentZK", name: "Agent ZK" },
    { id: "Browser", name: "TTTV" },
    { id: "Bridge", name: "Send KAS" },
    { id: "ZekuAI", name: "Zeku AI" },
    { id: "Hercules", name: "Hercules" },
    { id: "KaspaBalanceViewer", name: "Balance Viewer" },
    { id: "KaspaNode", name: "Kaspa Node" },
    { id: "Shop", name: "Shop" },
    { id: "Marketplace", name: "Marketplace" },
    { id: "MarketX", name: "Market X" },
    { id: "RegisterTTTID", name: "TTT ID" },
    { id: "DAGKnightWallet", name: "DAGKnight" },
    { id: "AgentZKDirectory", name: "Agent Directory" },
    { id: "Countdown", name: "Countdown" },
    { id: "Feed", name: "TTT Feed" },
    { id: "GlobalHistory", name: "Global History" },
    { id: "GlobalWar", name: "Global War" },
    { id: "Arcade", name: "Arcade" },
    { id: "Analytics", name: "Analytics" },
    { id: "Wallet", name: "Wallet" },
    { id: "History", name: "History" },
    { id: "Profile", name: "Profile" },
    { id: "Subscription", name: "Subscription" },
    { id: "NFTMint", name: "NFT Mint" },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: `App icon for ${selectedApp}: ${prompt}. Style: modern, clean, minimal, flat design, professional app icon, centered on transparent or solid background`
      });
      
      setPreviewUrl(response.url);
    } catch (err) {
      console.error("Generation failed:", err);
      alert("Failed to generate icon");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setPreviewUrl(response.file_url);
      setUploadedFile(file);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload icon");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedApp || !previewUrl) return;

    setIsSaving(true);
    try {
      // Check if customization exists
      const existing = await base44.entities.AppIconCustomization.filter({ app_id: selectedApp });
      
      if (existing && existing.length > 0) {
        await base44.entities.AppIconCustomization.update(existing[0].id, {
          icon_url: previewUrl,
          icon_type: mode === 'ai' ? 'ai_generated' : 'uploaded',
          generation_prompt: mode === 'ai' ? prompt : null
        });
      } else {
        await base44.entities.AppIconCustomization.create({
          app_id: selectedApp,
          icon_url: previewUrl,
          icon_type: mode === 'ai' ? 'ai_generated' : 'uploaded',
          generation_prompt: mode === 'ai' ? prompt : null
        });
      }

      await onUpdate();
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save custom icon. Please try again.");
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
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">App Icon Generator</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Select App */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-white mb-2">Select App</label>
            <select
              value={selectedApp}
              onChange={(e) => setSelectedApp(e.target.value)}
              className="w-full bg-black/60 border border-white/20 rounded-lg px-4 py-3 text-white [&>option]:bg-black [&>option]:text-white"
            >
              <option value="" className="bg-black text-white">Choose an app...</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id} className="bg-black text-white">
                  {app.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selection */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode("ai")}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                mode === "ai"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              <Sparkles className="w-5 h-5 inline mr-2" />
              AI Generate
            </button>
            <button
              onClick={() => setMode("upload")}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                mode === "upload"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              Upload
            </button>
          </div>

          {/* AI Mode */}
          {mode === "ai" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">Describe Icon</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., colorful gradient sphere, futuristic, glowing edges"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 min-h-[100px] resize-none"
                disabled={!selectedApp}
              />
              <Button
                onClick={handleGenerate}
                disabled={!selectedApp || !prompt.trim() || isGenerating}
                className="mt-3 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Icon
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Upload Mode */}
          {mode === "upload" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={!selectedApp || isGenerating}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-cyan-500 file:to-blue-500 file:text-white file:cursor-pointer"
              />
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">Preview</label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Icon preview"
                  className="w-32 h-32 rounded-2xl object-cover"
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!selectedApp || !previewUrl || isSaving}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Save Custom Icon
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}