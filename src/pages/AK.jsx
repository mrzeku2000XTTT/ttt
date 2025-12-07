import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, Bot, Sparkles, Share2, Download, Film, Image as ImageIcon, Lock, Shield, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarGateProvider, useStarGate } from "@/components/stargate/StarGateContext";
import DataShareModal from "@/components/stargate/DataShareModal";
import MultiStreamModal from "@/components/MultiStreamModal";
import { toast } from "sonner";

function AKContent() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey agent, I'm AK, Your Artificial K 🤖\n\n**Available Commands:**\n• Type 'play [song name]' - Search and play music\n• Type 'watch [movie name]' - Search and watch movies\n• Type '!Split' - Multi-stream mode (watch up to 4 streams!)\n• Type '!Sports' - Watch live sports\n• Type '!Asian' - Browse Asian dramas\n• Type '!African' - Browse African content\n• Type '!Popcorn' - Browse Popcornflix\n• Click 'Browse Genres' - Browse movies by genre\n• Ask me anything - I'm here to help!\n\n⚠️ **Movie Tip:** An ad will pop up when you start a movie. Just close it and the movie will play with no more ads unless the screen is clicked."
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
  const [pastedImages, setPastedImages] = useState([]);
  const [splitScreen, setSplitScreen] = useState(false);
  const [splitScreenContent, setSplitScreenContent] = useState(null);
  const [multiStreamModal, setMultiStreamModal] = useState(false);
  const [multiStreams, setMultiStreams] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [akUnlocked, setAkUnlocked] = useState(false);
  const [kaswareWallet, setKaswareWallet] = useState({ connected: false, address: null });
  const [showZkVerification, setShowZkVerification] = useState(false);
  const [zkAmount, setZkAmount] = useState('1');
  const [zkVerifying, setZkVerifying] = useState(false);
  const [zkWalletBalance, setZkWalletBalance] = useState(null);
  const [selectedZkWallet, setSelectedZkWallet] = useState('ttt');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [expiresAt, setExpiresAt] = useState(() => {
    const saved = localStorage.getItem('ak_expires_at');
    return saved ? parseInt(saved) : null;
  });
  const { getSharedData, getAllSharedData } = useStarGate();
  const messagesEndRef = React.useRef(null);

  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Animation'];

  useEffect(() => {
    loadUser();
    loadSharedData();
    generateBackgroundIfNeeded();
    checkKasware();
    loadZkWalletBalance();
    checkSubscription();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkSubscription();
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const checkSubscription = () => {
    if (!expiresAt) {
      setAkUnlocked(false);
      setShowPaymentModal(true);
      setTimeRemaining(0);
      return;
    }

    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) {
      setAkUnlocked(false);
      setShowPaymentModal(true);
      setTimeRemaining(0);
      localStorage.removeItem('ak_expires_at');
      setExpiresAt(null);
      toast.error('⏰ Time expired! Pay 1 KAS for 20 more minutes');
    } else {
      setAkUnlocked(true);
      setTimeRemaining(remaining);
    }
  };

  const addTime = () => {
    const now = Date.now();
    const twentyMinutes = 20 * 60 * 1000;
    const newExpiry = (expiresAt && expiresAt > now ? expiresAt : now) + twentyMinutes;
    setExpiresAt(newExpiry);
    localStorage.setItem('ak_expires_at', newExpiry.toString());
    setAkUnlocked(true);
  };

  const formatTimeRemaining = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const checkKasware = async () => {
    if (typeof window.kasware !== 'undefined') {
      try {
        const accounts = await window.kasware.getAccounts();
        if (accounts.length > 0) {
          setKaswareWallet({ connected: true, address: accounts[0] });
        }
      } catch (err) {
        console.log('Kasware not connected');
      }
    }
  };

  const loadZkWalletBalance = async () => {
    try {
      if (user?.created_wallet_address) {
        const response = await base44.functions.invoke('getKaspaBalance', { address: user.created_wallet_address });
        if (response.data?.balance) {
          setZkWalletBalance(response.data.balance);
        }
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const handleSelfPayment = async () => {
    if (!kaswareWallet.connected) {
      toast.error('Please connect Kasware wallet');
      return;
    }

    try {
      const amountSompi = 100000000; // 1 KAS
      const txId = await window.kasware.sendKaspa(kaswareWallet.address, amountSompi);
      
      addTime();
      setShowPaymentModal(false);
      toast.success('✅ Payment verified! Added 20 minutes');
    } catch (err) {
      console.error('Payment failed:', err);
      toast.error('Payment failed: ' + err.message);
    }
  };

  const handleZkVerification = async () => {
    const verifyAddress = selectedZkWallet === 'ttt' ? user?.created_wallet_address : kaswareWallet.address;
    
    if (!verifyAddress) {
      toast.error(selectedZkWallet === 'ttt' ? 'Please login first' : 'Please connect Kasware');
      return;
    }

    const timestamp = Date.now();
    setZkVerifying(true);

    try {
      const targetAmount = parseFloat(zkAmount);
      let attempts = 0;
      const maxAttempts = 200;

      const checkTransaction = async () => {
        attempts++;

        try {
          const response = await base44.functions.invoke('verifyKaspaSelfTransaction', {
            address: verifyAddress,
            expectedAmount: targetAmount,
            timestamp: timestamp
          });

          if (response.data?.verified && response.data?.transaction) {
            setZkVerifying(false);
            setShowZkVerification(false);
            setShowPaymentModal(false);
            addTime();
            toast.success('✅ Payment verified! Added 20 minutes');
            return true;
          }

          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setZkVerifying(false);
            toast.error('Verification timeout');
          }
        } catch (err) {
          if (attempts < maxAttempts) {
            setTimeout(checkTransaction, 3000);
          } else {
            setZkVerifying(false);
            toast.error('Failed to verify transaction');
          }
        }
      };

      checkTransaction();
    } catch (err) {
      setZkVerifying(false);
      toast.error('Verification failed');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
    const movieData = {
      embed_url: movie.embed_url,
      title: movie.title,
      source: "0123Movie"
    };
    
    setLastMovie(movieData);
    setMessages(prev => [...prev, { 
      role: "assistant", 
      content: `🎬 Now playing: ${movie.title}`,
      movie: movieData
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

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          setPastedImages(prev => [...prev, file_url]);
        } catch (err) {
          console.error('Failed to upload pasted image:', err);
        }
      }
    }
  };

  const handleSend = async () => {
    if (!akUnlocked) {
      toast.error('Please unlock AK first by paying 1 KAS');
      return;
    }
    if ((!input.trim() && pastedImages.length === 0) || loading) return;

    const userMessage = { 
      role: "user", 
      content: input,
      images: pastedImages.length > 0 ? [...pastedImages] : undefined
    };
    setMessages(prev => [...prev, userMessage]);
    const query = input;
    const imageUrls = [...pastedImages];
    setInput("");
    setPastedImages([]);
    setLoading(true);

    try {
        // Check for !ASIAN command
        if (query.trim().toLowerCase() === '!asian') {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "🎬 Opening Asian drama browser...",
            movie: {
              embed_url: "https://kisskh.co/List?type=History",
              title: "KissKH - Asian Drama Browser",
              source: "KissKH"
            }
          }]);
          setLoading(false);
          return;
        }

        // Check for !AFRICAN command
        if (query.trim().toLowerCase() === '!african') {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "🎬 Opening African content browser...",
            movie: {
              embed_url: "https://www.naijaplay.com.ng",
              title: "NaijaPlay - African Movies Browser",
              source: "NaijaPlay"
            }
          }]);
          setLoading(false);
          return;
        }

        // Check for !POPCORN command
        if (query.trim().toLowerCase() === '!popcorn') {
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "🎬 Opening Popcornflix browser...",
            movie: {
              embed_url: "https://popcornflix.com",
              title: "Popcornflix - Free Movies Browser",
              source: "Popcornflix"
            }
          }]);
          setLoading(false);
          return;
        }

        // Check for !SPLIT command
        if (query.trim().toLowerCase() === '!split') {
          setMultiStreamModal(true);
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "🎬 Opening multi-stream selector..."
          }]);
          setLoading(false);
          return;
        }

        // Check for !SPORTS command
        if (query.trim().toLowerCase() === '!sports') {
          const sportsContent = {
            embed_url: "https://sportsurge.io",
            title: "SportsurGe - Live Sports",
            source: "Sportsurge"
          };

          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "🏆 Opening Sports Streams...",
            movie: sportsContent
          }]);
          setLoading(false);
          return;
        }

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
          // Check if user just typed "watch" without movie name
          if (query.trim().toLowerCase() === 'watch') {
            if (lastMovie) {
              // Get AI response first, then show last movie
              const aiResponse = await base44.integrations.Core.InvokeLLM({
                prompt: "User wants to watch the last movie again. Give a friendly short response confirming you're reopening it.",
                add_context_from_internet: false,
              });

              setMessages(prev => [...prev, 
                { role: "assistant", content: aiResponse },
                { 
                  role: "assistant", 
                  content: `🎬 Reopening: ${lastMovie.title}`,
                  movie: lastMovie
                }
              ]);
            } else {
              // Get AI response and show 123movies home page
              const aiResponse = await base44.integrations.Core.InvokeLLM({
                prompt: "User wants to watch something. Give a friendly short response about opening the movie browser for them.",
                add_context_from_internet: false,
              });
              
              setMessages(prev => [...prev, 
                { role: "assistant", content: aiResponse },
                { 
                  role: "assistant", 
                  content: "🎬 Opening movie browser...",
                  movie: {
                    embed_url: "https://fmovies-co.net",
                    title: "Movie Browser",
                    source: "FMovies"
                  }
                }
              ]);
            }
          } else {
            // Search for specific movie
            const movieResult = await base44.functions.invoke('searchMovie', { query });

            if (movieResult.data.embed_url) {
              const movieData = {
                embed_url: movieResult.data.embed_url,
                title: movieResult.data.title,
                source: movieResult.data.source
              };

              setLastMovie(movieData);

              // Get AI response first, then show movie
              const aiResponse = await base44.integrations.Core.InvokeLLM({
                prompt: `User wants to watch "${query}". Give a friendly short response about this movie (1-2 sentences).`,
                add_context_from_internet: true,
              });

              setMessages(prev => [...prev, 
                { role: "assistant", content: aiResponse },
                { 
                  role: "assistant", 
                  content: `🎬 Now playing: ${movieData.title}`,
                  movie: movieData
                }
              ]);
            } else {
              setMessages(prev => [...prev, { 
                role: "assistant", 
                content: "Sorry, I couldn't find that movie. Please try a different search or click 'Browse Genres' to explore."
              }]);
            }
          }
        } else {
          const response = await base44.integrations.Core.InvokeLLM({
            prompt: query,
            add_context_from_internet: false,
            file_urls: imageUrls.length > 0 ? imageUrls : undefined
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
    <>
      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && !akUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-yellow-500/30 rounded-xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                        {expiresAt && expiresAt > Date.now() ? <Lock className="w-5 h-5 text-green-400" /> : <Lock className="w-5 h-5 text-yellow-400" />}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{expiresAt && expiresAt > Date.now() ? 'Add More Time' : 'Unlock AK'}</h3>
                        <p className="text-white/60 text-sm">1 KAS = 20 minutes {expiresAt && expiresAt > Date.now() ? '(adds to current time)' : ''}</p>
                      </div>
                    </div>
                <Button
                  onClick={() => setShowPaymentModal(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                {kaswareWallet.connected && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="text-xs text-white/60 mb-1">Your Kasware Wallet</div>
                    <div className="text-white font-mono text-sm break-all">
                      {kaswareWallet.address}
                    </div>
                  </div>
                )}

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-white/80">
                      <p className="mb-2">Pay <span className="font-bold text-yellow-400">1 KAS</span> to yourself to {expiresAt && expiresAt > Date.now() ? 'add' : 'unlock AK for'} <span className="font-bold text-cyan-400">20 minutes</span>.</p>
                      <p className="text-white/60">{expiresAt && expiresAt > Date.now() ? 'Time will be added to your current timer.' : 'Timer-based access. Pay again when time expires.'}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSelfPayment}
                  disabled={!kaswareWallet.connected}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12 text-black font-bold"
                >
                  {kaswareWallet.connected ? (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pay 1 KAS - Get 20 Min
                    </>
                  ) : (
                    'Connect Kasware First'
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-black px-2 text-white/40">or</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setShowZkVerification(true);
                  }}
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 h-12 font-semibold"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  ZK Verification (iOS/Kaspium)
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZK Verification Modal */}
      <AnimatePresence>
        {showZkVerification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!zkVerifying) {
                setShowZkVerification(false);
                setShowPaymentModal(true);
                setZkAmount('1');
              }
            }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border border-cyan-500/30 rounded-xl w-full max-w-md p-6"
            >
              <h3 className="text-2xl font-bold text-white mb-2">ZK Verification</h3>
              <p className="text-white/60 text-sm mb-6">
                Send KAS to yourself in Kaspium to unlock AK
              </p>

              {!zkVerifying ? (
                <div className="space-y-4">
                  {zkWalletBalance !== null && selectedZkWallet === 'ttt' && (
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-white/40 text-xs mb-1">Current Balance</p>
                      <p className="text-white text-lg font-bold">{zkWalletBalance.toFixed(2)} KAS</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-white/60 text-sm">Select wallet to send from:</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedZkWallet('ttt')}
                        className={`flex-1 h-auto py-3 ${selectedZkWallet === 'ttt' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        <div className="text-left">
                          <p className="text-xs font-semibold mb-1">TTT Wallet</p>
                          <p className="text-[10px] font-mono opacity-70">
                            {user?.created_wallet_address?.substring(0, 10)}...
                          </p>
                        </div>
                      </Button>
                      <Button
                        onClick={() => setSelectedZkWallet('kasware')}
                        className={`flex-1 h-auto py-3 ${selectedZkWallet === 'kasware' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                      >
                        <div className="text-left">
                          <p className="text-xs font-semibold mb-1">Kasware L1</p>
                          <p className="text-[10px] font-mono opacity-70">
                            {kaswareWallet.address?.substring(0, 10)}...
                          </p>
                        </div>
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-white/40 text-xs mb-1">Selected Address</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white text-sm font-mono break-all">
                        {selectedZkWallet === 'ttt' 
                          ? `${user?.created_wallet_address?.substring(0, 12)}...${user?.created_wallet_address?.slice(-8)}`
                          : `${kaswareWallet.address?.substring(0, 12)}...${kaswareWallet.address?.slice(-8)}`
                        }
                      </p>
                      <Button
                        onClick={() => {
                          const address = selectedZkWallet === 'ttt' ? user?.created_wallet_address : kaswareWallet.address;
                          navigator.clipboard.writeText(address || '');
                          toast.success('✓ Address copied');
                        }}
                        size="sm"
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs h-7"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-white/60 text-sm mb-2 block">
                      Amount to send yourself (KAS)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={zkAmount}
                      onChange={(e) => setZkAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg"
                    />
                  </div>

                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
                    <p className="text-cyan-400 text-xs font-semibold mb-2">Instructions:</p>
                    <ol className="text-white/60 text-xs space-y-1 list-decimal list-inside">
                      <li>Select which wallet to send from</li>
                      <li>Copy your selected wallet address above</li>
                      <li>Enter the amount (default: 1 KAS)</li>
                      <li>Click "Start Verification"</li>
                      <li>Open {selectedZkWallet === 'ttt' ? 'Kaspium' : 'Kasware'} and send that amount to your own address</li>
                      <li>Wait for automatic verification</li>
                    </ol>
                  </div>

                  <Button
                    onClick={handleZkVerification}
                    disabled={!zkAmount || parseFloat(zkAmount) <= 0}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white h-12 font-semibold disabled:opacity-50"
                  >
                    Start Verification
                  </Button>

                  <Button
                    onClick={() => {
                      setShowZkVerification(false);
                      setShowPaymentModal(true);
                      setZkAmount('1');
                    }}
                    variant="outline"
                    className="w-full border-white/10 text-white/60"
                  >
                    Back
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-cyan-400 font-semibold mb-2">🔍 Waiting for Transaction...</p>
                  <p className="text-white/60 text-sm mb-4">
                    Send {zkAmount} KAS to yourself in {selectedZkWallet === 'ttt' ? 'Kaspium' : 'Kasware'}
                  </p>
                  <div className="bg-white/5 rounded-lg p-3 mb-4">
                    <p className="text-white/40 text-xs mb-1">Send to this address:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white text-xs font-mono break-all flex-1">
                        {selectedZkWallet === 'ttt' ? user?.created_wallet_address : kaswareWallet.address}
                      </p>
                      <Button
                        onClick={() => {
                          const address = selectedZkWallet === 'ttt' ? user?.created_wallet_address : kaswareWallet.address;
                          navigator.clipboard.writeText(address || '');
                          toast.success('Address copied!');
                        }}
                        size="sm"
                        className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs h-7 px-2"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs">
                    Verification will happen automatically when the transaction is detected
                  </p>
                  <Button
                    onClick={() => {
                      setZkVerifying(false);
                      setShowZkVerification(false);
                      setShowPaymentModal(true);
                      setZkAmount('1');
                    }}
                    variant="outline"
                    className="w-full border-white/10 text-white/60 mt-4"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            padding: '1.5rem 0 0.5rem 0', 
            textAlign: 'center',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Bot className="w-5 h-5 text-purple-400" />
              <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: 0 }}>AK</h1>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            {akUnlocked && timeRemaining > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ 
                  background: timeRemaining < 300000 ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))' : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(20, 184, 166, 0.2))',
                  border: timeRemaining < 300000 ? '2px solid rgba(239, 68, 68, 0.5)' : '2px solid rgba(6, 182, 212, 0.5)',
                  boxShadow: timeRemaining < 300000 ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 0 20px rgba(6, 182, 212, 0.3)'
                }}
              >
                <div className="flex items-center gap-2">
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: timeRemaining < 300000 ? '#ef4444' : '#06b6d4',
                    borderRadius: '50%',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    boxShadow: timeRemaining < 300000 ? '0 0 10px #ef4444' : '0 0 10px #06b6d4'
                  }} />
                  <span style={{ 
                    fontSize: '1rem', 
                    fontWeight: 700, 
                    color: timeRemaining < 300000 ? '#fca5a5' : '#67e8f9',
                    fontFamily: 'monospace',
                    letterSpacing: '0.05em'
                  }}>
                    {formatTimeRemaining(timeRemaining)}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPaymentModal(true);
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:scale-110 transition-transform"
                  style={{ 
                    background: 'rgba(6, 182, 212, 0.3)',
                    border: '2px solid rgba(6, 182, 212, 0.5)',
                    color: '#06b6d4',
                    cursor: 'pointer',
                    fontWeight: 900,
                    fontSize: '1.25rem'
                  }}
                  title="Add 20 more minutes"
                >
                  +
                </button>
              </motion.div>
            )}
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
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} ${msg.movie ? "w-full" : ""}`}
              >
                <div className="flex items-start gap-2 group w-full">
                  <div
                    className={`${msg.movie ? "w-full" : "max-w-[80%] lg:max-w-[95%]"} rounded-2xl ${msg.movie ? "px-2 py-2" : "px-4 py-3"} ${
                      msg.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-white backdrop-blur-xl border border-white/10"
                    }`}
                  >
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.images.map((url, idx) => (
                          <img 
                            key={idx}
                            src={url} 
                            alt="Pasted" 
                            className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
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
                      <div className="mt-2 w-full relative" style={{ height: 'calc(100vh - 200px)', minHeight: '600px', maxHeight: '900px' }}>
                        <iframe
                          src={msg.movie.embed_url}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          scrolling="yes"
                          className="rounded-lg"
                          style={{ overflow: 'auto' }}
                        />
                      </div>
                    )}
                    {msg.multiStreams && (
                      <div className="mt-2 w-full" style={{ height: 'calc(100vh - 200px)', minHeight: '600px', maxHeight: '900px' }}>
                        <div className={`grid gap-2 h-full ${
                          msg.multiStreams.length === 1 ? 'grid-cols-1' :
                          msg.multiStreams.length === 2 ? 'grid-cols-2' :
                          msg.multiStreams.length === 3 ? 'grid-cols-2' :
                          'grid-cols-2'
                        } ${msg.multiStreams.length === 3 ? 'grid-rows-2' : ''}`}>
                          {msg.multiStreams.map((stream, idx) => (
                            <div key={idx} className={`relative ${
                              msg.multiStreams.length === 3 && idx === 0 ? 'col-span-2' : ''
                            }`}>
                              <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-xl border border-white/20 rounded px-2 py-1">
                                <span className="text-white text-xs font-bold">{stream.name}</span>
                              </div>
                              <iframe
                                src={stream.url}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                scrolling="yes"
                                className="rounded-lg"
                                style={{ overflow: 'auto' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {msg.role === "assistant" && !msg.movie && (
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
          <div ref={messagesEndRef} />
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

          {pastedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-lg mb-2">
              {pastedImages.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img 
                    src={url} 
                    alt="Pasted" 
                    className="w-16 h-16 rounded object-cover"
                  />
                  <button
                    onClick={() => setPastedImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="text-white text-xs">×</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask AK anything or paste images..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none text-sm py-2"
              rows={1}
              style={{ fontSize: '16px', minHeight: '38px' }}
            />
            <Button
              onClick={handleSend}
              disabled={loading || (!input.trim() && pastedImages.length === 0)}
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

        <MultiStreamModal
          isOpen={multiStreamModal}
          onClose={() => setMultiStreamModal(false)}
          onConfirm={(streams) => {
            setMultiStreams(streams);
            setMessages(prev => [...prev, { 
              role: "assistant", 
              content: `🎬 Starting ${streams.length} streams...`,
              multiStreams: streams
            }]);
          }}
        />
      </div>
      </div>
    </div>
    </>
  );
}

export default function AKPage() {
  return (
    <StarGateProvider>
      <AKContent />
    </StarGateProvider>
  );
}