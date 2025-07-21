import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, onSnapshot, setDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import styles from './BestLiarGame.module.css';
import { Users, Crown, Play, RotateCcw, Award } from 'lucide-react';

// Helper to generate unique IDs for cards
const generateUniqueId = () => Math.random().toString(36).substring(2, 15);

// Define all possible Person Cards as objects with unique IDs and properties
const ALL_GOOD_PEOPLE = [
  "一群9歲的小孩子", "一位住在你隔壁的老奶奶", "一位孕婦",
  "聰明絕頂的醫生能治療任何疾病，如果沒被撞的話", "你最好、跟你同甘苦的朋友", "一群正要前往救災的消防員",
  "啟發你成功的啟蒙老師", "世界貿易中心，掌管世界的股票交易", "舉家出遊的企鵝家庭",
  "黃仁勳", "主動在老人院服務的志工", "在遊戲室裡的大家","周杰倫", "路邊一對相互依為取暖的流浪貓跟流浪狗",
  "世界鬆餅大賽冠軍隊伍", "清華大學學務處", "在路上發傳單的小明", "大象寶寶與他的家人","Asepa演唱會舉辦處",
  "早上總會開朗地跟你說早安的導護爺爺", "聾啞人的營隊", "Iphone製造工廠, 占全球90%的產量", "你最常去的一間麥當勞"
].map(name => ({ id: generateUniqueId(), name, type: 'person', character: 'good' }));

const ALL_BAD_PEOPLE = [
  "不死族希特勒", "曾經霸凌過你朋友的人", "試圖統治世界的肯德基爺爺",
  "小時候偷你橡皮擦的同學", "販賣小狗肉餅的餅店師傅", "在軌道上耍智障的白痴網紅",
  "一群奧客大媽旅行團", "不受控制的幼稚園小孩", "捍衛屁孩的恐龍家長",
  "不讓博愛座就破口大罵的阿北", "偷用你洗髮精兩年半的室友", "一到周末就施工的樓上鄰居",
  "撞上後有50%的機率引爆一個核彈"
].map(name => ({ id: generateUniqueId(), name, type: 'person', character: 'bad' }));

// Define all possible State Cards as objects with unique IDs and properties
const ALL_STATE_CARDS = [
  { id: generateUniqueId(), name: "每個月捐錢給慈善機構", type: "state", description: "Positive social impact." },
  { id: generateUniqueId(), name: "剛剛綁架了你最好的朋友", type: "state", description: "Unexpected betrayal." },
  { id: generateUniqueId(), name: "打麻將時一直出老千而且輸了又賴皮", type: "state", description: "Boosts morale." },
  { id: generateUniqueId(), name: "我就不信你敢撞啦", type: "state", description: "Increases chaos." },
  { id: generateUniqueId(), name: "近期改邪歸正並收養了一隻小狗", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "盜用你的IG發布總族歧視言論", type: "state", description: "Ultimate test of survival." },
  { id: generateUniqueId(), name: "吃披薩時會加鳳梨再吃", type: "state", description: "Everyone is happy." },
  { id: generateUniqueId(), name: "打球時又爛又不傳球給你", type: "state", description: "Intergalactic conflict." },
  { id: generateUniqueId(), name: "每週寫信給同一為孩子, 成為他的筆友來度過孤單的時光", type: "state", description: "Positive social impact." },
  { id: generateUniqueId(), name: "被撞之後會變得更加強大地回到這世上", type: "state", description: "Unexpected betrayal." },
  { id: generateUniqueId(), name: "其時偷偷跟蹤你十年了", type: "state", description: "Boosts morale." },
  { id: generateUniqueId(), name: "運動後不洗澡直接把充滿汗的腳踩在你枕頭上", type: "state", description: "Increases chaos." },
  { id: generateUniqueId(), name: "暗戀你3年了", type: "state", description: "Spreads joy." },
  { id: generateUniqueId(), name: "丟垃圾時一定會做垃圾分類", type: "state", description: "Ultimate test of survival." },
  { id: generateUniqueId(), name: "其實他是你失散多年的親友", type: "state", description: "Everyone is happy." },
  { id: generateUniqueId(), name: "欠了你500美金", type: "state", description: "Intergalactic conflict." },
];

const TrolleyProblemGame = () => {
  // Main game state
  const [gameState, setGameState] = useState('home'); // home, lobby, playing, ended
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isRoomHead, setIsRoomHead] = useState(false);
  const [isImpactAnimating, setIsImpactAnimating] = useState(false);
  const [impactedRailVisual, setImpactedRailVisual] = useState(null); // 'A' or 'B'
  
  // Trolley game specific state
  const [gameData, setGameData] = useState(null);
  const [playerHand, setPlayerHand] = useState([]); // Current player's hand of card objects
  const [selectedStateCardToApply, setSelectedStateCardToApply] = useState(null); // New state for state card targeting

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const deleteRoom = async (code) => {
    try {
      await deleteDoc(doc(db, 'trolley_rooms', code));
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  };

  const createRoom = async () => {
    if (!currentPlayer.trim()) return;
    
    const code = generateRoomCode();
    const roomRef = doc(db, "trolley_rooms", code);

    try {
      await setDoc(roomRef, {
        gameState: 'lobby',
        players: [currentPlayer],
        createdAt: Date.now(),
        trolley: null
      });

      setRoomCode(code);
      setIsRoomHead(true);
      setGameState('lobby');
    } catch (error) {
      console.error("Error creating room. Please try again.");
      alert("Error creating room. Please try again.");
    }
  };

  const joinRoom = async (code) => {
    if (!currentPlayer.trim() || !code.trim()) return;
    
    const roomRef = doc(db, "trolley_rooms", code);
    
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
        if (data.players.length >= 10) {
          alert("Room is full!");
          return;
        }
        
        await updateDoc(roomRef, {
          players: arrayUnion(currentPlayer)
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

  const assignRoles = async () => {
    if (!roomCode) return;
    
    const roomRef = doc(db, 'trolley_rooms', roomCode);
    const snap = await getDoc(roomRef);
    const roomData = snap.data();
    const roomPlayers = roomData.players;

    if (roomPlayers.length < 3) {
      alert('Need at least 3 players (1 driver + 2 teams)');
      return;
    }

    // Shuffle players and assign roles
    const shuffled = [...roomPlayers].sort(() => Math.random() - 0.5);
    const driver = shuffled[0];
    const remainingPlayers = shuffled.slice(1);
    
    // Split remaining players into two teams as evenly as possible
    const teamASize = Math.ceil(remainingPlayers.length / 2);
    const teamA = remainingPlayers.slice(0, teamASize);
    const teamB = remainingPlayers.slice(teamASize);

    // --- NEW: Initialize rails with one system-placed good person card ---
    // Make sure ALL_GOOD_PEOPLE has enough unique cards
    const shuffledGoodPeople = [...ALL_GOOD_PEOPLE].sort(() => Math.random() - 0.5);
    const systemCardA = { ...shuffledGoodPeople[0], systemPlaced: true, stateCardApplied: null };
    const systemCardB = { ...shuffledGoodPeople[1], systemPlaced: true, stateCardApplied: null }; // Ensure it's a different card if possible

    const railA = [systemCardA]; // Rail A starts with one system-placed good person
    const railB = [systemCardB]; // Rail B starts with one system-placed good person
    // --- END NEW ---

    // Deal cards to each player
    const playerHands = {};
    let totalStateCardsCount = 0; // Initialize total state card counter
    roomPlayers.forEach(player => {
      if (player !== driver) {
        // Get 3 random good persons (excluding those used for systemPlaced cards if needed, for simplicity we assume enough cards)
        const goodPersons = [...ALL_GOOD_PEOPLE].sort(() => Math.random() - 0.5).filter(card => card.id !== systemCardA.id && card.id !== systemCardB.id).slice(0, 3);
        // Get 3 random bad persons
        const badPersons = [...ALL_BAD_PEOPLE].sort(() => Math.random() - 0.5).slice(0, 3);
        // Get 1 random state card
        const stateCard = [...ALL_STATE_CARDS].sort(() => Math.random() - 0.5).slice(0, 1);
        
        playerHands[player] = [...goodPersons, ...badPersons, ...stateCard]; // Player gets 3 good, 3 bad, 1 state card
        totalStateCardsCount++; // Increment total state cards for each non-driver player
      }
    });

    // Initialize scores (each player starts with 3 points)
    const currentScores = gameData?.scores || {};
    const scores = Object.fromEntries(
      roomPlayers.map(p => [p, currentScores[p] !== undefined ? currentScores[p] : 10])
    );

    await updateDoc(roomRef, {
      'trolley': {
        currentDriver: driver,
        teamA,
        teamB,
        railA, // Rails start with system-placed card
        railB, // Rails start with system-placed card
        scores,
        round: (gameData?.round || 0) + 1,
        selectedRail: null,
        roundPhase: 'building', // building, deciding, completed
        playerHands: playerHands, // Store player hands in gameData
        totalStateCards: totalStateCardsCount, // Store the total state cards dealt
        stateCardsUsed: 0, // Initialize state cards used count
      },
      'gameState': 'playing'
    });
  };

  // Helper to get card counts on a rail
  const getRailCardCounts = (rail) => {
    let goodCount = 0;
    let badCount = 0;
    rail.forEach(card => {
      if (card.type === 'person') {
        if (card.character === 'good') goodCount++;
        else if (card.character === 'bad') badCount++;
      }
    });
    return { goodCount, badCount };
  };

  const playPersonCard = async (cardObject) => {
    if (!roomCode || gameData.roundPhase !== 'building') return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    const currentPlayerTeam = gameData.teamA.includes(currentPlayer) ? 'A' : 'B';
    const opponentTeam = currentPlayerTeam === 'A' ? 'B' : 'A';

    let railKeyToUpdate = null;
    let currentRailContent = null;
    
    const ownRailKey = `rail${currentPlayerTeam}`;
    const opponentRailKey = `rail${opponentTeam}`;
    const ownRail = gameData[ownRailKey];
    const opponentRail = gameData[opponentRailKey];

    const { goodCount: ownGoodCount, badCount: ownBadCount } = getRailCardCounts(ownRail);
    const { goodCount: oppGoodCount, badCount: oppBadCount } = getRailCardCounts(opponentRail);

    // Rule: Rail will only have 2 good person cards and 1 bad person card (total 3 person cards)
    // Remember one good person card is already placed by the system
    // So players can add 1 more good person card and 1 bad person card
    const currentPersonCardsOnOwnRail = ownRail.filter(card => card.type === 'person').length;
    const currentPersonCardsOnOpponentRail = opponentRail.filter(card => card.type === 'person').length;

    if (cardObject.character === 'good') {
      if (currentPersonCardsOnOwnRail >= 3 || ownGoodCount >= 2) {
        alert('Cannot add more good persons to your rail. Limit is 2 good persons and 3 total persons.');
        return;
      }
      railKeyToUpdate = ownRailKey;
      currentRailContent = ownRail;
    } else if (cardObject.character === 'bad') {
      // Rule: Bad person card will be put to the opponent rail
      if (currentPersonCardsOnOpponentRail >= 3 || oppBadCount >= 1) {
        alert('Cannot add more bad persons to opponent rail. Limit is 1 bad person and 3 total persons.');
        return;
      }
      railKeyToUpdate = opponentRailKey;
      currentRailContent = opponentRail;
    } else {
        return; // Should not happen for person cards
    }

    if (!railKeyToUpdate || !currentRailContent) return; // Should not happen if logic is sound

    // Remove the card from the current player's hand
    const updatedPlayerHand = gameData.playerHands[currentPlayer].filter(card => card.id !== cardObject.id);
    const updatedPlayerHands = {
        ...gameData.playerHands,
        [currentPlayer]: updatedPlayerHand
    };

    // Add stateCardApplied: null to the person card when it's initially placed
    const newPersonCardOnRail = { ...cardObject, stateCardApplied: null };
    const newRail = [...currentRailContent, newPersonCardOnRail];
    
    // Update the specific rail and player hands in the database
    await updateDoc(roomRef, {
      [`trolley.${railKeyToUpdate}`]: newRail,
      'trolley.playerHands': updatedPlayerHands
    });

    // Check if both rails are complete (3 person cards each) AND all state cards are used
    const railA = railKeyToUpdate === 'railA' ? newRail : gameData.railA;
    const railB = railKeyToUpdate === 'railB' ? newRail : gameData.railB;

    if (railA.length === 3 && railB.length === 3 && gameData.stateCardsUsed === gameData.totalStateCards) {
      // Both rails complete and all state cards used, driver can now decide
      await updateDoc(roomRef, {
        'trolley.roundPhase': 'deciding'
      });
    }
  };

  const initiateStateCardTargeting = (stateCard) => {
    if (gameData?.roundPhase !== 'building') return;
    setSelectedStateCardToApply(stateCard);
  };

  const applyStateCardToPerson = async (targetRailKey, targetCardId) => {
    if (!roomCode || !selectedStateCardToApply || gameData.roundPhase !== 'building') return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    const currentRail = gameData[targetRailKey];

    // Find the index of the target person card
    const targetCardIndex = currentRail.findIndex(card => card.id === targetCardId && card.type === 'person');

    if (targetCardIndex === -1) {
      alert("Selected card is not a valid target or not found.");
      setSelectedStateCardToApply(null); // Reset targeting mode
      return;
    }

    // Check if a state card is already applied to this person card
    if (currentRail[targetCardIndex].stateCardApplied) {
        alert("A state card is already applied to this person.");
        setSelectedStateCardToApply(null); // Reset targeting mode
        return;
    }

    const updatedRail = [...currentRail];
    updatedRail[targetCardIndex] = {
      ...updatedRail[targetCardIndex],
      stateCardApplied: selectedStateCardToApply, // Apply the state card object
    };

    // Remove the state card from the player's hand
    const updatedPlayerHand = gameData.playerHands[currentPlayer].filter(card => card.id !== selectedStateCardToApply.id);
    const updatedPlayerHands = {
        ...gameData.playerHands,
        [currentPlayer]: updatedPlayerHand
    };

    await updateDoc(roomRef, {
      [`trolley.${targetRailKey}`]: updatedRail,
      'trolley.playerHands': updatedPlayerHands,
      'trolley.stateCardsUsed': gameData.stateCardsUsed + 1, // Increment the state cards used counter
    });

    setSelectedStateCardToApply(null); // Exit targeting mode
    // alert(`"${selectedStateCardToApply.name}" applied to "${currentRail[targetCardIndex].name}"!`);
  };

  // Function to remove a person card from the rail and return to hand
  const removePersonCardFromRail = async (railKey, cardId) => {
    if (!roomCode || gameData.roundPhase !== 'building') return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    const currentRail = gameData[railKey];

    // Find the index and the card object
    const cardIndex = currentRail.findIndex(card => card.id === cardId && card.type === 'person');
    if (cardIndex === -1) {
        alert("Card not found on this rail.");
        return;
    }
    const cardToRemove = currentRail[cardIndex];

    // --- NEW: Prevent removal if card is systemPlaced ---
    if (cardToRemove.systemPlaced) {
        alert("This card was placed by the system and cannot be removed.");
        return;
    }
    // --- END NEW ---

    // Add confirmation dialog
    const confirmed = window.confirm("Do you really want to remove this card?");
    if (!confirmed) {
        return; // User cancelled
    }

    // Determine the current player's team
    const currentPlayerTeam = gameData.teamA.includes(currentPlayer) ? 'A' : 'B';

    // Determine which team placed this specific card
    let cardPlacingTeam;
    const railTeam = railKey === 'railA' ? 'A' : 'B'; // Team that 'owns' this rail

    if (cardToRemove.character === 'good') {
        // Good cards are always placed by the team whose rail it is
        cardPlacingTeam = railTeam;
    } else if (cardToRemove.character === 'bad') {
        // Bad cards are placed by the *opponent* team onto this rail
        cardPlacingTeam = railTeam === 'A' ? 'B' : 'A';
    } else {
        alert("Invalid card type for removal.");
        return;
    }

    // Verify if the current player belongs to the team that placed this card
    if (currentPlayerTeam !== cardPlacingTeam) {
        alert("You can only remove cards that *your team* has placed.");
        return;
    }

    // Remove card from rail
    const updatedRail = currentRail.filter(card => card.id !== cardId);

    // Add card back to player's hand (without the stateCardApplied property, as state card effect is tied to its presence on rail)
    const cardForHand = {
        id: cardToRemove.id,
        name: cardToRemove.name,
        type: cardToRemove.type,
        character: cardToRemove.character
    };
    const updatedPlayerHand = [...gameData.playerHands[currentPlayer], cardForHand];
    const updatedPlayerHands = {
        ...gameData.playerHands,
        [currentPlayer]: updatedPlayerHand
    };

    await updateDoc(roomRef, {
        [`trolley.${railKey}`]: updatedRail,
        'trolley.playerHands': updatedPlayerHands
    });
    alert(`"${cardToRemove.name}" removed from rail and returned to your hand.`);
  };

  const chooseRail = async (rail) => {
    if (!roomCode || gameData.roundPhase !== 'deciding') return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    const scores = { ...gameData.scores };

    // Players from the chosen rail lose 1 point
    const losers = rail === 'A' ? gameData.teamA : gameData.teamB;
    losers.forEach(player => {
      scores[player] = (scores[player] || 0) - 1;
    });

    // Check if any player has score below 0 (game ends)
    const gameOver = Object.values(scores).some(score => score < 0);

    // Update the database immediately
    await updateDoc(roomRef, {
      'trolley.scores': scores,
      'trolley.selectedRail': rail,
      'trolley.roundPhase': 'completed',
      'gameState': gameOver ? 'ended' : 'playing'
    });
  };

  const startNextRound = async () => {
    await assignRoles();
  };

  // New function for driver to force decision
  const forceDriverDecision = async () => {
    if (!roomCode || !isDriver || gameData?.roundPhase !== 'building') return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    await updateDoc(roomRef, {
      'trolley.roundPhase': 'deciding'
    });
  };

  const leaveRoom = async () => {
    if (!roomCode || !currentPlayer) return;
    
    const roomRef = doc(db, 'trolley_rooms', roomCode);
    
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
      
      let updateData = {
        players: updatedPlayers
      };
      
      // Handle game state updates if in a game
      if (data.gameState === 'playing' && data.trolley) {
        let needsNewRound = false;
        
        // If the driver left
        if (data.trolley.currentDriver === currentPlayer) {
          needsNewRound = true;
        }
        
        // If a team member left
        if (data.trolley.teamA.includes(currentPlayer) || data.trolley.teamB.includes(currentPlayer)) {
          needsNewRound = true;
        }
        
        // If we need a new round but don't have enough players
        if (needsNewRound && updatedPlayers.length < 3) {
          updateData.gameState = 'lobby';
          updateData.trolley = null;
        } else if (needsNewRound) {
          // We'll need to restart the round after updating players
          updateData.gameState = 'lobby';
          updateData.trolley = null;
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
    setGameData(null);
    setPlayerHand([]); // Reset player hand on leaving
    setSelectedStateCardToApply(null); // Reset state card targeting
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

  // Firebase listener
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = doc(db, 'trolley_rooms', roomCode);
    const unsub = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlayers(data.players || []);
        setGameState(data.gameState || 'lobby');
        setGameData(data.trolley);
        
        // Update current player's hand when gameData changes
        if (data.trolley?.playerHands && data.trolley.playerHands[currentPlayer]) {
            setPlayerHand(data.trolley.playerHands[currentPlayer]);
        } else {
            setPlayerHand([]); // Clear hand if not in game or no hand assigned
        }

        // Check if current player is room head (first player)
        if (data.players && data.players.length > 0) {
          setIsRoomHead(currentPlayer === data.players[0]);
        }
      } else {
        // Room was deleted or no longer exists
        resetLocalState();
      }
    });

    return () => unsub();
  }, [roomCode, currentPlayer]);

  // New useEffect for managing train impact animation
  useEffect(() => {
    // Check if a rail has been selected and the round is completed
    if (gameData?.selectedRail && gameData.roundPhase === 'completed') {
        const railChosen = gameData.selectedRail;
        const isCurrentPlayerOnImpactedTeam =
            (railChosen === 'A' && gameData.teamA.includes(currentPlayer)) ||
            (railChosen === 'B' && gameData.teamB.includes(currentPlayer));

        // Only trigger animation for players on the impacted team AND the driver
        // (The driver also needs to see the impact effect for the rail they chose)
        if (isCurrentPlayerOnImpactedTeam || currentPlayer === gameData.currentDriver) {
            setImpactedRailVisual(railChosen);
            setIsImpactAnimating(true);

            // Set a timeout to end the animation and clear the visual state
            setTimeout(() => {
                setIsImpactAnimating(false);
                setImpactedRailVisual(null);
            }, 3000); // Animation duration (1.5 seconds)
        }
    }
    // Dependency array: re-run when gameData.selectedRail, gameData.roundPhase,
    // gameData.teamA, gameData.teamB, gameData.currentDriver, or currentPlayer changes.
    // Ensure all variables from gameData used inside the effect are in the dependency array.
  }, [gameData?.selectedRail, gameData?.roundPhase, gameData?.teamA, gameData?.teamB, gameData?.currentDriver, currentPlayer]);

  // Home screen
  if (gameState === 'home') {
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={styles.card}>
            <h1 className={styles.title}>🚂 電車難題-最終審判</h1>
            <p className={`${styles.subtitle} ${styles.textGray}`}>Find out what you really concern</p>
            
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
      </div>
    );
  }

  // Lobby screen
  if (gameState === 'lobby') {
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={styles.cardSmall}>
            <div className={`${styles.textCenter} ${styles.mb6}`}>
              <h2 className={styles.heading}>🚂 Room: {roomCode}</h2>
              <p className={styles.textGray}>Players: {players.length}/10</p>
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
                onClick={assignRoles}
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
      </div>
    );
  }

  if (!gameData && gameState === 'playing') {
    return (
      <div className={styles.container}>
        <div className={styles.maxWidth2xl}>
          <div className={styles.cardSmall}>
            <h2 className={styles.heading}>Trolley Problem Game</h2>
            <p className={styles.textGray}>Setting up game...</p>
          </div>
        </div>
      </div>
    );
  }

  const isDriver = currentPlayer === gameData?.currentDriver;
  const isTeamA = gameData?.teamA.includes(currentPlayer);
  const Team = isTeamA ? 'A':'B';
  const isTeamB = gameData?.teamB.includes(currentPlayer);

  // Game ended screen
  if (gameState === 'ended') {
    const winner = Object.entries(gameData?.scores || {}).find(([_, score]) => score >= 0);
    const losers = Object.entries(gameData?.scores || {}).filter(([_, score]) => score < 0);
    const rankings = Object.entries(gameData?.scores || {}).sort((a, b) => b[1] - a[1]);
    
    return (
      <div className={styles.container}>
        <div className={styles.maxWidthMd}>
          <div className={`${styles.card} ${styles.textCenter}`}>
            <div className={styles.mb6}>
              <Award className={styles.iconLarge} />
              <h2 className={styles.heading}>🚂 Game Over!</h2>
              <p className={styles.textGray}>Final Results</p>
            </div>
            
            <div className={`${styles.spaceY3} ${styles.mb6}`}>
              <h3 className={styles.subheading}>Final Scores</h3>
              {rankings.map(([player, score], index) => (
                <div key={player} className={`${styles.rankingItem} ${
                  index === 0 ? styles.rankingFirst :
                  index === 1 ? styles.rankingSecond :
                  index === 2 ? styles.rankingThird :
                  styles.rankingOther
                }`}>
                  <div className={styles.left}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.name}>{player}</span>
                  </div>
                  <span className={`${styles.score} ${score < 0 ? styles.textRed : styles.textGreen}`}>
                    {score} {score < 0 ? '(Eliminated)' : ''}
                  </span>
                </div>
              ))}
            </div>

            {losers.length > 0 && (
              <p className={styles.textGray}>
                {losers.map(([name]) => name).join(', ')} eliminated!
              </p>
            )}

            {isRoomHead && (
              <button
                onClick={resetAndEndGame}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                <RotateCcw className={styles.icon} />
                Play Again
              </button>
            )}
            
            {!isRoomHead && (
              <button
                onClick={resetGame}
                className={`${styles.button} ${styles.buttonGray}`}
              >
                Leave Room
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth2xl}>
        <div className={styles.cardSmall}>
          <div className={`${styles.textCenter} ${styles.mb4}`}>
            <h2 className={styles.heading}>🚂 電車難題_最終審判 - Round {gameData?.round}</h2>
            <p className={styles.textGray}>Room: {roomCode}</p>
          </div>
          
          <div className={`${styles.spaceY2} ${styles.mb4}`}>
            <p className={styles.textGray}>👨‍✈️ 司機: <strong>{gameData?.currentDriver}</strong></p>
            <p className={styles.textGray}>👥 Team A: {gameData?.teamA.join(', ')}</p>
            <p className={styles.textGray}>👥 Team B: {gameData?.teamB.join(', ')}</p>
          </div>

          {/* Rails Display */}
          <div className={`${styles.spaceY3} ${styles.mb4}`}>
            <div className={styles.railDisplayContainer}>
              <h3 className={styles.subheading}>🚉 軌道 A ({gameData?.railA.length}/3)</h3>
              <div className="flex gap-2 flex-wrap">
                {gameData?.railA.map((card) => {
                  // Determine if this specific card is removable by the current player
                  const isRemovable =
                      gameData?.roundPhase === 'building' && // Must be in building phase
                      card.type === 'person' && // Must be a person card
                      !card.systemPlaced && // NEW: System-placed cards are not removable
                      (
                          (card.character === 'good' && gameData.teamA.includes(currentPlayer)) || // Good card on Rail A, removable by Team A
                          (card.character === 'bad' && gameData.teamB.includes(currentPlayer))     // Bad card on Rail A (placed by Team B), removable by Team B
                      );

                  return (
                    <div
                      key={card.id}
                      className={`${styles.personCard} ${card.character === 'good' ? styles.goodPersonCard : styles.badPersonCard} ${card.systemPlaced ? styles.systemPlacedCard : ''} ${selectedStateCardToApply && card.type === 'person' ? styles.targetableCard : ''} ${isRemovable ? styles.removableCard : ''}`}
                      onClick={() => {
                        if (selectedStateCardToApply && card.type === 'person') {
                          applyStateCardToPerson('railA', card.id);
                        } else if (isRemovable) {
                          removePersonCardFromRail('railA', card.id);
                        }
                      }}
                    >
                      {card.character === 'good' ? '😃' : '🤬'} {card.name}
                      {card.stateCardApplied && (
                        <div className={styles.stateCardAppliedBadge}>
                          📜 {card.stateCardApplied.name}
                        </div>
                      )}
                    </div>
                  );
                })}
                {Array(3 - (gameData?.railA.length || 0)).fill(null).map((_, index) => (
                  <div key={`empty-a-${index}`} className={`${styles.personCard} ${styles.emptyPersonCard}`}>
                    empty
                  </div>
                ))}
              </div>
                {isImpactAnimating && impactedRailVisual === 'A' && (
                   <div className={`${styles.trainImpactIcon} ${isImpactAnimating ? styles.animate : ''}`}>
                       🚆
                   </div>
                )}
            </div>
            
            <div className={styles.railDisplayContainer}>
              <h3 className={styles.subheading}>🚉 軌道 B ({gameData?.railB.length}/3)</h3>
              <div className="flex gap-2 flex-wrap">
                {gameData?.railB.map((card) => {
                  // Determine if this specific card is removable by the current player
                  const isRemovable =
                      gameData?.roundPhase === 'building' && // Must be in building phase
                      card.type === 'person' && // Must be a person card
                      !card.systemPlaced && // NEW: System-placed cards are not removable
                      (
                          (card.character === 'good' && gameData.teamB.includes(currentPlayer)) || // Good card on Rail B, removable by Team B
                          (card.character === 'bad' && gameData.teamA.includes(currentPlayer))     // Bad card on Rail B (placed by Team A), removable by Team A
                      );

                  return (
                    <div
                      key={card.id}
                      className={`${styles.personCard} ${card.character === 'good' ? styles.goodPersonCard : styles.badPersonCard} ${card.systemPlaced ? styles.systemPlacedCard : ''} ${selectedStateCardToApply && card.type === 'person' ? styles.targetableCard : ''} ${isRemovable ? styles.removableCard : ''}`}
                      onClick={() => {
                        if (selectedStateCardToApply && card.type === 'person') {
                          applyStateCardToPerson('railB', card.id);
                        } else if (isRemovable) {
                          removePersonCardFromRail('railB', card.id);
                        }
                      }}
                    >
                      {card.character === 'good' ? '😃' : '🤬'} {card.name}
                      {card.stateCardApplied && (
                        <div className={styles.stateCardAppliedBadge}>
                          📜 {card.stateCardApplied.name}
                        </div>
                      )}
                    </div>
                  );
                })}
                {Array(3 - (gameData?.railB.length || 0)).fill(null).map((_, index) => (
                  <div key={`empty-b-${index}`} className={`${styles.personCard} ${styles.emptyPersonCard}`}>
                    empty
                  </div>
                ))}
              </div>
                {isImpactAnimating && impactedRailVisual === 'B' && (
                    <div className={`${styles.trainImpactIcon} ${isImpactAnimating ? styles.animate : ''}`}>
                        🚆
                    </div>
                )}
            </div>
          </div>

          {/* Driver Decision */}
          {isDriver && gameData?.roundPhase === 'deciding' && (
            <div className={`${styles.spaceY3} ${styles.mb4}`}>
              <h3 className={styles.subheading}>🚂 選擇要衝撞哪條軌道:</h3>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => chooseRail('A')}
                  className={`${styles.button} ${styles.buttonWarning}`}
                >
                  💥 衝撞軌道 A
                </button>
                <button
                  onClick={() => chooseRail('B')}
                  className={`${styles.button} ${styles.buttonWarning}`}
                >
                  💥 衝撞軌道 B
                </button>
              </div>
            </div>
          )}

          {/* Driver's "Call for Decision" button */}
          {isDriver && gameData?.roundPhase === 'building' && (
            <div className={`${styles.textCenter} ${styles.mb4}`}>
              <button
                onClick={forceDriverDecision}
                className={`${styles.button} ${styles.buttonWarning}`}
              >
                宣告:做出審判
              </button>
            </div>
          )}

          {/* Player Actions (Team A or Team B) */}
          {(isTeamA || isTeamB) && gameData?.roundPhase === 'building' && (
            <div className={`${styles.spaceY2} ${styles.mb4}`}>
              <h3 className={styles.subheading}>你的隊伍: {Team}, 你的手牌:</h3>
              <div className="flex gap-2 justify-center flex-wrap">
                {playerHand.map((card) => {
                  let buttonClass = styles.buttonSecondary;
                  let buttonText = card.name;
                  let disabled = false;
                  let onClickHandler = null;

                  if (card.type === 'person') {
                    buttonClass = `${styles.buttonSecondary} ${card.character === 'good' ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900'}`;
                    buttonText = `${card.character === 'good' ? '😃' : '🤬'} ${card.name}`;
                    
                    const ownRail = isTeamA ? gameData.railA : gameData.railB;
                    const opponentRail = isTeamA ? gameData.railB : gameData.railA;
                    const { goodCount: ownGoodCount, badCount: ownBadCount } = getRailCardCounts(ownRail);
                    const { goodCount: oppGoodCount, badCount: oppBadCount } = getRailCardCounts(opponentRail);

                    // Note: Rail length limit is now 3, with 1 system-placed good card initially
                    const currentPersonCardsOnOwnRail = ownRail.filter(card => card.type === 'person').length;
                    const currentPersonCardsOnOpponentRail = opponentRail.filter(card => card.type === 'person').length;

                    if (card.character === 'good') {
                        disabled = currentPersonCardsOnOwnRail >= 3 || ownGoodCount >= 2;
                        onClickHandler = () => playPersonCard(card);
                    } else if (card.character === 'bad') {
                        disabled = currentPersonCardsOnOpponentRail >= 3 || oppBadCount >= 1;
                        onClickHandler = () => playPersonCard(card);
                    }
                  } else if (card.type === 'state') {
                    buttonClass = `${styles.buttonSecondary} bg-blue-200 text-blue-900 ${selectedStateCardToApply?.id === card.id ? styles.selectedCardForTargeting : ''}`;
                    buttonText = `📜 ${card.name}`;
                    // Disable if already targeting another card, or if it's the card currently selected for targeting
                    disabled = !!selectedStateCardToApply && selectedStateCardToApply.id !== card.id;
                    onClickHandler = () => {
                      if (selectedStateCardToApply?.id === card.id) {
                        setSelectedStateCardToApply(null); // Deselect if already selected
                      } else {
                        initiateStateCardTargeting(card);
                      }
                    };
                  }

                  return (
                    <button
                      key={card.id}
                      onClick={onClickHandler}
                      disabled={disabled || gameData?.roundPhase !== 'building'}
                      className={buttonClass}
                    >
                      {buttonText}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {selectedStateCardToApply && (
            <div className={`${styles.textCenter} ${styles.mt-2} ${styles.mb4}`}>
                <p className={styles.textGray}>
                    請選擇一張牌來施加特性 "<strong className={styles.textBlue}>{selectedStateCardToApply.name}</strong>"
                    <button onClick={() => setSelectedStateCardToApply(null)} className={styles.cancelButton}>取消</button>
                </p>
            </div>
          )}

          {/* Game Status */}
          <div className={`${styles.mb4} ${styles.textCenter}`}>
            {gameData?.roundPhase === 'building' && (
              <p className={styles.textGray}>
                Teams are building their rails... (Total person cards placed: {(gameData?.railA.length || 0) + (gameData?.railB.length || 0)}/6)
                {gameData?.totalStateCards !== undefined && (
                    <span> | State cards used: {gameData.stateCardsUsed}/{gameData.totalStateCards}</span>
                )}
              </p>
            )}

            {gameData?.roundPhase === 'deciding' && !isDriver && (
              <p className={styles.textGray}>
                ⏳ Waiting for {gameData?.currentDriver} to make their decision...
              </p>
            )}

            {gameData?.selectedRail && (
              <div className={`${styles.spaceY2} ${styles.textCenter}`}>
                <h3 className={styles.subheading}>💥 Decision Made!</h3>
                <p>列車選擇撞向 {gameData?.selectedRail}!</p>
                <p>Team {gameData?.selectedRail} 玩家距離地獄靠近了一步.</p>
              </div>
            )}
          </div>

          {/* Scores */}
          <div className={`${styles.spaceY2} ${styles.mb4}`}>
            <h3 className={`${styles.subheading} ${styles.textCenter}`}>🔥 大家與地獄的距離</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(gameData?.scores || {})
                .sort((a, b) => b[1] - a[1])
                .map(([player, score]) => (
                  <div key={player} className={`p-2 rounded text-center ${score < 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    <strong>{player}</strong>: {score}
                  </div>
                ))}
            </div>
          </div>

          {/* Control Buttons */}
          <div className={`${styles.textCenter} ${styles.spaceY3}`}>
            {/* Next Round Button */}
            {isRoomHead && gameData?.roundPhase === 'completed' && gameState !== 'ended' && (
              <button
                onClick={startNextRound}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                Start Next Round
              </button>
            )}

            {/* Leave Room Button */}
            <button
              onClick={leaveRoom}
              className={`${styles.button} ${styles.buttonGray} ${styles.mt3}`}
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrolleyProblemGame;