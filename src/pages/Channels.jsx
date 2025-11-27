import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Video, Users, Play, Eye, TrendingUp, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ChannelsPage() {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Get all posts with videos
      const allPosts = await base44.entities.Post.list('-created_date', 500);
      
      // Group by author
      const channelMap = new Map();
      
      allPosts.forEach(post => {
        if (post.media_files?.some(m => m.type === 'video') || post.image_url) {
          const authorKey = post.author_wallet_address || post.created_by;
          
          if (!channelMap.has(authorKey)) {
            channelMap.set(authorKey, {
              author_name: post.author_name,
              author_wallet_address: post.author_wallet_address,
              author_agent_zk_id: post.author_agent_zk_id,
              created_by: post.created_by,
              videos: [],
              totalLikes: 0,
              totalViews: 0
            });
          }
          
          const channel = channelMap.get(authorKey);
          channel.videos.push(post);
          channel.totalLikes += (post.likes || 0);
          channel.totalViews += (post.views || 0);
        }
      });

      const channelsList = Array.from(channelMap.values())
        .sort((a, b) => b.videos.length - a.videos.length);
      
      setChannels(channelsList);
    } catch (err) {
      console.error('Failed to load channels:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChannels = channels.filter(channel => 
    searchQuery.trim() === '' || 
    channel.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.author_agent_zk_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChannelThumbnail = (channel) => {
    const latestVideo = channel.videos[0];
    if (latestVideo?.media_files?.length > 0) {
      return latestVideo.media_files[0].url;
    }
    return latestVideo?.image_url;
  };

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
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/50">
                <Video className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">TTT Channels</h1>
                <p className="text-white/60 text-sm">Discover creators and their content</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search channels..."
                className="pl-12 bg-white/5 border-white/10 text-white h-14 text-base"
              />
            </div>

            {/* My Channel Button */}
            {user && (
              <Link to={createPageUrl("MyChannel")}>
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-12">
                  <Sparkles className="w-5 h-5 mr-2" />
                  My Channel
                </Button>
              </Link>
            )}
          </motion.div>

          {/* Channels Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChannels.map((channel, index) => (
              <motion.div
                key={channel.created_by}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={createPageUrl("Channel") + "?creator=" + encodeURIComponent(channel.created_by)}>
                  <Card className="backdrop-blur-xl bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all group cursor-pointer overflow-hidden">
                    <CardContent className="p-0">
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-gradient-to-br from-cyan-500/20 to-purple-500/20 overflow-hidden">
                        {getChannelThumbnail(channel) ? (
                          <>
                            <img
                              src={getChannelThumbnail(channel)}
                              alt={channel.author_name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-16 h-16 text-white/20" />
                          </div>
                        )}
                        
                        {/* Play Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-white ml-1" />
                          </div>
                        </div>

                        {/* Video Count Badge */}
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                          <Video className="w-3 h-3 text-white" />
                          <span className="text-xs text-white font-bold">{channel.videos.length}</span>
                        </div>
                      </div>

                      {/* Channel Info */}
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 bg-white/10 border-2 border-white/20 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            {channel.author_name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-base truncate group-hover:text-cyan-400 transition-colors">
                              {channel.author_name}
                            </h3>
                            {channel.author_agent_zk_id && (
                              <p className="text-xs text-white/40 font-mono truncate">
                                {channel.author_agent_zk_id}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <div className="flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            <span>{channel.videos.length} videos</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{channel.totalLikes} likes</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {filteredChannels.length === 0 && (
            <div className="text-center py-20">
              <Video className="w-20 h-20 text-white/20 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Channels Found</h2>
              <p className="text-white/60">
                {searchQuery ? 'Try a different search term' : 'Be the first to create content!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}