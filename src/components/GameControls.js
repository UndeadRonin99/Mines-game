import React from 'react';
import './GameControls.css';

function GameControls({
  gameState,
  onBuyInAndStart,
  onNewGameNoBet,
  onCashOut,
  entryFee,
  onEntryFeeChange,
  mineCount,
  onDifficultyChange,
  gridSize,
  onGridSizeChange
}) {
  const gridSizes = [3, 4, 5, 6, 7, 8];
  const maxMines = Math.floor((gridSize * gridSize) * 0.4);
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
            {gridSizes.map(size => (
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
            {mineOptions.map(mines => (
              <option key={mines} value={mines}>
                {mines} {mines === 1 ? 'Mine' : 'Mines'}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="entry-fee">Entry Fee (BDAG):</label>
          <input
            type="number"
            id="entry-fee"
            min="0.1"
            step="0.1"
            value={entryFee}
            onChange={(e) => onEntryFeeChange(Number(e.target.value))}
            disabled={gameState === 'playing'}
          />
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="btn new-game"
          onClick={onBuyInAndStart}
          disabled={entryFee <= 0 || gameState === 'playing'}
        >
          Enter & Start Round
        </button>

        <button
          className="btn new-game"
          onClick={onNewGameNoBet}
          disabled={gameState === 'playing'}
        >
          New Game (No Entry)
        </button>

        <button
          className="btn cash-out"
          onClick={onCashOut}
          disabled={gameState !== 'playing' || entryFee <= 0}
        >
          Collect Reward
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
}

export default GameControls;
