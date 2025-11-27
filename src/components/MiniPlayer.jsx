import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Volume2, VolumeX, Minimize2, Maximize } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useVideoPlayer } from './VideoPlayerContext';

export default function MiniPlayer({ currentPage }) {
  const navigate = useNavigate();
  const { videoState, setVideoState } = useVideoPlayer();
  
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [size, setSize] = useState({ width: 200, height: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const miniplayerRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Load saved position and size
  useEffect(() => {
    try {
      const savedPos = localStorage.getItem('tttv_mini_player_position');
      const savedSize = localStorage.getItem('tttv_mini_player_size');
      
      if (savedPos) setPosition(JSON.parse(savedPos));
      if (savedSize) setSize(JSON.parse(savedSize));
    } catch (err) {
      console.error('Failed to load position/size:', err);
    }
  }, []);

  // DRAGGING LOGIC
  const handleDragStart = (e) => {
    if (isResizing) return;
    e.preventDefault();
    
    const rect = miniplayerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    dragStartRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setIsDragging(true);
    document.body.classList.add('dragging');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  const handleDragMove = (e) => {
    if (!isDragging || isResizing) return;
    e.preventDefault();
    
    requestAnimationFrame(() => {
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      
      // Keep within viewport
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height - 44;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.classList.remove('dragging');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // Save position
    localStorage.setItem('tttv_mini_player_position', JSON.stringify(position));
  };

  // RESIZING LOGIC
  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    };
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nwse-resize';
  };

  const handleResizeMove = (e) => {
    if (!isResizing) return;
    e.preventDefault();
    
    requestAnimationFrame(() => {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;
      
      const newWidth = Math.max(160, Math.min(220, resizeStartRef.current.width + deltaX));
      const newHeight = Math.max(120, Math.min(180, resizeStartRef.current.height + deltaY));
      
      setSize({ width: newWidth, height: newHeight });
    });
  };

  const handleResizeEnd = () => {
    if (!isResizing) return;
    
    setIsResizing(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // Save size
    localStorage.setItem('tttv_mini_player_size', JSON.stringify(size));
  };

  // EVENT LISTENERS
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, size]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing]);

  const handleClose = () => {
    setVideoState({
      isPlaying: false,
      videoUrl: null,
      videoId: null,
      title: null,
      isMinimized: false,
      isMuted: false
    });
  };

  const handleMaximize = () => {
    navigate(createPageUrl('Browser'));
  };

  const handleToggleHide = () => {
    setIsHidden(!isHidden);
  };

  const handleToggleMute = () => {
    setVideoState(prev => ({
      ...prev,
      isMuted: !prev.isMuted
    }));
  };

  // Don't show if no video or on Browser page
  if (!videoState.videoUrl || !videoState.videoId || currentPage === 'Browser') {
    return null;
  }

  const videoUrl = videoState.videoUrl + (videoState.isMuted ? '&mute=1' : '&mute=0');

  return (
    <>
      {/* MAIN PLAYER - Always mounted, hidden off-screen when minimized */}
      <div
        ref={miniplayerRef}
        className="video-miniplayer fixed z-[9999]"
        style={{
          left: isHidden ? '-99999px' : `${position.x}px`,
          top: isHidden ? '-99999px' : `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height + 44}px`,
          visibility: isHidden ? 'hidden' : 'visible',
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          transition: isDragging || isResizing ? 'none' : 'transform 0.1s ease-out',
          boxShadow: isDragging 
            ? '0 20px 50px rgba(6,182,212,0.6)' 
            : '0 10px 30px rgba(6,182,212,0.4)',
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        <div className="bg-black border-2 border-cyan-500 rounded-xl overflow-hidden h-full">
          {/* Header - Drag Handle */}
          <div
            onMouseDown={handleDragStart}
            className="bg-black/95 backdrop-blur-sm px-3 py-2 flex items-center justify-between border-b border-cyan-500/30 cursor-grab active:cursor-grabbing select-none"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-xs font-semibold truncate">
                {videoState.title || 'TTTV'}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMute();
                }}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title={videoState.isMuted ? "Unmute" : "Mute"}
              >
                {videoState.isMuted ? (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleHide();
                }}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Hide (Keep Playing)"
              >
                <Minimize2 className="w-4 h-4 text-cyan-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMaximize();
                }}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Maximize"
              >
                <Maximize2 className="w-4 h-4 text-cyan-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>

          {/* Video Player */}
          <div 
            className="relative w-full bg-black"
            style={{ 
              height: `${size.height}px`,
              pointerEvents: isDragging || isResizing ? 'none' : 'auto'
            }}
          >
            <iframe
              src={videoUrl}
              className="w-full h-full border-0"
              title="TTTV Mini Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Resize Handle */}
          <div
            onMouseDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize group z-10"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(6,182,212,0.5) 50%)',
              borderBottomRightRadius: '0.75rem'
            }}
          >
            <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-cyan-400 group-hover:border-cyan-300 transition-colors" />
          </div>
        </div>
      </div>

      {/* FLOATING WIDGET when hidden */}
      {isHidden && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="fixed z-[9999] bg-black border-2 border-cyan-500 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.6)] cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleDragStart}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            userSelect: 'none'
          }}
        >
          <div className="p-3">
            {!isHovered ? (
              /* Compact Mode */
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <Volume2 className="w-5 h-5 text-cyan-400" />
              </div>
            ) : (
              /* Expanded Mode with Controls */
              <div className="flex items-center gap-3 min-w-[200px]">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-xs font-semibold truncate max-w-[100px]">
                    {videoState.title || 'Playing'}
                  </span>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleMute();
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {videoState.isMuted ? (
                      <VolumeX className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-cyan-400" />
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleHide();
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Maximize className="w-5 h-5 text-cyan-400" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMaximize();
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Maximize2 className="w-5 h-5 text-cyan-400" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose();
                    }}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-500/50 rounded-full" />
        </div>
      )}

      {/* Global Styles */}
      <style jsx global>{`
        .dragging {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }

        .video-miniplayer {
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        body.dragging * {
          cursor: grabbing !important;
        }
      `}</style>
    </>
  );
}