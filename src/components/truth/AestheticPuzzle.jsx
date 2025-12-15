import React, { useState, useEffect } from 'react';
import { RotateCw, Check, Upload, Sparkles, Wand2 } from 'lucide-react';
import { solvePuzzle } from './puzzleSolver';
import { base44 } from "@/api/base44Client";

export default function AestheticPuzzle({ onSolve }) {
  const [tiles, setTiles] = useState([]);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [difficulty, setDifficulty] = useState(3);
  const [backgroundImage, setBackgroundImage] = useState('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800');
  const [history, setHistory] = useState([]);
  const [initialState, setInitialState] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [isAutoSolving, setIsAutoSolving] = useState(false);
  const solverIntervalRef = React.useRef(null);
  const solutionPathRef = React.useRef(null);
  const historyRef = React.useRef([]);

  useEffect(() => {
    initializePuzzle();
  }, [difficulty]);

  const initializePuzzle = () => {
    const size = difficulty;
    const totalTiles = size * size;
    const puzzleTiles = Array.from({ length: totalTiles - 1 }, (_, i) => i + 1);
    puzzleTiles.push(null);
    
    const initialHistory = [];
    
    // Shuffle - reduce iterations for larger grids to ensure auto-solve is reasonably fast (rewind strategy)
    // 3x3 uses smart solver so can be shuffled more. 4x4/5x5 use rewind so we keep shuffle efficient.
    // For 5x5 we reduce it further to make it solve faster while still looking shuffled
    const shuffleCount = size === 3 ? 500 : size === 4 ? 120 : 80; 
    
    for (let i = 0; i < shuffleCount; i++) {
      const emptyIndex = puzzleTiles.indexOf(null);
      const validMoves = getValidMoves(emptyIndex, size);
      
      // Prevent immediate backtracking during shuffle for better quality
      const lastEmpty = initialHistory.length > 0 ? initialHistory[initialHistory.length - 1] : -1;
      const candidates = validMoves.filter(m => m !== lastEmpty);
      // If we're stuck (corner case), use any valid move
      const moveSet = candidates.length > 0 ? candidates : validMoves;
      
      const randomMove = moveSet[Math.floor(Math.random() * moveSet.length)];
      
      // Record the empty position BEFORE the swap (this is where we need to move back to undo)
      initialHistory.push(emptyIndex);
      
      [puzzleTiles[emptyIndex], puzzleTiles[randomMove]] = [puzzleTiles[randomMove], puzzleTiles[emptyIndex]];
    }
    
    setTiles(puzzleTiles);
    setInitialState([...puzzleTiles]);
    setHistory(initialHistory);
    historyRef.current = initialHistory;
    setMoves(0);
    setSolved(false);
    setStartTime(Date.now());
    setIsAutoSolving(false);
    solutionPathRef.current = null;
  };

  const getValidMoves = (emptyIndex, size) => {
    const moves = [];
    const row = Math.floor(emptyIndex / size);
    const col = emptyIndex % size;
    
    if (row > 0) moves.push(emptyIndex - size);
    if (row < size - 1) moves.push(emptyIndex + size);
    if (col > 0) moves.push(emptyIndex - 1);
    if (col < size - 1) moves.push(emptyIndex + 1);
    
    return moves;
  };

  const handleVictory = async (finalTiles, manualWin = false) => {
    setSolved(true);
    // Auto-enter removed. User must click to enter.

    // Track user data for ML
    try {
        const user = await base44.auth.me();
        if (user) {
            await base44.entities.PuzzleSession.create({
                user_email: user.email,
                difficulty: difficulty,
                moves_count: moves + 1,
                time_taken_seconds: (Date.now() - startTime) / 1000,
                was_auto_solved: isAutoSolving || !manualWin,
                move_history: history,
                initial_state: initialState
            });
        }
    } catch (err) {
        console.error("Failed to track puzzle session", err);
    }
  };

  const handleTileClick = (index) => {
    if (solved) return;
    
    const emptyIndex = tiles.indexOf(null);
    const validMoves = getValidMoves(emptyIndex, difficulty);
    
    if (validMoves.includes(index)) {
      const newTiles = [...tiles];
      
      // Smart history: if we are undoing the last move, pop it. Otherwise push.
      const lastEmptyIndex = history[history.length - 1];
      let newHistory;
      
      if (index === lastEmptyIndex) {
          // We are moving the tile BACK to where it was (undoing)
          newHistory = history.slice(0, -1);
      } else {
          newHistory = [...history, emptyIndex];
      }
      setHistory(newHistory);
      historyRef.current = newHistory;
      
      // Invalidate calculated path if user interacts
      solutionPathRef.current = null;
      
      [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
      setTiles(newTiles);
      setMoves(moves + 1);
      
      const isSolved = newTiles.every((tile, i) => {
        if (i === newTiles.length - 1) return tile === null;
        return tile === i + 1;
      });
      
      if (isSolved) {
        handleVictory(newTiles, true);
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const autoSolveStep = () => {
    setTiles(prevTiles => {
        let targetIndex;
        // Use ref for latest history to avoid stale closures in interval
        let currentHistory = historyRef.current;
        let newHistory = [...currentHistory];

        // Try to get next move from A* path first
        if (solutionPathRef.current && solutionPathRef.current.length > 0) {
            targetIndex = solutionPathRef.current.shift();
        } else {
            // Fallback to history reversal (guaranteed solution)
            if (newHistory.length === 0) return prevTiles;
            targetIndex = newHistory.pop();
        }
        
        // Update history state in parent scope if we used history
        if (!solutionPathRef.current) {
            setHistory(newHistory);
            historyRef.current = newHistory;
        }

        const emptyIndex = prevTiles.indexOf(null);
        
        // If targetIndex is undefined (path empty or history empty), stop
        if (targetIndex === undefined) return prevTiles;

        const newTiles = [...prevTiles];
        [newTiles[emptyIndex], newTiles[targetIndex]] = [newTiles[targetIndex], newTiles[emptyIndex]];
        
        // Check if solved
        const isSolved = newTiles.every((tile, i) => {
           if (i === newTiles.length - 1) return tile === null;
           return tile === i + 1;
        });

        if (isSolved) {
           handleVictory(newTiles, false);
           stopAutoSolve();
        }

        return newTiles;
    });
  };

  const startAutoSolve = () => {
    if (solved) return;
    setIsAutoSolving(true);
    
    // Attempt to calculate optimal path if not already done
    if (!solutionPathRef.current && difficulty <= 3) {
        const path = solvePuzzle(tiles, difficulty);
        if (path) {
            solutionPathRef.current = path;
            console.log("A* Solution found:", path.length, "moves");
        } else {
            console.log("A* too complex, falling back to history reversal");
        }
    }

    if (solverIntervalRef.current) clearInterval(solverIntervalRef.current);
    // Ultra fast animation for smoother solve (10ms)
    solverIntervalRef.current = setInterval(autoSolveStep, 10);
  };

  const stopAutoSolve = () => {
    if (solverIntervalRef.current) {
      clearInterval(solverIntervalRef.current);
      solverIntervalRef.current = null;
    }
  };

  const getTilePosition = (index) => {
    const row = Math.floor(index / difficulty);
    const col = index % difficulty;
    const percentage = 100 / difficulty;
    // Fix background position calculation for percentage based sizing
    // When using percentage background-position, 0% is left/top, 100% is right/bottom
    // Formula: (current_index / (total_items - 1)) * 100
    // But easier with specific sizing:
    // If size is 3 (300%), positions are 0%, 50%, 100%
    const x = col / (difficulty - 1) * 100;
    const y = row / (difficulty - 1) * 100;
    
    return {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: `${difficulty * 100}% ${difficulty * 100}%`,
      backgroundPosition: `${x}% ${y}%`,
    };
  };

  const gridSize = difficulty === 3 ? 'grid-cols-3' : difficulty === 4 ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className="relative z-30 w-full max-w-md pointer-events-auto">
        {/* Compact Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center justify-center gap-2 drop-shadow-lg">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            Puzzle
          </h1>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-5">
          {/* Controls Row */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <div className="text-sm">
              <div className="text-gray-500 text-xs">Moves</div>
              <div className="text-2xl font-bold text-gray-800">{moves}</div>
            </div>
            
            <div className="flex gap-1">
              {[3, 4, 5].map(size => (
                <button
                  key={size}
                  onClick={() => setDifficulty(size)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm transition ${
                    difficulty === size 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {size}×{size}
                </button>
              ))}
            </div>

            <button
              onClick={initializePuzzle}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white w-10 h-10 rounded-lg flex items-center justify-center transition shadow-lg"
              title="New Game"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-4 flex justify-center">
            <button
              onMouseDown={startAutoSolve}
              onMouseUp={stopAutoSolve}
              onMouseLeave={stopAutoSolve}
              onTouchStart={startAutoSolve}
              onTouchEnd={stopAutoSolve}
              disabled={solved || history.length === 0}
              className={`
                relative flex items-center gap-2 px-6 py-2 rounded-full font-bold text-white shadow-lg transition-all active:scale-95 overflow-hidden
                ${solved || history.length === 0 
                  ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 ring-2 ring-white/20'
                }
              `}
            >
              {isAutoSolving && (
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              )}
              <Wand2 className={`w-4 h-4 ${isAutoSolving ? 'animate-spin' : 'animate-pulse'}`} />
              <span>
                {isAutoSolving 
                  ? `Solving... (${history.length} left)`
                  : 'Hold to Auto-Solve'
                }
              </span>
            </button>
          </div>

          {/* Image Upload */}
          <div className="mb-4">
            <label className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2.5 rounded-xl cursor-pointer hover:from-orange-600 hover:to-pink-600 transition shadow-lg">
              <Upload className="w-4 h-4" />
              <span className="text-sm font-semibold">Upload Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Puzzle Grid */}
          <div className={`grid ${gridSize} gap-2 mb-4 bg-gray-800/20 p-2 rounded-2xl`}>
            {tiles.map((tile, index) => {
              // Only render tiles, null is the empty space
              return (
                <div
                  key={index}
                  onClick={() => handleTileClick(index)}
                  className={`
                    aspect-square rounded-xl flex items-center justify-center font-bold text-2xl
                    transition-all duration-200 cursor-pointer relative overflow-hidden
                    ${tile === null 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : 'hover:scale-105 shadow-xl border-2 border-white/50'
                    }
                  `}
                  style={tile !== null ? getTilePosition(tile - 1) : {}}
                >
                  {tile !== null && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                  )}
                  {tile !== null && (
                    <span className="relative z-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-black text-3xl">
                      {tile}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Victory Message */}
          {solved && (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-4 text-center shadow-xl">
                <div className="flex items-center justify-center gap-2 text-white mb-2">
                  <Check className="w-6 h-6" />
                  <div>
                    <div className="text-xl font-bold">Solved!</div>
                    <div className="text-sm opacity-90">{moves} moves</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={onSolve}
                className="w-full py-4 bg-white text-black font-black text-xl rounded-2xl shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <span>ENTER TRUTH</span>
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Tip */}
          {!solved && (
            <div className="text-center text-xs text-gray-500">
              Click tiles next to empty space to slide
            </div>
          )}
        </div>
    </div>
  );
}