import seedrandom from 'seedrandom';

// Generate a game board with randomly placed mines
export const generateGameBoard = (gridSize, mineCount, seed) => {
  // Initialize random number generator with seed for provably fair generation
  const rng = seedrandom(seed);

  // Create an empty board using `let` so we can modify its contents
  let board = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => ({
      value: 'gem', // default value; will be replaced for mines
      isRevealed: false,
    }))
  );

  // Place mines randomly
  let minesPlaced = 0;
  while (minesPlaced < mineCount) {
    const row = Math.floor(rng() * gridSize);
    const col = Math.floor(rng() * gridSize);

    // If this position doesn't already have a mine, place one
    if (board[row][col].value !== 'mine') {
      board[row][col].value = 'mine';
      minesPlaced++;
    }
  }

  return board;
};

// Reveal a tile on the game board
export const revealTile = (board, rowIndex, colIndex) => {
  // Create a deep copy of the board to avoid direct mutation
  const newBoard = board.map(row => row.map(tile => ({ ...tile })));

  // Mark the selected tile as revealed
  newBoard[rowIndex][colIndex].isRevealed = true;

  return {
    newBoard,
    tileValue: newBoard[rowIndex][colIndex].value,
  };
};

// Calculate the multiplier based on revealed tiles
export const calculateMultiplier = (revealedCount, mineCount, gridSize) => {
  const totalTiles = gridSize * gridSize;
  const safeTiles = totalTiles - mineCount;

  // Simple multiplier calculation: increases with each safe tile revealed
  const baseMultiplier = 1.2; // Starting multiplier
  const progressFactor = revealedCount / safeTiles;

  return 1 + (baseMultiplier ** progressFactor - 1);
};
