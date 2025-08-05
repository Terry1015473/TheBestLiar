import React, { useState, useEffect } from 'react';
import { Users, Play, Crown, Copy } from 'lucide-react';
import styles from './SillyGooseGame.module.css';
import { db } from './firebase';
import {
    doc, setDoc, updateDoc, onSnapshot, arrayUnion, getDoc, deleteDoc, arrayRemove
} from 'firebase/firestore';

const requiredPlayerNum = 4;
const goalScore = 3;
const firebaseRoomName = "sillygoose_rooms";

const SillyGooseGame = () => {
  const [gameState, setGameState] = useState("home"); // home, lobby, playing, voting
  
  const [playerName, setPlayerName] = useState("");
  const [allPlayers, setAllPlayers] = useState([]);
  const [playerID, setPlayerID] = useState(0);
  
  const [roomCode, setRoomCode] = useState("");
  const [isRoomHost, setIsRoomHost] = useState(false);
  const [unsubscribeRoom, setUnsubscribeRoom] = useState(null);

  const [showLeaveGameModal, setShowLeaveGameModal] = useState(false);
  const [showLeaveRoomModal, setShowLeaveRoomModal] = useState(false);

  const [isSillyGoose, setIsSillyGoose] = useState(false);
  const [sillyGoose, setSillyGoose] = useState("");
  const [roundID, setRoundID] = useState(0);
  const [word, setWord] = useState("");
  const [hints, setHints] = useState([]);
  const [hintPicker, setHintPicker] = useState("");
  const [isHintPicker, setIsHintPicker] = useState(false);
  const [stepID, setStepID] = useState(0);
  const [selectedHintID, setSelectedHintID] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [allAnswersConsistent, setAllAnswersConsistent] = useState(false);
  const [allAnswers, setAllAnswers] = useState([]);
  const [guardianScore, setGuardianScore] = useState(0);
  const [sillyGooseScore, setSillyGooseScore] = useState(0);
  const [isVoted, setIsVoted] = useState(false);
  const [votedPlayerID, setVotedPlayerID] = useState(0);
  const [allVoted, setAllVoted] = useState(false);
  const [allVotes, setAllVotes] = useState([]);

  const reset = () => {
    setIsSillyGoose(false);
    setSillyGoose("");
    setRoundID(0);
    setWord("");
    setHints([]);
    setHintPicker("");
    setIsHintPicker(false);
    setStepID(0);
    setSelectedHintID(0);
    setAnswer("");
    setIsAnswerSubmitted(false);
    setAllAnswersConsistent(false);
    setAllAnswers([]);
    setGuardianScore(0);
    setSillyGooseScore(0);
    setIsVoted(false);
    setVotedPlayerID(0);
    setAllVoted(false);
    setAllVotes([]);
  };

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
        wordIDHistory: [],  // new doc state
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
        setIsSillyGoose(data.sillyGoose === data.allPlayers.indexOf(playerName));
        setSillyGoose(data.allPlayers[data.sillyGoose]);
        setRoundID(data.roundID);
        setWord(data.wordID ? WORD_BANK[data.wordID].word : "");
        setHints(data.wordID ? WORD_BANK[data.wordID].hints : []);
        setHintPicker(data.allPlayers[data.hintPicker]);
        setIsHintPicker(data.hintPicker === data.allPlayers.indexOf(playerName));
        setStepID(data.stepID);
        setSelectedHintID(data.selectedHintID);
        if (data.stepID === 0) setAnswer("");
        if (data.stepID === 0) setIsAnswerSubmitted(false);
        setAllAnswersConsistent(data.answers ? data.answers.every(ans => ans === data.answers[0]) : false);
        setAllAnswers(data.answers ? data.answers : []);
        setGuardianScore(data.guardianScore ? data.guardianScore : 0);
        setSillyGooseScore(data.sillyGooseScore ? data.sillyGooseScore : 0);
        if (data.isVoting) setGameState("voting");
        setAllVoted(data.votes ? data.votes.every(vote => vote !== -1) : false);
        setAllVotes(data.votes ? data.votes : []);
        if (data.stepID === 0) setIsVoted(false);
      } else {
        setGameState("home");
        setPlayerName("");
        setAllPlayers([]);
        setRoomCode("");
        alert("The room has been closed by the host.");
        reset();
      }
    });

    setUnsubscribeRoom(() => unsub);
  };

  useEffect(() => {
    const updateScores = async () => {
      if (!roomCode.trim()) return;

      const roomRef = doc(db, firebaseRoomName, roomCode);

      try {
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return;
        const data = roomSnap.data();

        if (stepID !== 2 || data.guardianScore + data.sillyGooseScore === data.roundID + 1) return;
        
        await updateDoc(roomRef, {
          guardianScore: data.guardianScore + (allAnswersConsistent ? 1 : 0),
          sillyGooseScore: data.sillyGooseScore + (allAnswersConsistent ? 0 : 1),
        });
      } catch (err) {
        console.error("Error updating scores:", err);
      }
    };

    updateScores();
  }, [stepID]);

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
      reset();
    } catch (error) {
      console.error("Error leaving room:", error);
      alert("Error leaving room. Please try again.");
    }
  };

  const startGame = async (code) => {
    const roomRef = doc(db, firebaseRoomName, code);
    
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      const data = roomSnap.data();

      await updateDoc(roomRef, {
        isPlaying: true,
        sillyGoose: Math.floor(Math.random() * requiredPlayerNum),  // new doc state
        roundID: -1,  // new doc state
        guardianScore: 0,  // new doc state
        sillyGooseScore: 0,  // new doc state
        isVoting: false,  // new doc state
        votes: new Array(data.allPlayers.length).fill(-1),  // new doc state
      });
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Error starting game. Please try again.");
    }
    
    startRound(code);
  };

  const leaveGame = async (code) => {
    const roomRef = doc(db, firebaseRoomName, code);
    
    try {
      await updateDoc(roomRef, {
        isPlaying: false,
        isVoting: false,
      });
    } catch (error) {
      console.error("Error leaving game:", error);
      alert("Error leaving game. Please try again.");
    }
  };

  const startRound = async (code) => {
    const roomRef = doc(db, firebaseRoomName, code);
    
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      const data = roomSnap.data();

      // Pick a word that has not been selected before
      const availableWordIDs = WORD_BANK.map((_, idx) => idx).filter(idx => idx !== 0 && !data.wordIDHistory.includes(idx));
      if (availableWordIDs.length === 0) {
        alert("所有題目都用完了！");
        return;
      }
      const newWordID = availableWordIDs[Math.floor(Math.random() * availableWordIDs.length)];

      await updateDoc(roomRef, {
        roundID: data.roundID + 1,
        wordIDHistory: [...data.wordIDHistory, newWordID],
        hintPicker: (data.roundID + 1) % data.allPlayers.length,  // new doc state
        wordID: newWordID,  // new doc state
        stepID: 0,  // new doc state
        selectedHintID: 0,  // new doc state
        answers: new Array(data.allPlayers.length).fill(""),  // new doc state
      });

      console.log([...data.wordIDHistory, newWordID])
    } catch (error) {
      console.error("Error starting round:", error);
      alert("Error starting round. Please try again.");
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

  const handleHintSelect = async (code, index) => {
    const roomRef = doc(db, firebaseRoomName, code);
    
    try {
      await updateDoc(roomRef, {
        stepID: 1,
        selectedHintID: index,
      });
    } catch (error) {
      console.error("Error leaving game:", error);
      alert("Error leaving game. Please try again.");
    }
  };

  const handleAnswerSubmit = async (code, answer) => {
    const roomRef = doc(db, firebaseRoomName, code);
    
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      const data = roomSnap.data();

      // Construct new answers
      const newAnswers = [...data.answers];
      newAnswers[playerID] = answer.trim();

      await updateDoc(roomRef, {
        stepID: newAnswers.every(ans => ans !== "") ? 2 : 1,
        answers: newAnswers,
      });

      setIsAnswerSubmitted(true);
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Error submitting answer. Please try again.");
    }
  };

  const handleStartVoting = async (code) => {
    const roomRef = doc(db, firebaseRoomName, code);
    
    try {
      await updateDoc(roomRef, {
        isVoting: true,
      });
    } catch (error) {
      console.error("Error starting voting:", error);
      alert("Error starting voting. Please try again.");
    }
  };

  const handleVoteSomeone = async (code, index) => {
    const roomRef = doc(db, firebaseRoomName, code);
    
    try {
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) return;
      const data = roomSnap.data();

      // Construct new votes
      const newVotes = [...data.votes];
      newVotes[playerID] = index;

      await updateDoc(roomRef, {
        votes: newVotes,
      });

      setIsVoted(true);
      setVotedPlayerID(index);
    } catch (error) {
      console.error("Error leaving game:", error);
      alert("Error leaving game. Please try again.");
    }
  };

  const ruleDiscription = (
    <p className={styles.footerText}>
      每輪有三個提示，所有人可以討論選擇哪一個提示，但不能說出待會要寫的答案<br />
      <br />
      普通成員: 根據提示盡量和其他人寫出「一樣」的答案<br />
      糊塗鬼: 寫出「合理」但和其他人「不一樣」的答案，隱藏自己的身分<br />
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

              <div className={styles.flexBetween}>
                {/* scores */}
                <div className={`${styles.selectedHintText} ${styles.resetH4}`}>
                  守護者們 {guardianScore} 分：糊塗鬼 {sillyGooseScore} 分
                </div>

                {/* identity */}
                <div className={`${styles.selectedHintText} ${styles.resetH4}`}>
                  你是{isSillyGoose ? "糊塗鬼" : "守護者"}
                </div>
              </div>

              <div className={`${styles.textBlack} ${styles.wordBlock}`}>
                {/* word */}
                <div className={styles.wordTitle}>
                  第 {roundID + 1} 題：{word}
                </div>

                {/* hints */}
                <div className={styles.hintGrid}>
                  {hints.map((hint, index) => (
                    <button
                      key={index}
                      disabled={!(stepID === 0 && isHintPicker)}
                      className={`
                        ${stepID !== 0 && index === selectedHintID ? styles.hintButtonSelected : styles.hintButton}
                        ${stepID !== 0 && index === selectedHintID ? styles.selectedHintText: styles.textBlack}
                      `}
                      onClick={() => handleHintSelect(roomCode, index)}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>

              {/* instruction */}
              <div className={styles.instructionBlock}>
                {stepID === 0 && (
                  <div className={`${styles.textBlack}`}>
                    所有人討論選擇哪一個提示，並由「{isHintPicker ? "你" : hintPicker}」做出最終選擇
                  </div>
                )}
                {stepID === 1 && (
                  <div>
                    <div className={styles.textBlack}>
                      「{isHintPicker ? "你" : hintPicker}」選擇了提示「{selectedHintID + 1}」
                    </div>

                    <div className={styles.answerInputBlock}>
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        disabled={isAnswerSubmitted}
                        className={styles.answerInput}
                        placeholder="請輸入你的答案"
                      />
                      
                      {!isAnswerSubmitted ? (
                        <button
                          onClick={() => handleAnswerSubmit(roomCode, answer)}
                          className={styles.submitButton}
                          disabled={!answer.trim()}
                        >
                          送出
                        </button>
                      ) : (
                        <div className={`${styles.textGreen} ${styles.textCenter}`}>
                          ✓ 已送出
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {stepID === 2 && (
                  <div className={styles.spaceY6}>
                    <div className={`${styles.textBlack}`}>
                      {guardianScore === goalScore ? `守護者們獲勝!${!isSillyGoose ? ` 糊塗鬼是「${sillyGoose}」` : ""}` :
                       sillyGooseScore === goalScore ? "守護者們失敗，若沒找出隱藏的糊塗鬼，則由糊塗鬼獲勝!" :
                       allAnswersConsistent ? "糊塗鬼還在藏!" : "糊塗鬼出沒啦!"}
                    </div>

                    <div className={`${styles.spaceY2} ${styles.mb6}`}>
                      {allPlayers.map((player, index) => (
                        <div key={index} className={styles.playerItem}>
                          <span className={styles.playerName}>
                            {player} 的答案是「{allAnswers[index]}」
                          </span>
                          <div className={styles.playerIcons}>
                            {player === playerName && <span className={styles.pointingFinger}>🫵</span>}
                            {index === 0 && <Crown className={`${styles.icon} ${styles.iconYellow}`} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* next round button */}
              {isRoomHost && stepID === 2 && guardianScore !== goalScore && sillyGooseScore !== goalScore && (
                <button
                  onClick={() => startRound(roomCode)}
                  className={`${styles.button} ${styles.buttonPrimary} ${styles.mt3}`}
                >
                  Next Round
                </button>
              )}

              {/* vote button */}
              {isRoomHost && stepID === 2 && sillyGooseScore === goalScore && (
                <button
                  onClick={() => handleStartVoting(roomCode)}
                  className={`${styles.button} ${styles.buttonPrimary} ${styles.mt3}`}
                >
                  Start Voting
                </button>
              )}

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

  if (gameState === "voting") {
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

              <div className={styles.flexBetween}>
                {/* scores */}
                <div className={`${styles.selectedHintText} ${styles.resetH4}`}>
                  守護者們 {guardianScore} 分：糊塗鬼 {sillyGooseScore} 分
                </div>

                {/* identity */}
                <div className={`${styles.selectedHintText} ${styles.resetH4}`}>
                  你是{isSillyGoose ? "糊塗鬼" : "守護者"}
                </div>
              </div>

              {!allVoted && (
                <div>
                  <div className={`${styles.textBlack} ${styles.wordBlock}`}>
                    {/* word */}
                    <div className={styles.wordTitle}>
                      投票進行中...
                    </div>
                  </div>
                  
                  <div className={styles.spaceY6}>
                    <div className={`${styles.spaceY2} ${styles.mb6}`}>
                      <div className={`${styles.textBlack}`}>
                        注意: 若是糊塗鬼和其中一位守護者同為最高票，則由糊塗鬼獲勝
                      </div>

                      <div className={`${styles.spaceY2} ${styles.mb6}`}>
                        {allPlayers.map((player, index) => (
                          <button
                            key={index}
                            disabled={isVoted}
                            className={`${styles.button} ${(isVoted && votedPlayerID === index) ? styles.playerButtonSelected : styles.playerButton} ${styles.textBlack}`}
                            onClick={() => handleVoteSomeone(roomCode, index)}
                          >
                            <span className={(isVoted && votedPlayerID === index) ? styles.playerNameSelected : styles.playerName}>
                              {player}
                            </span>
                            <div className={styles.playerIcons}>
                              {player === playerName && <span className={styles.pointingFinger}>🫵</span>}
                              {index === 0 && <Crown className={`${styles.icon} ${styles.iconYellow}`} />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {allVoted && (
                <div>
                  <div className={`${styles.textBlack} ${styles.wordBlock}`}>
                    {/* word */}
                    <div className={styles.wordTitle}>
                      投票結束
                    </div>
                  </div>
                  
                  <div className={styles.spaceY6}>
                    <div className={`${styles.spaceY2} ${styles.mb6}`}>
                      {(() => {
                        const voteCounts = allPlayers.map((_, i) => allVotes.filter(v => v === i).length);
                        const maxVotes = Math.max(...voteCounts);
                        const highestVotedIndexes = voteCounts.map((count, i) => (count === maxVotes ? i : -1)).filter(i => i !== -1);
                        const sillyGooseIndex = allPlayers.indexOf(sillyGoose);
                        const guardianWins = highestVotedIndexes.includes(sillyGooseIndex) && highestVotedIndexes.length === 1;
                        return (
                          <div className={styles.textBlack}>
                            {guardianWins ? "守護者們獲勝!" : "糊塗鬼獲勝!"}
                            {!isSillyGoose ? ` 糊塗鬼是「${sillyGoose}」` : ""}
                          </div>
                        );
                      })()}

                      <div className={`${styles.spaceY2} ${styles.mb6}`}>
                        {allPlayers.map((player, index) => (
                          <div key={index} className={styles.playerItem}>
                            <span className={styles.playerName}>
                              {player} 投給了「{allPlayers[allVotes[index]]}」，自己得到 {allVotes.filter(v => v === index).length} 票
                            </span>
                            <div className={styles.playerIcons}>
                              {player === playerName && <span className={styles.pointingFinger}>🫵</span>}
                              {index === 0 && <Crown className={`${styles.icon} ${styles.iconYellow}`} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

const WORD_BANK = [
  // 01 ~ 10
  {
    word: "夏天",
    hints: ["最想去的地方", "最常吃的冰品", "最怕遇到的事情"]
  },
  {
    word: "學校",
    hints: ["最喜歡的課", "最常用的文具", "最不想遇到的狀況"]
  },
  {
    word: "早餐",
    hints: ["最常點的食物", "最搭的飲料", "最容易忽略的配料"]
  },
  {
    word: "動物園",
    hints: ["最受歡迎的動物", "最容易被忽略的動物", "最想模仿的叫聲"]
  },
  {
    word: "手機",
    hints: ["最常用的APP", "最容易壞掉的部位", "不能沒有它的功能"]
  },
  {
    word: "生日派對",
    hints: ["最想收到的禮物", "最適合的地點", "最掃興的事情"]
  },
  {
    word: "聖誕節",
    hints: ["最常聽到的歌曲", "最適合送給朋友的禮物", "最想和誰一起過"]
  },
  {
    word: "便利商店",
    hints: ["最常買的東西", "最特別的商品", "深夜最適合吃的"]
  },
  {
    word: "動物",
    hints: ["最想養的", "最危險的", "動作最可愛的"]
  },
  {
    word: "電影",
    hints: ["最想重看一次的片名", "最感動的角色", "最適合配爆米花的類型"]
  },

  // 11 ~ 20
  {
    word: "旅行",
    hints: ["最想去的國家", "最重要的打包物品", "最怕遇到的狀況"]
  },
  {
    word: "雨天",
    hints: ["最需要的物品", "最適合做的事", "最討厭的感覺"]
  },
  {
    word: "海邊",
    hints: ["最想做的活動", "最常帶的東西", "最怕忘記的東西"]
  },
  {
    word: "書店",
    hints: ["最常買的書類", "最喜歡逛的區域", "最不能理解的分類"]
  },
  {
    word: "夏令營",
    hints: ["最難忘的活動", "最討厭的部分", "最容易交朋友的時刻"]
  },
  {
    word: "電影院",
    hints: ["最喜歡的位置", "最常吃的食物", "最不想遇到的狀況"]
  },
  {
    word: "超市",
    hints: ["最常買的東西", "最容易買太多的類別", "最難找到的物品"]
  },
  {
    word: "公園",
    hints: ["最常見的運動", "最常聽到的聲音", "最喜歡的時間點"]
  },
  {
    word: "飛機上",
    hints: ["最期待的服務", "最難忍受的事情", "最喜歡的座位"]
  },
  {
    word: "火鍋",
    hints: ["最不能缺的配料", "最討厭的食材", "最愛的沾醬"]
  },
  
  // 21 ~ 30
  {
    word: "遊樂園",
    hints: ["最想玩的設施", "最害怕的設施", "最適合拍照的地方"]
  },
  {
    word: "社團",
    hints: ["最容易交朋友的活動", "最常辦的聚會", "最令人頭痛的事"]
  },
  {
    word: "咖啡廳",
    hints: ["最常點的飲品", "最在意的氣氛", "最喜歡的座位"]
  },
  {
    word: "火車站",
    hints: ["最常買的便當", "最討厭的等候狀況", "最有趣的旅伴"]
  },
  {
    word: "百貨公司",
    hints: ["最常去的樓層", "最想逛的品牌", "最想躲起來的地方"]
  },
  {
    word: "萬聖節",
    hints: ["最有趣的裝扮", "最不想拿到的糖果", "最想嚇的人"]
  },
  {
    word: "機器人",
    hints: ["最想要的功能", "最可怕的故障", "最適合的用途"]
  },
  {
    word: "露營",
    hints: ["最難忘的經歷", "最怕忘記帶的東西", "最想吃的食物"]
  },
  {
    word: "餐廳",
    hints: ["最常點的料理", "最不敢吃的食材", "最在意的服務"]
  },
  {
    word: "音樂會",
    hints: ["最想看的歌手", "最重要的準備", "最容易錯過的事"]
  },
  
  // 31 ~ 40
  {
    word: "情人節",
    hints: ["最想收到的禮物", "最不想一個人做的事", "最浪漫的場景"]
  },
  {
    word: "圖書館",
    hints: ["最常借的書類", "最安靜的角落", "最怕被發現的事"]
  },
  {
    word: "夜市",
    hints: ["最愛的小吃", "最怕排隊的攤位", "最容易踩雷的選項"]
  },
  {
    word: "節日",
    hints: ["最期待的節日", "最常吃的料理", "最累的事情"]
  },
  {
    word: "高鐵",
    hints: ["最想坐的位置", "最想吃的便當", "最怕遇到的乘客"]
  },
  {
    word: "演唱會",
    hints: ["最想聽的歌", "最難忘的瞬間", "最怕的突發狀況"]
  },
  {
    word: "畢業典禮",
    hints: ["最感動的時刻", "最想感謝的人", "最容易哭的場景"]
  },
  {
    word: "美術館",
    hints: ["最喜歡的畫風", "最想收藏的作品", "最容易錯過的展區"]
  },
  {
    word: "通勤",
    hints: ["最常用的交通工具", "最煩的狀況", "最需要的東西"]
  },
  {
    word: "健身房",
    hints: ["最常用的器材", "最痛苦的動作", "最怕遇到的情況"]
  },
  
  // 41 ~ 50
  {
    word: "早餐店",
    hints: ["最常點的飲料", "最想嘗試的新菜單", "最容易塞車的時間"]
  },
  {
    word: "漫畫",
    hints: ["最喜歡的主角", "最感動的一幕", "最想擁有的能力"]
  },
  {
    word: "夏天穿搭",
    hints: ["最常穿的單品", "最怕流汗的部位", "最適合約會的風格"]
  },
  {
    word: "冬天",
    hints: ["最怕的冷部位", "最喜歡的衣物", "最愛的熱飲"]
  },
  {
    word: "家",
    hints: ["最舒服的地方", "最亂的空間", "最懶得整理的角落"]
  },
  {
    word: "生日禮物",
    hints: ["最常收到的東西", "最不想收到的禮物", "最感動的一次"]
  },
  {
    word: "朋友",
    hints: ["最會講笑話的人", "最常聯絡的人", "最常忘記回訊息的人"]
  },
  {
    word: "打工",
    hints: ["最辛苦的經歷", "最難忘的同事", "最無聊的工作"]
  },
  {
    word: "遙控器",
    hints: ["最常按的按鈕", "最常找不到的地方", "最不想被搶的功能"]
  },
  {
    word: "洗澡",
    hints: ["最喜歡的時間", "最怕忘了帶的東西", "最常被打擾的時候"]
  },

  // 51 ~60
  {
    word: "畢業旅行",
    hints: ["最想去的地點", "最瘋狂的回憶", "最懷念的瞬間"]
  },
  {
    word: "寵物",
    hints: ["最想養的動物", "最費工的照顧", "最可愛的行為"]
  },
  {
    word: "購物",
    hints: ["最常衝動購買的東西", "最划算的一次", "最想退貨的經驗"]
  },
  {
    word: "社群軟體",
    hints: ["最常使用的APP", "最愛看的內容", "最常按錯的地方"]
  },
  {
    word: "廚房",
    hints: ["最常用的器具", "最怕操作失誤的東西", "最不想清的地方"]
  },
  {
    word: "暑假",
    hints: ["最想做的事", "最常耍廢的時間", "最難忘的回憶"]
  },
  {
    word: "聽音樂",
    hints: ["最愛的歌手", "最常重播的歌", "最喜歡的聽歌情境"]
  },
  {
    word: "夢想職業",
    hints: ["最小時候想當的", "最現實的選擇", "最不想做的工作"]
  },
  {
    word: "餐具",
    hints: ["最常用的", "最不會用的", "最討厭洗的"]
  },
  {
    word: "笑話",
    hints: ["最冷的一個", "最常被轉傳的", "最想分享的"]
  },
];

export default SillyGooseGame;