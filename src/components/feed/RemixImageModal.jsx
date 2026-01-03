import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { X, Sparkles, Loader2, Lock, Shirt, User, Upload, Image as ImageIcon } from "lucide-react";

export default function RemixImageModal({ imageUrl, onClose, onSave }) {
  const [remixPrompt, setRemixPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [faceLocked, setFaceLocked] = useState(true);
  const [clothingEditable, setClothingEditable] = useState(true);
  const [postureEditable, setPostureEditable] = useState(true);
  const [uploadedImage, setUploadedImage] = useState(imageUrl);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedImage(file_url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload image");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleGenerateRemix = async () => {
    if (!remixPrompt.trim()) {
      alert("Please describe what you want to create");
      return;
    }

    setIsGenerating(true);
    
    try {
      let detailedPrompt = "";
      
      if (uploadedImage) {
        // Remix existing image
        detailedPrompt = `Create a photorealistic image transformation: ${remixPrompt}.
${faceLocked ? "CRITICAL: Keep the person's face, facial features, and identity exactly the same as the reference image." : ""}
${clothingEditable ? "Change the clothing/outfit as described." : "Keep the same clothing."}
${postureEditable ? "Adjust the pose/posture as described." : "Keep the same pose."}
Professional quality, realistic lighting, high detail, natural look.`;
      } else {
        // Generate brand new image
        detailedPrompt = `Create a photorealistic image: ${remixPrompt}.
Professional quality, realistic lighting, high detail, natural look, digital art masterpiece.`;
      }

      console.log('🎨 Generating image with prompt:', detailedPrompt);
      
      const response = await base44.integrations.Core.GenerateImage({
        prompt: detailedPrompt,
        ...(uploadedImage && { existing_image_urls: [uploadedImage] })
      });

      console.log('✅ Generated image:', response);

      if (response?.url) {
        // Convert URL to blob for saving
        const imageResponse = await fetch(response.url);
        const blob = await imageResponse.blob();
        onSave(blob);
        onClose();
      } else {
        throw new Error('No image URL in response');
      }
    } catch (err) {
      console.error("❌ Remix generation error:", err);
      alert(`Failed to generate remix: ${err.message || 'Unknown error'}. Please try again with a different description.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    "wearing a red leather jacket, arms crossed",
    "in a business suit, confident pose",
    "casual jeans and t-shirt, relaxed stance",
    "evening gown, elegant pose"
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-950 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                {uploadedImage ? "Remix Image" : "Generate Image"}
              </h3>
              <p className="text-white/60 text-sm">
                {uploadedImage ? "AI-powered image transformation" : "Create brand new AI art"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                if (!uploadedImage) {
                  alert('Generate or upload an image first to share to TikTok');
                  return;
                }
                // TikTok sharing functionality
                alert('🎵 TikTok Share\n\nYour image is ready to share! Download and post to TikTok.');
              }}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden hover:scale-105 transition-transform group"
              title="Share to TikTok"
            >
              <div className="absolute inset-0 bg-black" />
              <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="tiktok-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f2ea" />
                    <stop offset="100%" stopColor="#ff0050" />
                  </linearGradient>
                </defs>
                <path 
                  d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" 
                  fill="url(#tiktok-gradient)"
                />
              </svg>
            </button>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Upload/Display */}
            <div>
              <div className="text-white/60 text-sm mb-3 font-semibold">
                {uploadedImage ? "Reference Image" : "Upload Image"}
              </div>
              {uploadedImage ? (
                <div className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
                  <img
                    src={uploadedImage}
                    alt="Reference"
                    className="w-full h-auto object-contain max-h-[400px]"
                  />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="relative bg-white/5 border-2 border-dashed border-white/20 rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all h-[400px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingFile}
                  />
                  {uploadingFile ? (
                    <>
                      <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                      <p className="text-white/60 text-sm">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-white/40 mb-4" />
                      <p className="text-white/80 font-semibold mb-2">Upload Image</p>
                      <p className="text-white/40 text-sm">Click to select or drag & drop</p>
                    </>
                  )}
                </label>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="text-white/60 text-sm mb-3 font-semibold">
                {uploadedImage ? "Remix Options" : "Generation Options"}
              </div>

              {/* Lock Toggles - Only show if image exists */}
              {uploadedImage && (
              <div className="space-y-3">
                <button
                  onClick={() => setFaceLocked(!faceLocked)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    faceLocked
                      ? "bg-purple-500/10 border-purple-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    faceLocked ? "bg-purple-500/20" : "bg-white/10"
                  }`}>
                    {faceLocked ? <Lock className="w-5 h-5 text-purple-400" /> : <User className="w-5 h-5 text-white/60" />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-semibold text-sm">Face will be preserved</div>
                    <div className="text-white/40 text-xs">Your facial features stay the same</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    faceLocked ? "bg-purple-500/20 text-purple-400" : "bg-white/10 text-white/40"
                  }`}>
                    {faceLocked ? "Locked" : "Editable"}
                  </div>
                </button>

                <button
                  onClick={() => setClothingEditable(!clothingEditable)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    clothingEditable
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    clothingEditable ? "bg-green-500/20" : "bg-white/10"
                  }`}>
                    <Shirt className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-semibold text-sm">Clothing Editable</div>
                    <div className="text-white/40 text-xs">AI can change outfit</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    clothingEditable ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                  }`}>
                    {clothingEditable ? "Editable" : "Locked"}
                  </div>
                </button>

                <button
                  onClick={() => setPostureEditable(!postureEditable)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    postureEditable
                      ? "bg-blue-500/10 border-blue-500/30"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    postureEditable ? "bg-blue-500/20" : "bg-white/10"
                  }`}>
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-semibold text-sm">Posture Editable</div>
                    <div className="text-white/40 text-xs">AI can change pose/stance</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    postureEditable ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white/40"
                  }`}>
                    {postureEditable ? "Editable" : "Locked"}
                  </div>
                  </button>
                  </div>
                  )}

              {/* Prompt Input */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  {uploadedImage 
                    ? "Describe Changes (clothing, posture, background, etc.)"
                    : "Describe What You Want to Create"
                  }
                </label>
                <Textarea
                  value={remixPrompt}
                  onChange={(e) => setRemixPrompt(e.target.value)}
                  placeholder={uploadedImage 
                    ? "e.g., wearing a red leather jacket, arms crossed, city background..."
                    : "e.g., a futuristic cyberpunk warrior in neon city, digital art masterpiece..."
                  }
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30 h-32 resize-none"
                />
                <p className="text-white/40 text-xs mt-2">
                  {uploadedImage 
                    ? "The face appearance will remain the same. Describe the clothing, pose, and environment you want."
                    : "Describe in detail what you want to create. Be specific about style, mood, and details."
                  }
                </p>
              </div>

              {/* Example Prompts */}
              <div>
                <div className="text-white/40 text-xs mb-2">Example prompts:</div>
                <div className="grid grid-cols-2 gap-2">
                  {(uploadedImage ? examplePrompts : [
                    "cyberpunk warrior in neon city",
                    "elegant fantasy princess portrait",
                    "futuristic sci-fi landscape",
                    "abstract colorful digital art"
                  ]).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setRemixPrompt(prompt)}
                      className="text-left px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-xs text-white/60"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20 bg-black/30">
          <div className="flex gap-3 justify-end">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateRemix}
              disabled={isGenerating || !remixPrompt.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {uploadedImage ? "Generate Remix" : "Generate Image"}
                </>
              )}
              </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}