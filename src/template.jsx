import React, { useState, useEffect } from 'react';
import { Users, Crown, Eye, MessageCircle, Award, Play, RotateCcw } from 'lucide-react';
import styles from './BestLiarGame.module.css';
import { db } from './firebase';
import {
    doc, setDoc, updateDoc, onSnapshot, arrayUnion, getDoc, deleteDoc, arrayRemove
} from 'firebase/firestore';

const CARD_BANK = [

];

const CARD_BANK_1 = [

];

const CARD_BANK_2 = [

];

const BestLiarGame = () => {
  const [gameState, setGameState] = useState('home'); // home, lobby, playing, ended
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isRoomHead, setIsRoomHead] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [listener, setListener] = useState('');
  const [honestPlayer, setHonestPlayer] = useState('');
  const [currentWord, setCurrentWord] = useState(null);
  const [wtfCards, setWtfCards] = useState({});
  const [usedListeners, setUsedListeners] = useState([]);
  const [playerScores, setPlayerScores] = useState({});
  const [roundPhase, setRoundPhase] = useState('playing'); // playing, ended
  const [wtfCardsUsed, setWtfCardsUsed] = useState(0);
  const [displayWtfOnPlayer, setDisplayWtfOnPlayer] = useState(null);
  const [showFullScreenWtf, setShowFullScreenWtf] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const deleteRoom = async (code) => {
    try {
      await deleteDoc(doc(db, 'rooms', code));
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const createRoom = async () => {
    if (!currentPlayer.trim()) return;
    
    const code = generateRoomCode();
    const roomRef = doc(db, "rooms", code);

    try {
      await setDoc(roomRef, {
        gameState: 'lobby',
        players: [currentPlayer],
        playerScores: { [currentPlayer]: 0 },
        createdAt: Date.now(),
        currentRound: 1,
        listener: '',
        honestPlayer: '',
        currentWord: null,
        wtfCards: {},
        usedListeners: [],
        roundPhase: 'playing',
        wtfCardsUsed: 0
      });

      setRoomCode(code);
      setIsRoomHead(true);
      setGameState('lobby');
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Error creating room. Please try again.");
    }
  };

  const joinRoom = async (code) => {
    if (!currentPlayer.trim() || !code.trim()) return;
    
    const roomRef = doc(db, "rooms", code);
    
    try {
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        const data = roomSnap.data();
        
        // Check if player is already in the room
        if (data.players.includes(currentPlayer)) {
          alert("A player with this name is already in the room!");
          return;
        }
        
        // Check if room is full
        if (data.players.length >= 15) {
          alert("Room is full!");
          return;
        }
        
        await updateDoc(roomRef, {
          players: arrayUnion(currentPlayer),
          [`playerScores.${currentPlayer}`]: 0
        });

        setRoomCode(code);
        setIsRoomHead(false);
        setGameState('lobby');
      } else {
        alert("Room not found!");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Error joining room. Please try again.");
    }
  };

  const startGame = async () => {
    if (!isRoomHead) return;
    
    const roomRef = doc(db, "rooms", roomCode);
    
    try {
      const roomSnap = await getDoc(roomRef);
      const data = roomSnap.data();

      if (data.players.length >= 3) {
        const availableListeners = data.players.filter(p => !(data.usedListeners || []).includes(p));
        const newListener = availableListeners[Math.floor(Math.random() * availableListeners.length)];
        const remainingPlayers = data.players.filter(p => p !== newListener);
        const newHonestPlayer = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
        const randomWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];

        await updateDoc(roomRef, {
          listener: newListener,
          honestPlayer: newHonestPlayer,
          currentWord: randomWord,
          gameState: "playing",
          roundPhase: "playing",
          wtfCardsUsed: 0,
          wtfCards: {},
          usedListeners: data.usedListeners || [],
        });
      } else {
        alert("Need at least 3 players to start!");
      }
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Error starting game. Please try again.");
    }
  };

  const endRound = async () => {
    if (!isRoomHead) return;
    
    const roomRef = doc(db, "rooms", roomCode);
    let newScores = { ...playerScores };
    
    // Calculate scores
    Object.keys(wtfCards).forEach(player => {
      if (player === honestPlayer) {
        // Listener gave WTF card to honest player
        newScores[listener] = (newScores[listener] || 0) - 2;
        newScores[honestPlayer] = (newScores[honestPlayer] || 0) - 1;
      } else {
        // Listener found a liar
        newScores[listener] = (newScores[listener] || 0) + 1;
      }
    });
    
    // Liars who weren't found get points
    players.forEach(player => {
      if (player !== listener && player !== honestPlayer && !wtfCards[player]) {
        newScores[player] = (newScores[player] || 0) + 1;
      }
    });
    
    const newUsedListeners = [...usedListeners, listener];
    
    try {
      await updateDoc(roomRef, {
        playerScores: newScores,
        usedListeners: newUsedListeners,
        roundPhase: 'ended'
      });
      
      // Check if game should end
      if (newUsedListeners.length >= players.length) {
        await updateDoc(roomRef, {
          gameState: 'ended'
        });
      }
    } catch (error) {
      console.error("Error ending round:", error);
    }
  };

  const nextRound = async () => {
    if (!isRoomHead) return;
    
    const roomRef = doc(db, "rooms", roomCode);
    
    try {
      const roomSnap = await getDoc(roomRef);
      const data = roomSnap.data();
      
      const availableListeners = data.players.filter(p => !data.usedListeners.includes(p));
      const newListener = availableListeners[Math.floor(Math.random() * availableListeners.length)];
      const remainingPlayers = data.players.filter(p => p !== newListener);
      const newHonestPlayer = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
      const randomWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];

      await updateDoc(roomRef, {
        currentRound: currentRound + 1,
        listener: newListener,
        honestPlayer: newHonestPlayer,
        currentWord: randomWord,
        roundPhase: "playing",
        wtfCardsUsed: 0,
        wtfCards: {}
      });
    } catch (error) {
      console.error("Error starting next round:", error);
    }
  };

  const leaveRoom = async () => {
    if (!roomCode || !currentPlayer) return;
    
    const roomRef = doc(db, 'rooms', roomCode);
    
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      
      const data = roomSnap.data();
      const updatedPlayers = data.players.filter(p => p !== currentPlayer);
      
      // If this is the last player, delete the room
      if (updatedPlayers.length === 0) {
        await deleteRoom(roomCode);
        resetLocalState();
        return;
      }
      
      // Clean up player-related data
      const updatedPlayerScores = { ...data.playerScores };
      delete updatedPlayerScores[currentPlayer];
      
      const updatedUsedListeners = data.usedListeners.filter(p => p !== currentPlayer);
      
      // Clean up WTF cards
      const updatedWtfCards = { ...data.wtfCards };
      delete updatedWtfCards[currentPlayer];
      
      let updateData = {
        players: updatedPlayers,
        playerScores: updatedPlayerScores,
        usedListeners: updatedUsedListeners,
        wtfCards: updatedWtfCards
      };
      
      // Handle special game state updates
      if (data.gameState === 'playing') {
        let needsNewRound = false;
        
        // If the listener left
        if (data.listener === currentPlayer) {
          needsNewRound = true;
        }
        
        // If the honest player left
        if (data.honestPlayer === currentPlayer) {
          needsNewRound = true;
        }
        
        // If we need a new round but don't have enough players
        if (needsNewRound && updatedPlayers.length < 3) {
          updateData.gameState = 'lobby';
          updateData.listener = '';
          updateData.honestPlayer = '';
          updateData.currentWord = null;
          updateData.wtfCards = {};
          updateData.usedListeners = [];
          updateData.roundPhase = 'playing';
          updateData.wtfCardsUsed = 0;
          updateData.currentRound = 1;
        } else if (needsNewRound) {
          // Start a new round with remaining players
          const availableListeners = updatedPlayers.filter(p => !updatedUsedListeners.includes(p));
          if (availableListeners.length > 0) {
            const newListener = availableListeners[Math.floor(Math.random() * availableListeners.length)];
            const remainingPlayers = updatedPlayers.filter(p => p !== newListener);
            const newHonestPlayer = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
            const randomWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
            
            updateData.listener = newListener;
            updateData.honestPlayer = newHonestPlayer;
            updateData.currentWord = randomWord;
            updateData.wtfCards = {};
            updateData.wtfCardsUsed = 0;
            updateData.roundPhase = 'playing';
          } else {
            // All players have been listeners, end the game
            updateData.gameState = 'ended';
          }
        }
      }
      
      await updateDoc(roomRef, updateData);
      resetLocalState();
      
    } catch (error) {
      console.error("Error leaving room:", error);
      resetLocalState();
    }
  };

  const resetLocalState = () => {
    setGameState('home');
    setPlayers([]);
    setCurrentPlayer('');
    setRoomCode('');
    setInputRoomCode('');
    setIsRoomHead(false);
    setCurrentRound(1);
    setListener('');
    setHonestPlayer('');
    setCurrentWord(null);
    setWtfCards({});
    setUsedListeners([]);
    setPlayerScores({});
    setRoundPhase('playing');
    setWtfCardsUsed(0);
    setShowFullScreenWtf(false);
  };

  const resetGame = () => {
    leaveRoom();
  };

  const resetAndEndGame = () => {
    if (roomCode) {
      deleteRoom(roomCode);
    }
    resetLocalState();
  };


  const getRankings = () => {
    return Object.entries(playerScores)
      .sort(([,a], [,b]) => b - a)
      .map(([player, score], index) => ({ player, score, rank: index + 1 }));
  };

  // Firebase listener
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = doc(db, "rooms", roomCode);
    const unsub = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlayers(data.players || []);
        setPlayerScores(data.playerScores || {});
        setGameState(data.gameState || 'lobby');
        setListener(data.listener || '');
        setHonestPlayer(data.honestPlayer || '');
        setCurrentWord(data.currentWord || null);
        setWtfCards(data.wtfCards || {});
        setUsedListeners(data.usedListeners || []);
        setRoundPhase(data.roundPhase || 'playing');
        setWtfCardsUsed(data.wtfCardsUsed || 0);
        setCurrentRound(data.currentRound || 1);
        
        // Check if current player is room head (first player)
        if (data.players && data.players.length > 0) {
          setIsRoomHead(currentPlayer === data.players[0]);
        }
      }
    });

    return () => unsub();
  }, [roomCode, currentPlayer]);

  if (gameState === 'home') {
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={styles.card}>
            <h1 className={styles.title}>The Best Liar</h1>
            <p className={`${styles.subtitle} ${styles.textGray}`}>A social deduction game</p>
            
            <div className={`${styles.spaceY4} ${styles.mb8}`}>
              <input
                type="text"
                placeholder="Enter your name"
                value={currentPlayer}
                onChange={(e) => setCurrentPlayer(e.target.value)}
                className={styles.input}
              />
            </div>
            
            <div className={styles.spaceY3}>
              <button
                onClick={createRoom}
                disabled={!currentPlayer.trim()}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                <Users className={styles.icon} />
                Create Room
              </button>
              
              <div className={styles.flexGap2}>
                <input
                  type="text"
                  placeholder="Room Code"
                  value={inputRoomCode}
                  className={styles.inputSmall}
                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                />
                <button
                  onClick={() => joinRoom(inputRoomCode)}
                  disabled={!currentPlayer.trim() || !inputRoomCode.trim()}
                  className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className={styles.footer}>
            <p className={styles.footerText}>
            Rule
            </p>
        </div>
      </div>
    );
  }

  if (gameState === 'lobby') {
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={styles.cardSmall}>
            <div className={`${styles.textCenter} ${styles.mb6}`}>
              <h2 className={styles.heading}>Room: {roomCode}</h2>
              <p className={styles.textGray}>Players: {players.length}/15</p>
            </div>
            
            <div className={`${styles.spaceY2} ${styles.mb6}`}>
              {players.map((player, index) => (
                <div key={index} className={styles.playerItem}>
                  <span className={styles.playerName}>{player}</span>
                  {index === 0 && <Crown className={`${styles.icon} ${styles.iconYellow}`} />}
                </div>
              ))}
            </div>
            
            {isRoomHead && (
              <button
                onClick={startGame}
                disabled={players.length < 3}
                className={`${styles.button} ${styles.buttonSuccess}`}
              >
                <Play className={styles.icon} />
                Start Game {players.length < 3 && `(${3 - players.length} more needed)`}
              </button>
            )}
            
            {!isRoomHead && (
              <p className={styles.textGray}>Waiting for room host to start the game...</p>
            )}
            
            <button
              onClick={resetGame}
              className={`${styles.button} ${styles.buttonGray} ${styles.mt3}`}
            >
              Leave Room
            </button>
          </div>
        </div>
        {/* Footer */}
        <div className={styles.footer}>
            <p className={styles.footerText}>
            Rule
            </p>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className={styles.container}>
        <div className={styles.maxWidth2xl}>
          <div className={styles.cardSmall}>
            <div className={`${styles.textCenter} ${styles.mb6}`}>
              <h2 className={styles.heading}>Round {currentRound}</h2>
              <div className={`${styles.flexCenter} ${styles.mt2}`}>
                <Eye className={styles.icon} />
                <span className={styles.textGray}>Room: {roomCode}</span>
              </div>
            </div>            
            {!isRoomHead && (
              <>
                <button
                  onClick={leaveRoom}
                  className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonLeave}`}
                >
                  Leave the room
                </button>                    
              </>  
            )}          
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'ended') {
    
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={`${styles.card} ${styles.textCenter}`}>        
            <button
              onClick={resetAndEndGame}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              <RotateCcw className={styles.icon} />
              Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default BestLiarGame;