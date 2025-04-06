import React from 'react';
import './GameStats.css';

function GameStats({
  gameState,
  multiplier,
  entryFee,
  potentialReward,
  gameHash
}) {
  return (
    <div className="game-stats">
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-label">Entry Fee</div>
          <div className="stat-value">{entryFee.toFixed(2)}</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Multiplier</div>
          <div className="stat-value multiplier">{multiplier.toFixed(2)}x</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Potential Reward</div>
          <div className="stat-value potential-win">{potentialReward.toFixed(2)}</div>
        </div>
      </div>

      <div className="game-status">
        {gameState === 'waiting' && <p>Select your entry fee and click a tile to start</p>}
        {gameState === 'playing' && <p>Game in progress - find the gems!</p>}
        {gameState === 'won' && (
          <p className="status-success">
            You won {potentialReward.toFixed(2)} coins! 🎉
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
