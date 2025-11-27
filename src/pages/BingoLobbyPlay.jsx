
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Trophy, Shield, ArrowLeft, Users, Sparkles, CheckCircle2, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BingoLobbyPlayPage() {
  const [searchParams] = useSearchParams();
  const gameCode = searchParams.get('code');
  const cardNumber = parseInt(searchParams.get('card'));
  
  const [user, setUser] = useState(null);
  const [game, setGame] = useState(null);
  const [myCard, setMyCard] = useState(null);
  const [revealedWords, setRevealedWords] = useState([]);
  const [myReveals, setMyReveals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevealing, setIsRevealing] = useState(null);
  const [winner, setWinner] = useState(null);
  const [fullSeedPhrase, setFullSeedPhrase] = useState(null);
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [gameMaster, setGameMaster] = useState(null);
  const [nextCallIn, setNextCallIn] = useState(null);

  useEffect(() => {
    loadGame();
    
    const interval = setInterval(() => {
      loadGame(true);
      tickGameMaster();
    }, 2000);

    return () => clearInterval(interval);
  }, [gameCode, cardNumber]);

  useEffect(() => {
    if (gameMaster?.next_call_time) {
      const timer = setInterval(() => {
        const seconds = Math.max(0, Math.floor((new Date(gameMaster.next_call_time) - Date.now()) / 1000));
        setNextCallIn(seconds);
      }, 500);

      return () => clearInterval(timer);
    }
  }, [gameMaster?.next_call_time]);

  const tickGameMaster = async () => {
    if (!gameCode) return;

    try {
      await base44.functions.invoke('bingoGameMaster', {
        game_code: gameCode.toUpperCase(),
        action: 'tick'
      });
    } catch (err) {
      console.log('GM tick failed:', err);
    }
  };

  const loadGame = async (silent = false) => {
    if (!silent) setIsLoading(true);
    
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const games = await base44.entities.BingoGame.filter({
        game_code: gameCode.toUpperCase()
      });

      if (games.length === 0) {
        if (!silent) alert('Game not found');
        return;
      }

      const gameData = games[0];
      setGame(gameData);
      setRevealedWords(gameData.revealed_words || []);
      setGameMaster(gameData.game_master || null);

      if (gameData.winner_email) {
        setWinner(gameData.winner_email);
        if (gameData.winner_email === currentUser.email) {
          const seedPhrase = atob(gameData.encrypted_seed_phrase);
          setFullSeedPhrase(seedPhrase);
        }
      }

      const userCard = (gameData.cards || []).find(c => c.cardNumber === cardNumber);
      setMyCard(userCard);

      const userCardReveals = (gameData.revealed_words || []).filter(
        r => r.card_number === cardNumber
      );
      setMyReveals(userCardReveals);

    } catch (err) {
      console.error('Failed to load game:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleRevealWord = async (column, row, bingoNumber) => {
    if (!game || winner || isRevealing !== null) return;

    const wordIndex = getBoxIdFromPosition(column, row);
    const alreadyRevealed = myReveals.find(r => r.word_index === wordIndex);
    if (alreadyRevealed) return;

    // FREE space is always clickable
    if (bingoNumber !== 'FREE') {
      // Check if number was called by AI
      const wasCalled = gameMaster?.called_numbers?.some(ball => ball.number === bingoNumber);
      if (!wasCalled) {
        alert(`❌ ${column}-${bingoNumber} hasn't been called yet!\n\nWait for the AI Game Master to call it.`);
        return;
      }
    }

    setIsRevealing(wordIndex);

    try {
      const response = await base44.functions.invoke('revealBingoWord', {
        game_id: game.game_id,
        word_index: wordIndex,
        card_number: cardNumber
      });

      if (response.data.success) {
        await loadGame(true);
        
        if (response.data.is_winner) {
          setWinner('YOU');
          setFullSeedPhrase(response.data.full_seed_phrase);
          
          // Show big winner announcement
          setTimeout(() => {
            alert(`🎉🎉🎉 BINGO! YOU WON! 🎉🎉🎉\n\nYou revealed all 24 words first!\n\nPrize: ${game.prize_amount} KAS\n\nYour seed phrase is displayed above. Copy it now!`);
          }, 500);
        }
      }
    } catch (err) {
      console.error('Failed to reveal word:', err);
      alert('❌ Failed to reveal: ' + err.message);
    } finally {
      setIsRevealing(null);
    }
  };

  const getWordStatus = (wordIndex) => {
    return revealedWords.find(r => r.word_index === wordIndex && r.card_number === cardNumber);
  };

  const getBoxIdFromPosition = (column, row) => {
    const columns = ['B', 'I', 'N', 'G', 'O'];
    const colIndex = columns.indexOf(column);
    const flatIndex = row * 5 + colIndex;
    return flatIndex > 12 ? flatIndex - 1 : flatIndex;
  };

  const copyPhrase = () => {
    if (fullSeedPhrase) {
      navigator.clipboard.writeText(fullSeedPhrase);
      setCopiedPhrase(true);
      setTimeout(() => setCopiedPhrase(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!game || !myCard) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-950 border-zinc-800 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Game Not Found</h2>
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

  const columns = ['B', 'I', 'N', 'G', 'O'];
  const isWinner = winner === user?.email || winner === 'YOU';
  const isNumberCallable = (number) => {
    if (number === 'FREE') return true;
    return gameMaster?.called_numbers?.some(ball => ball.number === number);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Link to={createPageUrl("BingoLobbyBrowser")}>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </motion.div>

          {/* Winner Banner */}
          <AnimatePresence>
            {isWinner && fullSeedPhrase && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3 animate-bounce" />
                      <h2 className="text-3xl font-bold text-yellow-400 mb-2">🎉 BINGO! YOU WON! 🎉</h2>
                      <p className="text-white">You revealed all 24 words first!</p>
                      <p className="text-yellow-300 font-bold text-xl mt-2">Prize: {game.prize_amount} KAS</p>
                    </div>

                    <div className="bg-black/60 rounded-lg p-4 mb-4">
                      <div className="text-xs text-gray-400 mb-2 text-center font-bold">🔐 Your Winning Seed Phrase:</div>
                      <div className="grid grid-cols-6 gap-1">
                        {fullSeedPhrase.split(' ').map((word, idx) => (
                          <div key={idx} className="text-xs text-green-400 font-mono text-center bg-green-500/10 rounded px-1 py-1 border border-green-500/30">
                            {word}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={copyPhrase}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 h-12"
                    >
                      {copiedPhrase ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          ✅ Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 mr-2" />
                          Copy Seed Phrase
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Left Sidebar - AI Game Master */}
            <div className="space-y-4">
              {/* Current Call */}
              {gameMaster?.current_call && (
                <motion.div
                  key={gameMaster.current_call.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  className="relative"
                >
                  <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-xs text-yellow-300 mb-2 font-bold animate-pulse">🎱 NOW CALLING</div>
                        <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl border-4 border-white animate-bounce">
                          <div className="text-center">
                            <div className="text-white text-2xl font-bold drop-shadow-lg">
                              {gameMaster.current_call.letter}
                            </div>
                            <div className="text-white text-3xl font-bold drop-shadow-lg">
                              {gameMaster.current_call.number}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Call #{gameMaster.current_call.call_number}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Next Call Timer */}
              {gameMaster?.status === 'calling' && nextCallIn !== null && (
                <Card className="bg-zinc-950/90 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">⏰ Next Call In</div>
                      <div className="text-4xl font-bold text-cyan-400">{nextCallIn}s</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Call History */}
              {gameMaster?.call_history && gameMaster.call_history.length > 0 && (
                <Card className="bg-zinc-950/90 border-zinc-800">
                  <CardContent className="p-4">
                    <h3 className="text-white font-bold mb-3 text-sm">📜 Last Called</h3>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {gameMaster.call_history.map((call, idx) => (
                        <div key={call.id} className={`flex items-center gap-2 p-2 rounded ${
                          idx === 0 ? 'bg-green-500/20 border border-green-500/50' : 'bg-black/30'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {call.letter}
                          </div>
                          <div className="text-lg font-bold text-white">{call.number}</div>
                          {idx === 0 && <span className="ml-auto text-xs text-green-400">Latest</span>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Center - Bingo Card */}
            <div className="lg:col-span-2">
              <Card className="backdrop-blur-xl bg-gradient-to-br from-black/90 to-purple-900/30 border-white/20 shadow-2xl">
                <CardHeader className="border-b border-white/10 bg-black/60 p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                        Card #{myCard.cardNumber}
                      </h1>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                          {game.game_code}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Prize</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {game.prize_amount} KAS
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400">Your Progress</div>
                      <div className="text-xl font-bold text-cyan-400">
                        {myReveals.length}/24
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400">Players</div>
                      <div className="text-xl font-bold text-purple-400">
                        {game.players?.length || 0}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-400">Total Reveals</div>
                      <div className="text-xl font-bold text-white">
                        {revealedWords.length}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 md:p-6">
                  {/* BINGO Header */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {columns.map(letter => (
                      <div
                        key={letter}
                        className="text-center py-3 bg-gradient-to-br from-red-500/30 to-pink-600/30 border border-red-500/50 rounded-lg shadow-lg"
                      >
                        <span className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
                          {letter}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* BINGO Grid */}
                  <div className="grid grid-cols-5 gap-2 md:gap-3">
                    {[0, 1, 2, 3, 4].map(row => (
                      columns.map(column => {
                        const isCenter = column === 'N' && row === 2;
                        const wordIndex = getBoxIdFromPosition(column, row);
                        const bingoNumber = myCard.numbers[column][row];
                        const wordStatus = getWordStatus(wordIndex);
                        const isRevealed = !!wordStatus;
                        const isMine = wordStatus?.revealed_by === user?.email;
                        const isCurrentlyRevealing = isRevealing === wordIndex;
                        const canClick = isNumberCallable(bingoNumber);

                        return (
                          <button
                            key={`${column}-${row}`}
                            onClick={() => !isCenter && !winner && handleRevealWord(column, row, bingoNumber)}
                            disabled={isRevealed || winner || isCurrentlyRevealing || isCenter || !canClick}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all shadow-lg relative ${
                              isCenter
                                ? 'bg-gradient-to-br from-cyan-500 to-purple-500 border-2 border-white/50'
                                : isRevealed
                                  ? isMine
                                    ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-500'
                                    : 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-2 border-blue-500'
                                  : canClick
                                    ? 'bg-gradient-to-br from-yellow-500/40 to-orange-500/40 border-2 border-yellow-400 hover:scale-105 cursor-pointer active:scale-95'
                                    : 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {isCenter ? (
                              <div className="text-center">
                                <span className="text-2xl md:text-3xl font-black text-white">TTT</span>
                                <div className="text-xs text-white/70 mt-1">FREE</div>
                              </div>
                            ) : isCurrentlyRevealing ? (
                              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                            ) : !isRevealed ? (
                              <div className="text-center w-full px-1">
                                <div className="text-xs text-gray-400 font-bold mb-1">{column}</div>
                                <div className="text-3xl md:text-5xl font-black text-white drop-shadow-lg">
                                  {bingoNumber}
                                </div>
                                {canClick ? (
                                  <div className="text-[10px] text-yellow-400 mt-1 font-bold">CLICK!</div>
                                ) : (
                                  <div className="text-[10px] text-gray-600 mt-1">LOCKED</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center px-1 w-full">
                                <div className="text-xs text-gray-400 mb-1">#{wordStatus.word_index + 1}</div>
                                <div className={`text-sm md:text-base font-mono font-bold break-all ${
                                  isMine ? 'text-green-300' : 'text-blue-300'
                                }`}>
                                  {wordStatus.word}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">{column}-{bingoNumber}</div>
                              </div>
                            )}

                            {canClick && !isRevealed && !isCenter && (
                              <div className="absolute inset-0 border-2 border-yellow-400 rounded-lg pointer-events-none animate-pulse" />
                            )}
                          </button>
                        );
                      })
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="mt-6 flex items-center justify-center gap-4 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-yellow-500/40 border-2 border-yellow-400"></div>
                      <span className="text-gray-400">Called - Click Now!</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gray-800 border-2 border-gray-600 opacity-50"></div>
                      <span className="text-gray-400">Locked (Not Called)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-green-500/30 border-2 border-green-500"></div>
                      <span className="text-gray-400">Revealed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Leaderboard */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="backdrop-blur-xl bg-white/5 border-white/10 mb-4">
                  <CardContent className="p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      Leaderboard
                    </h3>

                    <div className="space-y-2">
                      {game.players?.map((player, idx) => {
                        const playerReveals = revealedWords.filter(r => r.card_number === player.cardNumber);
                        const isMe = player.email === user?.email;

                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between bg-black/30 rounded-lg p-3 border ${
                              isMe ? 'border-cyan-500/50' : 'border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                idx === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500'
                                : idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                                : idx === 2 ? 'bg-gradient-to-br from-orange-600 to-yellow-700'
                                : 'bg-gradient-to-br from-cyan-500 to-purple-500'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <div className="text-white font-medium text-sm">
                                  {player.name} {isMe && '(You)'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Card #{player.cardNumber}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-cyan-400">
                                {playerReveals.length}/24
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Game Stats */}
                {gameMaster && (
                  <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <h3 className="text-white font-bold mb-3 text-sm">Game Master</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Called:</span>
                          <span className="text-white font-bold">{gameMaster.called_numbers?.length || 0}/75</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Interval:</span>
                          <span className="text-cyan-400">{gameMaster.call_interval}s</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
