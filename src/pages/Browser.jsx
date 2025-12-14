import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, Home, ExternalLink, Loader2, Youtube, History, Minimize2, Maximize2, Tv } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useVideoPlayer } from "@/components/VideoPlayerContext";

export default function TTTVPage() {
  const [url, setUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recentlyWatched, setRecentlyWatched] = useState([]);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [customVideos, setCustomVideos] = useState([]);
  const [customChannels, setCustomChannels] = useState([]);
  const [channelVideos, setChannelVideos] = useState({});
  const [isFetchingChannel, setIsFetchingChannel] = useState(false);
  const iframeRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { videoState, setVideoState } = useVideoPlayer();

  useEffect(() => {
    loadRecentlyWatched();
    checkForMiniPlayer();
    loadCustomVideos();
    loadCustomChannels();
  }, []);

  const loadCustomVideos = () => {
    try {
      const saved = localStorage.getItem('tttv_custom_videos');
      if (saved) setCustomVideos(JSON.parse(saved));
    } catch (err) {
      console.error('Failed to load custom videos:', err);
    }
  };

  const loadCustomChannels = () => {
    try {
      const saved = localStorage.getItem('tttv_custom_channels');
      if (saved) setCustomChannels(JSON.parse(saved));
    } catch (err) {
      console.error('Failed to load custom channels:', err);
    }
  };

  const handleAddChannel = () => {
    const channelName = prompt("Enter YouTube Channel Name:");
    if (!channelName) return;
    
    if (customChannels.includes(channelName)) {
      alert("Channel already added!");
      return;
    }

    const updated = [channelName, ...customChannels];
    setCustomChannels(updated);
    localStorage.setItem('tttv_custom_channels', JSON.stringify(updated));
    alert(`Channel '${channelName}' added!`);
  };

  const handleAddVideo = () => {
    const videoUrlInput = prompt("Enter YouTube URL to add:");
    if (!videoUrlInput) return;
    
    const vidId = extractVideoId(videoUrlInput);
    if (!vidId) {
      alert("Invalid YouTube URL");
      return;
    }

    const titleInput = prompt("Enter a title for this video:");
    const newVideo = {
      id: vidId,
      title: titleInput || "My Custom Video",
      channel: "Me",
      views: "0"
    };

    const updated = [newVideo, ...customVideos];
    setCustomVideos(updated);
    localStorage.setItem('tttv_custom_videos', JSON.stringify(updated));
    alert("Video added to '✨ My Videos'!");
  };

  const checkForMiniPlayer = () => {
    const miniPlayerData = localStorage.getItem('tttv_mini_player');
    if (miniPlayerData) {
      const data = JSON.parse(miniPlayerData);
      setVideoId(data.videoId);
      setVideoUrl(data.videoUrl);
      setUrl(data.url || '');
    }
  };

  const loadRecentlyWatched = () => {
    try {
      const saved = localStorage.getItem('tttv_recently_watched');
      if (saved) {
        setRecentlyWatched(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load recently watched:', err);
    }
  };

  const saveToRecentlyWatched = (videoId, title) => {
    try {
      const video = {
        id: videoId,
        title: title || 'Untitled Video',
        timestamp: Date.now(),
        thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      };

      const existing = recentlyWatched.filter(v => v.id !== videoId);
      const updated = [video, ...existing].slice(0, 20);
      
      setRecentlyWatched(updated);
      localStorage.setItem('tttv_recently_watched', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save to recently watched:', err);
    }
  };

  const baseVideoLibrary = {
    "🔥 Viral Hits": [
      { id: "dQw4w9WgXcQ", title: "Rick Astley - Never Gonna Give You Up", channel: "Rick Astley", views: "1.4B" },
      { id: "kJQP7kiw5Fk", title: "Luis Fonsi - Despacito ft. Daddy Yankee", channel: "Luis Fonsi", views: "8.1B" },
      { id: "9bZkp7q19f0", title: "PSY - GANGNAM STYLE", channel: "officialpsy", views: "4.8B" },
      { id: "JGwWNGJdvx8", title: "Ed Sheeran - Shape of You", channel: "Ed Sheeran", views: "6.1B" },
      { id: "60ItHLz5WEA", title: "Alan Walker - Faded", channel: "Alan Walker", views: "3.5B" },
    ],
    "🎵 Music Legends": [
      { id: "fJ9rUzIMcZQ", title: "Queen - Bohemian Rhapsody", channel: "Queen Official", views: "2.1B" },
      { id: "OPf0YbXqDm0", title: "Mark Ronson - Uptown Funk ft. Bruno Mars", channel: "Mark Ronson", views: "4.7B" },
      { id: "CevxZvSJLk8", title: "Katy Perry - Roar", channel: "Katy Perry", views: "3.9B" },
      { id: "hLQl3WQQoQ0", title: "Adele - Someone Like You", channel: "Adele", views: "2.1B" },
      { id: "lp-EO5I60KA", title: "Imagine Dragons - Thunder", channel: "ImagineDragons", views: "2.3B" },
    ],
    "🎮 Gaming": [
      { id: "2lAe1cqCOXo", title: "Minecraft - The Story of Minecraft", channel: "Minecraft", views: "150M" },
      { id: "BgpQvfje0Ig", title: "PewDiePie - Best Moments 2023", channel: "PewDiePie", views: "80M" },
      { id: "6n3pFFPSlW4", title: "MrBeast - I Survived 50 Hours In Antarctica", channel: "MrBeast", views: "200M" },
      { id: "Crz3JR8YzEI", title: "Fortnite - Chapter 5", channel: "Fortnite", views: "120M" },
      { id: "KiXZ3a3yFzA", title: "Among Us - Best Plays Compilation", channel: "InnerSloth", views: "90M" },
    ],
    "😂 Comedy": [
      { id: "wWLhrHVySgA", title: "Kevin Hart - Stand Up Comedy", channel: "Kevin Hart", views: "180M" },
      { id: "EhxW_1Io0oU", title: "Key & Peele - Substitute Teacher", channel: "Comedy Central", views: "250M" },
      { id: "VdphvuyaV_I", title: "Dave Chappelle - The Age of Spin", channel: "Netflix", views: "95M" },
      { id: "fC8yl41v278", title: "Saturday Night Live - Best Sketches", channel: "SNL", views: "170M" },
      { id: "9iym331fPek", title: "Bo Burnham - Inside", channel: "Netflix", views: "130M" },
    ],
    "🎬 Movies & Trailers": [
      { id: "sGbxmsDFVnE", title: "Avengers: Endgame - Official Trailer", channel: "Marvel", views: "560M" },
      { id: "TcMBFSGVi1c", title: "Star Wars: The Force Awakens Trailer", channel: "Star Wars", views: "112M" },
      { id: "giXco2jaZ_4", title: "Joker - Final Trailer", channel: "Warner Bros.", views: "87M" },
      { id: "FZ1k8Y_2GFE", title: "Dune - Official Trailer", channel: "Warner Bros.", views: "65M" },
      { id: "JfVOs4VSpmA", title: "Spider-Man: No Way Home Trailer", channel: "Sony Pictures", views: "355M" },
    ],
    "📚 Education": [
      { id: "sDvS4-0QB5E", title: "How Does the Internet Work?", channel: "Code.org", views: "75M" },
      { id: "ww1UsGZHmX0", title: "The Science of Sleep", channel: "AsapSCIENCE", views: "45M" },
      { id: "yAoLSRbwxL8", title: "What If Earth Stopped Spinning?", channel: "Vsauce", views: "89M" },
      { id: "1Nh_vxpycEA", title: "How Engines Work", channel: "Engineering Explained", views: "35M" },
      { id: "ZKpFFD4aX3c", title: "The History of Everything", channel: "Kurzgesagt", views: "67M" },
    ],
    "📈 Stock Market": [
      { id: "Xn7KWR9f0e4", title: "Stock Market Today - Live Analysis", channel: "CNBC" },
      { id: "L0fHf6Jy3kc", title: "Stock Market Crash Coming?", channel: "Meet Kevin" },
      { id: "bC3czKGLHXY", title: "How To Invest For Beginners", channel: "Graham Stephan" },
      { id: "9HmFBgmP4lY", title: "S&P 500 Technical Analysis", channel: "Trading 212" },
      { id: "fvGgfr1SG0k", title: "Wall Street Week Ahead", channel: "Yahoo Finance" },
    ],
    "₿ Crypto & Bitcoin": [
      { id: "s4g1XFU8Gto", title: "Bitcoin Price Prediction 2025", channel: "Coin Bureau" },
      { id: "hbxPFmHPMHE", title: "Ethereum 2.0 Explained", channel: "Finematics" },
      { id: "kubGCSj5y3k", title: "Altcoin Season Coming?", channel: "Crypto Banter" },
      { id: "j2C8MkY7Co8", title: "DeFi Ultimate Guide", channel: "Whiteboard Crypto" },
      { id: "GZXbJ2S3dMY", title: "Bitcoin vs Gold Debate", channel: "Anthony Pompliano" },
    ],
    "🚀 Elon Musk": [
      { id: "DxREm3s1scA", title: "Elon Musk Interview 2024", channel: "Lex Fridman" },
      { id: "PjF2gGGU790", title: "Tesla's Future Plans", channel: "Tesla" },
      { id: "zIwLWfaAg-8", title: "SpaceX Starship Launch", channel: "SpaceX" },
      { id: "HQ_ytw58tAA", title: "Elon on AI and Future", channel: "TED" },
      { id: "OBD-NbMXkk4", title: "Neuralink Demo", channel: "Neuralink" },
    ],
    "🏛️ Donald Trump": [
      { id: "gAIQwTffK8I", title: "Trump Rally 2024", channel: "News Channel" },
      { id: "fmu4d7e9VhM", title: "Trump Interview Latest", channel: "Fox News" },
      { id: "wIK5rE4wF0s", title: "Trump Presidential Campaign", channel: "Political News" },
      { id: "9suHrzvFCWY", title: "Trump on Economy", channel: "CNBC" },
      { id: "OtvWm-GHm9c", title: "Trump Press Conference", channel: "C-SPAN" },
    ],
    "⚔️ War & Conflicts": [
      { id: "rrv6WFRODz0", title: "Ukraine War Latest Update", channel: "BBC News" },
      { id: "OIA_gzqq0_w", title: "Middle East Crisis Analysis", channel: "Al Jazeera" },
      { id: "DZMaxV8o3U0", title: "Global War Monitor", channel: "CNN" },
      { id: "7xg594eAwSA", title: "Geopolitical Tensions Rising", channel: "Sky News" },
      { id: "2134Evw86xM", title: "Military Analysis 2024", channel: "Defense Update" },
    ],
    "🔥 Trending Now": [
      { id: "TvXjYyZikYc", title: "Breaking News Today", channel: "News" },
      { id: "FrI_tFjcqjE", title: "Viral Story of the Week", channel: "Trending" },
      { id: "tsuIxzgBkMU", title: "Most Watched This Month", channel: "Popular" },
      { id: "quuuXBgHU18", title: "Top Headlines", channel: "News Network" },
      { id: "OkW_nYEOUnQ", title: "What's Happening Now", channel: "Live Updates" },
    ],
  };

  const videoLibrary = {
    ...(customVideos.length > 0 ? { "✨ My Videos": customVideos } : {}),
    ...baseVideoLibrary
  };

  const allCategories = [...customChannels, ...Object.keys(videoLibrary)];

  const extractVideoId = (input) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
      /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
      /(?:youtube\.com\/v\/)([^&\n?#]+)/,
      /(?:youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleLoadVideo = async (searchQuery = url, title = null) => {
    const query = searchQuery.trim();
    
    if (!query) return;

    setIsLoading(true);

    const vidId = extractVideoId(query);
    
    if (vidId) {
      console.log('🎥 Loading video:', vidId);
      const embedUrl = `https://www.youtube.com/embed/${vidId}?autoplay=1`;
      
      // Update LOCAL state
      setVideoUrl(embedUrl);
      setVideoId(vidId);
      setUrl(query);
      setSelectedCategory(null);
      setIsMiniPlayer(false);
      
      // Update GLOBAL state for mini player
      setVideoState({
        isPlaying: true,
        videoUrl: embedUrl,
        videoId: vidId,
        title: title || 'YouTube Video',
        isMinimized: false,
        isMuted: false
      });
      
      saveToRecentlyWatched(vidId, title || 'YouTube Video');
      
      setTimeout(() => setIsLoading(false), 1000);
    } else {
      alert('Please enter a valid YouTube URL or video ID');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLoadVideo();
    }
  };

  const handleBack = () => {
    setVideoUrl("");
    setVideoId("");
    setUrl("");
    setIsLoading(false);
    setSelectedCategory(null);
    setIsMiniPlayer(false);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        iframeRef.current.src = currentSrc;
        setTimeout(() => setIsLoading(false), 1000);
      }, 100);
    } else {
      setIsLoading(false);
    }
  };

  const handlePlayVideo = (video) => {
    setUrl(video.id);
    handleLoadVideo(video.id, video.title);
  };

  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    setVideoUrl("");
    setVideoId("");
    setIsMiniPlayer(false);

    // If it's a custom channel (not in static library and not "My Videos")
    if (customChannels.includes(category)) {
      if (!channelVideos[category]) {
        setIsFetchingChannel(true);
        try {
          const response = await base44.functions.invoke('youtubeApiSearch', { query: category });
          if (response.data.success && response.data.videos) {
            const mappedVideos = response.data.videos.map(v => ({
              id: v.videoId,
              title: v.title,
              channel: v.channelName,
              thumbnail: v.thumbnail,
              views: 'New'
            }));
            setChannelVideos(prev => ({ ...prev, [category]: mappedVideos }));
          }
        } catch (err) {
          console.error("Failed to fetch channel videos:", err);
        } finally {
          setIsFetchingChannel(false);
        }
      }
    }
  };

  const getCategoryIcon = (category) => {
    if (customChannels.includes(category)) return <span className="text-lg">📺</span>;
    if (category.includes('Viral')) return <span className="text-lg">🔥</span>;
    if (category.includes('My Videos')) return <span className="text-lg">✨</span>;
    if (category.includes('Music')) return <span className="text-lg">🎵</span>;
    if (category.includes('Gaming')) return <span className="text-lg">🎮</span>;
    if (category.includes('Comedy')) return <span className="text-lg">😂</span>;
    if (category.includes('Movies')) return <span className="text-lg">🎬</span>;
    if (category.includes('Education')) return <span className="text-lg">📚</span>;
    if (category.includes('Stock')) return <span className="text-lg">📈</span>;
    if (category.includes('Crypto')) return <span className="text-lg">₿</span>;
    if (category.includes('Elon')) return <span className="text-lg">🚀</span>;
    if (category.includes('Trump')) return <span className="text-lg">🏛️</span>;
    if (category.includes('War')) return <span className="text-lg">⚔️</span>;
    return <Youtube className="w-5 h-5" />;
  };

  const handleMinimize = () => {
    console.log('📱 Minimizing player...');
    setIsMiniPlayer(true);
    navigate(createPageUrl("Home"));
  };

  // Video Player View
  if (videoUrl && !isMiniPlayer) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="h-32" />
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={handleBack}
              size="sm"
              className="bg-cyan-500/20 border border-cyan-500 hover:bg-cyan-500/30 text-cyan-400 h-9 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all"
            >
              <Home className="w-4 h-4 mr-2 fill-current" />
              <span className="text-xs">Back</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                size="sm"
                className="bg-cyan-500/20 border border-cyan-500 hover:bg-cyan-500/30 text-cyan-400 h-9 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              <Button
                onClick={handleMinimize}
                size="sm"
                className="bg-purple-500/20 border border-purple-500 hover:bg-purple-500/30 text-purple-400 h-9 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all"
              >
                <Minimize2 className="w-4 h-4 mr-2" />
                <span className="text-xs">Minimize</span>
              </Button>

              <a
                href={`https://youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="sm"
                  className="bg-red-500/20 border border-red-500 hover:bg-red-500/30 text-red-400 h-9 shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <span className="text-xs">YouTube</span>
                </Button>
              </a>
            </div>
          </div>

          <div className="relative w-full bg-black rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]" style={{ paddingBottom: '56.25%' }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-10">
                <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={videoUrl}
              title="TTTV Player"
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    );
  }

  // Category Videos View
  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-black p-4">
        <div className="h-32" />
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => setSelectedCategory(null)}
            size="sm"
            className="mb-4 bg-cyan-500/20 border border-cyan-500 hover:bg-cyan-500/30 text-cyan-400 h-9 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all"
          >
            <Home className="w-4 h-4 mr-2 fill-current" />
            <span className="text-xs">Back</span>
          </Button>

          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            {getCategoryIcon(selectedCategory)}
            {selectedCategory}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {isFetchingChannel ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/50">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-cyan-400" />
                <p>Loading channel videos...</p>
              </div>
            ) : (
              (customChannels.includes(selectedCategory) ? (channelVideos[selectedCategory] || []) : videoLibrary[selectedCategory]).map((video) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handlePlayVideo(video)}
                  className="group bg-black border border-cyan-500/30 rounded-lg overflow-hidden cursor-pointer hover:border-cyan-500 transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  <div className="aspect-video bg-black border-b border-cyan-500/20 relative overflow-hidden">
                    <img 
                      src={video.thumbnail || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/30 transition-colors">
                      <Play className="w-12 h-12 text-cyan-400 fill-current opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                    </div>
                    {video.views && (
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-semibold">
                        {video.views} views
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-white font-semibold text-xs mb-1 line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-gray-500 text-[10px] flex items-center gap-1">
                      <Youtube className="w-3 h-3 fill-current" />
                      {video.channel}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
            {!isFetchingChannel && customChannels.includes(selectedCategory) && (!channelVideos[selectedCategory] || channelVideos[selectedCategory].length === 0) && (
              <div className="col-span-full text-center py-20 text-white/50">
                No videos found for this channel.
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Main Browse View
  return (
    <div className="min-h-screen bg-black p-4 md:p-6 relative overflow-hidden">
      <div className="h-32" />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight" style={{
            textShadow: '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.3)'
          }}>
            TTTV
          </h1>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>{Object.values(videoLibrary).flat().length} Videos</span>
            <div className="w-px h-3 bg-cyan-500/50 shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
            <span>{allCategories.length} Categories</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto mb-8 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-3">
            {/* Add Video Button */}
            <button 
              onClick={handleAddVideo}
              className="w-10 h-10 rounded-full overflow-hidden hover:scale-110 transition-transform shadow-[0_0_15px_rgba(6,182,212,0.3)] border border-cyan-500/50 bg-black flex-shrink-0 flex items-center justify-center group"
              title="Add Video"
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/b3c82bda2_image.png" 
                alt="Add" 
                className="w-full h-full object-cover" 
              />
            </button>

            {/* Add Channel Button */}
            <button 
              onClick={handleAddChannel}
              className="w-10 h-10 rounded-full hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-500/50 bg-black flex-shrink-0 flex items-center justify-center group"
              title="Add Channel"
            >
              <Tv className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
            </button>
          </div>

          <div className="w-full flex items-center gap-2 bg-black border border-cyan-500/50 rounded-lg px-3 py-2 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <div className="w-7 h-7 bg-cyan-500/20 border border-cyan-500 rounded flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
              <Youtube className="w-4 h-4 text-cyan-400 fill-current" />
            </div>
            <Input
              ref={inputRef}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Paste YouTube URL..."
              className="flex-1 bg-transparent border-0 text-white placeholder:text-gray-500 focus-visible:ring-0 text-sm"
            />
            <Button
              onClick={() => handleLoadVideo()}
              disabled={isLoading}
              size="sm"
              className="bg-cyan-500/20 border border-cyan-500 hover:bg-cyan-500/30 text-cyan-400 h-8 px-4 shadow-[0_0_10px_rgba(6,182,212,0.4)] hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1 fill-current" />
                  <span className="text-xs">Play</span>
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {recentlyWatched.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <History className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Recently Watched</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {recentlyWatched.slice(0, 6).map((video) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handlePlayVideo(video)}
                  className="group bg-black border border-cyan-500/30 rounded-lg overflow-hidden cursor-pointer hover:border-cyan-500 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <div className="aspect-video bg-black relative overflow-hidden">
                    <img 
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/30 transition-colors">
                      <Play className="w-8 h-8 text-cyan-400 fill-current opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="text-white text-xs font-semibold line-clamp-2">
                      {video.title}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {allCategories.map((category, index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
              onClick={() => handleCategoryClick(category)}
              className="bg-black border border-cyan-500/30 hover:border-cyan-500 rounded-lg p-4 cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-3"
            >
              <div className="text-cyan-400">
                {getCategoryIcon(category)}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm">
                  {category}
                </h3>
                <div className="text-cyan-400 text-xs font-semibold">
                  {customChannels.includes(category) 
                    ? 'Channel' 
                    : `${videoLibrary[category].length} videos`
                  }
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}