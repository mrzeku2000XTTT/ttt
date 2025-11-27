import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Grid3x3, Globe, Users, Search, Wallet, Bot, ShoppingBag, Upload, Play, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function ToolsPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('Home');
  const [sessionId, setSessionId] = useState('');
  const [videoUrl, setVideoUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showVideoUI, setShowVideoUI] = useState(false);
  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    // Generate unique encrypted session ID
    const generateSessionId = () => {
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 15);
      const hash = btoa(`${timestamp}-${randomStr}`).substring(0, 12).toUpperCase();
      return `ZK-${hash}`;
    };
    setSessionId(generateSessionId());
  }, []);

  const apps = [
    { name: 'TTT', icon: Globe, path: 'Home' },
    { name: 'Feed', icon: Users, path: 'Feed' },
    { name: 'TTTV', icon: Search, path: 'Browser' },
    { name: 'Wallet', icon: Wallet, path: 'Wallet' },
    { name: 'Agent ZK', icon: Bot, path: 'AgentZK' },
    { name: 'Shop', icon: ShoppingBag, path: 'Shop' },
  ];

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setVideoUrl(file_url);
    } catch (error) {
      console.error('Failed to upload video:', error);
      alert('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearVideo = () => {
    setVideoUrl(null);
  };

  const handleToggleVideoUI = () => {
    setShowVideoUI(!showVideoUI);
    if (showVideoUI) {
      setVideoUrl(null);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cyberpunk Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-black to-cyan-900/50" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
      `}</style>

      {/* Phone Cutout Shape - Centered */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <div 
          className="relative pointer-events-auto"
          style={{
            width: '240px',
            height: '500px',
          }}
        >
          {/* Shadow/Glow effect behind phone */}
          <div 
            className="absolute inset-0 rounded-[3rem]"
            style={{
              boxShadow: '0 0 80px 20px rgba(6, 182, 212, 0.3), 0 0 120px 40px rgba(147, 51, 234, 0.2)',
            }}
          />
          
          {/* Dark overlay with phone cutout */}
          <div 
            className="absolute rounded-[3rem]"
            style={{
              inset: '-9999px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
              borderRadius: '3rem',
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            }}
          />
          
          {/* Phone frame */}
          <div 
            className="absolute inset-0 rounded-[3rem] border-[14px] border-zinc-800 bg-black overflow-hidden"
            style={{
              boxShadow: 'inset 0 0 30px rgba(6, 182, 212, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* App content area */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden bg-black">
              {showVideoUI ? (
                /* Video Viewer UI */
                <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                  {videoUrl ? (
                    <video
                      key={videoUrl}
                      src={videoUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain"
                      onError={(e) => console.error('Video error:', e)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-8">
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                        <p className="text-white/60 text-sm">Upload a video to preview</p>
                      </div>
                    </div>
                  )}

                  {/* Video Controls */}
                  <input
                    type="file"
                    accept="video/*"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[101]">
                    <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-full px-3 py-2 flex items-center gap-1 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                        title="Upload Video"
                      >
                        <Upload className="w-4 h-4 text-cyan-400" />
                      </button>

                      {videoUrl && (
                        <>
                          <div className="w-px h-5 bg-white/10" />
                          <button
                            onClick={() => {
                              const video = document.querySelector('video');
                              if (video) video.play();
                            }}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Play"
                          >
                            <Play className="w-4 h-4 text-green-400" />
                          </button>
                          <button
                            onClick={handleClearVideo}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            title="Close Video"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* App Iframe */
                <iframe
                  ref={iframeRef}
                  src={`/#/${currentPage}`}
                  className="border-0 absolute"
                  style={{
                    width: 'calc(100% + 16px)',
                    height: '100%',
                    left: '0px',
                    top: 0
                  }}
                  title="App Preview"
                />
              )}

              {/* Toggle Button & App Switcher */}
              <div className="absolute top-2 left-2 z-[101] flex items-center gap-2">
                {!showVideoUI && (
                  <button
                    onClick={() => {
                      const menu = document.getElementById('app-menu');
                      menu.classList.toggle('hidden');
                    }}
                    className="bg-black/60 backdrop-blur-sm border border-white/20 text-white hover:bg-black/80 rounded-full w-9 h-9 flex items-center justify-center"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={handleToggleVideoUI}
                  className="bg-black/60 backdrop-blur-sm border border-cyan-500/50 text-cyan-400 hover:bg-black/80 rounded-full w-9 h-9 flex items-center justify-center"
                  title={showVideoUI ? "Switch to Apps" : "Switch to Video Viewer"}
                >
                  {showVideoUI ? <Grid3x3 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>

              {/* App Menu */}
              <div
                id="app-menu"
                className="hidden absolute top-14 left-2 z-[101] bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-2 w-48"
              >
                {apps.map((app) => {
                  const Icon = app.icon;
                  return (
                    <button
                      key={app.name}
                      onClick={() => {
                        setCurrentPage(app.path);
                        document.getElementById('app-menu').classList.add('hidden');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-all"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{app.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            </div>

            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-zinc-800 rounded-b-2xl z-10" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                onClick={() => navigate(createPageUrl('Categories'))}
                variant="ghost"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                KASPHONE
              </h1>
            </div>
            <p className="text-white/60 text-lg">Your mobile preview studio</p>
            {sessionId && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="px-4 py-2 bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-lg">
                  <span className="text-cyan-400 text-sm font-mono">Session: {sessionId}</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}