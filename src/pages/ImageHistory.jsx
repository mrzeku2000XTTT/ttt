import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
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
  const [completedImages, setCompletedImages] = useState(0);
  const [activeTab, setActiveTab] = useState('control');
  const [chatMessage, setChatMessage] = useState("");
  const [viewingImage, setViewingImage] = useState(null);
  const [rmxActivated, setRmxActivated] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectOptions, setShowProjectOptions] = useState(false);
  const [subjectImage, setSubjectImage] = useState(null);
  const [styleImage, setStyleImage] = useState(null);
  const [sceneImage, setSceneImage] = useState(null);
  const [uploadingSubject, setUploadingSubject] = useState(false);
  const [uploadingStyle, setUploadingStyle] = useState(false);
  const [uploadingScene, setUploadingScene] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [user, setUser] = useState(null);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [panelY, setPanelY] = useState(0);
  const dragControls = useDragControls();

  useEffect(() => {
    loadHistory();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log('User not logged in');
      setUser(null);
    }
  };

  const loadHistory = async () => {
    try {
      // Get wallet address
      let walletAddress = null;
      try {
        const currentUser = await base44.auth.me();
        walletAddress = currentUser?.created_wallet_address;
      } catch (err) {
        // Try Kasware for non-logged in users
        if (typeof window.kasware !== 'undefined') {
          const accounts = await window.kasware.getAccounts();
          if (accounts && accounts.length > 0) {
            walletAddress = accounts[0];
          }
        }
      }

      if (walletAddress) {
        // Filter by wallet address to show only user's projects
        const entries = await base44.entities.RemixAILearning.filter(
          { wallet_address: walletAddress },
          '-created_date',
          100
        );
        setHistory(entries);
      } else {
        // Load from localStorage for guests
        const localHistory = JSON.parse(localStorage.getItem('rmx_local_history') || '[]');
        setHistory(localHistory);
      }
    } catch (err) {
      console.error('Failed to load history, loading from localStorage:', err);
      const localHistory = JSON.parse(localStorage.getItem('rmx_local_history') || '[]');
      setHistory(localHistory);
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

  const handleSubjectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSubject(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSubjectImage(file_url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload subject image");
    } finally {
      setUploadingSubject(false);
    }
  };

  const handleStyleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingStyle(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setStyleImage(file_url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload style image");
    } finally {
      setUploadingStyle(false);
    }
  };

  const handleSceneUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingScene(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSceneImage(file_url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload scene image");
    } finally {
      setUploadingScene(false);
    }
  };

  const handleRMXClick = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }
    
    // Generate unique project ID bound to wallet
    let walletAddress = 'guest';
    try {
      if (user?.created_wallet_address) {
        walletAddress = user.created_wallet_address;
      } else if (typeof window.kasware !== 'undefined') {
        const accounts = await window.kasware.getAccounts();
        if (accounts && accounts.length > 0) {
          walletAddress = accounts[0];
        }
      }
    } catch (err) {
      console.log('Could not get wallet address');
    }
    
    // Generate project ID: WALLET_PREFIX-TIMESTAMP-RANDOM
    const walletPrefix = walletAddress.substring(0, 8);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    const generatedProjectId = `${walletPrefix}-${timestamp}-${random}`;
    
    setProjectId(generatedProjectId);
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
    setCompletedImages(0);
    setGeneratedImages([null, null, null, null, null, null, null, null, null, null]);
    
    try {
      // Collect ALL images: SUBJECT, STYLE, SCENE, and references
      const imageUrls = [
        subjectImage,
        styleImage,
        sceneImage,
        ...referenceImages
      ].filter(img => img !== null);
      
      // Build comprehensive base prompt
      let basePrompt = prompt;
      
      if (subjectImage || styleImage || sceneImage || imageUrls.length > 0) {
        basePrompt += "\n\nIMPORTANT INSTRUCTIONS:\n";
        if (subjectImage) basePrompt += "- USE THE SUBJECT CHARACTER from reference image EXACTLY as shown, maintain their appearance, features, and identity\n";
        if (styleImage) basePrompt += "- APPLY THE EXACT VISUAL STYLE from the style reference (art style, rendering technique, color palette, aesthetic)\n";
        if (sceneImage) basePrompt += "- USE THE SCENE/BACKGROUND from reference as the environmental setting\n";
        if (referenceImages.filter(img => img).length > 0) {
          basePrompt += "- REFERENCE the additional images for composition, mood, and visual elements\n";
        }
        basePrompt += "- MAINTAIN CONSISTENCY across all angles while keeping the core subject, style, and scene identical\n";
        basePrompt += "- HIGH QUALITY, professional photography, 8K resolution, sharp focus, detailed\n";
      }
      
      // Storyboard camera angles for cinematic sequencing
      const cameraAngles = [
        "establishing wide shot, full scene context, cinematic framing",
        "medium shot, main subject focus, eye level perspective",
        "close-up on subject, emotional detail, shallow depth of field",
        "3/4 angle view, dynamic composition, professional photography angle",
        "side profile view, dramatic lighting, artistic perspective",
        "over the shoulder shot, cinematic storytelling angle",
        "low angle shot, heroic perspective, looking up at subject",
        "high angle shot, bird's eye view, environmental context",
        "Dutch angle, tilted dynamic perspective, tension and energy",
        "extreme close-up, intimate detail focus, macro perspective"
      ];
      
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
            console.log(`🎨 Agent 1: Starting image ${i + 1}/10...`);
            const enhancedPrompt = `[Project ID: ${projectId}]\n\n${basePrompt}\n\nSTORYBOARD SHOT ${i + 1}/10 - Camera Angle: ${cameraAngles[i]}\nProfessional cinematography, consistent subject and style, high quality output`;
            const response = await base44.integrations.Core.GenerateImage({
              prompt: enhancedPrompt,
              ...(imageUrls.length > 0 && { existing_image_urls: imageUrls })
            });

            if (response?.url) {
              console.log(`✅ Agent 1: Completed image ${i + 1}/10`);
              setGeneratedImages(prev => {
                const updated = [...prev];
                updated[i] = response.url;
                return updated;
              });

              setCompletedImages(prev => {
                const newCount = prev + 1;
                console.log(`📊 Progress: ${newCount}/10 images completed`);
                return newCount;
              });

              // Get wallet address for ownership tracking
              let walletAddress = 'guest';
              try {
                if (user?.created_wallet_address) {
                  walletAddress = user.created_wallet_address;
                } else if (typeof window.kasware !== 'undefined') {
                  const accounts = await window.kasware.getAccounts();
                  if (accounts && accounts.length > 0) {
                    walletAddress = accounts[0];
                  }
                }
              } catch (err) {
                console.log('Could not get wallet');
              }

              const entryData = {
                wallet_address: walletAddress,
                project_id: projectId,
                user_prompt: prompt,
                detailed_prompt: enhancedPrompt,
                reference_images: imageUrls,
                result_image: response.url,
                was_successful: true,
                style_type: 'rmx_workflow',
                created_date: new Date().toISOString()
              };

              try {
                await base44.entities.RemixAILearning.create(entryData);
              } catch (err) {
                console.log('Not logged in, saving to localStorage');
                const localHistory = JSON.parse(localStorage.getItem('rmx_local_history') || '[]');
                localHistory.unshift({ ...entryData, id: Date.now() + i });
                localStorage.setItem('rmx_local_history', JSON.stringify(localHistory.slice(0, 100)));
              }
            } else {
              console.error(`❌ Agent 1: No URL returned for image ${i + 1}`);
            }
          } catch (err) {
            console.error(`❌ Agent 1 failed image ${i + 1}:`, err.message || err);
            // Don't stop on error, continue to next image
          }
        }
        console.log('✅ Agent 1: Completed all 5 images');
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
            console.log(`🎨 Agent 2: Starting image ${i + 1}/10...`);
            const enhancedPrompt = `[Project ID: ${projectId}]\n\n${basePrompt}\n\nSTORYBOARD SHOT ${i + 1}/10 - Camera Angle: ${cameraAngles[i]}\nProfessional cinematography, consistent subject and style, high quality output`;
            const response = await base44.integrations.Core.GenerateImage({
              prompt: enhancedPrompt,
              ...(imageUrls.length > 0 && { existing_image_urls: imageUrls })
            });

            if (response?.url) {
              console.log(`✅ Agent 2: Completed image ${i + 1}/10`);
              setGeneratedImages(prev => {
                const updated = [...prev];
                updated[i] = response.url;
                return updated;
              });

              setCompletedImages(prev => {
                const newCount = prev + 1;
                console.log(`📊 Progress: ${newCount}/10 images completed`);
                return newCount;
              });

              // Get wallet address for ownership tracking
              let walletAddress = 'guest';
              try {
                if (user?.created_wallet_address) {
                  walletAddress = user.created_wallet_address;
                } else if (typeof window.kasware !== 'undefined') {
                  const accounts = await window.kasware.getAccounts();
                  if (accounts && accounts.length > 0) {
                    walletAddress = accounts[0];
                  }
                }
              } catch (err) {
                console.log('Could not get wallet');
              }

              const entryData = {
                wallet_address: walletAddress,
                project_id: projectId,
                user_prompt: prompt,
                detailed_prompt: enhancedPrompt,
                reference_images: imageUrls,
                result_image: response.url,
                was_successful: true,
                style_type: 'rmx_workflow',
                created_date: new Date().toISOString()
              };

              try {
                await base44.entities.RemixAILearning.create(entryData);
              } catch (err) {
                console.log('Not logged in, saving to localStorage');
                const localHistory = JSON.parse(localStorage.getItem('rmx_local_history') || '[]');
                localHistory.unshift({ ...entryData, id: Date.now() + i });
                localStorage.setItem('rmx_local_history', JSON.stringify(localHistory.slice(0, 100)));
              }
            } else {
              console.error(`❌ Agent 2: No URL returned for image ${i + 1}`);
            }
          } catch (err) {
            console.error(`❌ Agent 2 failed image ${i + 1}:`, err.message || err);
            // Don't stop on error, continue to next image
          }
        }
        console.log('✅ Agent 2: Completed all 5 images');
      };

      // Run both agents simultaneously and wait for completion
      await Promise.all([agent1(), agent2()]);

      console.log('✅ All 10 images generation complete!');
      setProgress(100);
      setCompletedImages(10);
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

  const handleDownloadAll = async (projectImages) => {
    for (let i = 0; i < projectImages.length; i++) {
      const img = projectImages[i];
      if (!img) continue;
      
      try {
        const response = await fetch(img);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rmx-image-${i + 1}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Failed to download image ${i + 1}:`, err);
      }
    }
  };

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Group history by project ID
  const projectGroups = history.reduce((acc, entry) => {
    const id = entry.project_id || entry.user_prompt?.match(/\[Project ID: ([^\]]+)\]/)?.[1] || 'Unknown';
    if (!acc[id]) {
      acc[id] = [];
    }
    acc[id].push(entry);
    return acc;
  }, {});

  return (
    <div className="h-screen bg-[#0a0a0a] overflow-hidden flex flex-col lg:grid lg:grid-cols-[120px_1fr_400px]">
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-zinc-950 border-b border-zinc-800 px-3 py-2 flex items-center justify-between sticky top-0 z-[200]">
        <button
          onClick={() => navigate(createPageUrl('Feed'))}
          className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors relative z-[201]"
        >
          <Home className="w-4 h-4 text-white" />
        </button>
        
        <button
          onClick={() => setShowControlPanel(!showControlPanel)}
          className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center relative z-[201] ${
            showControlPanel ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/10 text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* LEFT SIDEBAR - Desktop Only */}
      <div className="hidden lg:flex bg-zinc-950 border-r border-zinc-800 flex-col py-6 px-3 gap-4 overflow-y-auto">
        <button
          onClick={() => navigate(createPageUrl('Feed'))}
          className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors mx-auto"
          title="Home"
        >
          <Home className="w-5 h-5 text-white" />
        </button>

        {/* SUBJECT Section */}
        <div className="space-y-2">
          <div className="text-white text-[10px] font-bold tracking-wider">SUBJECT</div>
          <label className="relative bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg overflow-hidden cursor-pointer hover:border-zinc-600 transition-colors block aspect-square">
            <input
              type="file"
              accept="image/*"
              onChange={handleSubjectUpload}
              className="hidden"
              disabled={uploadingSubject}
            />
            {subjectImage ? (
              <img src={subjectImage} alt="Subject" className="w-full h-full object-cover" />
            ) : uploadingSubject ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Upload className="w-5 h-5 text-zinc-700" />
                <span className="text-zinc-700 text-[8px] mt-1">Character</span>
              </div>
            )}
          </label>
        </div>

        {/* STYLE Section */}
        <div className="space-y-2">
          <div className="text-white text-[10px] font-bold tracking-wider">STYLE</div>
          <label className="relative bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg overflow-hidden cursor-pointer hover:border-zinc-600 transition-colors block aspect-square">
            <input
              type="file"
              accept="image/*"
              onChange={handleStyleUpload}
              className="hidden"
              disabled={uploadingStyle}
            />
            {styleImage ? (
              <img src={styleImage} alt="Style" className="w-full h-full object-cover" />
            ) : uploadingStyle ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Upload className="w-5 h-5 text-zinc-700" />
                <span className="text-zinc-700 text-[8px] mt-1">UI/Style</span>
              </div>
            )}
          </label>
        </div>

        {/* SCENE Section */}
        <div className="space-y-2">
          <div className="text-white text-[10px] font-bold tracking-wider">SCENE</div>
          <label className="relative bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg overflow-hidden cursor-pointer hover:border-zinc-600 transition-colors block aspect-square">
            <input
              type="file"
              accept="image/*"
              onChange={handleSceneUpload}
              className="hidden"
              disabled={uploadingScene}
            />
            {sceneImage ? (
              <img src={sceneImage} alt="Scene" className="w-full h-full object-cover" />
            ) : uploadingScene ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Upload className="w-5 h-5 text-zinc-700" />
                <span className="text-zinc-700 text-[8px] mt-1">Background</span>
              </div>
            )}
          </label>
        </div>

        <button className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mx-auto mt-auto" title="History">
          <History className="w-5 h-5 text-white" />
        </button>
        <button className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors mx-auto" title="Settings">
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* CENTER CANVAS */}
      <div className="flex flex-col items-center justify-start p-2 lg:p-8 relative overflow-y-auto flex-1">
        <div className="w-full max-w-6xl">
          {/* Desktop: Clean 2x5 grid (10 images) | Mobile: 3x3 grid + bottom row (9 images + refs + image 10) */}
          <div className="grid gap-1.5 lg:gap-4">
            {/* Desktop: All 10 images in 2x5 grid */}
            <div className="hidden lg:grid lg:grid-cols-5 gap-4">
              {generatedImages.map((img, idx) => (
                <div 
                  key={`desktop-gen-${idx}`} 
                  className="relative bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700/50 aspect-square group cursor-pointer"
                  onClick={() => img && setViewingImage(img)}
                >
                  {img ? (
                    <>
                      <img src={img} alt={`Generated ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <span className="text-white text-[8px] font-semibold">{idx + 1}</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                          <p className="text-zinc-600 text-xs mt-1">{idx + 1}</p>
                        </>
                      ) : (
                        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 flex items-center justify-center">
                          <span className="text-zinc-700 text-[10px] font-mono">{idx + 1}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile: 3x3 grid + bottom row with refs */}
            <div className="lg:hidden grid grid-cols-3 gap-1.5">
              {/* First 9 images */}
              {generatedImages.slice(0, 9).map((img, idx) => (
                <div 
                  key={`mobile-gen-${idx}`} 
                  className="relative bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700/50 aspect-square group cursor-pointer"
                  onClick={() => img && setViewingImage(img)}
                >
                  {img ? (
                    <>
                      <img src={img} alt={`Generated ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <span className="text-white text-[8px] font-semibold">{idx + 1}</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                          <p className="text-zinc-600 text-[8px] mt-1">{idx + 1}</p>
                        </>
                      ) : (
                        <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 flex items-center justify-center">
                          <span className="text-zinc-700 text-[10px] font-mono">{idx + 1}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Bottom Row: Ref1, Image10, Ref2 */}
              {/* Ref 1 */}
              <div key="ref-0" className="relative bg-zinc-900/50 rounded-lg overflow-hidden border border-dashed border-zinc-700/50 aspect-square cursor-pointer">
                {referenceImages[0] ? (
                  <>
                    <img src={referenceImages[0]} alt="Reference 1" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        const newImages = [...referenceImages];
                        newImages[0] = null;
                        setReferenceImages(newImages);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/90 rounded flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                      <span className="text-white text-[8px] font-semibold">Ref 1</span>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 0)}
                      className="hidden"
                      disabled={uploadingReference}
                    />
                    {uploadingReference ? (
                      <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 text-zinc-700" />
                        <p className="text-zinc-700 text-[8px] mt-1">Ref 1</p>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Image 10 - Mobile center */}
              <div 
                key="mobile-gen-9" 
                className="relative bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-700/50 aspect-square group cursor-pointer" 
                onClick={() => generatedImages[9] && setViewingImage(generatedImages[9])}
              >
                {generatedImages[9] ? (
                  <>
                    <img src={generatedImages[9]} alt="Generated 10" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                      <span className="text-white text-[8px] font-semibold">10</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                        <p className="text-zinc-600 text-[8px] mt-1">10</p>
                      </>
                    ) : (
                      <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 flex items-center justify-center">
                        <span className="text-zinc-700 text-[10px] font-mono">10</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ref 2 */}
              <div key="ref-1" className="relative bg-zinc-900/50 rounded-lg overflow-hidden border border-dashed border-zinc-700/50 aspect-square cursor-pointer">
                {referenceImages[1] ? (
                  <>
                    <img src={referenceImages[1]} alt="Reference 2" className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        const newImages = [...referenceImages];
                        newImages[1] = null;
                        setReferenceImages(newImages);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/90 rounded flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                      <span className="text-white text-[8px] font-semibold">Ref 2</span>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 1)}
                      className="hidden"
                      disabled={uploadingReference}
                    />
                    {uploadingReference ? (
                      <Loader2 className="w-5 h-5 text-zinc-600 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 text-zinc-700" />
                        <p className="text-zinc-700 text-[8px] mt-1">Ref 2</p>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Instruction Input - Mobile (Always visible) */}
          <div className="lg:hidden mt-2 bg-zinc-900 border border-zinc-700 rounded-lg p-2">
            <Textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setRmxActivated(false);
              }}
              placeholder="Describe your vision..."
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[50px] text-xs resize-none"
              disabled={isGenerating}
            />
            
            <div className="mt-2 flex gap-2">
              {!rmxActivated && !isGenerating && (
                <Button
                  onClick={handleRMXClick}
                  disabled={!prompt.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold h-9 active:scale-95 transition-all text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  RMX
                </Button>
              )}

              {rmxActivated && !isGenerating && !showProjectOptions && (
                <Button
                  onClick={handleStartGeneration}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold h-9 active:scale-95 transition-all text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Start
                </Button>
              )}

              {isGenerating && (
                <Button
                  onClick={handleStop}
                  className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 h-9 active:scale-95 transition-all text-xs"
                >
                  <StopCircle className="w-3 h-3 mr-1" />
                  Stop
                </Button>
              )}
            </div>

            {isGenerating && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-cyan-400 font-semibold">Gen {completedImages + 1}/10</span>
                  <span className="text-zinc-500">{completedImages}/10</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${(completedImages / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}
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

          {/* Reference Images Row - Hidden on mobile, shown in upload panel */}
          <div className="hidden lg:grid grid-cols-2 gap-4 mt-6">
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

          {/* Chat Input - Adjusted for mobile */}
          <div className="hidden lg:block mt-4 bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <Textarea
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Add additional instructions or modifications..."
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 min-h-[80px] resize-none"
            />
            <Button
              onClick={() => {
                if (chatMessage.trim()) {
                  // Generate project ID
                  const id = `PRJ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                  setProjectId(id);
                  
                  // Collect all images
                  const allImages = [
                    subjectImage,
                    styleImage,
                    sceneImage,
                    ...referenceImages
                  ].filter(img => img !== null);
                  
                  // Build comprehensive prompt
                  let enhancedPrompt = `[Project ID: ${id}]\n\n`;
                  enhancedPrompt += `${prompt}\n\n`;
                  enhancedPrompt += `Additional Instructions: ${chatMessage}\n\n`;
                  
                  if (subjectImage) enhancedPrompt += `[SUBJECT CHARACTER PROVIDED]\n`;
                  if (styleImage) enhancedPrompt += `[STYLE REFERENCE PROVIDED]\n`;
                  if (sceneImage) enhancedPrompt += `[SCENE BACKGROUND PROVIDED]\n`;
                  if (referenceImages.filter(img => img).length > 0) {
                    enhancedPrompt += `[${referenceImages.filter(img => img).length} REFERENCE IMAGE(S) PROVIDED]\n`;
                  }
                  
                  setPrompt(enhancedPrompt);
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



      {/* Mobile Control Panel */}
      <AnimatePresence>
        {showControlPanel && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowControlPanel(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[98]"
            />
            
            {/* Control Panel */}
            <motion.div
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              initial={{ y: '100%' }}
              animate={{ y: panelY }}
              exit={{ y: '100%' }}
              onDragEnd={(e, info) => {
                if (info.offset.y > 150) {
                  setShowControlPanel(false);
                } else {
                  setPanelY(0);
                }
              }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-[200] bg-[#121212] border-t-2 border-cyan-500/30 rounded-t-2xl shadow-2xl overflow-hidden"
              style={{ 
                touchAction: 'none',
                maxHeight: 'calc(100vh - 60px)',
                top: '60px'
              }}
            >
            <div 
              className="sticky top-0 bg-[#121212] border-b border-zinc-800 px-4 py-3 flex items-center justify-between z-10 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
                <h3 className="text-white font-bold text-sm">RMX Control</h3>
              </div>
              <button
                onClick={() => setShowControlPanel(false)}
                className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 60px)' }}>
            <div className="p-3 space-y-3 pb-6">
              {/* Upload Section */}
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                <div>
                  <div className="text-white text-[9px] font-bold tracking-wider mb-1 uppercase">Subject</div>
                  <label className="relative bg-zinc-900 border border-dashed border-zinc-700 rounded overflow-hidden cursor-pointer active:scale-95 transition-all block aspect-square">
                    <input type="file" accept="image/*" onChange={handleSubjectUpload} className="hidden" disabled={uploadingSubject} />
                    {subjectImage ? (
                      <>
                        <img src={subjectImage} alt="Subject" className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSubjectImage(null); }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/90 rounded flex items-center justify-center"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </>
                    ) : uploadingSubject ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Upload className="w-4 h-4 text-zinc-600" />
                        <span className="text-zinc-600 text-[7px] mt-0.5">Char</span>
                      </div>
                    )}
                  </label>
                </div>

                <div>
                  <div className="text-white text-[9px] font-bold tracking-wider mb-1 uppercase">Style</div>
                  <label className="relative bg-zinc-900 border border-dashed border-zinc-700 rounded overflow-hidden cursor-pointer active:scale-95 transition-all block aspect-square">
                    <input type="file" accept="image/*" onChange={handleStyleUpload} className="hidden" disabled={uploadingStyle} />
                    {styleImage ? (
                      <>
                        <img src={styleImage} alt="Style" className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setStyleImage(null); }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/90 rounded flex items-center justify-center"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </>
                    ) : uploadingStyle ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Upload className="w-4 h-4 text-zinc-600" />
                        <span className="text-zinc-600 text-[7px] mt-0.5">UI</span>
                      </div>
                    )}
                  </label>
                </div>

                <div>
                  <div className="text-white text-[9px] font-bold tracking-wider mb-1 uppercase">Scene</div>
                  <label className="relative bg-zinc-900 border border-dashed border-zinc-700 rounded overflow-hidden cursor-pointer active:scale-95 transition-all block aspect-square">
                    <input type="file" accept="image/*" onChange={handleSceneUpload} className="hidden" disabled={uploadingScene} />
                    {sceneImage ? (
                      <>
                        <img src={sceneImage} alt="Scene" className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSceneImage(null); }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/90 rounded flex items-center justify-center"
                        >
                          <X className="w-2.5 h-2.5 text-white" />
                        </button>
                      </>
                    ) : uploadingScene ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Upload className="w-4 h-4 text-zinc-600" />
                        <span className="text-zinc-600 text-[7px] mt-0.5">BG</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('control')}
                  className={`flex-1 px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                    activeTab === 'control'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  Control
                </button>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className={`flex-1 px-3 py-2 rounded-lg font-semibold text-xs transition-all ${
                    activeTab === 'projects'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  Projects
                </button>
              </div>

              {activeTab === 'control' && (
                <>
                  <Textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      setRmxActivated(false);
                    }}
                    placeholder="Describe your vision... RMX ULTRA will generate 10 high-quality images with different angles and perspectives."
                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 min-h-[80px] text-xs resize-none"
                    disabled={isGenerating}
                  />
                  
                  {!rmxActivated && !isGenerating && (
                    <Button
                      onClick={handleRMXClick}
                      disabled={!prompt.trim()}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold h-10 active:scale-95 transition-all text-xs"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      RMX
                    </Button>
                  )}

                  {rmxActivated && !isGenerating && showProjectOptions && (
                    <div className="space-y-2">
                      <Button
                        onClick={handleCreateNewProject}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold h-10 active:scale-95 transition-all text-xs"
                      >
                        Create New Project
                      </Button>
                      {currentProject && (
                        <Button
                          onClick={handleRunCurrentProject}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold h-10 active:scale-95 transition-all text-xs"
                        >
                          Run Current Project
                        </Button>
                      )}
                    </div>
                  )}

                  {rmxActivated && !isGenerating && !showProjectOptions && (
                    <Button
                      onClick={handleStartGeneration}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold h-10 active:scale-95 transition-all text-xs"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Generation
                    </Button>
                  )}

                  {isGenerating && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-cyan-400 font-semibold">Gen {completedImages + 1}/10</span>
                        <span className="text-zinc-500">{completedImages}/10</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                          style={{ width: `${(completedImages / 10) * 100}%` }}
                        />
                      </div>
                      <Button
                        onClick={handleStop}
                        className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 h-9 active:scale-95 transition-all text-xs"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                  )}

                  {/* RMX ULTRA Features Info */}
                  <div className="bg-black border border-zinc-800 rounded-lg p-3">
                    <div className="flex gap-2">
                      <Info className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <h4 className="text-zinc-300 font-semibold text-xs">RMX ULTRA Features:</h4>
                        <ul className="text-zinc-400 text-[10px] space-y-1 list-disc pl-3">
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

              {activeTab === 'projects' && (
                <div className="space-y-2">
                  {Object.keys(projectGroups).length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-500 text-xs">No projects</p>
                    </div>
                  ) : (
                    Object.entries(projectGroups).map(([projId, entries]) => (
                      <div key={projId} className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                        <button
                          onClick={() => toggleProject(projId)}
                          className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-800 active:bg-zinc-700 transition-colors"
                        >
                          <div className="text-left">
                            <p className="text-white text-xs font-semibold">{projId.substring(0, 12)}...</p>
                            <p className="text-zinc-500 text-[10px]">{entries.length} imgs</p>
                          </div>
                          <svg
                            className={`w-4 h-4 text-zinc-500 transition-transform ${expandedProjects[projId] ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {expandedProjects[projId] && (
                          <div className="p-2 border-t border-zinc-800">
                            <div className="grid grid-cols-4 gap-1">
                              {entries.map((entry, idx) => (
                                entry.result_image && (
                                  <img
                                    key={entry.id}
                                    src={entry.result_image}
                                    alt={`${idx + 1}`}
                                    className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                                    onClick={() => setViewingImage(entry.result_image)}
                                  />
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* RIGHT CONTROL PANEL - Desktop Only */}
      <div className="hidden lg:block bg-[#121212] border-l border-zinc-800 overflow-y-auto">
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
                <label className="text-zinc-400 text-sm font-semibold flex items-center justify-between">
                  <span>Enter your prompt for RMX ULTRA</span>
                  {projectId && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-mono border border-purple-500/50">
                        {projectId}
                      </span>
                    </div>
                  )}
                </label>
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
                    className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-semibold h-12"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
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
                    <span className="text-cyan-400">Generating image {completedImages + 1}/10</span>
                    <span className="text-zinc-500">{completedImages}/10</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${(completedImages / 10) * 100}%` }}
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
              <div className="bg-black border border-zinc-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <Info className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="text-zinc-300 font-semibold text-sm">RMX ULTRA Features:</h4>
                    <ul className="text-zinc-400 text-xs space-y-1 list-disc pl-4">
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
              {Object.keys(projectGroups).length === 0 ? (
                <div className="bg-zinc-900 rounded-lg p-4 text-center">
                  <p className="text-zinc-500 text-xs">No projects yet</p>
                </div>
              ) : (
                Object.entries(projectGroups).map(([projId, entries]) => (
                  <div key={projId} className="bg-zinc-900 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleProject(projId)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800 transition-colors"
                    >
                      <div className="text-left">
                        <p className="text-white text-xs font-semibold">Project {projId}</p>
                        <p className="text-zinc-500 text-[10px]">{entries.length} images</p>
                      </div>
                      <svg
                        className={`w-4 h-4 text-zinc-500 transition-transform ${expandedProjects[projId] ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {expandedProjects[projId] && (
                      <div className="p-3 border-t border-zinc-800 space-y-2">
                        <Button
                          onClick={() => handleDownloadAll(entries.map(e => e.result_image))}
                          className="w-full bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50 h-8 text-xs"
                        >
                          <svg className="w-3 h-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download All ({entries.length})
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          {entries.map((entry, idx) => (
                            entry.result_image && (
                              <img
                                key={entry.id}
                                src={entry.result_image}
                                alt={`Result ${idx + 1}`}
                                className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setViewingImage(entry.result_image)}
                              />
                            )
                          ))}
                        </div>
                      </div>
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