import React, { createContext, useState, useContext, useEffect } from 'react';

const VideoPlayerContext = createContext();

export function VideoPlayerProvider({ children }) {
  const [videoState, setVideoState] = useState({
    isPlaying: false,
    videoUrl: null,
    videoId: null,
    title: null,
    isMinimized: false,
    isMuted: false
  });

  // Load saved video state on mount
  useEffect(() => {
    const saved = localStorage.getItem('tttv_mini_player');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setVideoState({
          isPlaying: true,
          videoUrl: data.videoUrl,
          videoId: data.videoId,
          title: data.title,
          isMinimized: true,
          isMuted: false
        });
      } catch (err) {
        console.error('Failed to load video state:', err);
      }
    }
  }, []);

  // Save video state when it changes
  useEffect(() => {
    if (videoState.videoUrl && videoState.videoId) {
      localStorage.setItem('tttv_mini_player', JSON.stringify({
        videoUrl: videoState.videoUrl,
        videoId: videoState.videoId,
        title: videoState.title
      }));
    } else {
      localStorage.removeItem('tttv_mini_player');
    }
  }, [videoState.videoUrl, videoState.videoId, videoState.title]);

  return (
    <VideoPlayerContext.Provider value={{ videoState, setVideoState }}>
      {children}
    </VideoPlayerContext.Provider>
  );
}

export const useVideoPlayer = () => {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used within VideoPlayerProvider');
  }
  return context;
};