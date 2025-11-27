
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users, Trophy, Shield, Clock, ArrowRight, RefreshCw, Zap, Grid3x3, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BingoLobbyBrowserPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [lobbies, setLobbies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameCodeInput, setGameCodeInput] = useState('');
  const [isJoining, setIsJoining] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load ALL lobby games (waiting OR active)
      const allGames = await base44.entities.BingoGame.filter({
        game_type: 'lobby'
      }, '-created_date');

      // Filter to only show waiting and active
      const activeLobbies = allGames.filter(g => 
        g.status === 'waiting' || g.status === 'active'
      );

      setLobbies(activeLobbies);
      setLastRefresh(Date.now());
      console.log('📊 [Browser] Found', activeLobbies.length, 'active lobbies');
    } catch (err) {
      console.error('Failed to load lobbies:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!gameCodeInput || gameCodeInput.length !== 6) {
      alert('Please enter a valid 6-character game code');
      return;
    }

    setIsJoining('code');

    try {
      const response = await base44.functions.invoke('joinBingoLobby', {
        game_code: gameCodeInput.toUpperCase()
      });

      if (response.data.success) {
        navigate(createPageUrl("BingoLobbyRoom") + "?code=" + gameCodeInput.toUpperCase());
      } else {
        alert('❌ ' + (response.data.error || 'Failed to join lobby'));
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsJoining(null);
    }
  };

  const handleJoinLobby = (gameCode) => {
    navigate(createPageUrl("BingoLobbyRoom") + "?code=" + gameCode);
  };

  const getTimeSince = (timestamp) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
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
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[180px]"
        />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Grid3x3 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Bingo Lobbies
            </h1>
            <p className="text-gray-400 text-lg mb-4">
              Join a game or create your own
            </p>
            
            <div className="flex items-center justify-center gap-3">
              <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                <Users className="w-3 h-3 mr-1" />
                {lobbies.length} Active Lobbies
              </Badge>
              <Button
                onClick={() => loadData()}
                size="sm"
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Join with Code */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-1 w-full">
                    <label className="text-sm text-cyan-300 mb-2 block font-medium">
                      Have a game code?
                    </label>
                    <Input
                      value={gameCodeInput}
                      onChange={(e) => setGameCodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter 6-character code (e.g., ABC123)"
                      maxLength={6}
                      className="bg-black/50 border-cyan-500/30 text-white h-14 text-xl font-mono tracking-wider text-center uppercase"
                    />
                  </div>
                  <Button
                    onClick={handleJoinWithCode}
                    disabled={gameCodeInput.length !== 6 || isJoining === 'code'}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 h-14 px-8 w-full md:w-auto md:mt-6"
                  >
                    {isJoining === 'code' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Join Game
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Available Lobbies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-400" />
              Available Games
            </h2>

            {lobbies.length === 0 ? (
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-12 text-center">
                  <Grid3x3 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Active Lobbies</h3>
                  <p className="text-gray-400 mb-6">
                    Be the first to create a game!
                  </p>
                  <Button
                    onClick={() => navigate(createPageUrl("Arcade"))}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Create New Game
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lobbies.map((lobby, index) => {
                  const availableCards = (lobby.cards || []).filter(c => !c.claimed).length;
                  const isWaiting = lobby.status === 'waiting';
                  const isActive = lobby.status === 'active';

                  return (
                    <motion.div
                      key={lobby.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="backdrop-blur-xl bg-gradient-to-br from-black/80 to-purple-900/20 border-white/10 hover:border-purple-500/50 transition-all group">
                        <CardContent className="p-6">
                          {/* Game Code Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg px-4 py-2">
                              <div className="text-xs text-yellow-300 mb-1">GAME CODE</div>
                              <div className="text-2xl font-black text-yellow-400 tracking-widest">
                                {lobby.game_code}
                              </div>
                            </div>
                            <Badge className={`${
                              isWaiting 
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}>
                              {isWaiting ? 'OPEN' : 'PLAYING'}
                            </Badge>
                          </div>

                          {/* Prize Pool */}
                          <div className="bg-black/40 rounded-lg p-4 mb-4 border border-purple-500/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="w-5 h-5 text-yellow-400" />
                              <span className="text-sm text-gray-400">Prize Pool</span>
                            </div>
                            <div className="text-3xl font-bold text-yellow-400">
                              {lobby.prize_amount} KAS
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="bg-white/5 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-400 mb-1">Cards</div>
                              <div className="text-lg font-bold text-white">
                                {availableCards}/{lobby.total_cards}
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-400 mb-1">Players</div>
                              <div className="text-lg font-bold text-cyan-400">
                                {lobby.players?.length || 0}
                              </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-400 mb-1">Status</div>
                              <div className="text-lg font-bold text-green-400">
                                {isWaiting ? 'OPEN' : 'LIVE'}
                              </div>
                            </div>
                          </div>

                          {/* Time & Host */}
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeSince(lobby.created_date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Host
                            </div>
                          </div>

                          {/* Join Button */}
                          <Button
                            onClick={() => handleJoinLobby(lobby.game_code)}
                            disabled={!isWaiting || availableCards === 0 || isJoining === lobby.game_code}
                            className={`w-full h-12 font-semibold ${
                              isWaiting && availableCards > 0
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                                : 'bg-gray-700 cursor-not-allowed'
                            }`}
                          >
                            {isJoining === lobby.game_code ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : availableCards === 0 ? (
                              'Full'
                            ) : !isWaiting ? (
                              <>
                                <Play className="w-5 h-5 mr-2" />
                                Watch Live
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-5 h-5 mr-2" />
                                Join Lobby
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Create Game CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <CardContent className="p-8 text-center">
                <Zap className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-3">Want to Host?</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Create your own Bingo lobby and invite friends to compete for KAS prizes!
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("Arcade"))}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 px-8"
                >
                  <Grid3x3 className="w-5 h-5 mr-2" />
                  Create Game
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
