import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Play, Pause, Heart, Clock, Zap, Loader2, Image as ImageIcon, Video as VideoIcon, Volume2, VolumeX } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function POLFeedPage() {
  const [proofs, setProofs] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [likedProofs, setLikedProofs] = useState(new Set());
  const [playingVideos, setPlayingVideos] = useState(new Set());
  const [mutedVideos, setMutedVideos] = useState(new Set());
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadProofs();
    const interval = setInterval(loadProofs, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadProofs = async () => {
    try {
      const allProofs = await base44.entities.ProofOfLife.list('-created_date', 100);
      setProofs(allProofs);

      const uniqueAddresses = [...new Set(allProofs.map(p => p.wallet_address))];
      const profilesMap = {};

      for (const address of uniqueAddresses) {
        try {
          const agentProfiles = await base44.entities.AgentZKProfile.filter({
            wallet_address: address
          });
          if (agentProfiles.length > 0) {
            profilesMap[address] = agentProfiles[0];
          }
        } catch (err) {
          console.log(`No profile for ${address}`);
        }
      }

      setProfiles(profilesMap);
    } catch (error) {
      console.error('Failed to load proofs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (proof) => {
    if (likedProofs.has(proof.id)) return;

    try {
      await base44.entities.ProofOfLife.update(proof.id, {
        likes: (proof.likes || 0) + 1
      });
      
      setLikedProofs(prev => new Set([...prev, proof.id]));
      setProofs(prev => prev.map(p => 
        p.id === proof.id ? { ...p, likes: (p.likes || 0) + 1 } : p
      ));
    } catch (error) {
      console.error('Failed to like proof:', error);
    }
  };

  const toggleVideoPlay = (proofId, videoRef) => {
    if (playingVideos.has(proofId)) {
      videoRef.pause();
      setPlayingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(proofId);
        return newSet;
      });
    } else {
      videoRef.play();
      setPlayingVideos(prev => new Set([...prev, proofId]));
    }
  };

  const toggleVideoMute = (proofId, videoRef) => {
    if (mutedVideos.has(proofId)) {
      videoRef.muted = false;
      setMutedVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(proofId);
        return newSet;
      });
    } else {
      videoRef.muted = true;
      setMutedVideos(prev => new Set([...prev, proofId]));
    }
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading Proof of Life Feed...</p>
        </div>
      </div>
    );
  }

  const filteredProofs = proofs.filter(p => {
    if (filterType === 'all') return true;
    if (filterType === 'video') return p.media_type === 'video';
    if (filterType === 'photo') return p.media_type === 'photo';
    return true;
  });

  const videoProofs = proofs.filter(p => p.media_type === 'video');
  const photoProofs = proofs.filter(p => p.media_type === 'photo');

  return (
    <div className="min-h-screen bg-black">
      <div className="p-6 md:p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Proof of Life Feed
            </h1>
            <p className="text-gray-500 text-lg mb-4">
              Live visual activity from Agent ZK users
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10">
                <Activity className="w-3 h-3 mr-1" />
                {proofs.length} Total
              </Badge>
              <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10">
                <VideoIcon className="w-3 h-3 mr-1" />
                {videoProofs.length} Videos
              </Badge>
              <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10">
                <ImageIcon className="w-3 h-3 mr-1" />
                {photoProofs.length} Photos
              </Badge>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-2">
              {['all', 'video', 'photo'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    filterType === type
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {type === 'all' && 'All'}
                  {type === 'video' && 'Videos'}
                  {type === 'photo' && 'Photos'}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Feed Grid */}
          {filteredProofs.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {filteredProofs.map((proof, idx) => {
                const profile = profiles[proof.wallet_address];
                const aiCheck = proof.ai_wellness_check;
                const isMuted = mutedVideos.has(proof.id);

                return (
                  <motion.div
                    key={proof.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <Card className="bg-black border-white/10 hover:border-white/20 transition-all group overflow-hidden">
                      <CardContent className="p-0">
                        {/* Media */}
                        <div className="relative aspect-square">
                          {proof.media_type === 'photo' && proof.media_url ? (
                            <img 
                              src={proof.media_url} 
                              alt="Proof" 
                              className="w-full h-full object-cover"
                            />
                          ) : proof.media_type === 'video' && proof.media_url ? (
                            <>
                              <video
                                ref={(ref) => {
                                  if (ref) {
                                    ref.id = `video-${proof.id}`;
                                    ref.muted = isMuted;
                                  }
                                }}
                                src={proof.media_url}
                                className="w-full h-full object-cover"
                                loop
                              />
                              <button
                                onClick={() => {
                                  const videoRef = document.getElementById(`video-${proof.id}`);
                                  if (videoRef) toggleVideoPlay(proof.id, videoRef);
                                }}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
                              >
                                {playingVideos.has(proof.id) ? (
                                  <Pause className="w-12 h-12 text-white" />
                                ) : (
                                  <Play className="w-12 h-12 text-white" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  const videoRef = document.getElementById(`video-${proof.id}`);
                                  if (videoRef) toggleVideoMute(proof.id, videoRef);
                                }}
                                className="absolute bottom-2 right-2 bg-black/80 hover:bg-black rounded-full p-2 transition-all z-10"
                              >
                                {isMuted ? (
                                  <VolumeX className="w-4 h-4 text-white" />
                                ) : (
                                  <Volume2 className="w-4 h-4 text-white" />
                                )}
                              </button>
                              <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                {proof.video_duration}s
                              </div>
                            </>
                          ) : profile?.agent_zk_photo ? (
                            <img 
                              src={profile.agent_zk_photo} 
                              alt={profile.username || 'Agent'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center">
                              <Activity className="w-12 h-12 text-gray-600" />
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex gap-1">
                            {aiCheck?.passed && (
                              <Badge variant="outline" className="bg-black/80 text-white border-white/20 text-xs">
                                OK
                              </Badge>
                            )}
                            {proof.is_premium && (
                              <Badge variant="outline" className="bg-black/80 text-white border-white/20 text-xs">
                                PRO
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              {profile?.username ? (
                                <Link to={createPageUrl("AgentZKProfile") + "?address=" + encodeURIComponent(proof.wallet_address)}>
                                  <p className="font-bold text-white text-sm truncate hover:text-gray-300">
                                    {profile.username}
                                  </p>
                                </Link>
                              ) : (
                                <p className="font-mono text-xs text-gray-500 truncate">
                                  {truncateAddress(proof.wallet_address)}
                                </p>
                              )}
                              {proof.message && (
                                <p className="text-xs text-gray-600 truncate mt-1">
                                  {proof.message}
                                </p>
                              )}
                            </div>

                            <Button
                              onClick={() => handleLike(proof)}
                              disabled={likedProofs.has(proof.id)}
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                            >
                              <Heart 
                                className={`w-4 h-4 ${likedProofs.has(proof.id) ? 'fill-white text-white' : 'text-gray-600'}`} 
                              />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(proof.created_date), { addSuffix: true })}
                            </div>
                            {proof.streak_day && proof.streak_day > 1 && (
                              <span>{proof.streak_day}d</span>
                            )}
                          </div>

                          {aiCheck?.concerns && aiCheck.concerns.length > 0 && (
                            <p className="text-xs text-gray-700 mt-2 line-clamp-1">
                              {aiCheck.concerns.join(', ')}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <Activity className="w-20 h-20 text-gray-800 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Activity Yet</h3>
              <p className="text-gray-500 mb-6">
                {filterType === 'all' 
                  ? 'No proof of life posts yet'
                  : `No ${filterType}s yet`
                }
              </p>
              <Link to={createPageUrl("AgentZKDirectory")}>
                <Button className="bg-white text-black hover:bg-gray-200">
                  Go to Directory
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}