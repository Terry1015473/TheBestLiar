import React, { useState, useEffect } from 'react';
import { Users, Crown, Eye, MessageCircle, Award, Play, RotateCcw } from 'lucide-react';
import styles from './BestLiarGame.module.css';
import { db } from './firebase';
import {
    doc, setDoc, updateDoc, onSnapshot, arrayUnion, getDoc, deleteDoc, arrayRemove
} from 'firebase/firestore';

const WORD_BANK = [
  { word: "超一流運動選手的蛋", meaning: "來自《獵人×獵人》的虛構卡牌遊戲《貪婪之島》中一張極難獲得的道具卡，效果未知但稀有度極高。" }
];

const requiredPlayerNum = 2;

const SillyGooseGame = () => {
  const [gameState, setGameState] = useState('home'); // home, lobby, playing, ended
  
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('');
  
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isRoomHead, setIsRoomHead] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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
        createdAt: Date.now()
      });

      setGameState('lobby');
      setRoomCode(code);
      setIsRoomHead(true);
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

  const deleteRoom = async (code) => {
    try {
      await deleteDoc(doc(db, 'rooms', code));
    } catch (error) {
      console.error("Error deleting room:", error);
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

  const startGame = async () => {
    if (!isRoomHead) return;
    
    const roomRef = doc(db, "rooms", roomCode);
    
    try {
      const roomSnap = await getDoc(roomRef);
      const data = roomSnap.data();

      if (data.players.length >= requiredPlayerNum) {
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
        alert("Need at least ", requiredPlayerNum, " players to start!");
      }
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Error starting game. Please try again.");
    }
  };

  const resetGame = () => {
    leaveRoom();
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
        {/* Body */}
        <div className={styles.maxWidthMd}>
          <div className={styles.card}>
            {/* title */}
            <h1 className={styles.title}>Who's the Silly Goose?</h1>

            {/* subtitle */}
            <p className={`${styles.subtitle} ${styles.textGray}`}>A telepathy game</p>
            
            {/* player name input field */}
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
              {/* create room button */}
              <button
                onClick={createRoom}
                disabled={!currentPlayer.trim()}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                <Users className={styles.icon} />
                Create Room
              </button>
              
              <div className={styles.flexGap2}>
                {/* room code input field */}
                <input
                  type="text"
                  placeholder="Room Code"
                  value={inputRoomCode}
                  className={styles.inputSmall}
                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                />

                {/* join button */}
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
              每輪有三個提示，所有人可以討論選擇哪一個提示，但不能說出待會要寫的答案<br />
              <br />
              普通成員: 根據提示盡量和其他人寫出「一樣」的答案<br />
              糊塗鬼: 寫出「合理」但和其他人「不一樣」的答案<br />
              <br />
              遊戲共有七輪，其中有四輪全體答案一致則普通成員獲勝，反之則糊塗鬼獲勝<br />
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
              <p className={styles.textGray}>Players: {players.length}/{requiredPlayerNum}</p>
            </div>
            
            {isRoomHead && (
              <button
                onClick={startGame}
                disabled={players.length !== requiredPlayerNum}
                className={`${styles.button} ${styles.buttonSuccess}`}
              >
                {players.length < requiredPlayerNum &&
                `Need ${requiredPlayerNum - players.length} more player${requiredPlayerNum - players.length === 1 ? '' : 's'}`}
                {players.length > requiredPlayerNum &&
                `Too many players! Ask ${players.length - requiredPlayerNum} to leave`}
                {players.length === requiredPlayerNum && 
                <Play className={styles.icon} /> && 'Start Game'}
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
            每輪有三個提示，所有人可以討論選擇哪一個提示，但不能說出待會要寫的答案<br />
            <br />
            普通成員: 根據提示盡量和其他人寫出「一樣」的答案<br />
            糊塗鬼: 寫出「合理」但和其他人「不一樣」的答案<br />
            <br />
            遊戲共有七輪，其中有四輪全體答案一致則普通成員獲勝，反之則糊塗鬼獲勝<br />
            </p>
        </div>
      </div>
    );
  }
};

export default SillyGooseGame;