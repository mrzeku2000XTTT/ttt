
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Trophy, ArrowLeft, Shield, CheckCircle2, Clock, Zap, Grid3x3, Sparkles, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BingoLobbyRoomPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const gameCode = searchParams.get('code');
  
  const [user, setUser] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [myCard, setMyCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    loadLobby();
    
    const interval = setInterval(() => {
      loadLobby(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [gameCode]);

  const loadLobby = async (silent = false) => {
    if (!silent) setIsLoading(true);
    
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const games = await base44.entities.BingoGame.filter({
        game_code: gameCode
      });

      if (games.length === 0) {
        if (!silent) alert('Game not found');
        return;
      }

      const game = games[0];
      setLobby(game);

      // Check if user already has a card
      const userCard = (game.cards || []).find(c => c.claimedByEmail === currentUser.email);
      if (userCard) {
        setMyCard(userCard);
      }

      // Auto-redirect if game is active and user has card
      if (game.status === 'active' && userCard) {
        navigate(createPageUrl("BingoLobbyPlay") + `?code=${gameCode}&card=${userCard.cardNumber}`);
      }

    } catch (err) {
      console.error('Failed to load lobby:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleClaimCard = async (cardNumber) => {
    setIsClaiming(cardNumber);

    try {
      const response = await base44.functions.invoke('claimBingoCard', {
        game_code: gameCode,
        card_number: cardNumber
      });

      if (response.data.success) {
        await loadLobby();
      } else {
        alert('❌ ' + (response.data.error || 'Failed to claim card'));
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
    } finally {
      setIsClaiming(null);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleStartGame = async () => {
    if (!lobby || lobby.players?.length === 0) {
      alert('❌ Need at least 1 player to start the game');
      return;
    }

    if (!gameCode) {
      alert('❌ Invalid game code');
      return;
    }

    setIsStarting(true);

    try {
      console.log('🎮 Starting game with code:', gameCode);
      console.log('📊 Lobby data:', {
        players: lobby.players?.length,
        status: lobby.status,
        call_interval: lobby.call_interval
      });
      
      const response = await base44.functions.invoke('bingoGameMaster', {
        game_code: gameCode,
        action: 'start'
      });

      console.log('📡 Full response:', response);
      console.log('📦 Response data:', response.data);

      if (response.data.success) {
        const message = response.data.already_started 
          ? '⚠️ Game already started!\n\nRedirecting to gameplay...'
          : '🎮 Game Started!\n\nAI Game Master is now calling numbers!\n\nFirst call: ' + 
            (response.data.first_call ? `${response.data.first_call.letter}-${response.data.first_call.number}` : 'unknown');
        
        alert(message);
        
        // Wait a moment for backend to update
        setTimeout(() => {
          if (myCard) {
            navigate(createPageUrl("BingoLobbyPlay") + `?code=${gameCode}&card=${myCard.cardNumber}`);
          } else {
            loadLobby();
          }
        }, 1000);
      } else {
        console.error('❌ Start failed:', response.data);
        alert('❌ Failed to start: ' + (response.data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Start game error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorMsg = err.response?.data?.error || err.message || 'Network error';
      alert('❌ Failed to start game:\n\n' + errorMsg + '\n\nPlease try again.');
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-950 border-zinc-800 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Lobby Not Found</h2>
            <Link to={createPageUrl("BingoLobbyBrowser")}>
              <Button className="bg-cyan-500 hover:bg-cyan-600 mt-4">
                Browse Lobbies
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableCards = (lobby.cards || []).filter(c => !c.claimed);
  const columns = ['B', 'I', 'N', 'G', 'O'];
  const isCreator = user?.email === lobby?.created_by_admin;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link to={createPageUrl("BingoLobbyBrowser")}>
              <Button variant="ghost" className="text-gray-400 hover:text-white mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Lobbies
              </Button>
            </Link>

            <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Grid3x3 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                        Bingo Lobby
                      </h1>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyCode}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono text-lg font-bold tracking-wider"
                        >
                          {gameCode}
                        </button>
                        <button onClick={copyCode} className="text-gray-400 hover:text-white">
                          {copiedCode ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-center md:text-right">
                    <div className="text-sm text-gray-400 mb-1">Prize Pool</div>
                    <div className="text-3xl font-bold text-yellow-400">
                      {lobby.prize_amount} KAS
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Card Selection */}
            <div className="lg:col-span-2">
              {myCard ? (
                <Card className="backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                      <div>
                        <h2 className="text-2xl font-bold text-white">Card Claimed!</h2>
                        <p className="text-green-300">You're in the game with Card #{myCard.cardNumber}</p>
                      </div>
                    </div>

                    {/* Show claimed card */}
                    <div className="bg-black/40 rounded-xl p-4 border-2 border-green-500/50 mb-4">
                      <div className="grid grid-cols-5 gap-2 mb-2">
                        {columns.map(letter => (
                          <div key={letter} className="text-center py-2 bg-red-500/20 border border-red-500/40 rounded">
                            <span className="text-xl font-bold text-white">{letter}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {[0, 1, 2, 3, 4].map(row => (
                          columns.map(col => {
                            const number = myCard.numbers[col][row];
                            const isCenter = col === 'N' && row === 2;
                            
                            return (
                              <div
                                key={`${col}-${row}`}
                                className={`aspect-square rounded-lg flex items-center justify-center ${
                                  isCenter
                                    ? 'bg-gradient-to-br from-cyan-500 to-purple-500 border-2 border-white/50'
                                    : 'bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600'
                                }`}
                              >
                                <span className="text-xl md:text-2xl font-bold text-white">
                                  {isCenter ? 'TTT' : number}
                                </span>
                              </div>
                            );
                          })
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-300 font-medium">
                          {lobby.status === 'waiting' ? 'Waiting for game to start...' : 'Game in progress!'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {lobby.status === 'waiting' 
                          ? 'The host will start the game when ready' 
                          : 'Click boxes to reveal words!'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Grid3x3 className="w-6 h-6 text-purple-400" />
                    Select Your Card
                  </h2>

                  {availableCards.length === 0 ? (
                    <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                      <CardContent className="p-12 text-center">
                        <Shield className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">All Cards Claimed</h3>
                        <p className="text-gray-400">
                          All cards in this lobby have been claimed
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {availableCards.map((card, index) => (
                        <motion.div
                          key={card.cardNumber}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Card className="backdrop-blur-xl bg-gradient-to-br from-black/80 to-purple-900/20 border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-bold">
                                  #{card.cardNumber}
                                </Badge>
                              </div>

                              {/* Mini card preview */}
                              <div className="mb-3">
                                <div className="grid grid-cols-5 gap-0.5 mb-1">
                                  {columns.map(letter => (
                                    <div key={letter} className="text-center text-[10px] font-bold text-red-400">
                                      {letter}
                                    </div>
                                  ))}
                                </div>
                                <div className="grid grid-cols-5 gap-0.5">
                                  {[0, 1, 2, 3, 4].map(row => (
                                    columns.map(col => {
                                      const number = card.numbers[col][row];
                                      const isCenter = col === 'N' && row === 2;
                                      
                                      return (
                                        <div
                                          key={`${col}-${row}`}
                                          className={`aspect-square flex items-center justify-center text-[10px] font-bold rounded ${
                                            isCenter
                                              ? 'bg-gradient-to-br from-cyan-500 to-purple-500 text-white'
                                              : 'bg-gray-700 text-white'
                                          }`}
                                        >
                                          {isCenter ? 'T' : number}
                                        </div>
                                      );
                                    })
                                  ))}
                                </div>
                              </div>

                              <Button
                                onClick={() => handleClaimCard(card.cardNumber)}
                                disabled={isClaiming === card.cardNumber}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-10 text-sm font-semibold"
                              >
                                {isClaiming === card.cardNumber ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Claim Card
                                  </>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar - Lobby Info */}
            <div className="space-y-4">
              {/* Stats */}
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center pb-4 border-b border-white/10">
                    <div className="text-sm text-gray-400 mb-2">Available Cards</div>
                    <div className="text-4xl font-bold text-white">
                      {availableCards.length}
                      <span className="text-xl text-gray-500">/{lobby.total_cards}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Players Joined</span>
                      <span className="text-lg font-bold text-cyan-400">
                        {lobby.players?.length || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Status</span>
                      <Badge className={`${
                        lobby.status === 'waiting'
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          : 'bg-green-500/20 text-green-300 border-green-500/30'
                      }`}>
                        {lobby.status === 'waiting' ? 'WAITING' : 'ACTIVE'}
                      </Badge>
                    </div>

                    {lobby.call_interval && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Call Interval</span>
                        <span className="text-white font-bold">{lobby.call_interval}s</span>
                      </div>
                    )}
                  </div>

                  {isCreator && lobby.status === 'waiting' && lobby.players?.length > 0 && (
                    <Button
                      onClick={handleStartGame}
                      disabled={isStarting}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12 mt-4"
                    >
                      {isStarting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Start Game
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Players List */}
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    Players ({lobby.players?.length || 0})
                  </h3>

                  {lobby.players && lobby.players.length > 0 ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {lobby.players.map((player, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-black/30 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {player.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="text-white text-sm font-medium">
                              {player.name}
                            </span>
                          </div>
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                            #{player.cardNumber}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Users className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No players yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Share Code */}
              <Card className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                <CardContent className="p-6">
                  <h3 className="text-yellow-300 font-bold mb-3 text-sm">
                    📢 Share Game Code
                  </h3>
                  <div className="bg-black/40 rounded-lg p-4 mb-3 border border-yellow-500/30">
                    <div className="text-center">
                      <div className="text-3xl font-black text-yellow-400 tracking-widest mb-1">
                        {gameCode}
                      </div>
                      <div className="text-xs text-gray-400">Players enter this to join</div>
                    </div>
                  </div>
                  <Button
                    onClick={copyCode}
                    className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40"
                  >
                    {copiedCode ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
