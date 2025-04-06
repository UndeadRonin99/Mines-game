import seedrandom from 'seedrandom';

// Generate a game board with randomly placed mines
export function generateGameBoard(gridSize, mineCount, seed) {
  // Initialize RNG
  const rng = seedrandom(seed);

  let board = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => ({
      value: 'gem',
      isRevealed: false,
    }))
  );

  let minesPlaced = 0;
  while (minesPlaced < mineCount) {
    const row = Math.floor(rng() * gridSize);
    const col = Math.floor(rng() * gridSize);

    if (board[row][col].value !== 'mine') {
      board[row][col].value = 'mine';
      minesPlaced++;
    }
  }
  return board;
}

// Reveal a tile
export function revealTile(board, rowIndex, colIndex) {
  // Deep copy
  const newBoard = board.map(row => row.map(tile => ({ ...tile })));
  newBoard[rowIndex][colIndex].isRevealed = true;
  return {
    newBoard,
    tileValue: newBoard[rowIndex][colIndex].value,
  };
}

// Calculate the multiplier
export function calculateMultiplier(revealedCount, mineCount, gridSize) {
  const totalTiles = gridSize * gridSize;
  const safeTiles = totalTiles - mineCount;

  const baseMultiplier = 1.2;
  const progressFactor = revealedCount / safeTiles;
  return 1 + (baseMultiplier ** progressFactor - 1);
}
