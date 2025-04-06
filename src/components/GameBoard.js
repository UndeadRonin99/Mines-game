import React from 'react';
import './GameBoard.css';

const GameBoard = ({ gameBoard, onTileClick }) => {
  if (!gameBoard || gameBoard.length === 0) {
    return <div className="game-board">Loading board...</div>;
  }

  return (
    <div className="game-board">
      {gameBoard.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="board-row">
          {row.map((tile, colIndex) => (
            <button
              key={`tile-${rowIndex}-${colIndex}`}
              className={`board-tile ${tile.isRevealed ? 'revealed' : ''} ${
                tile.isRevealed && tile.value === 'mine' ? 'mine' : 
                tile.isRevealed && tile.value === 'gem' ? 'gem' : ''
              }`}
              onClick={() => !tile.isRevealed && onTileClick(rowIndex, colIndex)}
              disabled={tile.isRevealed}
            >
              {tile.isRevealed ? (
                tile.value === 'mine' ? (
                  <span role="img" aria-label="mine">💣</span>
                ) : (
                  <span role="img" aria-label="gem">💎</span>
                )
              ) : (
                ''
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;
