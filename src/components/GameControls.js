import React from 'react';
import './GameControls.css';

const GameControls = ({
  gameState,
  onNewGame,
  onCashOut,
  betAmount,
  onBetChange,
  mineCount,
  onDifficultyChange,
  gridSize,
  onGridSizeChange
}) => {
  // Available grid sizes
  const gridSizes = [3, 4, 5, 6, 7, 8];
  
  // Dynamic mine count options based on grid size
  const maxMines = Math.floor((gridSize * gridSize) * 0.4); // Max 40% of tiles can be mines
  const mineOptions = Array.from({ length: maxMines }, (_, i) => i + 1);
  
  return (
    <div className="game-controls">
      <div className="control-section">
        <h3>Game Settings</h3>
        
        <div className="control-group">
          <label htmlFor="grid-size">Grid Size:</label>
          <select
            id="grid-size"
            value={gridSize}
            onChange={(e) => onGridSizeChange(Number(e.target.value))}
            disabled={gameState === 'playing'}
          >
            {gridSizes.map((size) => (
              <option key={size} value={size}>
                {size}x{size}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="mine-count">Number of Mines:</label>
          <select
            id="mine-count"
            value={mineCount}
            onChange={(e) => onDifficultyChange(Number(e.target.value))}
            disabled={gameState === 'playing'}
          >
            {mineOptions.map((mines) => (
              <option key={mines} value={mines}>
                {mines} {mines === 1 ? 'Mine' : 'Mines'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="bet-amount">Bet Amount:</label>
          <input
            type="number"
            id="bet-amount"
            min="0.1"
            step="0.1"
            value={betAmount}
            onChange={(e) => onBetChange(Number(e.target.value))}
            disabled={gameState === 'playing'}
          />
        </div>
      </div>
      
      <div className="action-buttons">
        <button
          className="btn new-game"
          onClick={onNewGame}
        >
          New Game
        </button>
        
        <button
          className="btn cash-out"
          onClick={onCashOut}
          disabled={gameState !== 'playing' || betAmount <= 0}
        >
          Cash Out
        </button>
      </div>
      
      <div className="difficulty-info">
        <p>
          <strong>Difficulty:</strong> {mineCount} mine{mineCount !== 1 ? 's' : ''} in a {gridSize}x{gridSize} grid
        </p>
        <p>
          <strong>Success Rate:</strong> {(((gridSize * gridSize - mineCount) / (gridSize * gridSize)) * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default GameControls;