import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import GameBoard from './components/GameBoard';
import GameControls from './components/GameControls';
import GameStats from './components/GameStats';
import { generateGameBoard, revealTile, calculateMultiplier } from './utils/gameLogic';

// House's private key (INSECURE for demonstration!)
const HOUSE_PRIVATE_KEY = '0x06c849b764969d2c9b011bb5fd7198ecb3e0e95c2edcfd08326ded87a2c7f68c';

// BDAG chain details
const BDAG_RPC_URL = 'https://rpc.primordial.bdagscan.com';
const BDAG_CHAIN_ID = '1043';
const BDAG_CHAIN_NAME = 'BlockDAG Testnet';
const BDAG_CURRENCY_SYMBOL = 'BDAG';
const BDAG_BLOCK_EXPLORER = 'https://primordial.bdagscan.com';

// Generates a random hash for provably fair seeding
function generateGameHash() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function App() {
  const [gridSize, setGridSize] = useState(5);
  const [mineCount, setMineCount] = useState(3);
  const [gameBoard, setGameBoard] = useState(null);

  // 'waiting', 'playing', 'won', 'lost'
  const [gameState, setGameState] = useState('waiting');

  const [revealedCount, setRevealedCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [betAmount, setBetAmount] = useState(1);
  const [potentialWin, setPotentialWin] = useState(0);
  const [gameHash, setGameHash] = useState('');

  // Player's wallet
  const [playerAddress, setPlayerAddress] = useState(null);
  const [betInProgress, setBetInProgress] = useState(false);

  // Create house signer
  function getHouseSigner() {
    const provider = new ethers.providers.JsonRpcProvider(BDAG_RPC_URL);
    return new ethers.Wallet(HOUSE_PRIVATE_KEY, provider);
  }

  // Optionally add BDAG network to MetaMask
  async function addBlockDAGNetwork() {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${parseInt(BDAG_CHAIN_ID, 10).toString(16)}`,
          chainName: BDAG_CHAIN_NAME,
          nativeCurrency: {
            name: 'BlockDAG Credits',
            symbol: BDAG_CURRENCY_SYMBOL,
            decimals: 18
          },
          rpcUrls: [BDAG_RPC_URL],
          blockExplorerUrls: [BDAG_BLOCK_EXPLORER]
        }]
      });
      console.log('BDAG network added or already present');
    } catch (err) {
      console.error('Failed to add BDAG network:', err);
    }
  }

  // #### Updated: Accept an initialState param (default 'waiting')
  function startNewGame(initialState = 'waiting') {
    const newHash = generateGameHash();
    const newBoard = generateGameBoard(gridSize, mineCount, newHash);

    setGameBoard(newBoard);
    setGameState(initialState); // use the param here
    setRevealedCount(0);
    setMultiplier(1);
    setPotentialWin(betAmount);
    setGameHash(newHash);
  }

  // Generate a board on mount or when gridSize / mineCount changes
  useEffect(() => {
    startNewGame('waiting');
    // eslint-disable-next-line
  }, [gridSize, mineCount]);

  // placeBet => user => house
  async function placeBet() {
    if (!playerAddress) {
      alert('Please connect your wallet first!');
      return false;
    }
    if (betAmount <= 0) {
      alert('Bet must be > 0');
      return false;
    }
    try {
      setBetInProgress(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const houseAddress = '0x32942276BC049530CD63EB23B3776DCd2317bAE7';
      const tx = {
        to: houseAddress,
        value: ethers.utils.parseEther(betAmount.toString()),
      };

      const txResp = await signer.sendTransaction(tx);
      console.log('Bet TX:', txResp);

      await txResp.wait();
      alert(`Bet of ${betAmount} BDAG sent to the house!`);
      return true;
    } catch (err) {
      console.error('Error placing bet:', err);
      alert(`Error placing bet: ${err.message}`);
      return false;
    } finally {
      setBetInProgress(false);
    }
  }

  // "Buy In & Start Round" => place bet, then set board to "playing"
  async function handleBuyInAndStart() {
    const success = await placeBet();
    if (success) {
      // No need to setGameState('playing') by itself
      // We'll do it in startNewGame
      startNewGame('playing'); 
    }
  }

  // "New Game (No Bet)" => use 'waiting' state
  function handleNewGameNoBet() {
    startNewGame('waiting');
  }

  // Reveal tile
  function handleTileClick(rowIndex, colIndex) {
    if (gameState === 'lost' || gameState === 'won') return;

    if (gameState === 'waiting') {
      alert('You must “Buy In & Start Round” first to place your bet and begin!');
      return;
    }

    const { newBoard, tileValue } = revealTile(gameBoard, rowIndex, colIndex);

    if (tileValue === 'mine') {
      setGameState('lost');
      // Reveal all mines
      const fullyRevealedBoard = newBoard.map(row =>
        row.map(tile => ({
          ...tile,
          isRevealed: tile.value === 'mine' ? true : tile.isRevealed
        }))
      );
      setGameBoard(fullyRevealedBoard);
    } else {
      setGameBoard(newBoard);
      setRevealedCount(prev => prev + 1);

      const newCount = revealedCount + 1;
      const newMult = calculateMultiplier(newCount, mineCount, gridSize);
      setMultiplier(newMult);
      setPotentialWin(betAmount * newMult);

      const totalTiles = gridSize * gridSize;
      const safeTiles = totalTiles - mineCount;
      if (newCount === safeTiles) {
        setGameState('won');
        payWinningsToPlayer();
      }
    }
  }

  // "Cash Out"
  function handleCashOut() {
    if (gameState === 'playing') {
      setGameState('won');
      alert(`You won ${potentialWin.toFixed(2)} BDAG!`);
      payWinningsToPlayer();
    }
  }

  // House => pay the player from private key
  async function payWinningsToPlayer() {
    if (!playerAddress) {
      console.error('No player address found!');
      return;
    }
    try {
      const houseSigner = getHouseSigner();
      const tx = {
        to: playerAddress,
        value: ethers.utils.parseEther(potentialWin.toString()),
      };

      const txResp = await houseSigner.sendTransaction(tx);
      console.log('House paying TX:', txResp);

      await txResp.wait();
      alert(`House paid ${potentialWin} BDAG to you!`);
    } catch (err) {
      console.error('Error paying winnings:', err);
      alert(`Error paying winnings: ${err.message}`);
    }
  }

  // Connect player's MetaMask
  async function connectWallet() {
    if (!window.ethereum) {
      alert('MetaMask not detected!');
      return;
    }
    await addBlockDAGNetwork();
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setPlayerAddress(accounts[0]);
      console.log('Player connected:', accounts[0]);
    } catch (err) {
      console.error('User rejected request:', err);
    }
  }

  // update bet & potential
  function handleBetChange(amt) {
    setBetAmount(amt);
    setPotentialWin(amt * multiplier);
  }
  function handleDifficultyChange(mines) {
    setMineCount(mines);
  }
  function handleGridSizeChange(size) {
    setGridSize(size);
  }

  // UI note
  let canPlayMsg = null;
  if (gameState === 'playing') {
    canPlayMsg = <p style={{ color: 'green' }}>You can click tiles now!</p>;
  } else if (gameState === 'waiting') {
    canPlayMsg = <p style={{ color: 'blue' }}>Buy In & Start Round to begin playing.</p>;
  } else if (gameState === 'won') {
    canPlayMsg = <p style={{ color: 'purple' }}>You won! Start a new game or place another bet.</p>;
  } else if (gameState === 'lost') {
    canPlayMsg = <p style={{ color: 'red' }}>You lost. The house keeps your bet. Try "New Game"!</p>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Mines Game – BDAG Demo</h1>
        {playerAddress ? (
          <p>Player Address: {playerAddress}</p>
        ) : (
          <button onClick={connectWallet}>Connect MetaMask (BDAG)</button>
        )}
      </header>

      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        {canPlayMsg}
      </div>

      {gameBoard && (
        <div className="game-container" style={{ marginTop: '20px' }}>
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
            onBuyInAndStart={handleBuyInAndStart}
            onNewGameNoBet={handleNewGameNoBet}
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

      <footer style={{ marginTop: '20px' }}>
        <p>Provably Fair Hash: {gameHash}</p>
        <p style={{ color: 'red' }}>
          WARNING: Hard-coded house private key. 
          For real usage, use a contract or secure server to manage house funds.
        </p>
      </footer>
    </div>
  );
}

export default App;
