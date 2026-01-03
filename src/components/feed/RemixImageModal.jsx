import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { X, Sparkles, Loader2, Lock, Shirt, User } from "lucide-react";

export default function RemixImageModal({ imageUrl, onClose, onSave }) {
  const [remixPrompt, setRemixPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [faceLocked, setFaceLocked] = useState(true);
  const [clothingEditable, setClothingEditable] = useState(true);
  const [postureEditable, setPostureEditable] = useState(true);

  const handleGenerateRemix = async () => {
    if (!remixPrompt.trim()) {
      alert("Please describe the changes you want (clothing, posture, background, etc.)");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Build the AI prompt
      const systemPrompt = `Transform this image based on the user's request.
${faceLocked ? "IMPORTANT: PRESERVE THE PERSON'S FACE - keep facial features identical." : ""}
${clothingEditable ? "You can change clothing/outfit." : "Keep clothing the same."}
${postureEditable ? "You can change pose/posture." : "Keep the same pose."}

User's request: ${remixPrompt}

Generate a realistic, high-quality image with the requested changes.`;

      const response = await base44.integrations.Core.GenerateImage({
        prompt: systemPrompt,
        existing_image_urls: [imageUrl]
      });

      // Return the new image
      if (response.url) {
        // Convert URL to blob for saving
        const imageResponse = await fetch(response.url);
        const blob = await imageResponse.blob();
        onSave(blob);
        onClose();
      }
    } catch (err) {
      console.error("Failed to generate remix:", err);
      alert("Failed to generate remix. Please try again.");
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
              <h3 className="text-white font-bold text-lg">Remix Image - Change Clothing & Posture</h3>
              <p className="text-white/60 text-sm">AI-powered image transformation</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original Image */}
            <div>
              <div className="text-white/60 text-sm mb-3 font-semibold">Original Image</div>
              <div className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Original"
                  className="w-full h-auto object-contain max-h-[400px]"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="text-white/60 text-sm mb-3 font-semibold">Options</div>
              
              {/* Lock Toggles */}
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

              {/* Prompt Input */}
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Describe Changes (clothing, posture, background, etc.)
                </label>
                <Textarea
                  value={remixPrompt}
                  onChange={(e) => setRemixPrompt(e.target.value)}
                  placeholder="e.g., wearing a red leather jacket, arms crossed, city background..."
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30 h-32 resize-none"
                />
                <p className="text-white/40 text-xs mt-2">
                  The face appearance will remain the same. Describe the clothing, pose, and environment you want.
                </p>
              </div>

              {/* Example Prompts */}
              <div>
                <div className="text-white/40 text-xs mb-2">Example prompts:</div>
                <div className="grid grid-cols-2 gap-2">
                  {examplePrompts.map((prompt, idx) => (
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
                  Generate Remix
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}