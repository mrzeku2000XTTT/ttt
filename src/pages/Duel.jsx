import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Loader2, Trophy, Zap, Shield, Target, Clock, ArrowLeft } from "lucide-react";

export default function DuelPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lobby, setLobby] = useState(null);
  const [gameState, setGameState] = useState('waiting'); // waiting, ready, playing, finished
  const [countdown, setCountdown] = useState(3);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [player1Ready, setPlayer1Ready] = useState(false);
  const [player2Ready, setPlayer2Ready] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (gameState === 'ready' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'ready' && countdown === 0) {
      setGameState('playing');
      setTimeLeft(30);
    }
  }, [gameState, countdown]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      endGame();
    }
  }, [gameState, timeLeft]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const params = new URLSearchParams(window.location.search);
      const lobbyId = params.get('lobby');

      if (lobbyId) {
        const lobbyData = await base44.entities.DuelLobby.filter({ id: lobbyId }, '', 1);
        if (lobbyData.length > 0) {
          setLobby(lobbyData[0]);
          if (lobbyData[0].status === 'ready') {
            setGameState('ready');
          }
        }
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerReady = (playerNum) => {
    if (playerNum === 1) {
      setPlayer1Ready(true);
    } else {
      setPlayer2Ready(true);
    }

    if ((playerNum === 1 && player2Ready) || (playerNum === 2 && player1Ready)) {
      setGameState('ready');
    }
  };

  const handleClick = (playerNum) => {
    if (gameState !== 'playing') return;

    if (playerNum === 1) {
      setPlayer1Score(player1Score + 1);
    } else {
      setPlayer2Score(player2Score + 1);
    }
  };

  const endGame = () => {
    setGameState('finished');
    
    if (player1Score > player2Score) {
      setWinner('player1');
    } else if (player2Score > player1Score) {
      setWinner('player2');
    } else {
      setWinner('tie');
    }
  };

  const isPlayer1 = user && lobby && user.email === lobby.host_email;
  const isPlayer2 = user && lobby && user.email === lobby.guest_email;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="backdrop-blur-xl bg-white/5 border-white/10 max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-white mb-4">Lobby not found</p>
            <Button onClick={() => navigate(createPageUrl('DuelLobby'))}>
              Back to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-500/10 to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-cyan-500/10 to-transparent" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => navigate(createPageUrl('DuelLobby'))}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit Duel
            </Button>
            
            {gameState === 'playing' && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span className="text-2xl font-bold text-white">{timeLeft}s</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-red-400" />
              <span className="text-white font-bold">Quick Draw</span>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {gameState === 'ready' && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="text-9xl font-bold text-white">{countdown}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Overlay */}
      <AnimatePresence>
        {gameState === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 max-w-md">
              <CardContent className="p-8 text-center">
                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-white mb-4">
                  {winner === 'tie' ? "It's a Tie!" : 
                   winner === 'player1' ? `${lobby.host_username} Wins!` :
                   `${lobby.guest_username} Wins!`}
                </h2>
                <div className="flex justify-center gap-8 mb-6">
                  <div>
                    <p className="text-gray-400 text-sm">{lobby.host_username}</p>
                    <p className="text-3xl font-bold text-red-400">{player1Score}</p>
                  </div>
                  <div className="text-gray-500 text-2xl">-</div>
                  <div>
                    <p className="text-gray-400 text-sm">{lobby.guest_username}</p>
                    <p className="text-3xl font-bold text-cyan-400">{player2Score}</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(createPageUrl('DuelLobby'))}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500"
                >
                  Back to Lobby
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split Screen Game Area */}
      <div className="relative z-10 h-[calc(100vh-80px)] flex">
        {/* Player 1 Side (Red) */}
        <div className="w-1/2 border-r border-white/10 relative">
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-red-400 mb-2">{lobby.host_username}</h3>
              {lobby.host_wallet && (
                <p className="text-xs text-gray-500 font-mono">{lobby.host_wallet.substring(0, 20)}...</p>
              )}
            </div>

            {gameState === 'waiting' && isPlayer1 && !player1Ready && (
              <Button
                onClick={() => handlePlayerReady(1)}
                className="bg-red-500 hover:bg-red-600 h-16 px-8 text-lg"
              >
                <Shield className="w-6 h-6 mr-2" />
                Ready Up
              </Button>
            )}

            {gameState === 'waiting' && player1Ready && (
              <div className="text-green-400 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                <span>Ready!</span>
              </div>
            )}

            {gameState === 'playing' && (
              <button
                onClick={() => handleClick(1)}
                disabled={!isPlayer1}
                className={`w-64 h-64 rounded-full bg-gradient-to-br from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 flex items-center justify-center transition-transform active:scale-95 shadow-2xl ${!isPlayer1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Target className="w-32 h-32 text-white" />
              </button>
            )}

            <div className="mt-8 text-center">
              <p className="text-6xl font-bold text-red-400">{player1Score}</p>
              <p className="text-sm text-gray-500 mt-2">Clicks</p>
            </div>
          </div>
        </div>

        {/* Player 2 Side (Cyan) */}
        <div className="w-1/2 relative">
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-cyan-400 mb-2">{lobby.guest_username}</h3>
              {lobby.guest_wallet && (
                <p className="text-xs text-gray-500 font-mono">{lobby.guest_wallet.substring(0, 20)}...</p>
              )}
            </div>

            {gameState === 'waiting' && isPlayer2 && !player2Ready && (
              <Button
                onClick={() => handlePlayerReady(2)}
                className="bg-cyan-500 hover:bg-cyan-600 h-16 px-8 text-lg"
              >
                <Shield className="w-6 h-6 mr-2" />
                Ready Up
              </Button>
            )}

            {gameState === 'waiting' && player2Ready && (
              <div className="text-green-400 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                <span>Ready!</span>
              </div>
            )}

            {gameState === 'playing' && (
              <button
                onClick={() => handleClick(2)}
                disabled={!isPlayer2}
                className={`w-64 h-64 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 flex items-center justify-center transition-transform active:scale-95 shadow-2xl ${!isPlayer2 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Target className="w-32 h-32 text-white" />
              </button>
            )}

            <div className="mt-8 text-center">
              <p className="text-6xl font-bold text-cyan-400">{player2Score}</p>
              <p className="text-sm text-gray-500 mt-2">Clicks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}