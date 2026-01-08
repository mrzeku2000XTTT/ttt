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
  const [generatedImages, setGeneratedImages] = useState([null, null, null, null, null, null, null, null, null, null]);
  const [progress, setProgress] = useState(0);
  const [promptReady, setPromptReady] = useState(false);
  const [showProjectOptions, setShowProjectOptions] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState([]);

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

  const handlePromptEnter = () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }
    setPromptReady(true);
    setShowProjectOptions(true);
  };

  const handleCreateNewProject = () => {
    const newProject = {
      id: Date.now(),
      prompt: prompt,
      images: [],
      created_at: new Date().toISOString()
    };
    setProjects([newProject, ...projects]);
    setCurrentProject(newProject);
    setShowProjectOptions(false);
    generateImages();
  };

  const handleRunOnProject = () => {
    if (!currentProject) {
      alert('No active project. Creating new project.');
      handleCreateNewProject();
      return;
    }
    setShowProjectOptions(false);
    generateImages();
  };

  const generateImages = async () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedImages([null, null, null, null, null, null, null, null, null, null]);
    
    try {
      const imageUrls = referenceImages.filter(img => img !== null);
      
      // Generate detailed prompt with RMX ULTRA understanding
      const detailedPrompt = await base44.integrations.Core.InvokeLLM({
        prompt: `You are RMX ULTRA, an advanced AI prompt engineer for image generation. Analyze this user request and create 10 diverse, high-quality image generation prompts with different angles, compositions, and perspectives.

User Request: "${prompt}"

Generate 10 distinct prompts that capture the essence of the request. Each prompt should specify:
- Camera angle (eye-level, high-angle, low-angle, bird's eye, worm's eye, Dutch angle, over-the-shoulder)
- Shot type (close-up, medium shot, wide shot, extreme close-up, establishing shot)
- Composition (rule of thirds, centered, symmetrical, leading lines, golden ratio)
- Lighting (golden hour, blue hour, soft diffused, dramatic shadows, rim lighting)
- Perspective and depth
- Mood and atmosphere

Return as JSON array of 10 prompts.`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            prompts: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      const prompts = detailedPrompt.prompts || [];
      const generatedUrls = [];

      for (let i = 0; i < Math.min(10, prompts.length); i++) {
        setProgress(Math.round(((i + 1) / 10) * 100));
        
        try {
          const response = await base44.integrations.Core.GenerateImage({
            prompt: prompts[i],
            ...(imageUrls.length > 0 && { existing_image_urls: imageUrls })
          });

          if (response?.url) {
            generatedUrls[i] = response.url;
            setGeneratedImages([...generatedUrls, ...Array(10 - generatedUrls.length).fill(null)]);
            
            await base44.entities.RemixAILearning.create({
              user_prompt: prompt,
              detailed_prompt: prompts[i],
              reference_images: imageUrls,
              result_image: response.url,
              was_successful: true,
              style_type: 'rmx_workflow'
            });
          }
        } catch (err) {
          console.error(`Failed to generate image ${i + 1}:`, err);
        }
      }

      if (currentProject) {
        const updatedProjects = projects.map(p => 
          p.id === currentProject.id 
            ? { ...p, images: [...p.images, ...generatedUrls.filter(Boolean)] }
            : p
        );
        setProjects(updatedProjects);
      }

      await loadHistory();
      setPromptReady(false);
      setPrompt("");
    } catch (err) {
      console.error('Generation failed:', err);
      alert('Failed to generate images: ' + err.message);
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
        <div className="w-full max-w-6xl">
          {/* 5x2 Grid for 10 images */}
          <div className="grid grid-cols-5 gap-4">
            {generatedImages.map((img, idx) => (
              <div key={`gen-${idx}`} className="relative bg-zinc-900/50 rounded-xl overflow-hidden border-2 border-zinc-700/50 aspect-square">
                {img ? (
                  <img src={img} alt={`Generated ${idx + 1}`} className="w-full h-full object-cover" />
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
        </div>

        {/* Floating Prompt Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-3xl px-8">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-end gap-3 p-4">
              <Textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setPromptReady(false);
                  setShowProjectOptions(false);
                }}
                placeholder="Describe your vision... RMX ULTRA will generate 10 high-quality images with different angles and perspectives."
                className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-600 resize-none min-h-[60px] max-h-[120px] focus:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePromptEnter();
                  }
                }}
              />
              <div className="flex gap-2 pb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-500 hover:text-zinc-400"
                  title="Add reference images"
                >
                  <Upload className="w-5 h-5" />
                </Button>
                <Button
                  onClick={handlePromptEnter}
                  disabled={isGenerating || !prompt.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Analyze'
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
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold">RMX Workflow</h3>
              <p className="text-xs text-zinc-500">by RMX ULTRA AI</p>
            </div>
          </div>

          {/* Control Tabs */}
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg font-semibold text-sm border border-purple-500/50">
              Control
            </button>
            <button className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-500 rounded-lg font-semibold text-sm hover:bg-zinc-700">
              Settings
            </button>
            <button className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-500 rounded-lg font-semibold text-sm hover:bg-zinc-700">
              Projects
            </button>
          </div>

          {/* Prompt Display */}
          {prompt && promptReady && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-400 text-sm leading-relaxed">{prompt}</p>
              </div>
            </div>
          )}
          
          {prompt && !promptReady && (
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

          {/* Project Options */}
          {showProjectOptions && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm">Ready to generate 10 high-quality images</p>
              <Button
                onClick={handleCreateNewProject}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create New Project
              </Button>
              {currentProject && (
                <Button
                  onClick={handleRunOnProject}
                  className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50"
                >
                  Run on Current Project
                </Button>
              )}
            </div>
          )}

          {/* Control Buttons */}
          {!showProjectOptions && (
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

          {/* Current Project */}
          {currentProject && (
            <div className="bg-zinc-900 rounded-lg p-4">
              <h4 className="text-zinc-400 text-sm mb-2">Active Project</h4>
              <p className="text-white text-sm font-semibold mb-1">{currentProject.prompt}</p>
              <p className="text-zinc-500 text-xs">{currentProject.images.length} images generated</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}