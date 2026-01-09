import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Sparkles, Loader2, Image as ImageIcon, Upload, History, Settings, Pause, StopCircle, Info, X } from "lucide-react";
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
  const [generatedImages, setGeneratedImages] = useState([null, null, null, null, null, null, null, null, null, null]);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('control');
  const [chatMessage, setChatMessage] = useState("");
  const [viewingImage, setViewingImage] = useState(null);
  const [rmxActivated, setRmxActivated] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectOptions, setShowProjectOptions] = useState(false);

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

  const handleRMXClick = () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }
    setRmxActivated(true);
    setShowProjectOptions(true);
  };

  const handleCreateNewProject = () => {
    setCurrentProject({
      name: `Project ${Date.now()}`,
      prompt: prompt,
      createdAt: new Date().toISOString()
    });
    setShowProjectOptions(false);
  };

  const handleRunCurrentProject = () => {
    setShowProjectOptions(false);
  };

  const handleStartGeneration = () => {
    setIsGenerating(true);
    setShouldStop(false);
    setIsPaused(false);
    generateImages();
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const generateImages = async () => {
    setProgress(0);
    setGeneratedImages([null, null, null, null, null, null, null, null, null, null]);
    
    try {
      const imageUrls = referenceImages.filter(img => img !== null);
      
      // Run two RMX ULTRA agents in parallel
      const agent1 = async () => {
        // Agent 1: Generate images 1-5
        for (let i = 0; i < 5; i++) {
          if (shouldStop) break;
          while (isPaused && !shouldStop) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          if (shouldStop) break;

          try {
            console.log(`Agent 1: Generating image ${i + 1}/10...`);
            const response = await base44.integrations.Core.GenerateImage({
              prompt: prompt,
              ...(imageUrls.length > 0 && { existing_image_urls: imageUrls })
            });

            if (response?.url) {
              console.log(`✅ Agent 1: Got image ${i + 1}`);
              setGeneratedImages(prev => {
                const updated = [...prev];
                updated[i] = response.url;
                return updated;
              });
              
              await base44.entities.RemixAILearning.create({
                user_prompt: prompt,
                detailed_prompt: prompt,
                reference_images: imageUrls,
                result_image: response.url,
                was_successful: true,
                style_type: 'rmx_workflow'
              });
            }
          } catch (err) {
            console.error(`❌ Agent 1 failed image ${i + 1}:`, err);
          }
        }
      };

      const agent2 = async () => {
        // Agent 2: Generate images 6-10
        for (let i = 5; i < 10; i++) {
          if (shouldStop) break;
          while (isPaused && !shouldStop) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          if (shouldStop) break;

          try {
            console.log(`Agent 2: Generating image ${i + 1}/10...`);
            const response = await base44.integrations.Core.GenerateImage({
              prompt: prompt,
              ...(imageUrls.length > 0 && { existing_image_urls: imageUrls })
            });

            if (response?.url) {
              console.log(`✅ Agent 2: Got image ${i + 1}`);
              setGeneratedImages(prev => {
                const updated = [...prev];
                updated[i] = response.url;
                return updated;
              });
              
              await base44.entities.RemixAILearning.create({
                user_prompt: prompt,
                detailed_prompt: prompt,
                reference_images: imageUrls,
                result_image: response.url,
                was_successful: true,
                style_type: 'rmx_workflow'
              });
            }
          } catch (err) {
            console.error(`❌ Agent 2 failed image ${i + 1}:`, err);
          }
        }
      };

      // Run both agents simultaneously
      await Promise.all([agent1(), agent2()]);

      setProgress(100);
      await loadHistory();
    } catch (err) {
      console.error('Generation failed:', err);
      alert('Failed to generate images: ' + err.message);
    } finally {
      setIsGenerating(false);
      setRmxActivated(false);
      setShouldStop(false);
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    setShouldStop(true);
    setIsGenerating(false);
    setIsPaused(false);
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
        <div className="w-full max-w-6xl">
          {/* 5x2 Grid for 10 images */}
          <div className="grid grid-cols-5 gap-4">
            {generatedImages.map((img, idx) => (
              <div key={`gen-${idx}`} className="relative bg-zinc-900/50 rounded-xl overflow-hidden border-2 border-zinc-700/50 aspect-square group cursor-pointer" onClick={() => img && setViewingImage(img)}>
                {img ? (
                  <>
                    <img src={img} alt={`Generated ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white text-xs font-semibold">Click to view</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {isGenerating && idx <= Math.floor((progress / 100) * 10) ? (
                      <>
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-2" />
                        <p className="text-zinc-600 text-xs">Gen {idx + 1}</p>
                      </>
                    ) : (
                      <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Image Viewer Modal */}
          {viewingImage && (
            <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8" onClick={() => setViewingImage(null)}>
              <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
                <img src={viewingImage} alt="Full view" className="w-full h-full object-contain rounded-lg" />
                <Button
                  onClick={() => setViewingImage(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70"
                  size="icon"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Reference Images Row */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            {referenceImages.map((img, idx) => (
              <div key={`ref-${idx}`} className="relative bg-zinc-900/50 rounded-xl overflow-hidden border-2 border-dashed border-zinc-700/50 hover:border-zinc-600/50 transition-colors h-32">
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
                      <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-zinc-700 group-hover:text-zinc-600 transition-colors" />
                        <p className="text-zinc-700 text-xs mt-1">Reference {idx + 1}</p>
                      </>
                    )}
                  </label>
                )}
              </div>
            ))}
          </div>

          {/* Chat Input Below References */}
          <div className="mt-4 bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <Textarea
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Add additional instructions or modifications..."
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 min-h-[80px] resize-none"
            />
            <Button
              onClick={() => {
                if (chatMessage.trim()) {
                  setPrompt(prev => prev + '\n\nAdditional: ' + chatMessage);
                  setChatMessage("");
                }
              }}
              disabled={!chatMessage.trim()}
              className="mt-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Apply Instructions
            </Button>
          </div>
        </div>


      </div>

      {/* RIGHT CONTROL PANEL - Dark Theme */}
      <div className="bg-[#121212] border-l border-zinc-800 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/b768ec610_image.png" 
              alt="RMX ULTRA"
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="text-white font-bold">RMX Workflow</h3>
              <p className="text-xs text-zinc-500">by RMX ULTRA AI</p>
            </div>
          </div>

          {/* Control Tabs */}
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('control')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'control'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
              }`}
            >
              Control
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'settings'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
              }`}
            >
              Settings
            </button>
            <button 
              onClick={() => setActiveTab('projects')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'projects'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
              }`}
            >
              Projects
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'control' && (
            <>
              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-zinc-400 text-sm font-semibold">Enter your prompt for RMX ULTRA</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setRmxActivated(false);
                  }}
                  placeholder="Describe your vision... RMX ULTRA will generate 10 high-quality images with different angles and perspectives."
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 min-h-[100px]"
                  disabled={isGenerating}
                />
                
                {!rmxActivated && !isGenerating && (
                  <Button
                    onClick={handleRMXClick}
                    disabled={!prompt.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg h-12"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    RMX
                  </Button>
                )}

                {rmxActivated && !isGenerating && showProjectOptions && (
                  <div className="space-y-2">
                    <Button
                      onClick={handleCreateNewProject}
                      className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold h-10"
                    >
                      Create New Project
                    </Button>
                    {currentProject && (
                      <Button
                        onClick={handleRunCurrentProject}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold h-10"
                      >
                        Run Current Project
                      </Button>
                    )}
                  </div>
                )}

                {rmxActivated && !isGenerating && !showProjectOptions && (
                  <Button
                    onClick={handleStartGeneration}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold h-12"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Generation
                  </Button>
                )}
              </div>

              {/* Progress Bar */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cyan-400">Generating image {Math.floor((progress / 100) * 10) + 1}/10</span>
                    <span className="text-zinc-500">{progress}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Control Buttons */}
              {isGenerating && (
                <div className="grid grid-cols-3 gap-2">
                  {!isPaused ? (
                    <Button
                      onClick={handlePause}
                      className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      onClick={handleResume}
                      className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  <Button
                    onClick={handleStop}
                    className="col-span-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50"
                  >
                    <StopCircle className="w-4 h-4 mr-2" />
                    Stop Generation
                  </Button>
                </div>
              )}

              {/* Important Notes */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="text-purple-400 font-semibold text-sm">RMX ULTRA Features:</h4>
                    <ul className="text-purple-200/80 text-xs space-y-1 list-disc pl-4">
                      <li>Generates 10 high-quality images per request</li>
                      <li>Automatic angle and composition variations</li>
                      <li>Professional photography perspectives</li>
                      <li>Project-based workflow management</li>
                    </ul>
                  </div>
                </div>
              </div>


            </>
          )}

          {activeTab === 'settings' && (
            <div className="bg-zinc-900 rounded-lg p-4">
              <h4 className="text-zinc-400 text-sm mb-4">Settings</h4>
              <p className="text-zinc-500 text-xs">Settings coming soon...</p>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-3">
              <h4 className="text-zinc-400 text-sm mb-2">Generation History</h4>
              {history.length === 0 ? (
                <div className="bg-zinc-900 rounded-lg p-4 text-center">
                  <p className="text-zinc-500 text-xs">No generations yet</p>
                </div>
              ) : (
                history.slice(0, 10).map(entry => (
                  <div key={entry.id} className="bg-zinc-900 rounded-lg p-3">
                    <p className="text-white text-xs font-semibold mb-1 line-clamp-2">{entry.user_prompt}</p>
                    {entry.result_image && (
                      <img src={entry.result_image} alt="Result" className="w-full h-20 object-cover rounded mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}