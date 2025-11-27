import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Eye, Clock, TrendingUp, X, Maximize2, Minimize2 } from "lucide-react";

export default function TTTVWidget({ videos }) {
  const [playingVideo, setPlayingVideo] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleVideoClick = (videoId) => {
    setPlayingVideo(videoId);
    setIsExpanded(false);
  };

  const handleClose = () => {
    setPlayingVideo(null);
    setIsExpanded(false);
  };

  const formatViews = (views) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views;
  };

  return (
    <div className="w-full bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-black/60 px-4 py-3 border-b border-purple-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
            <span className="text-black font-black text-sm">TV</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">TTTV</h3>
            <p className="text-xs text-gray-400">{videos.length} trending videos</p>
          </div>
        </div>
        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
          <TrendingUp className="w-3 h-3 mr-1" />
          Live
        </Badge>
      </div>

      {/* Video Player (when playing) */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: isExpanded ? 500 : 280, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-black border-b border-purple-500/20 overflow-hidden"
          >
            <div className="relative w-full h-full">
              <iframe
                src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
              
              {/* Player Controls Overlay */}
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  onClick={() => setIsExpanded(!isExpanded)}
                  size="sm"
                  className="bg-black/80 hover:bg-black/90 text-white h-8 w-8 p-0 rounded-lg border border-white/20"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={handleClose}
                  size="sm"
                  className="bg-black/80 hover:bg-black/90 text-white h-8 w-8 p-0 rounded-lg border border-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Grid - Compact 2-column layout */}
      <div className="p-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-black/20">
        <div className="grid grid-cols-2 gap-3">
          {videos.map((video, idx) => (
            <motion.div
              key={video.id || idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleVideoClick(video.video_id)}
              className="group cursor-pointer"
            >
              <Card className="bg-black/80 border-purple-500/20 hover:border-cyan-500/50 transition-all overflow-hidden h-full">
                {/* Thumbnail */}
                <div className="relative w-full aspect-video overflow-hidden">
                  <img 
                    src={video.thumbnail || `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 text-black ml-1" fill="black" />
                    </div>
                  </div>
                  
                  {/* Duration badge */}
                  {video.duration && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/90 px-1.5 py-0.5 rounded text-[10px] text-white font-bold">
                      {video.duration}
                    </div>
                  )}

                  {/* Category badge */}
                  <div className="absolute top-1.5 left-1.5">
                    <Badge className="bg-purple-500/80 text-white border-0 text-[9px] px-1.5 py-0.5">
                      {video.category}
                    </Badge>
                  </div>
                </div>

                {/* Info - Compact */}
                <div className="p-2">
                  <h4 className="text-white font-semibold text-xs mb-1 line-clamp-2 group-hover:text-cyan-400 transition-colors leading-tight">
                    {video.title}
                  </h4>
                  
                  {video.is_trending && (
                    <Badge className="bg-red-500/20 text-red-300 border-0 text-[8px] px-1.5 py-0">
                      <TrendingUp className="w-2 h-2 mr-0.5" />
                      Hot
                    </Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/60 px-4 py-2 border-t border-purple-500/20 text-center">
        <p className="text-[10px] text-gray-500">
          {playingVideo ? '🎬 Now playing' : '💡 Click any video to watch'}
        </p>
      </div>
    </div>
  );
}