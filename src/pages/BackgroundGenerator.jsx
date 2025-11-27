import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Eye, Check, Settings, Zap, Image as ImageIcon, Upload, Trash2, RefreshCw, Globe, Lock } from "lucide-react";
import { toast } from "sonner";

export default function BackgroundGeneratorPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentBackground, setCurrentBackground] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [quickPrompts] = useState([
    'Dark abstract crypto network with neon blue circuits and digital nodes',
    'Futuristic cyberpunk cityscape with purple and cyan lighting',
    'Minimalist geometric pattern with gradient purple to black',
    'Cosmic nebula with stars and deep space purple atmosphere',
    'Digital matrix rain effect with glowing green code on black',
    'Abstract fluid art with purple, pink and blue liquid metal',
    'High-tech blockchain visualization with connecting golden nodes',
    'Dark minimal waves with subtle cyan glow particles'
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser.role !== 'admin') {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      setIsAdmin(true);
      
      // Load current background from admin user data
      setCurrentBackground(currentUser.marketplace_background_url || '');
      
      // Load previously generated backgrounds
      const savedBackgrounds = currentUser.generated_backgrounds || [];
      setGeneratedImages(savedBackgrounds);
      
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateBackground = async (prompt) => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt or select a quick prompt');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('🎨 Generating background with prompt:', prompt);
      
      const response = await base44.integrations.Core.GenerateImage({
        prompt: `Professional high-quality background image for a modern web application: ${prompt}. Ultra HD, seamless, suitable as full-page background, cinematic lighting, 8K resolution.`
      });

      console.log('✅ Background generated:', response);
      
      if (response.url) {
        const newImage = {
          url: response.url,
          prompt: prompt,
          created_at: new Date().toISOString(),
          id: Date.now().toString()
        };
        
        const updatedImages = [newImage, ...generatedImages].slice(0, 20); // Keep last 20
        setGeneratedImages(updatedImages);
        setSelectedImage(newImage);
        
        // Save to user data
        await base44.auth.updateMe({
          generated_backgrounds: updatedImages
        });
        
        toast.success('Background generated successfully!');
      } else {
        throw new Error('No image URL returned');
      }
      
    } catch (err) {
      console.error('❌ Generation failed:', err);
      toast.error('Failed to generate background: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const publishBackground = async (imageUrl) => {
    const confirmed = confirm('Publish this background to the P2P Marketplace?\n\nThis will update the background for all users.');
    if (!confirmed) return;

    setIsPublishing(true);
    try {
      await base44.auth.updateMe({
        marketplace_background_url: imageUrl
      });
      
      setCurrentBackground(imageUrl);
      toast.success('✅ Background published successfully!');
      
    } catch (err) {
      console.error('❌ Publish failed:', err);
      toast.error('Failed to publish background: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const removeBackground = async () => {
    const confirmed = confirm('Remove the current marketplace background?\n\nThis will reset to default.');
    if (!confirmed) return;

    setIsPublishing(true);
    try {
      await base44.auth.updateMe({
        marketplace_background_url: ''
      });
      
      setCurrentBackground('');
      toast.success('Background removed');
      
    } catch (err) {
      console.error('❌ Remove failed:', err);
      toast.error('Failed to remove background');
    } finally {
      setIsPublishing(false);
    }
  };

  const deleteGeneratedImage = async (imageId) => {
    const confirmed = confirm('Delete this generated background?');
    if (!confirmed) return;

    try {
      const updatedImages = generatedImages.filter(img => img.id !== imageId);
      setGeneratedImages(updatedImages);
      
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
      
      await base44.auth.updateMe({
        generated_backgrounds: updatedImages
      });
      
      toast.success('Background deleted');
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-950 border-zinc-800 max-w-md">
          <CardContent className="p-8 text-center">
            <Lock className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-6">
              This page is restricted to administrators only.
            </p>
            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
              Admin Access Required
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Preview Mode Background */}
      {previewMode && selectedImage && (
        <div 
          className="fixed inset-0 z-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url('${selectedImage.url}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
        </div>
      )}

      {/* Default Background Effects */}
      {!previewMode && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      )}

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    Background Generator
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    AI-Powered P2P Marketplace Backgrounds
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  <Settings className="w-3 h-3 mr-1" />
                  Admin Only
                </Badge>
                {currentBackground && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <Globe className="w-3 h-3 mr-1" />
                    Live Background
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-white mb-1">{generatedImages.length}</div>
                  <div className="text-xs text-gray-400">Generated</div>
                </CardContent>
              </Card>
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-cyan-400 mb-1">
                    {currentBackground ? 'Active' : 'None'}
                  </div>
                  <div className="text-xs text-gray-400">Current BG</div>
                </CardContent>
              </Card>
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-400 mb-1">AI</div>
                  <div className="text-xs text-gray-400">Powered</div>
                </CardContent>
              </Card>
              <Card className="bg-black/80 backdrop-blur-xl border-zinc-800">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-pink-400 mb-1">
                    {previewMode ? 'Preview' : 'Edit'}
                  </div>
                  <div className="text-xs text-gray-400">Mode</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Generator */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-black/80 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    AI Generator
                  </h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      AI Prompt
                    </label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Describe the background you want to generate..."
                      className="bg-white/5 border-white/10 text-white h-24"
                    />
                  </div>

                  <Button
                    onClick={() => generateBackground(aiPrompt)}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-5 h-5 mr-2" />
                        Generate Background
                      </>
                    )}
                  </Button>

                  <div className="border-t border-white/10 pt-4">
                    <label className="text-sm text-gray-400 mb-3 block">
                      Quick Prompts
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {quickPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setAiPrompt(prompt);
                            generateBackground(prompt);
                          }}
                          disabled={isGenerating}
                          className="text-left text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 transition-all"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right: Preview & Controls */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="bg-black/80 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Eye className="w-6 h-6 text-cyan-400" />
                      Preview & Publish
                    </h2>
                    <Button
                      onClick={() => setPreviewMode(!previewMode)}
                      size="sm"
                      variant="outline"
                      className="border-cyan-500/50 text-cyan-400"
                    >
                      {previewMode ? 'Exit Preview' : 'Preview Mode'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedImage ? (
                    <div>
                      <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-purple-500/50 mb-4">
                        <img
                          src={selectedImage.url}
                          alt="Selected Background"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                        {selectedImage.prompt}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => publishBackground(selectedImage.url)}
                          disabled={isPublishing}
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                        >
                          {isPublishing ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Globe className="w-4 h-4 mr-2" />
                          )}
                          Publish to Marketplace
                        </Button>
                        <Button
                          onClick={() => deleteGeneratedImage(selectedImage.id)}
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No background selected</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Generate or select a background
                      </p>
                    </div>
                  )}

                  {currentBackground && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-semibold text-green-400">
                            Current Live Background
                          </span>
                        </div>
                        <Button
                          onClick={removeBackground}
                          disabled={isPublishing}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-green-500/30">
                        <img
                          src={currentBackground}
                          alt="Current Background"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generated Backgrounds Gallery */}
              {generatedImages.length > 0 && (
                <Card className="bg-black/80 backdrop-blur-xl border-white/10 mt-6">
                  <CardHeader>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-400" />
                      Generated Backgrounds ({generatedImages.length})
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                      {generatedImages.map((img) => (
                        <motion.div
                          key={img.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                            selectedImage?.id === img.id
                              ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                          onClick={() => setSelectedImage(img)}
                        >
                          <img
                            src={img.url}
                            alt="Generated Background"
                            className="w-full h-full object-cover"
                          />
                          {currentBackground === img.url && (
                            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}