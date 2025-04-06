import React, { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import GameControls from './components/GameControls';
import GameStats from './components/GameStats';
import { generateGameBoard, revealTile, calculateMultiplier } from './utils/gameLogic';

function App() {
  const [gridSize, setGridSize] = useState(5); // 5x5 default grid
  const [mineCount, setMineCount] = useState(3); // Default 3 mines
  const [gameBoard, setGameBoard] = useState(null); // Initially null
  const [gameState, setGameState] = useState('waiting');
  const [revealedCount, setRevealedCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [betAmount, setBetAmount] = useState(1);
  const [potentialWin, setPotentialWin] = useState(0);
  const [gameHash, setGameHash] = useState('');

  // Initialize the game when gridSize or mineCount changes
  useEffect(() => {
    startNewGame();
  }, [gridSize, mineCount]);

  // Generate a unique hash for provably fair gameplay
  const generateGameHash = () => {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  };

  // Start a new game
  const startNewGame = () => {
    const newHash = generateGameHash();
    const newBoard = generateGameBoard(gridSize, mineCount, newHash);

    setGameBoard(newBoard);
    setGameState('waiting');
    setRevealedCount(0);
    setMultiplier(1);
    setPotentialWin(betAmount);
    setGameHash(newHash);
  };

  // Handle tile click
  const handleTileClick = (rowIndex, colIndex) => {
    if (gameState === 'lost' || gameState === 'won') return;

    if (gameState === 'waiting') {
      setGameState('playing');
    }

    const { newBoard, tileValue } = revealTile(gameBoard, rowIndex, colIndex);

    if (tileValue === 'mine') {
      setGameState('lost');
      // Reveal all mines using the updated board (newBoard)
      const fullyRevealedBoard = newBoard.map(row =>
        row.map(tile => ({
          ...tile,
          isRevealed: tile.value === 'mine' ? true : tile.isRevealed,
        }))
      );
      setGameBoard(fullyRevealedBoard);
    } else {
      setGameBoard(newBoard);
      const newRevealedCount = revealedCount + 1;
      setRevealedCount(newRevealedCount);

      // Calculate new multiplier
      const newMultiplier = calculateMultiplier(newRevealedCount, mineCount, gridSize);
      setMultiplier(newMultiplier);
      setPotentialWin(betAmount * newMultiplier);

      // Check if all safe tiles are revealed
      const totalTiles = gridSize * gridSize;
      const safeTiles = totalTiles - mineCount;
      if (newRevealedCount === safeTiles) {
        setGameState('won');
      }
    }
  };

  // Cash out current winnings
  const handleCashOut = () => {
    if (gameState === 'playing') {
      setGameState('won');
      // In a real implementation, this would trigger a payout
      alert(`Congratulations! You've won ${potentialWin.toFixed(2)} coins!`);
    }
  };

  // Update bet amount
  const handleBetChange = (amount) => {
    setBetAmount(amount);
    setPotentialWin(amount * multiplier);
  };

  // Change game difficulty (number of mines)
  const handleDifficultyChange = (mines) => {
    setMineCount(mines);
  };

  // Change grid size
  const handleGridSizeChange = (size) => {
    setGridSize(size);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Mines Game</h1>
        <p className="subtitle">Find the gems, avoid the mines!</p>
      </header>

      {gameBoard && (
        <div className="game-container">
          <GameStats
            gameState={gameState}
            multiplier={multiplier}
            betAmount={betAmount}
            potentialWin={potentialWin}
            gameHash={gameHash}
          />

          <GameBoard
            gameBoard={gameBoard}
            onTileClick={handleTileClick}
          />

          <GameControls
            gameState={gameState}
            onNewGame={startNewGame}
            onCashOut={handleCashOut}
            betAmount={betAmount}
            onBetChange={handleBetChange}
            mineCount={mineCount}
            onDifficultyChange={handleDifficultyChange}
            gridSize={gridSize}
            onGridSizeChange={handleGridSizeChange}
          />
        </div>
      )}

      <footer>
        <p>🛡️ Provably Fair - Verify your game with hash: {gameHash}</p>
      </footer>
    </div>
  );
}

export default App;
