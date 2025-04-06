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

const Notification = ({ message, type }) => {
  if (!message) return null;
  return (
    <div className={`notification notification-${type}`}>
      {message}
    </div>
  );
};

function App() {
  const [gridSize, setGridSize] = useState(5);
  const [mineCount, setMineCount] = useState(3);
  const [gameBoard, setGameBoard] = useState(null);
  // 'waiting', 'playing', 'won', 'lost'
  const [gameState, setGameState] = useState('waiting');
  const [revealedCount, setRevealedCount] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [entryFee, setEntryFee] = useState(1);
  const [potentialReward, setPotentialReward] = useState(0);
  const [gameHash, setGameHash] = useState('');
  // Player's wallet
  const [playerAddress, setPlayerAddress] = useState(null);
 
  // Notification state
  const [notification, setNotification] = useState(null);

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

  // Helper to show notifications
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Accept an initialState param (default 'waiting')
  function startNewGame(initialState = 'waiting') {
    const newHash = generateGameHash();
    const newBoard = generateGameBoard(gridSize, mineCount, newHash);
    setGameBoard(newBoard);
    setGameState(initialState);
    setRevealedCount(0);
    setMultiplier(1);
    setPotentialReward(entryFee);
    setGameHash(newHash);
  }

  // Generate a board on mount or when gridSize / mineCount changes
  useEffect(() => {
    startNewGame('waiting');
    // eslint-disable-next-line
  }, [gridSize, mineCount]);

  // Send entry fee from user to house
  async function sendEntryFee() {
    if (!playerAddress) {
      showNotification('Please connect your wallet first!', 'error');
      return false;
    }
    if (entryFee <= 0) {
      showNotification('Entry fee must be > 0', 'error');
      return false;
    }
    try {
      setActionInProgress(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const houseAddress = '0x32942276BC049530CD63EB23B3776DCd2317bAE7';
      const tx = {
        to: houseAddress,
        value: ethers.utils.parseEther(entryFee.toString()),
      };

      const txResp = await signer.sendTransaction(tx);
      console.log('Entry TX:', txResp);
      await txResp.wait();
      showNotification(`Entry fee of ${entryFee} BDAG sent to the game!`, 'success');
      return true;
    } catch (err) {
      console.error('Error sending entry fee:', err);
      showNotification(`Error sending entry fee: ${err.message}`, 'error');
      return false;
    } finally {
      setActionInProgress(false);
    }
  }

  // "Enter & Start Round" => send entry fee, then set board to "playing"
  async function handleEnterAndStart() {
    const success = await sendEntryFee();
    if (success) {
      startNewGame('playing'); 
    }
  }

  // "New Game (No Entry)" => use 'waiting' state
  function handleNewGameNoEntry() {
    startNewGame('waiting');
  }

  // Reveal tile
  function handleTileClick(rowIndex, colIndex) {
    if (gameState === 'lost' || gameState === 'won') return;
    if (gameState === 'waiting') {
      showNotification('You must “Enter & Start Round” first to send your entry fee and begin!', 'info');
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
      setPotentialReward(entryFee * newMult);

      const totalTiles = gridSize * gridSize;
      const safeTiles = totalTiles - mineCount;
      if (newCount === safeTiles) {
        setGameState('won');
        payWinningsToPlayer();
      }
    }
  }

  // "Collect Reward"
  function handleCollectReward() {
    if (gameState === 'playing') {
      setGameState('won');
      showNotification(`You won ${potentialReward.toFixed(2)} BDAG!`, 'success');
      payWinningsToPlayer();
    }
  }

  // House pays the player from private key
  async function payWinningsToPlayer() {
    if (!playerAddress) {
      console.error('No player address found!');
      return;
    }
    try {
      const houseSigner = getHouseSigner();
      const tx = {
        to: playerAddress,
        value: ethers.utils.parseEther(potentialReward.toString()),
      };

      const txResp = await houseSigner.sendTransaction(tx);
      console.log('Game paying TX:', txResp);
      await txResp.wait();
      showNotification(`Game paid ${potentialReward} BDAG to you!`, 'success');
    } catch (err) {
      console.error('Error paying reward:', err);
      showNotification(`Error paying reward: ${err.message}`, 'error');
    }
  }

  // Connect player's MetaMask
  async function connectWallet() {
    if (!window.ethereum) {
      showNotification('MetaMask not detected!', 'error');
      return;
    }
    await addBlockDAGNetwork();
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setPlayerAddress(accounts[0]);
      console.log('Wallet connected');
    } catch (err) {
      console.error('User rejected request:', err);
    }
  }

  // update entry fee & potential reward
  function handleEntryFeeChange(amt) {
    setEntryFee(amt);
    setPotentialReward(amt * multiplier);
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
    canPlayMsg = <p style={{ color: 'blue' }}>Enter & Start Round to begin playing.</p>;
  } else if (gameState === 'won') {
    canPlayMsg = <p style={{ color: 'purple' }}>You won! Start a new game or send another entry fee.</p>;
  } else if (gameState === 'lost') {
    canPlayMsg = <p style={{ color: 'red' }}>You lost. The Game keeps your entry fee. Try "New Game"!</p>;
  }

  return (
    <div className="App">
      {/* Render Notification */}
      {notification && (
        <Notification message={notification.message} type={notification.type} />
      )}
      <header className="App-header">
        <h1>Mines Game – BDAG Demo</h1>
        {playerAddress ? (
          <p>Wallet Connected</p>
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
            entryFee={entryFee}
            potentialReward={potentialReward}
            gameHash={gameHash}
          />

          <GameBoard
            gameBoard={gameBoard}
            onTileClick={handleTileClick}
          />

          <GameControls
            gameState={gameState}
            onBuyInAndStart={handleEnterAndStart}
            onNewGameNoBet={handleNewGameNoEntry}
            onCashOut={handleCollectReward}
            entryFee={entryFee}
            onEntryFeeChange={handleEntryFeeChange}
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
          WARNING: Hard-coded Game private key. 
          For real usage, use a contract or secure server to manage Game funds.
        </p>
      </footer>
    </div>
  );
}

export default App;
