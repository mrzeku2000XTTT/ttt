import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Send, Heart, MessageCircle, Loader2, X, Image as ImageIcon, Sparkles, Bot, Plus, Trash2, Edit2 } from "lucide-react";
import AgentSettingsModal from "@/components/st/AgentSettingsModal";

export default function StPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState(10);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAgentSettings, setShowAgentSettings] = useState(false);
  const fileInputRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    loadData();
    setupInfiniteScroll();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const allPosts = await base44.entities.Post.list('-created_date', 100);
      const stPosts = allPosts.filter(p => p.content?.includes('#StCreative') || p.author_name === 'St. Creative');
      setPosts(stPosts);
    } catch (err) {
      console.log("User not logged in or failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  const setupInfiniteScroll = () => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visiblePosts < posts.length) {
          setVisiblePosts(prev => Math.min(prev + 10, posts.length));
        }
      },
      { threshold: 0.5 }
    );
  };

  useEffect(() => {
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel && observerRef.current) {
      observerRef.current.observe(sentinel);
    }
    return () => observerRef.current?.disconnect();
  }, [visiblePosts, posts.length]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('Image must be under 20MB');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedImage(file_url);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() && !uploadedImage) {
      alert('Please enter content or upload an image');
      return;
    }

    setIsPosting(true);
    try {
      const postData = {
        content: newPost.trim() + '\n\n#StCreative',
        author_name: user?.username || 'St. Creative',
        author_wallet_address: user?.created_wallet_address || '',
        author_role: user?.role || 'user',
        likes: 0,
        comments_count: 0
      };

      if (uploadedImage) {
        postData.media_files = [{
          url: uploadedImage,
          type: 'image',
          name: 'image.png',
          size: 0
        }];
      }

      await base44.entities.Post.create(postData);
      await loadData();
      setNewPost("");
      setUploadedImage(null);
    } catch (err) {
      console.error('Failed to post:', err);
      alert('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!agentPrompt.trim()) {
      alert('Please describe what content you want to generate');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are St. Creative, a professional creative content generator. Create engaging social media content based on this request: ${agentPrompt}`,
        add_context_from_internet: false
      });

      setNewPost(response);
      setAgentPrompt("");
      setShowAdminPanel(false);
    } catch (err) {
      console.error('Failed to generate:', err);
      alert('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLike = async (post) => {
    try {
      const newLikes = (post.likes || 0) + 1;
      await base44.entities.Post.update(post.id, { likes: newLikes });
      setPosts(posts.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return;
    
    try {
      await base44.entities.Post.delete(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const isAdmin = user?.role === 'admin';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-900 to-black">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/3 rounded-full blur-[130px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/0042f30b3_image.png"
              alt="St."
              className="w-16 h-16 object-contain"
            />
            <div>
              <h1 className="text-3xl font-black text-white">St. Creative</h1>
              <p className="text-white/60 text-sm">Premium Creative Content</p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <Bot className="w-4 h-4 mr-2" />
                Quick Gen
              </Button>
              <Button
                onClick={() => setShowAgentSettings(true)}
                variant="outline"
                className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30"
              >
                <Settings className="w-4 h-4 mr-2" />
                Agent Settings
              </Button>
            </div>
          )}
        </motion.div>

        {/* Admin AI Agent Panel */}
        <AnimatePresence>
          {showAdminPanel && isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mb-6"
            >
              <Card className="bg-black border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">AI Content Generator</h3>
                      <p className="text-white/40 text-xs">Admin Only</p>
                    </div>
                  </div>

                  <Textarea
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    placeholder="Describe the content you want to generate..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mb-4"
                  />

                  <div className="flex gap-3">
                    <Button
                      onClick={handleGenerateContent}
                      disabled={isGenerating || !agentPrompt.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowAdminPanel(false)}
                      variant="outline"
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Post */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-black border-white/10">
              <CardContent className="p-6">
                <div className="flex gap-4 mb-4">
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {user.username?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <Textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share your creative work..."
                    className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px]"
                  />
                </div>

                {uploadedImage && (
                  <div className="mb-4 relative">
                    <img src={uploadedImage} alt="Upload" className="w-full max-h-64 object-contain rounded-lg" />
                    <Button
                      onClick={() => setUploadedImage(null)}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 bg-black/80 hover:bg-black border border-white/20"
                    >
                      <X className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      variant="outline"
                      size="sm"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <Button
                    onClick={handlePost}
                    disabled={isPosting || (!newPost.trim() && !uploadedImage)}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    {isPosting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Feed */}
        <div className="space-y-6">
          {posts.slice(0, visiblePosts).map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="bg-black border-white/10 hover:border-white/20 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {post.author_name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{post.author_name || 'Anonymous'}</div>
                        <div className="text-xs text-white/40">
                          {new Date(post.created_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {(user?.email === post.created_by || isAdmin) && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleDelete(post.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400/60 hover:text-red-400 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-white mb-4 whitespace-pre-wrap">
                    {post.content?.replace('#StCreative', '').trim()}
                  </p>

                  {post.media_files?.[0]?.url && (
                    <img
                      src={post.media_files[0].url}
                      alt="Post"
                      className="w-full rounded-lg mb-4 max-h-96 object-contain"
                    />
                  )}

                  <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                    <Button
                      onClick={() => handleLike(post)}
                      variant="ghost"
                      size="sm"
                      className="text-white/40 hover:text-red-400 h-auto p-0"
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      <span className="text-sm">{post.likes || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/40 hover:text-white h-auto p-0"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm">{post.comments_count || 0}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Infinite Scroll Sentinel */}
        {visiblePosts < posts.length && (
          <div id="scroll-sentinel" className="py-8 text-center">
            <Loader2 className="w-6 h-6 text-white/40 animate-spin mx-auto" />
          </div>
        )}

        {posts.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg">No posts yet</p>
            <p className="text-white/20 text-sm">Be the first to share creative content!</p>
          </div>
        )}
      </div>

      {/* Agent Settings Modal */}
      {showAgentSettings && (
        <AgentSettingsModal onClose={() => setShowAgentSettings(false)} />
      )}
    </div>
  );
}