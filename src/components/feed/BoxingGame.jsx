import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Trophy } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function BoxingGame({ post, onClose, user }) {
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [playerAction, setPlayerAction] = useState(null);
  const [opponentAction, setOpponentAction] = useState(null);
  const [combo, setCombo] = useState(0);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (!gameStarted || gameWon || gameLost) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 400;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(50, 50, 700, 300);

      // Player (left)
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(150, 200, 60, 100);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(160, 210, 15, 15); // eye
      if (playerAction === 'punch') {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(210, 240, 40, 10); // punch
      }

      // Opponent (right)
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(590, 200, 60, 100);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(620, 210, 15, 15); // eye
      if (opponentAction === 'punch') {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(550, 240, 40, 10); // punch
      }

      // Health bars
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(50, 20, health * 3, 20);
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(500, 20, opponentHealth * 3, 20);

      requestAnimationFrame(animate);
    };

    animate();
  }, [gameStarted, gameWon, gameLost, playerAction, opponentAction, health, opponentHealth]);

  const performAction = (action) => {
    if (gameLost || gameWon) return;

    setPlayerAction(action);
    setTimeout(() => setPlayerAction(null), 300);

    // Opponent AI
    const opponentMoves = ['punch', 'block', 'dodge'];
    const opponentMove = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];
    setOpponentAction(opponentMove);
    setTimeout(() => setOpponentAction(null), 300);

    // Combat logic
    if (action === 'punch' && opponentMove !== 'block' && opponentMove !== 'dodge') {
      const damage = 10 + Math.floor(Math.random() * 10);
      setOpponentHealth(prev => Math.max(0, prev - damage));
      setScore(prev => prev + damage);
      setCombo(prev => prev + 1);
    } else if (action === 'punch' && opponentMove === 'block') {
      setCombo(0);
    }

    if (opponentMove === 'punch' && action !== 'block' && action !== 'dodge') {
      const damage = 8 + Math.floor(Math.random() * 8);
      setHealth(prev => Math.max(0, prev - damage));
      setCombo(0);
    }
  };

  useEffect(() => {
    if (opponentHealth <= 0 && !gameWon) {
      handleWin();
    } else if (health <= 0 && !gameLost) {
      setGameLost(true);
    }
  }, [health, opponentHealth]);

  const handleWin = async () => {
    setGameWon(true);
    const finalScore = score + (health * 2);
    setScore(finalScore);
    
    try {
      await base44.entities.Post.update(post.id, {
        tips_received: (post.tips_received || 0) + 0.5
      });
      
      if (user) {
        const existingBadges = await base44.entities.UserBadge.filter({
          user_email: user.email,
          badge_name: 'Boxing Champion'
        });
        
        if (existingBadges.length === 0) {
          await base44.entities.UserBadge.create({
            user_email: user.email,
            badge_name: 'Boxing Champion',
            badge_emoji: '🥊',
            badge_color: '#FFD700',
            is_active: true
          });
        }
      }
    } catch (err) {
      console.error('Failed to save win:', err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border border-red-500/30 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.3)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-red-500/20 bg-black/40">
            <div className="flex items-center gap-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6901295fa9bcfaa0f5ba2c2a/f14ad4d81_image.png"
                alt="Boxing"
                className="w-12 h-12 object-contain"
              />
              <div>
                <h3 className="text-white font-black text-2xl">BOXING ARENA</h3>
                <p className="text-red-400 text-sm">Fight to Win!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
                <div className="text-red-400 text-xs">SCORE</div>
                <div className="text-white font-black text-2xl">{score}</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
                <div className="text-green-400 text-xs">COMBO</div>
                <div className="text-white font-black text-2xl">x{combo}</div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Game Area */}
          <div className="flex-1 relative flex items-center justify-center">
            {!gameStarted ? (
              <div className="text-center space-y-6">
                <h2 className="text-4xl font-black text-white mb-4">
                  Ready to Fight?
                </h2>
                <p className="text-red-400 mb-6">
                  Knock out your opponent to win Boxing Champion badge!
                </p>
                <Button
                  onClick={() => setGameStarted(true)}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-6 text-xl font-bold"
                >
                  START FIGHT
                </Button>
              </div>
            ) : gameWon ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center space-y-6"
              >
                <Trophy className="w-24 h-24 text-yellow-400 mx-auto animate-bounce" />
                <h2 className="text-5xl font-black text-white mb-4">
                  KNOCKOUT!
                </h2>
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-6">
                  <div className="text-red-400 text-lg mb-2">Final Score</div>
                  <div className="text-white font-black text-4xl">{score}</div>
                </div>
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <span className="text-4xl">🥊</span>
                  <span className="text-lg font-bold">Boxing Champion Badge Earned!</span>
                </div>
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-4 text-lg font-bold"
                >
                  Close
                </Button>
              </motion.div>
            ) : gameLost ? (
              <div className="text-center space-y-6">
                <h2 className="text-4xl font-black text-red-400 mb-4">
                  KNOCKED OUT!
                </h2>
                <p className="text-white/60">Better luck next time!</p>
                <Button
                  onClick={() => {
                    setHealth(100);
                    setOpponentHealth(100);
                    setScore(0);
                    setCombo(0);
                    setGameLost(false);
                    setGameStarted(false);
                  }}
                  className="bg-white/10 border border-white/20 text-white hover:bg-white/20"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <canvas
                  ref={canvasRef}
                  className="border-2 border-red-500/30 rounded-lg shadow-2xl"
                />
              </div>
            )}
          </div>

          {/* Controls */}
          {gameStarted && !gameWon && !gameLost && (
            <div className="p-6 border-t border-red-500/20 bg-black/40">
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={() => performAction('punch')}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-lg font-bold"
                >
                  🥊 PUNCH
                </Button>
                <Button
                  onClick={() => performAction('block')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg font-bold"
                >
                  🛡️ BLOCK
                </Button>
                <Button
                  onClick={() => performAction('dodge')}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg font-bold"
                >
                  💨 DODGE
                </Button>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-white/60">
                <div>Your Health: {health}%</div>
                <div>Opponent: {opponentHealth}%</div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}