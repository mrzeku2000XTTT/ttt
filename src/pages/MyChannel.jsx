import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, Loader2, TrendingUp, Eye, Heart, MessageCircle,
  Edit2, Trash2, Upload, BarChart3, Users, Sparkles, Plus,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatDistanceToNow } from "date-fns";

export default function MyChannelPage() {
  const [user, setUser] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const allPosts = await base44.entities.Post.filter({
        created_by: currentUser.email
      });

      setMyPosts(allPosts.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      ));
    } catch (err) {
      console.error('Failed to load channel:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this video?')) return;

    try {
      await base44.entities.Post.delete(postId);
      setMyPosts(myPosts.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete post');
    }
  };

  const videoPosts = myPosts.filter(p => 
    p.media_files?.some(m => m.type === 'video') || p.image_url
  );

  const totalLikes = myPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = myPosts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
  const totalTips = myPosts.reduce((sum, p) => sum + (p.tips_received || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to={createPageUrl("Channels")}>
              <Button variant="ghost" className="mb-4 text-white/60 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Channels
              </Button>
            </Link>

            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <div className="w-14 h-14 bg-black rounded-lg flex items-center justify-center text-xl font-bold text-white">
                    {user?.username?.[0]?.toUpperCase() || user?.email[0].toUpperCase()}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {user?.username || 'My Channel'}
                  </h1>
                  <p className="text-white/60 text-sm">Creator Dashboard</p>
                </div>
              </div>

              <Link to={createPageUrl("Feed")}>
                <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-white/60 mb-2">
                    <Video className="w-4 h-4" />
                    <span className="text-xs">Videos</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{videoPosts.length}</div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-400/60 mb-2">
                    <Heart className="w-4 h-4" />
                    <span className="text-xs text-white/60">Likes</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{totalLikes}</div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-cyan-400/60 mb-2">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-xs text-white/60">Comments</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{totalComments}</div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-400/60 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs text-white/60">Tips (KAS)</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{totalTips.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Videos Grid */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              Your Videos
            </h2>

            {videoPosts.length === 0 ? (
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <Upload className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Videos Yet</h3>
                  <p className="text-white/60 mb-6">Start creating content to grow your channel</p>
                  <Link to={createPageUrl("Feed")}>
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Upload First Video
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videoPosts.map((post, index) => {
                  const mediaUrl = post.media_files?.[0]?.url || post.image_url;
                  const mediaType = post.media_files?.[0]?.type || 'image';

                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:border-cyan-500/50 transition-all group overflow-hidden">
                        <CardContent className="p-0">
                          {/* Thumbnail */}
                          <div className="relative aspect-video bg-black overflow-hidden">
                            {mediaType === 'video' ? (
                              <video
                                src={mediaUrl}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <img
                                src={mediaUrl}
                                alt="Post"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            
                            {/* Actions */}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => handleDeletePost(post.id)}
                                size="sm"
                                variant="ghost"
                                className="bg-black/70 hover:bg-red-500/70 text-white h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-4">
                            <p className="text-white text-sm mb-2 line-clamp-2">
                              {post.content || 'No description'}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-white/60 mb-2">
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                <span>{post.likes || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                <span>{post.comments_count || 0}</span>
                              </div>
                              {post.tips_received > 0 && (
                                <div className="flex items-center gap-1 text-green-400">
                                  <Sparkles className="w-3 h-3" />
                                  <span>{post.tips_received.toFixed(2)} KAS</span>
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-white/40">
                              {formatDistanceToNow(new Date(post.created_date), { addSuffix: true })}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}