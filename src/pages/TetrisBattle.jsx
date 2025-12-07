import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, Trophy, Zap, Clock, Star, Target, Swords, Crown,
  Play, Loader2, ArrowLeft, TrendingUp, Award
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import TetrisBattleGame from "../components/tetris/TetrisBattleGame";
import TetrisLobby from "../components/tetris/TetrisLobby";

export default function TetrisBattlePage() {
  const [user, setUser] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameMode, setGameMode] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [showLobby, setShowLobby] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Get or create ranking
      const rankings = await base44.entities.TetrisRanking.filter({
        user_email: currentUser.email
      });

      if (rankings.length === 0) {
        const newRanking = await base44.entities.TetrisRanking.create({
          user_email: currentUser.email,
          username: currentUser.username || currentUser.email.split('@')[0],
          rank: 1,
          stars: 0,
          total_xp: 0
        });
        setRanking(newRanking);
      } else {
        setRanking(rankings[0]);
      }

      // Load leaderboard
      const allRankings = await base44.entities.TetrisRanking.list('-total_xp', 10);
      setLeaderboard(allRankings);

    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const gameModes = [
    {
      id: "battle-2p",
      name: "Battle 2P",
      icon: Swords,
      description: "1v1 competitive battle with bomb garbage",
      color: "from-red-500 to-orange-500",
      maxPlayers: 2,
      duration: 120
    },
    {
      id: "battle-6p",
      name: "Battle 6P",
      icon: Users,
      description: "6-player multiplayer chaos",
      color: "from-purple-500 to-pink-500",
      maxPlayers: 6,
      duration: 180
    },
    {
      id: "sprint",
      name: "Sprint",
      icon: Zap,
      description: "Race to clear 40 lines",
      color: "from-yellow-500 to-orange-500",
      maxPlayers: 1,
      duration: null
    },
    {
      id: "marathon",
      name: "Marathon",
      icon: Target,
      description: "Survive as long as you can",
      color: "from-cyan-500 to-blue-500",
      maxPlayers: 1,
      duration: null
    }
  ];

  const handleModeSelect = (mode) => {
    setGameMode(mode);
    if (mode.maxPlayers > 1) {
      setShowLobby(true);
    } else {
      startSinglePlayerGame(mode);
    }
  };

  const startSinglePlayerGame = async (mode) => {
    const match = await base44.entities.TetrisMatch.create({
      mode: mode.id,
      status: "in_progress",
      players: [{
        user_email: user.email,
        username: user.username || user.email.split('@')[0],
        rank: ranking?.rank || 1,
        score: 0,
        lines_cleared: 0,
        finished: false
      }],
      max_players: 1,
      start_time: new Date().toISOString()
    });
    setCurrentMatch(match);
  };

  const handleGameEnd = async (finalScore, linesCleared) => {
    if (!currentMatch) return;

    // Update match
    await base44.entities.TetrisMatch.update(currentMatch.id, {
      status: "completed",
      end_time: new Date().toISOString(),
      players: [{
        ...currentMatch.players[0],
        score: finalScore,
        lines_cleared: linesCleared,
        finished: true
      }]
    });

    // Update ranking
    const xpGained = Math.floor(finalScore / 10);
    await base44.entities.TetrisRanking.update(ranking.id, {
      total_xp: (ranking.total_xp || 0) + xpGained,
      total_games: (ranking.total_games || 0) + 1,
      total_lines_cleared: (ranking.total_lines_cleared || 0) + linesCleared,
      highest_score: Math.max(ranking.highest_score || 0, finalScore)
    });

    setCurrentMatch(null);
    setGameMode(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-black border-cyan-500/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
            <Button onClick={() => base44.auth.redirectToLogin()} className="bg-cyan-500 hover:bg-cyan-600">
              Login to Play
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentMatch) {
    return (
      <TetrisBattleGame
        match={currentMatch}
        user={user}
        ranking={ranking}
        onGameEnd={handleGameEnd}
        onExit={() => {
          setCurrentMatch(null);
          setGameMode(null);
        }}
      />
    );
  }

  if (showLobby && gameMode) {
    return (
      <TetrisLobby
        mode={gameMode}
        user={user}
        ranking={ranking}
        onMatchStart={(match) => {
          setCurrentMatch(match);
          setShowLobby(false);
        }}
        onCancel={() => {
          setShowLobby(false);
          setGameMode(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-20">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl("Gate")}>
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-cyan-400">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                  TETRIS BATTLE
                </h1>
                <p className="text-white/60 text-sm">Multiplayer Competitive Tetris</p>
              </div>
            </div>
          </div>

          {/* Player Stats */}
          {ranking && (
            <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{ranking.username}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                          Rank {ranking.rank}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < ranking.stars ? "text-yellow-400 fill-yellow-400" : "text-white/20"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-white/60 text-xs">Total XP</p>
                      <p className="text-white font-bold">{ranking.total_xp}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Wins</p>
                      <p className="text-green-400 font-bold">{ranking.wins}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Losses</p>
                      <p className="text-red-400 font-bold">{ranking.losses}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">High Score</p>
                      <p className="text-cyan-400 font-bold">{ranking.highest_score}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Game Modes */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {gameModes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <motion.div
                key={mode.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  onClick={() => handleModeSelect(mode)}
                  className="bg-black/40 border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <Badge className="bg-white/5 text-white/60">
                        {mode.maxPlayers} {mode.maxPlayers === 1 ? "Player" : "Players"}
                      </Badge>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">{mode.name}</h3>
                    <p className="text-white/60 text-sm mb-4">{mode.description}</p>
                    {mode.duration && (
                      <div className="flex items-center gap-2 text-white/40 text-xs">
                        <Clock className="w-3 h-3" />
                        <span>{mode.duration}s per match</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-black/40 border-cyan-500/30 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-bold text-xl">Leaderboard</h3>
              </div>
              <div className="space-y-2">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-black"
                            : index === 1
                            ? "bg-gray-400 text-black"
                            : index === 2
                            ? "bg-orange-600 text-white"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{player.username}</p>
                        <p className="text-white/40 text-xs">Rank {player.rank}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-bold">{player.total_xp} XP</p>
                      <p className="text-white/40 text-xs">
                        {player.wins}W / {player.losses}L
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}