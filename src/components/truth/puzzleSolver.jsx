// Priority Queue implementation for A*
class PriorityQueue {
  constructor() {
    this.elements = [];
  }
  
  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }
  
  dequeue() {
    return this.elements.shift().element;
  }
  
  isEmpty() {
    return this.elements.length === 0;
  }
}

// Manhattan Distance Heuristic
function getManhattanDistance(tiles, size) {
  let distance = 0;
  for (let i = 0; i < tiles.length; i++) {
    const value = tiles[i];
    if (value !== null) {
      // Target position for value (value - 1 because values are 1-based)
      const targetRow = Math.floor((value - 1) / size);
      const targetCol = (value - 1) % size;
      
      // Current position
      const currentRow = Math.floor(i / size);
      const currentCol = i % size;
      
      distance += Math.abs(currentRow - targetRow) + Math.abs(currentCol - targetCol);
    }
  }
  return distance;
}

// Convert tiles array to string for Map keys
const serialize = (tiles) => JSON.stringify(tiles);

export function solvePuzzle(initialTiles, size) {
  // For 5x5 (24-puzzle), A* is too slow in JS without optimizations. 
  // We'll fallback to null so the UI uses the history-reverse method (guaranteed solution).
  if (size > 3) return null; 

  const startState = [...initialTiles];
  const goalState = Array.from({ length: size * size - 1 }, (_, i) => i + 1).concat([null]);
  const goalString = serialize(goalState);
  
  if (serialize(startState) === goalString) return [];
  
  const pq = new PriorityQueue();
  pq.enqueue({ tiles: startState, path: [], emptyIndex: startState.indexOf(null) }, 0);
  
  const visited = new Set();
  visited.add(serialize(startState));
  
  const maxNodes = 20000; // Safety limit to prevent freezing
  let nodes = 0;
  
  while (!pq.isEmpty()) {
    nodes++;
    if (nodes > maxNodes) return null; // Too complex for instant solve
    
    const { tiles, path, emptyIndex } = pq.dequeue();
    
    // Check neighbors
    const row = Math.floor(emptyIndex / size);
    const col = emptyIndex % size;
    const moves = [];
    
    if (row > 0) moves.push(emptyIndex - size); // Up
    if (row < size - 1) moves.push(emptyIndex + size); // Down
    if (col > 0) moves.push(emptyIndex - 1); // Left
    if (col < size - 1) moves.push(emptyIndex + 1); // Right
    
    for (const moveIndex of moves) {
      const newTiles = [...tiles];
      [newTiles[emptyIndex], newTiles[moveIndex]] = [newTiles[moveIndex], newTiles[emptyIndex]];
      const stateString = serialize(newTiles);
      
      if (!visited.has(stateString)) {
        if (stateString === goalString) {
          // Found it! Return the list of emptyIndex positions (moves)
          // Actually we want the sequence of moves. 
          // The `path` stores the sequence of emptyIndices (or the moves made).
          // Let's store the moveIndex (the tile that moved into empty space)
          return [...path, moveIndex];
        }
        
        visited.add(stateString);
        const h = getManhattanDistance(newTiles, size);
        const g = path.length + 1;
        pq.enqueue({ tiles: newTiles, path: [...path, moveIndex], emptyIndex: moveIndex }, g + h);
      }
    }
  }
  
  return null; // No solution found within limits
}