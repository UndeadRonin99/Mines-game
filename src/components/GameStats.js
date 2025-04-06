import React from 'react';
import './GameStats.css';

function GameStats({
  gameState,
  multiplier,
  betAmount,
  potentialWin,
  gameHash
}) {
  return (
    <div className="game-stats">
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-label">Bet Amount</div>
          <div className="stat-value">{betAmount.toFixed(2)}</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Multiplier</div>
          <div className="stat-value multiplier">{multiplier.toFixed(2)}x</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Potential Win</div>
          <div className="stat-value potential-win">{potentialWin.toFixed(2)}</div>
        </div>
      </div>

      <div className="game-status">
        {gameState === 'waiting' && <p>Select your bet and click a tile to start</p>}
        {gameState === 'playing' && <p>Game in progress - find the gems!</p>}
        {gameState === 'won' && (
          <p className="status-success">
            You won {potentialWin.toFixed(2)} coins! 🎉
          </p>
        )}
        {gameState === 'lost' && (
          <p className="status-failure">
            You hit a mine! Game over.
          </p>
        )}
      </div>

      <div className="provably-fair">
        <details>
          <summary>Provably Fair Information</summary>
          <div className="fair-details">
            <p>Game Hash: <code>{gameHash}</code></p>
            <p>
              This game uses provably fair technology. You can verify the fairness
              of each round by checking the hash above.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}

export default GameStats;
