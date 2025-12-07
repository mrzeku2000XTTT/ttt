import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RotateCw, ChevronLeft, ChevronRight, ChevronDown, Pause, Play, X } from "lucide-react";

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

export default function TetrisGame({ onClose }) {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState(null);
  const [position, setPosition] = useState({ x: 4, y: 0 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [nextPiece, setNextPiece] = useState(null);
  const gameLoopRef = useRef(null);

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
      setCurrentPiece(getRandomPiece());
      setNextPiece(getRandomPiece());
    }
  }, [currentPiece]);

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

  const mergePiece = useCallback(() => {
    if (!currentPiece) return;
    
    const newBoard = board.map(row => [...row]);
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      });
    });
    
    setBoard(newBoard);
    clearLines(newBoard);
    
    if (checkCollision(nextPiece, { x: 4, y: 0 }, newBoard)) {
      setGameOver(true);
    } else {
      setCurrentPiece(nextPiece);
      setNextPiece(getRandomPiece());
      setPosition({ x: 4, y: 0 });
    }
  }, [currentPiece, position, board, nextPiece, checkCollision]);

  const clearLines = useCallback((boardState) => {
    const newBoard = boardState.filter(row => row.some(cell => cell === 0));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    
    if (linesCleared > 0) {
      const emptyLines = Array(linesCleared).fill(null).map(() => Array(BOARD_WIDTH).fill(0));
      setBoard([...emptyLines, ...newBoard]);
      setScore(prev => prev + linesCleared * 100 * level);
      setLevel(prev => Math.floor(score / 1000) + 1);
    }
  }, [level, score]);

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

  const rotate = useCallback(() => {
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

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    
    let newY = position.y;
    while (!checkCollision(currentPiece, { x: position.x, y: newY + 1 })) {
      newY++;
    }
    setPosition({ x: position.x, y: newY });
    mergePiece();
  }, [currentPiece, position, checkCollision, mergePiece, gameOver, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) return;
      
      switch(e.key) {
        case 'ArrowLeft': moveLeft(); break;
        case 'ArrowRight': moveRight(); break;
        case 'ArrowDown': moveDown(); break;
        case 'ArrowUp': rotate(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
        case 'p': setIsPaused(prev => !prev); break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moveLeft, moveRight, moveDown, rotate, hardDrop, gameOver]);

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

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setPosition({ x: 4, y: 0 });
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
  };

  const displayBoard = renderBoard();

  return (
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
        className="bg-black border border-cyan-500/30 rounded-2xl p-6 max-w-2xl w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            TETRIS
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-6 items-start">
          {/* Game Board */}
          <div className="flex-1">
            <div className="bg-black/80 border-2 border-cyan-500/30 rounded-lg p-2" style={{ aspectRatio: '10/20' }}>
              <div className="grid gap-[1px]" style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)` }}>
                {displayBoard.map((row, y) => 
                  row.map((cell, x) => (
                    <div
                      key={`${y}-${x}`}
                      className="aspect-square rounded-sm border border-white/5"
                      style={{ 
                        backgroundColor: cell || '#0a0a0a',
                        boxShadow: cell ? `0 0 10px ${cell}40` : 'none'
                      }}
                    />
                  ))
                )}
              </div>
            </div>

            {gameOver && (
              <div className="mt-4 text-center">
                <p className="text-red-500 font-bold text-xl mb-2">GAME OVER!</p>
                <Button onClick={resetGame} className="bg-cyan-500 hover:bg-cyan-600">
                  Play Again
                </Button>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="w-40 space-y-4">
            <div className="bg-black/40 border border-white/10 rounded-lg p-4">
              <p className="text-white/60 text-xs mb-1">Score</p>
              <p className="text-white font-bold text-2xl">{score}</p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-lg p-4">
              <p className="text-white/60 text-xs mb-1">Level</p>
              <p className="text-cyan-400 font-bold text-2xl">{level}</p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-lg p-4">
              <p className="text-white/60 text-xs mb-2">Next</p>
              <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {nextPiece && Array(4).fill(0).map((_, y) =>
                  Array(4).fill(0).map((_, x) => {
                    const cell = nextPiece.shape[y]?.[x];
                    return (
                      <div
                        key={`${y}-${x}`}
                        className="aspect-square rounded-sm"
                        style={{ backgroundColor: cell ? nextPiece.color : '#0a0a0a' }}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <Button
              onClick={() => setIsPaused(!isPaused)}
              disabled={gameOver}
              variant="outline"
              className="w-full bg-white/5 border-white/20 text-white"
            >
              {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>

            <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white/60 space-y-1">
              <p>← → : Move</p>
              <p>↑ : Rotate</p>
              <p>↓ : Soft Drop</p>
              <p>Space: Hard Drop</p>
              <p>P: Pause</p>
            </div>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="mt-4 flex gap-2 justify-center md:hidden">
          <Button onClick={moveLeft} size="sm" variant="outline" className="bg-white/5 border-white/20">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button onClick={rotate} size="sm" variant="outline" className="bg-white/5 border-white/20">
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
        </div>
      </motion.div>
    </motion.div>
  );
}