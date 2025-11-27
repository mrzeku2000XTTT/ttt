import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Trophy, Shield, AlertCircle, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BingoWallet() {
  const [game, setGame] = useState(null);
  const [revealedWords, setRevealedWords] = useState([]);
  const [myReveals, setMyReveals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevealing, setIsRevealing] = useState(null);
  const [winner, setWinner] = useState(null);
  const [fullSeedPhrase, setFullSeedPhrase] = useState(null);
  const [copiedPhrase, setCopiedPhrase] = useState(false);

  useEffect(() => {
    loadActiveGame();
    const interval = setInterval(loadActiveGame, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveGame = async () => {
    try {
      const games = await base44.entities.BingoGame.filter({ status: 'active' }, '-created_date', 1);
      
      if (games.length > 0) {
        const activeGame = games[0];
        console.log('🎰 [Bingo] Game:', activeGame.game_id);
        console.log('🎲 [Bingo] Numbers:', activeGame.bingo_numbers);
        
        setGame(activeGame);
        setRevealedWords(activeGame.revealed_words || []);
        
        if (activeGame.winner_email) {
          setWinner(activeGame.winner_email);
        }

        const user = await base44.auth.me().catch(() => null);
        if (user) {
          const userReveals = (activeGame.revealed_words || []).filter(r => r.revealed_by === user.email);
          setMyReveals(userReveals);
        }
      } else {
        setGame(null);
      }
    } catch (err) {
      console.error('Failed to load game:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevealWord = async (wordIndex) => {
    if (!game || winner || isRevealing !== null) return;
    
    const alreadyRevealed = revealedWords.find(r => r.word_index === wordIndex);
    if (alreadyRevealed) return;

    setIsRevealing(wordIndex);

    try {
      const response = await base44.functions.invoke('revealBingoWord', {
        game_id: game.game_id,
        word_index: wordIndex
      });

      if (response.data.success) {
        await loadActiveGame();
        
        if (response.data.is_winner) {
          setWinner('YOU');
          setFullSeedPhrase(response.data.full_seed_phrase);
        }
      }
    } catch (err) {
      console.error('Failed to reveal word:', err);
    } finally {
      setIsRevealing(null);
    }
  };

  const getWordStatus = (wordIndex) => {
    return revealedWords.find(r => r.word_index === wordIndex);
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <Card className="bg-black/95 border border-white/10 max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-bold text-white/60 mb-2">No Active Bingo</h3>
          <p className="text-sm text-gray-400">Admin needs to create a game</p>
        </CardContent>
      </Card>
    );
  }

  const columns = ['B', 'I', 'N', 'G', 'O'];
  const bingoNumbers = game.bingo_numbers;
  const hasValidNumbers = bingoNumbers && 
                         bingoNumbers.B && 
                         bingoNumbers.I && 
                         bingoNumbers.N && 
                         bingoNumbers.G && 
                         bingoNumbers.O &&
                         bingoNumbers.B.length === 5;

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence>
        {winner === 'YOU' && fullSeedPhrase && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-gradient-to-br from-green-500/10 to-black border-2 border-green-500/50 rounded-xl p-4"
          >
            <div className="text-center mb-3">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-yellow-400">🎉 BINGO!</h2>
            </div>
            <div className="bg-black/80 rounded-lg p-3 mb-3">
              <div className="grid grid-cols-6 gap-1">
                {fullSeedPhrase.split(' ').map((word, idx) => (
                  <div key={idx} className="text-xs text-green-400 font-mono text-center bg-green-500/10 rounded px-1 py-0.5">
                    {word}
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={copyPhrase} className="w-full bg-green-500 hover:bg-green-600 h-10">
              <Copy className="w-4 h-4 mr-2" />
              {copiedPhrase ? '✅ Copied' : 'Copy Seed'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasValidNumbers && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-bold mb-1">⚠️ Game needs to be recreated</p>
              <p className="text-xs text-gray-400">Admin should delete this game and create a new one with the updated system.</p>
            </div>
          </div>
        </div>
      )}

      <Card className="bg-gradient-to-br from-black/95 to-purple-900/20 border border-white/20 overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-white/10 bg-black/80 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎰</span>
              <h2 className="text-xl font-bold text-white">Wallet Bingo</h2>
            </div>
            <div className="flex items-center gap-2">
              {hasValidNumbers && (
                <Badge className="bg-green-500/20 text-green-300 border-green-500/50 text-xs px-2 py-0.5">
                  <Shield className="w-3 h-3 mr-1" />
                  Valid
                </Badge>
              )}
              <Button onClick={loadActiveGame} variant="ghost" size="sm" className="h-8 w-8 p-0">
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white/5 rounded p-2 text-center">
              <div className="text-gray-400">You</div>
              <div className="text-lg font-bold text-cyan-400">{myReveals.length}/24</div>
            </div>
            <div className="bg-white/5 rounded p-2 text-center">
              <div className="text-gray-400">Total</div>
              <div className="text-lg font-bold text-purple-400">{revealedWords.length}/24</div>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-2 text-center">
              <div className="text-yellow-300">Prize</div>
              <div className="text-lg font-bold text-yellow-400">{game.prize_amount} KAS</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* BINGO Header */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {columns.map(letter => (
              <div 
                key={letter}
                className="text-center py-2 bg-gradient-to-br from-red-500/30 to-pink-600/30 border border-red-500/50 rounded-lg"
              >
                <span className="text-3xl font-black text-white drop-shadow-lg">{letter}</span>
              </div>
            ))}
          </div>

          {/* BINGO GRID */}
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map(row => (
              columns.map(column => {
                const isCenter = column === 'N' && row === 2;
                const wordIndex = getBoxIdFromPosition(column, row);
                
                // Get number - now properly handling the stored numbers
                let bingoNumber = 0;
                if (hasValidNumbers) {
                  const num = bingoNumbers[column][row];
                  // Handle both number and string types from database
                  bingoNumber = typeof num === 'number' ? num : parseInt(num);
                } else {
                  // Fallback for old games
                  const colIndex = columns.indexOf(column);
                  const ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
                  const [min, max] = ranges[column];
                  bingoNumber = min + ((row * 5 + colIndex) % (max - min + 1));
                }
                
                const wordStatus = getWordStatus(wordIndex);
                const isRevealed = !!wordStatus;
                const isMine = wordStatus?.revealed_by === myReveals[0]?.revealed_by;
                const isCurrentlyRevealing = isRevealing === wordIndex;

                return (
                  <button
                    key={`${column}-${row}`}
                    onClick={() => !isCenter && !winner && hasValidNumbers && handleRevealWord(wordIndex)}
                    disabled={isRevealed || winner || isCurrentlyRevealing || isCenter || !hasValidNumbers}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all shadow-md ${
                      isCenter
                        ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-2 border-cyan-500/50'
                        : isRevealed
                          ? isMine
                            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/60'
                            : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/60'
                          : hasValidNumbers
                            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 hover:border-cyan-500 hover:scale-105 cursor-pointer active:scale-95'
                            : 'bg-gradient-to-br from-red-900/30 to-black border-2 border-red-500/50 cursor-not-allowed'
                    }`}
                  >
                    {isCenter ? (
                      <div className="text-center">
                        <span className="text-2xl font-black text-white">TTT</span>
                        <div className="text-xs text-white/70">FREE</div>
                      </div>
                    ) : isCurrentlyRevealing ? (
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    ) : !isRevealed ? (
                      <div className="text-center">
                        <div className="text-xs text-gray-400 font-bold mb-0.5">{column}</div>
                        <div className="text-4xl font-black text-white drop-shadow-lg">
                          {bingoNumber}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">Click</div>
                      </div>
                    ) : (
                      <div className="text-center px-1">
                        <div className="text-xs text-gray-400 mb-0.5">#{wordStatus.word_index + 1}</div>
                        <div className={`text-sm font-mono font-bold break-all ${
                          isMine ? 'text-green-300' : 'text-blue-300'
                        }`}>
                          {wordStatus.word}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">{column}-{bingoNumber}</div>
                      </div>
                    )}
                  </button>
                );
              })
            ))}
          </div>

          {/* Compact Legend */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-800 border-2 border-gray-600"></div>
              <span className="text-gray-400">Shows #</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500"></div>
              <span className="text-gray-400">You</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-blue-500/20 border-2 border-blue-500"></div>
              <span className="text-gray-400">Others</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}