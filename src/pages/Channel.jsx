import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Video, Loader2, Heart, MessageCircle, Sparkles,
  ArrowLeft, Play, TrendingUp, Users, Eye
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatDistanceToNow } from "date-fns";

export default function ChannelPage() {
  const [searchParams] = useSearchParams();
  const creatorEmail = searchParams.get('creator');
  
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (creatorEmail) {
      loadChannel();
    }
  }, [creatorEmail]);

  const loadChannel = async () => {
    setIsLoading(true);
    try {
      const allPosts = await base44.entities.Post.filter({
        created_by: creatorEmail
      });

      const sortedPosts = allPosts.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );

      setPosts(sortedPosts);

      if (sortedPosts.length > 0) {
        setCreator({
          author_name: sortedPosts[0].author_name,
          author_wallet_address: sortedPosts[0].author_wallet_address,
          author_agent_zk_id: sortedPosts[0].author_agent_zk_id
        });
      }
    } catch (err) {
      console.error('Failed to load channel:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const videoPosts = posts.filter(p => 
    p.media_files?.some(m => m.type === 'video') || p.image_url
  );

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Channel not found</p>
          <Link to={createPageUrl("Channels")}>
            <Button className="bg-white/10 hover:bg-white/20">
              Back to Channels
            </Button>
          </Link>
        </div>
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

            {/* Channel Header */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <div className="w-18 h-18 bg-black rounded-lg flex items-center justify-center text-2xl font-bold text-white">
                    {creator.author_name[0].toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    {creator.author_name}
                  </h1>
                  {creator.author_agent_zk_id && (
                    <p className="text-sm text-white/60 font-mono mb-2">
                      {creator.author_agent_zk_id}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      <span>{videoPosts.length} videos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{totalLikes} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{totalComments} comments</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Videos Grid */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              Videos
            </h2>

            {videoPosts.length === 0 ? (
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <Video className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Videos Yet</h3>
                  <p className="text-white/60">This creator hasn't uploaded any videos</p>
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
                      <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:border-cyan-500/50 transition-all group cursor-pointer overflow-hidden">
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
                            
                            {/* Play Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <Play className="w-8 h-8 text-white ml-1" />
                              </div>
                            </div>

                            {post.is_stamped && (
                              <Badge className="absolute top-2 right-2 bg-orange-500/80 text-white border-0">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Stamped
                              </Badge>
                            )}
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