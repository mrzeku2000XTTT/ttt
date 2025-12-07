import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RotateCw, ChevronLeft, ChevronRight, ChevronDown,
  Pause, Play, X, Zap, Target, Clock, Star, Settings, Copy, Volume2, VolumeX
} from "lucide-react";
import { toast } from "sonner";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: '#00f0f0' },
  O: { shape: [[1, 1], [1, 1]], color: '#f0f000' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000f0' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f0a000' }
};

export default function TetrisBattleGame({ match, user, ranking, onGameEnd, onExit }) {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState({ x: 4, y: 0 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [nextPieces, setNextPieces] = useState([]);
  const [heldPiece, setHeldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [combo, setCombo] = useState(0);
  const [garbageQueue, setGarbageQueue] = useState([]);
  const [timer, setTimer] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [ghostPieceEnabled, setGhostPieceEnabled] = useState(true);
  const gameLoopRef = useRef(null);
  const timerRef = useRef(null);

  function createEmptyBoard() {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
  }

  function getRandomPiece() {
    const pieces = Object.keys(TETROMINOS);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return { type: randomPiece, ...TETROMINOS[randomPiece] };
  }

  useEffect(() => {
    if (!currentPiece) {
      const next = [];
      for (let i = 0; i < 3; i++) {
        next.push(getRandomPiece());
      }
      setNextPieces(next);
      setCurrentPiece(next[0]);
      setNextPieces(prev => [...prev.slice(1), getRandomPiece()]);
    }
  }, [currentPiece]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameOver, isPaused]);

  const checkCollision = useCallback((piece, pos, boardState = board) => {
    if (!piece) return true;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;

          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) return true;
          if (newY >= 0 && boardState[newY][newX]) return true;
        }
      }
    }
    return false;
  }, [board]);

  const addGarbage = useCallback(() => {
    if (garbageQueue.length === 0) return;

    const newBoard = board.map(row => [...row]);
    const garbageLines = garbageQueue.reduce((a, b) => a + b, 0);

    for (let i = 0; i < garbageLines; i++) {
      newBoard.shift();
      const garbageLine = Array(BOARD_WIDTH).fill('garbage');
      const bombPos = Math.floor(Math.random() * BOARD_WIDTH);
      garbageLine[bombPos] = 'bomb';
      newBoard.push(garbageLine);
    }

    setBoard(newBoard);
    setGarbageQueue([]);
  }, [garbageQueue, board]);

  const mergePiece = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = board.map(row => [...row]);
    let bombsExploded = false;

    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            if (newBoard[boardY][boardX] === 'bomb') {
              bombsExploded = true;
              newBoard.splice(boardY, 1);
              newBoard.unshift(Array(BOARD_WIDTH).fill(0));
            } else {
              newBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      });
    });

    setBoard(newBoard);
    const linesCleared = clearLines(newBoard);

    if (linesCleared > 0) {
      setCombo(prev => prev + 1);
    } else {
      setCombo(0);
    }

    if (garbageQueue.length > 0) {
      addGarbage();
    }

    if (checkCollision(nextPieces[0], { x: 4, y: 0 }, newBoard)) {
      setGameOver(true);
      onGameEnd(score, lines);
    } else {
      setCurrentPiece(nextPieces[0]);
      setNextPieces(prev => [...prev.slice(1), getRandomPiece()]);
      setPosition({ x: 4, y: 0 });
      setCanHold(true);
    }
  }, [currentPiece, position, board, nextPieces, score, lines, garbageQueue, checkCollision, onGameEnd, addGarbage]);

  const clearLines = useCallback((boardState) => {
    const newBoard = boardState.filter(row => row.some(cell => cell === 0 || cell === 'garbage' || cell === 'bomb'));
    const linesCleared = BOARD_HEIGHT - newBoard.length;

    if (linesCleared > 0) {
      const emptyLines = Array(linesCleared).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
      setBoard([...emptyLines, ...newBoard]);

      let points = 0;
      switch (linesCleared) {
        case 1: points = 100; break;
        case 2: points = 300; break;
        case 3: points = 500; break;
        case 4: points = 800; break;
      }

      points *= level;
      points += combo * 50;

      setScore(prev => prev + points);
      setLines(prev => prev + linesCleared);
      setLevel(Math.floor((lines + linesCleared) / 10) + 1);

      // Calculate garbage to send
      if (match.mode === 'battle-2p' || match.mode === 'battle-6p') {
        const garbageToSend = calculateGarbage(linesCleared, combo);
        // TODO: Send garbage to opponents via backend function
      }
    }

    return linesCleared;
  }, [level, combo, lines, match.mode]);

  const calculateGarbage = (linesCleared, comboCount) => {
    let garbage = 0;
    switch (linesCleared) {
      case 1: garbage = 0; break;
      case 2: garbage = 1; break;
      case 3: garbage = 2; break;
      case 4: garbage = 4; break;
    }
    garbage += Math.floor(comboCount / 2);
    return garbage;
  };

  const moveDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    const newPos = { x: position.x, y: position.y + 1 };
    if (checkCollision(currentPiece, newPos)) {
      mergePiece();
    } else {
      setPosition(newPos);
    }
  }, [currentPiece, position, checkCollision, mergePiece, gameOver, isPaused]);

  const moveLeft = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    const newPos = { x: position.x - 1, y: position.y };
    if (!checkCollision(currentPiece, newPos)) {
      setPosition(newPos);
    }
  }, [currentPiece, position, checkCollision, gameOver, isPaused]);

  const moveRight = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    const newPos = { x: position.x + 1, y: position.y };
    if (!checkCollision(currentPiece, newPos)) {
      setPosition(newPos);
    }
  }, [currentPiece, position, checkCollision, gameOver, isPaused]);

  const rotateClockwise = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    const rotated = {
      ...currentPiece,
      shape: currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
      )
    };

    if (!checkCollision(rotated, position)) {
      setCurrentPiece(rotated);
    }
  }, [currentPiece, position, checkCollision, gameOver, isPaused]);

  const rotateCounterClockwise = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    const rotated = {
      ...currentPiece,
      shape: currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[row.length - 1 - i])
      )
    };

    if (!checkCollision(rotated, position)) {
      setCurrentPiece(rotated);
    }
  }, [currentPiece, position, checkCollision, gameOver, isPaused]);

  const holdPiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused || !canHold) return;

    if (heldPiece === null) {
      setHeldPiece(currentPiece);
      setCurrentPiece(nextPieces[0]);
      setNextPieces(prev => [...prev.slice(1), getRandomPiece()]);
      setPosition({ x: 4, y: 0 });
    } else {
      const temp = currentPiece;
      setCurrentPiece(heldPiece);
      setHeldPiece(temp);
      setPosition({ x: 4, y: 0 });
    }
    setCanHold(false);
  }, [currentPiece, heldPiece, nextPieces, gameOver, isPaused, canHold]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    let newY = position.y;
    while (!checkCollision(currentPiece, { x: position.x, y: newY + 1 })) {
      newY++;
    }

    const newBoard = board.map(row => [...row]);
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = newY + y;
          const boardX = position.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      });
    });

    setBoard(newBoard);
    clearLines(newBoard);

    if (checkCollision(nextPieces[0], { x: 4, y: 0 }, newBoard)) {
      setGameOver(true);
      onGameEnd(score, lines);
    } else {
      setCurrentPiece(nextPieces[0]);
      setNextPieces(prev => [...prev.slice(1), getRandomPiece()]);
      setPosition({ x: 4, y: 0 });
      setCanHold(true);
    }
  }, [currentPiece, position, board, nextPieces, score, lines, checkCollision, clearLines, onGameEnd, gameOver, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) return;

      const key = e.key.toLowerCase();

      switch (key) {
        case 'arrowleft':
        case 'a':
          moveLeft();
          break;
        case 'arrowright':
        case 'd':
          moveRight();
          break;
        case 'arrowdown':
        case 's':
          moveDown();
          break;
        case 'arrowup':
        case 'w':
        case 'x':
          rotateClockwise();
          break;
        case 'z':
        case 'control':
          rotateCounterClockwise();
          break;
        case 'c':
        case 'shift':
          holdPiece();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moveLeft, moveRight, moveDown, rotateClockwise, rotateCounterClockwise, holdPiece, hardDrop, gameOver]);

  useEffect(() => {
    if (gameOver || isPaused) return;

    const speed = Math.max(100, 800 - (level - 1) * 50);
    gameLoopRef.current = setInterval(moveDown, speed);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveDown, level, gameOver, isPaused]);

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);

    if (currentPiece && !gameOver) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        });
      });
    }

    return displayBoard;
  };

  const displayBoard = renderBoard();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    onExit();
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(user.created_wallet_address || '');
    toast.success('Address copied!');
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-black border border-cyan-500/30 rounded-xl p-4 max-w-4xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              TETRIS
            </h2>
            <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-1.5">
              <div className="w-7 h-7 bg-cyan-500/30 rounded-full flex items-center justify-center border border-cyan-500/50">
                <span className="text-cyan-400 font-bold text-xs">
                  {(user.username || user.email?.split('@')[0] || 'P')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">{user.username || user.email?.split('@')[0] || 'Player'}</p>
                <div className="flex items-center gap-1">
                  <p className="text-cyan-400 text-xs font-mono">
                    {user.created_wallet_address 
                      ? `${user.created_wallet_address.substring(0, 8)}...${user.created_wallet_address.slice(-4)}`
                      : 'No wallet'
                    }
                  </p>
                  {user.created_wallet_address && (
                    <button
                      onClick={copyAddress}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
              Rank {ranking?.rank || 1}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Clock className="w-4 h-4" />
              <span>{formatTime(timer)}</span>
            </div>
            <Button onClick={() => setShowSettings(true)} variant="ghost" size="icon" className="text-white/60 hover:text-cyan-400">
              <Settings className="w-5 h-5" />
            </Button>
            <Button onClick={handleExit} variant="ghost" size="icon" className="text-white/60 hover:text-red-400">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          {/* Game Board */}
          <div className="flex-1">
            <div className="bg-black/80 border border-cyan-500/30 rounded-lg p-1" style={{ aspectRatio: '10/20' }}>
              <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)` }}>
                {displayBoard.map((row, y) =>
                  row.map((cell, x) => (
                    <div
                      key={`${y}-${x}`}
                      className="aspect-square rounded-sm border border-white/5"
                      style={{
                        backgroundColor:
                          cell === 'garbage'
                            ? '#555'
                            : cell === 'bomb'
                            ? '#ff0000'
                            : cell || '#0a0a0a',
                        boxShadow: cell && cell !== 'garbage' && cell !== 'bomb' ? `0 0 10px ${cell}40` : 'none'
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            {gameOver && (
              <div className="mt-3 text-center">
                <p className="text-red-500 font-bold text-lg mb-2">GAME OVER!</p>
                <p className="text-white/60 text-sm">Final Score: {score}</p>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="w-32 space-y-2">
            {/* Stats */}
            <div className="bg-black/40 border border-white/10 rounded-lg p-2">
              <p className="text-white/60 text-[10px] mb-0.5">Score</p>
              <p className="text-white font-bold text-lg">{score}</p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-lg p-2">
              <p className="text-white/60 text-[10px] mb-0.5">Lines</p>
              <p className="text-cyan-400 font-bold text-lg">{lines}</p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-lg p-2">
              <p className="text-white/60 text-[10px] mb-0.5">Level</p>
              <p className="text-purple-400 font-bold text-lg">{level}</p>
            </div>

            {combo > 0 && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2">
                <p className="text-yellow-400 font-bold text-sm">
                  COMBO x{combo}
                </p>
              </div>
            )}

            {/* Hold */}
            <div className="bg-black/40 border border-white/10 rounded-lg p-2">
              <p className="text-white/60 text-[10px] mb-1">Hold</p>
              <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {Array(4)
                  .fill(0)
                  .map((_, y) =>
                    Array(4)
                      .fill(0)
                      .map((_, x) => {
                        const cell = heldPiece?.shape[y]?.[x];
                        return (
                          <div
                            key={`held-${y}-${x}`}
                            className="aspect-square rounded-sm"
                            style={{
                              backgroundColor: cell ? heldPiece.color : '#0a0a0a',
                              opacity: canHold ? 1 : 0.3
                            }}
                          />
                        );
                      })
                  )}
              </div>
            </div>

            {/* Next Pieces */}
            <div className="bg-black/40 border border-white/10 rounded-lg p-2">
              <p className="text-white/60 text-[10px] mb-1">Next</p>
              {nextPieces.slice(0, 3).map((piece, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {Array(4)
                      .fill(0)
                      .map((_, y) =>
                        Array(4)
                          .fill(0)
                          .map((_, x) => {
                            const cell = piece?.shape[y]?.[x];
                            return (
                              <div
                                key={`next-${i}-${y}-${x}`}
                                className="aspect-square rounded-sm"
                                style={{ backgroundColor: cell ? piece.color : '#0a0a0a' }}
                              />
                            );
                          })
                      )}
                  </div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <Button
              onClick={() => setIsPaused(!isPaused)}
              disabled={gameOver}
              variant="outline"
              size="sm"
              className="w-full bg-white/5 border-white/20 text-white h-8"
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="mt-3 flex gap-1 justify-center md:hidden">
          <Button onClick={moveLeft} size="sm" variant="outline" className="bg-white/5 border-white/20">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button onClick={rotateClockwise} size="sm" variant="outline" className="bg-white/5 border-white/20">
            <RotateCw className="w-5 h-5" />
          </Button>
          <Button onClick={moveDown} size="sm" variant="outline" className="bg-white/5 border-white/20">
            <ChevronDown className="w-5 h-5" />
          </Button>
          <Button onClick={moveRight} size="sm" variant="outline" className="bg-white/5 border-white/20">
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button onClick={hardDrop} size="sm" className="bg-cyan-500 hover:bg-cyan-600">
            Drop
          </Button>
          <Button onClick={holdPiece} size="sm" variant="outline" className="bg-white/5 border-white/20" disabled={!canHold}>
            Hold
          </Button>
        </div>

        {/* Exit Confirmation Modal */}
        {showExitConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <div className="bg-black border border-red-500/30 rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-white font-bold text-lg mb-2">Exit Game?</h3>
              <p className="text-white/60 text-sm mb-6">
                Your progress will be lost. Are you sure you want to exit?
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowExitConfirm(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmExit}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Exit
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <div className="bg-black border border-cyan-500/30 rounded-xl p-6 max-w-sm w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Settings</h3>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  size="icon"
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Sound */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-white/40" />
                    )}
                    <span className="text-white font-medium">Sound Effects</span>
                  </div>
                  <Button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    variant="outline"
                    size="sm"
                    className={soundEnabled ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/20 text-white/40'}
                  >
                    {soundEnabled ? 'ON' : 'OFF'}
                  </Button>
                </div>

                {/* Ghost Piece */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-medium">Ghost Piece</span>
                  </div>
                  <Button
                    onClick={() => setGhostPieceEnabled(!ghostPieceEnabled)}
                    variant="outline"
                    size="sm"
                    className={ghostPieceEnabled ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/20 text-white/40'}
                  >
                    {ghostPieceEnabled ? 'ON' : 'OFF'}
                  </Button>
                </div>

                {/* Game Speed Info */}
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <p className="text-cyan-400 text-xs font-semibold mb-1">Current Speed</p>
                  <p className="text-white text-sm">Level {level} - {Math.max(100, 800 - (level - 1) * 50)}ms</p>
                </div>
              </div>

              <Button
                onClick={() => setShowSettings(false)}
                className="w-full mt-4 bg-cyan-500 hover:bg-cyan-600"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}