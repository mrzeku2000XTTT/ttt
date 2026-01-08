import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Sparkles, Loader2, Image as ImageIcon, Upload, History, Settings, Pause, StopCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ImageHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [referenceImages, setReferenceImages] = useState([null, null]);
  const [generatedImages, setGeneratedImages] = useState([null, null]);
  const [progress, setProgress] = useState(0);

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

  const handleImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReference(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newImages = [...referenceImages];
      newImages[index] = file_url;
      setReferenceImages(newImages);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload image");
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
    setProgress(0);
    setGeneratedImages([null, null]);
    
    try {
      const imageUrls = referenceImages.filter(img => img !== null);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 200);

      const response = await base44.integrations.Core.GenerateImage({
        prompt: prompt,
        ...(imageUrls.length > 0 && { existing_image_urls: imageUrls })
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response?.url) {
        setGeneratedImages([response.url, null]);
        
        await base44.entities.RemixAILearning.create({
          user_prompt: prompt,
          detailed_prompt: prompt,
          reference_images: imageUrls,
          result_image: response.url,
          was_successful: true,
          style_type: 'autowhisk_generation'
        });

        await loadHistory();
      }
    } catch (err) {
      console.error('Generation failed:', err);
      alert('Failed to generate image: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    setIsGenerating(false);
    setProgress(0);
  };

  return (
    <div className="h-screen bg-[#0a0a0a] overflow-hidden grid" style={{ gridTemplateColumns: '64px 1fr 400px' }}>
      {/* LEFT SIDEBAR - Yellow Icon-Only */}
      <div className="bg-gradient-to-b from-yellow-500 to-orange-500 flex flex-col items-center py-6 gap-6">
        <button
          onClick={() => navigate(createPageUrl('Feed'))}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
          title="Home"
        >
          <Home className="w-5 h-5 text-white" />
        </button>
        <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors" title="Upload">
          <Upload className="w-5 h-5 text-white" />
        </button>
        <button className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center" title="History">
          <History className="w-5 h-5 text-white" />
        </button>
        <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors mt-auto" title="Settings">
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* CENTER CANVAS - 2x2 Grid */}
      <div className="flex flex-col items-center justify-center p-8 relative">
        <div className="w-full max-w-4xl grid grid-cols-2 grid-rows-2 gap-4" style={{ aspectRatio: '16/9' }}>
          {/* Top Row - Images */}
          {referenceImages.map((img, idx) => (
            <div key={`ref-${idx}`} className="relative bg-zinc-900/50 rounded-2xl overflow-hidden border-2 border-dashed border-zinc-700/50 hover:border-zinc-600/50 transition-colors">
              {img ? (
                <img src={img} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, idx)}
                    className="hidden"
                    disabled={uploadingReference}
                  />
                  {uploadingReference ? (
                    <Loader2 className="w-12 h-12 text-zinc-600 animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-12 h-12 text-zinc-700 group-hover:text-zinc-600 transition-colors" />
                      <p className="text-zinc-700 text-sm mt-2">Upload Image</p>
                    </>
                  )}
                </label>
              )}
            </div>
          ))}

          {/* Bottom Row - Generated Videos/Images */}
          {generatedImages.map((img, idx) => (
            <div key={`gen-${idx}`} className="relative bg-zinc-900/50 rounded-2xl overflow-hidden border-2 border-zinc-700/50">
              {img ? (
                <img src={img} alt={`Generated ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-12 h-12 text-zinc-600 animate-spin mb-3" />
                      <p className="text-zinc-600 text-sm">Generating...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Floating Prompt Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-end gap-3 p-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate..."
                className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-600 resize-none min-h-[60px] max-h-[120px] focus:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <div className="flex gap-2 pb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-500 hover:text-zinc-400"
                >
                  <Upload className="w-5 h-5" />
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT CONTROL PANEL - Dark Theme */}
      <div className="bg-[#121212] border-l border-zinc-800 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold">Auto Whisk</h3>
              <p className="text-xs text-zinc-500">by Ultra Vision Labs</p>
            </div>
          </div>

          {/* Control Tabs */}
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg font-semibold text-sm">
              Control
            </button>
            <button className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-500 rounded-lg font-semibold text-sm hover:bg-zinc-700">
              Settings
            </button>
            <button className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-500 rounded-lg font-semibold text-sm hover:bg-zinc-700">
              History
            </button>
          </div>

          {/* Prompt Display */}
          {prompt && (
            <div className="bg-zinc-900 rounded-lg p-4">
              <p className="text-zinc-400 text-sm leading-relaxed">{prompt}</p>
            </div>
          )}

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-cyan-400">Processing prompt 2/10</span>
                <span className="text-zinc-500">{progress}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setIsGenerating(false)}
              disabled={!isGenerating}
              className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
            <Button
              onClick={handleStop}
              disabled={!isGenerating}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-yellow-400 font-semibold text-sm">Important Notes:</h4>
                <ul className="text-yellow-200/80 text-xs space-y-1 list-disc pl-4">
                  <li>Always keep the Whisk Tab and this panel open</li>
                  <li>Running in a separate browser window is more stable</li>
                </ul>
              </div>
            </div>
          </div>

          {/* User Manual Link */}
          <div className="bg-zinc-900 rounded-lg p-4">
            <p className="text-zinc-400 text-sm mb-3">Hướng Dẫn Sử Dụng / User Manual</p>
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold">
              Tiếng Việt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}