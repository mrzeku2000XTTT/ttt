import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Bot, Sparkles, Share2, Download, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarGateProvider, useStarGate } from "@/components/stargate/StarGateContext";
import DataShareModal from "@/components/stargate/DataShareModal";

function AKContent() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey agent, I'm AK, Your Artificial K 🤖\n\n**Available Commands:**\n• Type 'play [song name]' - Search and play music\n• Type 'watch [movie name]' - Search and watch movies\n• Click 'Browse Genres' - Browse movies by genre\n• Ask me anything - I'm here to help!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [shareModal, setShareModal] = useState({ open: false, data: "" });
  const [backgroundUrl, setBackgroundUrl] = useState(() => localStorage.getItem('ak_background_url') || '');
  const [bgLoading, setBgLoading] = useState(false);
  const [showGenres, setShowGenres] = useState(false);
  const [genreMovies, setGenreMovies] = useState([]);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [lastMovie, setLastMovie] = useState(null);
  const { getSharedData, getAllSharedData } = useStarGate();

  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Animation'];

  useEffect(() => {
    loadUser();
    loadSharedData();
    generateBackgroundIfNeeded();
  }, []);

  const generateBackgroundIfNeeded = async () => {
    const savedUrl = localStorage.getItem('ak_background_url');
    if (savedUrl) {
      setBackgroundUrl(savedUrl);
      return;
    }

    setBgLoading(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: "Ultra high definition photorealistic deep space nebula background, cosmic purple and cyan nebula clouds, countless white stars scattered across black void, distant galaxies, ethereal glowing stardust, dreamy space atmosphere, professional astronomy photograph, 8K resolution, cinematic lighting"
      });
      
      const newUrl = result.url;
      setBackgroundUrl(newUrl);
      localStorage.setItem('ak_background_url', newUrl);
      
      const img = new Image();
      img.src = newUrl;
    } catch (err) {
      console.error('Failed to generate background:', err);
    } finally {
      setBgLoading(false);
    }
  };

  const loadSharedData = () => {
    const allData = getAllSharedData();
    if (Object.keys(allData).length > 0) {
      const latestData = Object.values(allData).sort((a, b) => b.timestamp - a.timestamp)[0];
      if (latestData && latestData.data.content) {
        setInput(latestData.data.content);
      }
    }
  };

  const handleGenreClick = async (genre) => {
    setLoadingGenre(true);
    setGenreMovies([]);
    try {
      const result = await base44.functions.invoke('scrapeMovieGenres', { genre });
      setGenreMovies(result.data.movies || []);
    } catch (err) {
      console.error('Genre error:', err);
    } finally {
      setLoadingGenre(false);
    }
  };

  const handleMovieSelect = (movie) => {
    setMessages(prev => [...prev, { 
      role: "assistant", 
      content: `🎬 Now playing: ${movie.title}`,
      movie: {
        embed_url: movie.embed_url,
        title: movie.title,
        source: "0123Movie"
      }
    }]);
    setShowGenres(false);
    setGenreMovies([]);
  };

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (err) {
      console.log("User not logged in");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    const query = input;
    setInput("");
    setLoading(true);

    try {
      // Check if it's a music request
      const isMusicRequest = /play|music|song|listen|audio/i.test(query);
      const isMovieRequest = /watch|movie|film|cinema/i.test(query);
      
      if (isMusicRequest) {
        const musicResult = await base44.functions.invoke('searchMusic', { query });
        
        if (musicResult.data.embed_url) {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: `🎵 Now playing: ${musicResult.data.title}`,
            music: {
              embed_url: musicResult.data.embed_url,
              title: musicResult.data.title,
              source: musicResult.data.source
            }
          }]);
        } else {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "Sorry, I couldn't find that song. Please try a different search."
          }]);
        }
      } else if (isMovieRequest) {
        const movieResult = await base44.functions.invoke('searchMovie', { query });
        
        if (movieResult.data.embed_url) {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: `🎬 Now playing: ${movieResult.data.title}`,
            movie: {
              embed_url: movieResult.data.embed_url,
              title: movieResult.data.title,
              source: movieResult.data.source
            }
          }]);
        } else {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "Sorry, I couldn't find that movie. Please try a different search."
          }]);
        }
      } else {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: query,
          add_context_from_internet: false,
        });

        setMessages(prev => [...prev, { role: "assistant", content: response }]);
      }
    } catch (err) {
      console.error("AI error:", err);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 'calc(var(--sat, 0px) + 7.5rem)',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex', 
      flexDirection: 'column',
      backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'linear-gradient(to bottom right, rgb(59, 7, 100), rgb(0, 0, 0), rgb(59, 7, 100))',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      imageRendering: '-webkit-optimize-contrast',
      overflow: 'hidden'
    }}>
      
      <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        maxWidth: '64rem', 
        margin: '0 auto', 
        width: '100%',
        padding: '0 0.75rem',
        paddingBottom: 'calc(var(--sab, 0px) + 5rem)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            padding: '0.5rem 0', 
            textAlign: 'center',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
            <Bot className="w-5 h-5 text-purple-400" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: 0 }}>AK</h1>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
        </motion.div>

        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          minHeight: 0,
          paddingBottom: '0.5rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex items-start gap-2 group">
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-white backdrop-blur-xl border border-white/10"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.music && (
                      <div className="mt-3">
                        <iframe
                          src={msg.music.embed_url}
                          width="100%"
                          height="200"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-lg"
                        />
                      </div>
                    )}
                    {msg.movie && (
                      <div className="mt-3 w-full" style={{ aspectRatio: '16/9', height: 'clamp(250px, 50vh, 600px)' }}>
                        <iframe
                          src={msg.movie.embed_url}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => setShareModal({ open: true, data: msg.content })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg"
                      title="Share response"
                    >
                      <Share2 className="w-4 h-4 text-white/60 hover:text-purple-400" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              </div>
            </motion.div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flexShrink: 0, paddingTop: '0.5rem', paddingBottom: '0.25rem', background: 'linear-gradient(to bottom, transparent, rgba(59, 7, 100, 0.95) 5%, rgba(59, 7, 100, 1))', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            <Button
              onClick={() => setShowGenres(!showGenres)}
              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-8 text-xs px-2.5"
            >
              <Film className="w-3.5 h-3.5 mr-1.5" />
              Browse Genres
            </Button>
          </div>

          {showGenres && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-2"
            >
              <div className="flex flex-wrap gap-1.5 mb-2">
                {genres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => handleGenreClick(genre)}
                    className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded text-white text-xs transition-colors"
                  >
                    {genre}
                  </button>
                ))}
              </div>

              {loadingGenre && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                </div>
              )}

              {genreMovies.length > 0 && (
                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
                  {genreMovies.map((movie, i) => (
                    <button
                      key={i}
                      onClick={() => handleMovieSelect(movie)}
                      className="text-left p-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded transition-colors"
                    >
                      <div className="text-white text-xs font-semibold line-clamp-1">{movie.title}</div>
                      {movie.rating && (
                        <div className="text-yellow-400 text-[10px] mt-0.5">⭐ {movie.rating}</div>
                      )}
                      <div className="text-white/60 text-[10px] line-clamp-1 mt-0.5">{movie.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask AK anything..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none text-sm py-2"
              rows={1}
              style={{ fontSize: '16px', minHeight: '38px' }}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white h-[38px] w-[38px] p-0 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <DataShareModal
          isOpen={shareModal.open}
          onClose={() => setShareModal({ open: false, data: "" })}
          sourceApp="AK"
          dataToShare={shareModal.data}
          dataType="text"
        />
      </div>
      </div>
    </div>
  );
}

export default function AKPage() {
  return (
    <StarGateProvider>
      <AKContent />
    </StarGateProvider>
  );
}