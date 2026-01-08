import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Loader2, Image as ImageIcon, Download, Trash2, Send, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ImageHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [referenceImage, setReferenceImage] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const entries = await base44.entities.RemixAILearning.filter({}, '-created_date', 50);
      setHistory(entries);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReferenceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReference(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReferenceImage(file_url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload reference image");
    } finally {
      setUploadingReference(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const imageUrls = referenceImage ? [referenceImage] : [];
      
      const response = await base44.integrations.Core.GenerateImage({
        prompt: prompt,
        ...(imageUrls.length > 0 && { existing_image_urls: imageUrls })
      });

      if (response?.url) {
        // Save to history
        await base44.entities.RemixAILearning.create({
          user_prompt: prompt,
          detailed_prompt: prompt,
          reference_images: imageUrls,
          result_image: response.url,
          was_successful: true,
          style_type: 'chat_generation'
        });

        // Reload history
        await loadHistory();
        
        // Clear input
        setPrompt("");
        setReferenceImage(null);
      }
    } catch (err) {
      console.error('Generation failed:', err);
      alert('Failed to generate image: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this image from history?')) return;
    
    try {
      await base44.entities.RemixAILearning.delete(id);
      setHistory(history.filter(h => h.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete image');
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(createPageUrl('Feed'))}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Image Generation History</h1>
                <p className="text-sm text-white/60">View past generations and create new images</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <span className="text-xs text-purple-400 font-semibold">{history.length} Images</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Chat Interface */}
        <div className="mb-8 bg-zinc-950 border border-white/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Image Generator</h2>
                <p className="text-sm text-white/60">Describe what you want to create</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Reference Image Upload */}
            {referenceImage ? (
              <div className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
                <img
                  src={referenceImage}
                  alt="Reference"
                  className="w-full h-48 object-contain"
                />
                <button
                  onClick={() => setReferenceImage(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="relative bg-white/5 border-2 border-dashed border-white/20 rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all h-32">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReferenceUpload}
                  className="hidden"
                  disabled={uploadingReference}
                />
                {uploadingReference ? (
                  <>
                    <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                    <p className="text-white/60 text-xs">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-white/40 mb-2" />
                    <p className="text-white/80 text-sm font-semibold">Upload Reference Image</p>
                    <p className="text-white/40 text-xs">(Optional)</p>
                  </>
                )}
              </label>
            )}

            {/* Prompt Input */}
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate... (e.g., 'a futuristic cyberpunk warrior in neon city, digital art masterpiece')"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/30 min-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />

            {/* Generate Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
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
                    Generate Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* History Grid */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Generation History</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
              <ImageIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No generation history yet</p>
              <p className="text-white/40 text-sm mt-2">Start generating images to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-zinc-950 border border-white/20 rounded-xl overflow-hidden group hover:border-purple-500/50 transition-all"
                  >
                    <div
                      onClick={() => setSelectedImage(item)}
                      className="relative cursor-pointer overflow-hidden aspect-square"
                    >
                      <img
                        src={item.result_image}
                        alt={item.user_prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-4">
                      <p className="text-white/80 text-sm line-clamp-2 mb-3">{item.user_prompt}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/40">
                          {new Date(item.created_date).toLocaleDateString()}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <a
                            href={item.result_image}
                            download={`generated-${item.id}.png`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Download className="w-4 h-4 text-white/60" />
                          </a>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="w-8 h-8 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Full Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedImage(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-950 border border-white/20 rounded-2xl overflow-hidden max-w-4xl max-h-[90vh] w-full flex flex-col"
              >
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <div>
                    <h3 className="text-white font-bold">Generated Image</h3>
                    <p className="text-sm text-white/60">{new Date(selectedImage.created_date).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <img
                    src={selectedImage.result_image}
                    alt={selectedImage.user_prompt}
                    className="w-full h-auto rounded-xl"
                  />
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2">Prompt</h4>
                      <p className="text-white/60 text-sm bg-white/5 rounded-lg p-3">{selectedImage.user_prompt}</p>
                    </div>

                    {selectedImage.reference_images && selectedImage.reference_images.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white/80 mb-2">Reference Images</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedImage.reference_images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Reference ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-white/10"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}