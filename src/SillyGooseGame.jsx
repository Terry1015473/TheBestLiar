import React, { useState, useEffect } from 'react';
import { Users, Play, Crown, Copy } from 'lucide-react';
import styles from './SillyGooseGame.module.css';
import { db } from './firebase';
import {
    doc, setDoc, updateDoc, onSnapshot, arrayUnion, getDoc, deleteDoc, arrayRemove
} from 'firebase/firestore';

const requiredPlayerNum = 2;
const firebaseRoomName = "sillygoose_rooms";

const SillyGooseGame = () => {
  const [gameState, setGameState] = useState("home"); // home, lobby, playing
  
  const [playerName, setPlayerName] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [playerID, setPlayerID] = useState(0);
  
  const [roomCode, setRoomCode] = useState("");
  const [isRoomHost, setIsRoomHost] = useState(false);
  const [unsubscribeRoom, setUnsubscribeRoom] = useState(null);

  const [showLeaveGameModal, setShowLeaveGameModal] = useState(false);
  const [showLeaveRoomModal, setShowLeaveRoomModal] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async () => {
    const code = generateRoomCode();
    const roomRef = doc(db, firebaseRoomName, code);

    try {
      await setDoc(roomRef, {
        isPlaying: false,  // doc state
        allPlayers: [playerName],  // doc state
      });

      setGameState("lobby");
      setRoomCode(code);
      setIsRoomHost(true);

      listenToRoom(code);
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Error creating room. Please try again.");
    }
  };

  const joinRoom = async (code) => {
    const roomRef = doc(db, firebaseRoomName, roomCode);
    
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        alert("Room not found!");
        return;
      }
      const data = roomSnap.data();

      // Check if the game already started
      if (data.isPlaying) {
        alert("The game already started!");
        return;
      }
      
      // Check if player is already in the room
      if (data.allPlayers.includes(playerName)) {
        alert("A player with this name is already in the room!");
        return;
      }
      
      await updateDoc(roomRef, {
        allPlayers: [...data.allPlayers, playerName],
      });

      setGameState("lobby");

      listenToRoom(code);
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Error joining room. Please try again.");
    }
  };

  const listenToRoom = (code) => {
    const roomRef = doc(db, firebaseRoomName, code);

    const unsub = onSnapshot(roomRef, (roomSnap) => {
      if (roomSnap.exists()) {
        const data = roomSnap.data();
        setAllPlayers(data.allPlayers);
        setPlayerID(data.allPlayers.indexOf(playerName));
        setGameState(data.isPlaying ? "playing" : "lobby");
      } else {
        setGameState("home");
        setPlayerName("");
        setAllPlayers([]);
        setRoomCode("");
        alert("The room has been closed by the host.");
      }
    });

    setUnsubscribeRoom(() => unsub);
  };

  const deleteRoom = async (code) => {
    const roomRef = doc(db, firebaseRoomName, code);
    
    try {
      await deleteDoc(roomRef);
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const leaveRoom = async (code) => {
    const roomRef = doc(db, firebaseRoomName, code);
    
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      const data = roomSnap.data();

      unsubscribeRoom();
      
      if (isRoomHost) {
        await deleteRoom(code);
      } else {
        await updateDoc(roomRef, {
            allPlayers: data.allPlayers.filter(p => p !== playerName),
        });
      }

      setGameState("home");
      setPlayerName("");
      setAllPlayers([]);
      setRoomCode("");
      setIsRoomHost(false);
    } catch (error) {
      console.error("Error leaving room:", error);
      alert("Error leaving room. Please try again.");
    }
  };

  const startGame = async (code) => {
    const roomRef = doc(db, firebaseRoomName, code);
    
    try {
      await updateDoc(roomRef, {
        isPlaying: true,
      });
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Error starting game. Please try again.");
    }
  };

  const leaveGame = async (code) => {
    const roomRef = doc(db, firebaseRoomName, code);
    
    try {
      await updateDoc(roomRef, {
        isPlaying: false,
      });
    } catch (error) {
      console.error("Error leaving game:", error);
      alert("Error leaving game. Please try again.");
    }
  };

  const copyRoomCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch (err) {
      console.error("Failed to copy room code:", err);
      alert("Failed to copy room code.");
    }
  };

  const ruleDiscription = (
    <p className={styles.footerText}>
      每輪有三個提示，所有人可以討論選擇哪一個提示，但不能說出待會要寫的答案<br />
      <br />
      普通成員: 根據提示盡量和其他人寫出「一樣」的答案<br />
      糊塗鬼: 寫出「合理」但和其他人「不一樣」的答案<br />
      <br />
      遊戲共有七輪，其中有四輪全體答案一致則普通成員獲勝，反之則糊塗鬼獲勝<br />
    </p>
  )

  if (gameState === "home") {
    return (
      <div className={styles.container}>
        {/* Body */}
        <div className={styles.maxWidthMd}>
          <div className={styles.card}>
            {/* title */}
            <h1 className={styles.title}>
              Who's the Silly Goose?
            </h1>

            {/* subtitle */}
            <p className={`${styles.subtitle} ${styles.textGray}`}>
              A telepathy game
            </p>
            
            {/* player name input field */}
            <div className={`${styles.spaceY4} ${styles.mb8}`}>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className={styles.input}
              />
            </div>
            
            <div className={styles.spaceY3}>
              {/* create room button */}
              <button
                onClick={createRoom}
                disabled={!playerName.trim()}
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
                  value={roomCode}
                  className={styles.inputSmall}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                />

                {/* join button */}
                <button
                  onClick={() => joinRoom(roomCode)}
                  disabled={!playerName.trim() || !roomCode.trim()}
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
          {ruleDiscription}
        </div>
      </div>
    );
  }

  if (gameState === "lobby") {
    return (
      <div>
        {/* Leave Room Modal */}
        {showLeaveRoomModal && (
          <div className={styles.iosModalOverlay}>
            <div className={styles.iosModal}>
              <p className={styles.textBlack}>
                Are you sure you want to leave the room?
              </p>

              <button
                onClick={() => { leaveRoom(roomCode); setShowLeaveRoomModal(false); }}
                className={`${styles.iosModalButton} ${styles.iosModalButtonPrimary}`}
              >
                Leave Room
              </button>

              <button
                onClick={() => setShowLeaveRoomModal(false)}
                className={`${styles.iosModalButton} ${styles.iosModalButtonCancel}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={styles.container}>
          {/* Body */}
          <div className={styles.maxWidthMd}>
            <div className={styles.cardSmall}>
              <div className={`${styles.textCenter} ${styles.mb6}`}>
                <div className={styles.relativeWrapper}>
                  {/* room code */}
                  <h2 className={`${styles.heading} ${styles.centerText}`}>
                    Room: {roomCode}
                  </h2>

                  {/* copy button */}
                  <button
                    onClick={copyRoomCodeToClipboard}
                    className={`${styles.copyButton}`}
                  >
                    <Copy className={styles.icon} />
                    Copy
                  </button>
                </div>

                {/* player number */}
                <p className={styles.textGray}>
                  Players: {allPlayers.length}/{requiredPlayerNum}
                </p>
              </div>
              
              {/* player list */}
              <div className={`${styles.spaceY2} ${styles.mb6}`}>
                {allPlayers.map((player, index) => (
                  <div key={index} className={styles.playerItem}>
                    <span className={styles.playerName}>
                      {player}
                    </span>
                    <div className={styles.playerIcons}>
                      {player === playerName && <span className={styles.pointingFinger}>🫵</span>}
                      {index === 0 && <Crown className={`${styles.icon} ${styles.iconYellow}`} />}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* start button */}
              {isRoomHost && (
                <button
                  onClick={() => startGame(roomCode)}
                  disabled={allPlayers.length !== requiredPlayerNum}
                  className={`${styles.button} ${styles.buttonSuccess}`}
                >
                  {allPlayers.length < requiredPlayerNum &&
                  `Need ${requiredPlayerNum - allPlayers.length} more player${requiredPlayerNum - allPlayers.length === 1 ? '' : 's'}`}
                  {allPlayers.length > requiredPlayerNum &&
                  `Too many allPlayers! Ask ${allPlayers.length - requiredPlayerNum} to leave`}
                  {allPlayers.length === requiredPlayerNum && 
                  <Play className={styles.icon} /> && 'Start Game'}
                </button>
              )}
              {!isRoomHost && (
                <p className={styles.textGray}>
                  Waiting for room host to start the game...
                </p>
              )}
              
              {/* leave room button */}
              <button
                onClick={() => setShowLeaveRoomModal(true)}
                className={`${styles.button} ${styles.buttonGray} ${styles.mt3}`}
              >
                Leave Room
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <div className={styles.footer}>
            {ruleDiscription}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "playing") {
    return (
      <div>
        {/* Leave Game Modal */}
        {showLeaveGameModal && (
          <div className={styles.iosModalOverlay}>
            <div className={styles.iosModal}>
              <p className={styles.textBlack}>
                Are you sure you want to end the game and go back to the lobby?
              </p>

              <button
                onClick={() => { leaveGame(roomCode); setShowLeaveGameModal(false); }}
                className={`${styles.iosModalButton} ${styles.iosModalButtonPrimary}`}
              >
                End Game
              </button>

              <button
                onClick={() => setShowLeaveGameModal(false)}
                className={`${styles.iosModalButton} ${styles.iosModalButtonCancel}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={styles.container}>
          {/* Body */}
          <div className={styles.maxWidthMd}>
            <div className={styles.cardSmall}>
              <div className={`${styles.textCenter} ${styles.mb6}`}>
                {/* title */}
                <h1 className={styles.title}>
                  Who's the Silly Goose?
                </h1>
              </div>

              {/* back to lobby button */}
              {isRoomHost && (
                <button
                  onClick={() => setShowLeaveGameModal(true)}
                  className={`${styles.button} ${styles.buttonGray} ${styles.mt3}`}
                >
                  Back to Lobby
                </button>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className={styles.footer}>
            {ruleDiscription}
          </div>
        </div>
      </div>
    );
  }
};

export default SillyGooseGame;