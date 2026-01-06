import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { X, Sparkles, Loader2, Lock, Shirt, User, Upload, Image as ImageIcon, Send, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ImageCropModal from "./ImageCropModal";

export default function RemixImageModal({ imageUrl, onClose, onSave }) {
  const navigate = useNavigate();
  const [remixPrompt, setRemixPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [faceLocked, setFaceLocked] = useState(true);
  const [clothingEditable, setClothingEditable] = useState(true);
  const [postureEditable, setPostureEditable] = useState(true);
  const [uploadedImage, setUploadedImage] = useState(imageUrl);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [startImage, setStartImage] = useState(null);
  const [endImage, setEndImage] = useState(null);
  const [uploadingStart, setUploadingStart] = useState(false);
  const [uploadingEnd, setUploadingEnd] = useState(false);
  const [generatingStart, setGeneratingStart] = useState(false);
  const [generatingEnd, setGeneratingEnd] = useState(false);
  const [pushingToFeed, setPushingToFeed] = useState(false);
  const [additionalReferenceImages, setAdditionalReferenceImages] = useState([]);
  const [uploadingAdditionalImage, setUploadingAdditionalImage] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState(null);

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

  const handleStartImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingStart(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setStartImage(file_url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload start image");
    } finally {
      setUploadingStart(false);
    }
  };

  const handleEndImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEnd(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEndImage(file_url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload end image");
    } finally {
      setUploadingEnd(false);
    }
  };

  const handleAdditionalImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAdditionalImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAdditionalReferenceImages([...additionalReferenceImages, file_url]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload additional image");
    } finally {
      setUploadingAdditionalImage(false);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if the pasted item is an image
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        setUploadingAdditionalImage(true);
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          setAdditionalReferenceImages([...additionalReferenceImages, file_url]);
        } catch (err) {
          console.error("Upload failed:", err);
          alert("Failed to upload pasted image");
        } finally {
          setUploadingAdditionalImage(false);
        }
        break;
      }
    }
  };

  const handleGenerateStartImage = async () => {
    if (!uploadedImage) {
      alert("Please upload a reference image first");
      return;
    }

    setGeneratingStart(true);
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: "Create a simplified, base version of this image. Reduce detail and styling while keeping the core structure, pose, and composition. Make it more neutral and unadorned as a starting point for transformation.",
        existing_image_urls: [uploadedImage]
      });

      if (response?.url) {
        setStartImage(response.url);
      }
    } catch (err) {
      console.error("Failed to generate start image:", err);
      alert("Failed to generate start image: " + err.message);
    } finally {
      setGeneratingStart(false);
    }
  };

  const handleGenerateEndImage = async () => {
    if (!uploadedImage) {
      alert("Please upload a reference image first");
      return;
    }

    setGeneratingEnd(true);
    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: "Create an enhanced, stylized version of this image. Add more artistic details, dramatic effects, and refined aesthetics while keeping the core identity and structure. Make it more polished and visually striking.",
        existing_image_urls: [uploadedImage]
      });

      if (response?.url) {
        setEndImage(response.url);
      }
    } catch (err) {
      console.error("Failed to generate end image:", err);
      alert("Failed to generate end image: " + err.message);
    } finally {
      setGeneratingEnd(false);
    }
  };

  const handlePushToFeed = () => {
    // Collect all available images
    const images = [];
    if (uploadedImage) images.push(uploadedImage);
    if (startImage) images.push(startImage);
    if (endImage) images.push(endImage);

    if (images.length === 0) {
      alert("Please upload or generate at least one image first");
      return;
    }

    // Store images in sessionStorage for Feed page to pick up
    sessionStorage.setItem('remix_feed_images', JSON.stringify(images));
    sessionStorage.setItem('remix_feed_caption', remixPrompt || 'AI Remix Transformation');
    
    // Navigate to Feed page
    navigate(createPageUrl('Feed'));
    onClose();
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
        // Check if user wants a style transformation (anime, pixel art, etc.)
        const lowerPrompt = remixPrompt.toLowerCase();
        const isStyleTransformation = lowerPrompt.includes('anime') || lowerPrompt.includes('cartoon') || 
                                      lowerPrompt.includes('pixel') || lowerPrompt.includes('3d') || 
                                      lowerPrompt.includes('version') || lowerPrompt.includes('style') ||
                                      lowerPrompt.includes('painting') || lowerPrompt.includes('sketch') ||
                                      lowerPrompt.includes('ghibli') || lowerPrompt.includes('cyberpunk') ||
                                      lowerPrompt.includes('manga') || lowerPrompt.includes('comic');
        
        if (isStyleTransformation) {
          // Style transformation mode with enhanced keywords
          const styleMap = {
            'anime': 'Japanese anime art style with large expressive eyes, clean cell-shaded coloring, smooth vibrant colors, and anime facial proportions',
            'ghibli': 'Studio Ghibli animation style with soft watercolor textures, gentle lighting, whimsical atmosphere, and characteristic hand-drawn charm',
            'pixel': 'retro pixel art style with 16-bit or 32-bit game graphics, limited color palette, and blocky pixelated aesthetic',
            'manga': 'black and white manga illustration with dynamic ink linework, dramatic screentone shading, and expressive Japanese comic style',
            'comic': 'American comic book art with bold ink outlines, vibrant flat colors, halftone shading, and superhero comic aesthetic',
            'cyberpunk': 'dark cyberpunk anime with neon accets, futuristic tech elements, noir atmosphere, and edgy sci-fi style',
            'pixar': '3D Pixar animation style with smooth 3D rendering, exaggerated friendly features, warm lighting, and cinematic quality',
            'painting': 'classical oil painting with visible brush strokes, rich layered colors, soft lighting, and fine art portrait aesthetic',
            'cartoon': 'Western cartoon style with simplified bold features, thick outlines, bright saturated colors, and playful design',
            'sketch': 'pencil sketch drawing with soft graphite shading, detailed linework, and traditional hand-drawn aesthetic',
            'watercolor': 'watercolor painting with soft color bleeds, transparent layers, organic textures, and artistic brush marks'
          };

          let styleDescription = '';
          for (const [keyword, description] of Object.entries(styleMap)) {
            if (lowerPrompt.includes(keyword)) {
              styleDescription = description;
              break;
            }
          }

          if (styleDescription) {
            detailedPrompt = `Transform the subject in the reference image into ${styleDescription}. CRITICAL PRESERVATION: Maintain the core identity, structure, composition, and key elements from the reference. If it's a person, preserve their face and features. If it's a UI/logo/object, preserve its shape and design elements. ONLY change the visual art style and rendering technique. CAMERA ANGLE & SPATIAL UNDERSTANDING: Respect the perspective, angle, and 3D orientation of the subject. If merging features from multiple references, place them correctly in 3D space. LOCALIZED EDITING & TYPOGRAPHY: When user specifies editing a specific area (logo, text, background), focus ONLY on that part. Understand special characters - backwards K means horizontally mirrored K (К), reversed letters should be properly rendered. For UI/interface images, preserve the layout and structure while applying style changes. Professional high-quality result.`;
          } else {
            detailedPrompt = `Transform the subject into ${remixPrompt}. CRITICAL PRESERVATION: Maintain the core structure, composition, and identity of the subject from the reference. Whether it's a person, UI design, logo, or object - preserve the essential elements while applying changes. SPATIAL UNDERSTANDING: Respect the perspective, camera angle, and 3D orientation. When merging features from references, place them correctly in 3D space matching the subject's orientation. LOCALIZED EDITING & TYPOGRAPHY: When user specifies editing a specific area (logo, text, background), focus changes ONLY on that part. Understand special characters - backwards K means horizontally mirrored K (К), reversed letters should be properly rendered as requested. High quality professional result.`;
          }

          // Add start/end image guidance
          if (startImage && endImage) {
            detailedPrompt += ` Use the start image as the initial visual state and the end image as the target final state. Create a transformation that progresses from start to end while maintaining identity.`;
          } else if (startImage) {
            detailedPrompt += ` Use the start image as the base visual state to begin the transformation.`;
          } else if (endImage) {
            detailedPrompt += ` Use the end image as the target visual state for the transformation.`;
          }
        } else {
          // Standard remix mode - edit specific elements
          const basePrompt = `Transform the reference image: ${remixPrompt}.`;
          
          // Build constraint instructions based on toggles (only for people-focused edits)
          const constraints = [];
          if (faceLocked) {
            constraints.push("If the image contains people, preserve their faces, facial features, and identity");
          }
          if (!clothingEditable) {
            constraints.push("If the image contains people, keep their clothing/outfit unchanged");
          }
          if (!postureEditable) {
            constraints.push("If the image contains people, maintain their pose/posture");
          }
          
          const constraintText = constraints.length > 0 ? constraints.join(". ") + "." : "";
          detailedPrompt = `${basePrompt} ${constraintText} SPATIAL UNDERSTANDING: Respect perspective, camera angles, and 3D orientation (front-facing, 3/4 view, profile, etc.). When merging features from references, place them correctly in 3D space matching the subject's perspective. For faces, eyes should sit in eye sockets; for UI elements, maintain proper alignment and depth. LOCALIZED EDITING & TYPOGRAPHY: When user specifies a specific area (logo, text, coin, background, UI element), focus changes ONLY on that part. Backwards K means horizontally mirrored K (К). For UI/interface images, respect the layout structure. Preserve non-specified elements. High quality, professional, detailed result.`;
        }
      } else {
        // Generate brand new image
        detailedPrompt = `Create an image: ${remixPrompt}. LOCALIZED EDITING: When user specifies changing a particular area, region, or element (e.g., "change the logo", "edit the text", "modify the background"), focus changes ONLY on that specified part while preserving everything else. Understand text and typography instructions including special characters like backwards/reversed letters (e.g., backwards K should be К or mirrored K). Ensure there are no UI elements, buttons, or interface controls in the final image. High quality, professional, detailed digital art.`;
      }

      console.log('🎨 Generating image with prompt:', detailedPrompt);
      
      // Collect all image references
      const imageUrls = [];
      if (uploadedImage) imageUrls.push(uploadedImage);
      if (startImage) imageUrls.push(startImage);
      if (endImage) imageUrls.push(endImage);
      if (additionalReferenceImages.length > 0) {
        imageUrls.push(...additionalReferenceImages);
      }
      
      const response = await base44.integrations.Core.GenerateImage({
        prompt: detailedPrompt,
        ...(imageUrls.length > 0 && { existing_image_urls: imageUrls })
      });

      console.log('✅ Generated image:', response);

      if (response?.url) {
        // Save learning data for AI improvement
        try {
          await base44.entities.RemixAILearning.create({
            user_prompt: remixPrompt,
            detailed_prompt: detailedPrompt,
            reference_images: imageUrls,
            result_image: response.url,
            was_successful: true,
            style_type: isStyleTransformation ? 'style_transformation' : (uploadedImage ? 'localized_edit' : 'new_generation')
          });
        } catch (err) {
          console.log('Failed to save learning data:', err);
        }

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
      
      // Save failure data for learning
      try {
        await base44.entities.RemixAILearning.create({
          user_prompt: remixPrompt,
          detailed_prompt: detailedPrompt,
          reference_images: imageUrls,
          was_successful: false,
          error_message: err.message || 'Unknown error'
        });
      } catch (saveErr) {
        console.log('Failed to save error data:', saveErr);
      }
      
      alert(`Failed to generate remix: ${err.message || 'Unknown error'}. Please try again with a different description.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    "anime version",
    "Studio Ghibli style",
    "pixel art version",
    "cyberpunk anime style",
    "manga ink drawing",
    "3D Pixar character",
    "oil painting portrait",
    "comic book style"
  ];

  return (
    <>
      {showCropModal && cropImageUrl && (
        <ImageCropModal
          imageUrl={cropImageUrl}
          onClose={() => {
            setShowCropModal(false);
            setCropImageUrl(null);
          }}
          onSave={async (blob) => {
            const file = new File([blob], 'cropped.png', { type: 'image/png' });
            try {
              const { file_url } = await base44.integrations.Core.UploadFile({ file });
              setUploadedImage(file_url);
              setShowCropModal(false);
              setCropImageUrl(null);
            } catch (err) {
              console.error('Failed to upload cropped image:', err);
              alert('Failed to save cropped image');
            }
          }}
        />
      )}
      
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
              onClick={handlePushToFeed}
              disabled={pushingToFeed || (!uploadedImage && !startImage && !endImage)}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden hover:scale-105 transition-transform bg-gradient-to-br from-cyan-500 to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Push to Feed"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
            
            <button
              onClick={() => {
                const imageParam = uploadedImage ? `?image=${encodeURIComponent(uploadedImage)}` : '';
                navigate(createPageUrl('TikTokWorkflow') + imageParam);
                onClose();
              }}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden hover:scale-105 transition-transform group"
              title="TikTok Workflow Generator"
            >
              <div className="absolute inset-0 bg-black" />
              <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="tiktok-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#25F4EE" />
                    <stop offset="100%" stopColor="#FE2C55" />
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
            {/* Left Column: Image Uploads */}
            <div className="space-y-4">
              {/* Reference Image */}
              <div>
                <div className="text-white/60 text-sm mb-3 font-semibold">
                  {uploadedImage ? "Reference Image" : "Upload Reference Image"}
                </div>
                {uploadedImage ? (
                  <div className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
                    <div 
                      onClick={() => {
                        setCropImageUrl(uploadedImage);
                        setShowCropModal(true);
                      }}
                      className="relative cursor-pointer overflow-hidden group/img"
                    >
                      <img
                        src={uploadedImage}
                        alt="Reference"
                        className="w-full h-auto object-contain max-h-[200px] hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-center pb-2">
                        <span className="text-white text-xs font-semibold">Click to edit</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCropImageUrl(uploadedImage);
                        setShowCropModal(true);
                      }}
                      className="absolute top-2 left-2 w-8 h-8 bg-cyan-500/80 hover:bg-cyan-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="relative bg-white/5 border-2 border-dashed border-white/20 rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all h-[200px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingFile}
                    />
                    {uploadingFile ? (
                      <>
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                        <p className="text-white/60 text-xs">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-white/40 mb-2" />
                        <p className="text-white/80 text-sm font-semibold mb-1">Upload</p>
                        <p className="text-white/40 text-xs">Main reference</p>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Start Image Endpoint */}
              <div>
                <div className="text-white/60 text-sm mb-3 font-semibold flex items-center gap-2">
                  <span>Start Image</span>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Optional</span>
                </div>
                {startImage ? (
                  <div className="relative bg-white/5 border border-green-500/30 rounded-xl overflow-hidden group">
                    <img
                      src={startImage}
                      alt="Start"
                      className="w-full h-auto object-contain max-h-[160px]"
                    />
                    <button
                      onClick={() => setStartImage(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="relative bg-white/5 border-2 border-dashed border-green-500/30 rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-green-500/5 transition-all h-[120px]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStartImageUpload}
                        className="hidden"
                        disabled={uploadingStart}
                      />
                      {uploadingStart ? (
                        <>
                          <Loader2 className="w-6 h-6 text-green-400 animate-spin mb-2" />
                          <p className="text-white/60 text-xs">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-green-400/60 mb-2" />
                          <p className="text-white/80 text-xs font-semibold mb-1">Upload Start</p>
                          <p className="text-white/40 text-[10px] text-center px-4">Initial visual state</p>
                        </>
                      )}
                    </label>
                    <Button
                      onClick={handleGenerateStartImage}
                      disabled={generatingStart || !uploadedImage}
                      className="w-full bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 h-8 text-xs"
                    >
                      {generatingStart ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* End Image Endpoint */}
              <div>
                <div className="text-white/60 text-sm mb-3 font-semibold flex items-center gap-2">
                  <span>End Image</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Optional</span>
                </div>
                {endImage ? (
                  <div className="relative bg-white/5 border border-blue-500/30 rounded-xl overflow-hidden group">
                    <img
                      src={endImage}
                      alt="End"
                      className="w-full h-auto object-contain max-h-[160px]"
                    />
                    <button
                      onClick={() => setEndImage(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="relative bg-white/5 border-2 border-dashed border-blue-500/30 rounded-xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-blue-500/5 transition-all h-[120px]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEndImageUpload}
                        className="hidden"
                        disabled={uploadingEnd}
                      />
                      {uploadingEnd ? (
                        <>
                          <Loader2 className="w-6 h-6 text-blue-400 animate-spin mb-2" />
                          <p className="text-white/60 text-xs">Uploading...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-blue-400/60 mb-2" />
                          <p className="text-white/80 text-xs font-semibold mb-1">Upload End</p>
                          <p className="text-white/40 text-[10px] text-center px-4">Target visual state</p>
                        </>
                      )}
                    </label>
                    <Button
                      onClick={handleGenerateEndImage}
                      disabled={generatingEnd || !uploadedImage}
                      className="w-full bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 h-8 text-xs"
                    >
                      {generatingEnd ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Controls */}
            <div className="space-y-4">
              <div className="text-white/60 text-sm mb-3 font-semibold flex items-center justify-between">
                <span>{uploadedImage ? "Remix Options" : "Generation Options"}</span>
                {(startImage || endImage) && (
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">
                    Transformation Mode Active
                  </span>
                )}
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
                <label className="text-white/60 text-sm mb-2 block flex items-center justify-between">
                  <span>{uploadedImage 
                    ? "Describe the style you want"
                    : "Describe What You Want to Create"
                  }</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAdditionalImageUpload}
                    className="hidden"
                    id="additional-image-upload"
                    disabled={uploadingAdditionalImage}
                  />
                  <label
                    htmlFor="additional-image-upload"
                    className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      uploadingAdditionalImage 
                        ? 'bg-white/5 text-white/40 cursor-not-allowed'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {uploadingAdditionalImage ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3" />
                        <span>Add Image</span>
                      </>
                    )}
                  </label>
                </label>

                {/* Additional Images Preview */}
                {additionalReferenceImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {additionalReferenceImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 group">
                        <img
                          src={imgUrl}
                          alt={`Additional ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setAdditionalReferenceImages(additionalReferenceImages.filter((_, i) => i !== idx))}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Textarea
                  value={remixPrompt}
                  onChange={(e) => setRemixPrompt(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={uploadedImage 
                    ? "e.g., anime version, Studio Ghibli style, pixel art, wearing red jacket..."
                    : "e.g., a futuristic cyberpunk warrior in neon city, digital art masterpiece..."
                  }
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/30 h-32 resize-none"
                />
                <p className="text-white/40 text-xs mt-2">
                  {uploadedImage 
                    ? "Transform into any style (anime, cartoon, painting, etc.) or change clothing, pose, background."
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
    </>
  );
}