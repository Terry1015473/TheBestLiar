import React, { useState, useEffect, useCallback } from 'react';
import { Users, Crown, Eye, MessageCircle, Award, Play, RotateCcw, Globe, Zap, HeartCrack, Leaf, Scale, Lightbulb, Megaphone, Group, LandPlot, CloudRain, Radiation, Factory, DollarSign, BookOpen, Newspaper, Handshake, FlaskConical, Microscope } from 'lucide-react';
import styles from './BestLiarGame.module.css';
import { db } from './firebase'; // Assuming firebase.js is correctly configured for Firestore
import {
    doc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, getDoc, deleteDoc, deleteField
} from 'firebase/firestore';
import { useTranslation } from 'react-i18next'; // Import useTranslation

// Define game roles and their starting stats
// Role keys remain English for internal logic, but descriptions and display names will be translated
const ROLES = {
    'World Government': {
        icon: Scale,
        descriptionKey: 'descWorldGovernment', // Key for translation
        actions: []
    },
    'Business': {
        icon: Factory,
        descriptionKey: 'descBusiness',
        actions: []
    },
    'Scientist': {
        icon: Lightbulb,
        descriptionKey: 'descScientist',
        actions: []
    },
    'Mass Media': {
        icon: Newspaper,
        descriptionKey: 'descMassMedia',
        actions: []
    },
    'The Public': {
        icon: Group,
        descriptionKey: 'descThePublic',
        actions: []
    },
    'The Earth': {
        icon: LandPlot,
        descriptionKey: 'descTheEarth',
        actions: [
            // Add a translation key for each action name
            { id: 'earth_earthquake', nameKey: 'actionTriggerEarthquake', effect: { population: -20, environment: -5, public_satisfaction: -15, earth_power: 10 } },
            { id: 'earth_flood', nameKey: 'actionTriggerMegaFlood', effect: { population: -15, environment: -5, public_satisfaction: -10, earth_power: 10 } },
            { id: 'earth_virus', nameKey: 'actionUnleashNewVirus', icon: FlaskConical, nameKey: 'actionUnleashNewVirus', effect: { population: -25, environment: 5, public_satisfaction: -20, earth_power: 15 } },
            { id: 'earth_famine', nameKey: 'actionCauseWidespreadFamine', effect: { population: -30, environment: -5, public_satisfaction: -25, earth_power: 15 } },
            { id: 'earth_recovery', nameKey: 'actionInitiateNaturalRecovery', effect: { environment: 20, earth_power: -10 } },
        ]
    },
};

const ProgressBar = ({ label, value, max, colorClass }) => {
    const percentage = (value / max) * 100;
    // Ensure value doesn't go below 0 for display purposes
    const displayValue = Math.max(0, value);

    return (
        <div className={styles.progressBarContainer}>
            <span className={styles.progressBarLabel}>{label}</span>
            <div className={styles.progressBarBackground}>
                <div
                    className={`${styles.progressBarFill} ${colorClass}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <span className={styles.progressBarValue}>
                {label.includes('Population') ? `${displayValue}M` : `${displayValue}%`}
            </span>
        </div>
    );
};

// Initial game state parameters
const INITIAL_GAME_STATS = {
    population: 100, // in millions, max 200, min 0
    environment: 100, // max 100, min 0
    government_power: 50, // max 100, min 0
    business_power: 50, // max 100, min 0
    scientist_power: 50, // max 100, min 0
    media_power: 50, // max 100, min 0
    public_satisfaction: 50, // max 100, min 0
    earth_power: 50, // max 100, min 0
};

const TheWorld = () => {
    const { t, i18n } = useTranslation(); // Initialize translation hook

    const [gameState, setGameState] = useState('home'); // home, lobby, playing, ended
    const [players, setPlayers] = useState([]);
    const [currentPlayerName, setCurrentPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [inputRoomCode, setInputRoomCode] = useState('');
    const [isRoomHead, setIsRoomHead] = useState(false);
    const [currentRound, setCurrentRound] = useState(1);
    const [playerRoles, setPlayerRoles] = useState({}); // { playerName: 'Role Name' }
    const [playerChoices, setPlayerChoices] = useState({}); // { playerName: 'action_id' } - for Earth's choice and dynamic choices
    const [gameStats, setGameStats] = useState(INITIAL_GAME_STATS);
    const [roundResults, setRoundResults] = useState([]); // Array of strings describing round outcomes
    const [myRole, setMyRole] = useState(null); // The role of the current player
    const [winner, setWinner] = useState(null); // Stores the winner's name

    // New states for dynamic round flow
    const [roundPhase, setRoundPhase] = useState('earth_choice'); // 'earth_choice', 'dynamic_reactions', 'round_resolution'
    const [activePlayersForChoice, setActivePlayersForChoice] = useState([]); // Players expected to make a choice in current phase
    const [currentDynamicPrompt, setCurrentDynamicPrompt] = useState('');
    const [currentDynamicChoices, setCurrentDynamicChoices] = useState([]); // Choices generated by LLM
    const [lastActionTaken, setLastActionTaken] = useState(null); // { playerName, role, actionName, effect }
    const [isGeneratingChoices, setIsGeneratingChoices] = useState(false); // Loading state for LLM call
    const [roundChainHistory, setRoundChainHistory] = useState([]); // To display the sequence of events in a round
    const [processingRoundFlag, setProcessingRoundFlag] = useState(false); // New flag to prevent multiple processRound calls
    const [nextTargetRoleForChaining, setNextTargetRoleForChaining] = useState(null); // Add this line

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
        if (!currentPlayerName.trim()) return;

        const code = generateRoomCode();
        const roomRef = doc(db, "rooms", code);

        try {
            await setDoc(roomRef, {
                gameState: 'lobby',
                players: [{ name: currentPlayerName, id: Date.now().toString() }], // Store player objects
                playerRoles: {},
                playerChoices: {}, // Earth's choice and dynamic choices
                gameStats: INITIAL_GAME_STATS,
                currentRound: 1,
                roundResults: [],
                winner: null,
                roundPhase: 'earth_choice', // Initial phase
                activePlayersForChoice: [],
                currentDynamicPrompt: '',
                currentDynamicChoices: [],
                lastActionTaken: null,
                roundChainHistory: [],
                processingRound: false, // Initialize the flag
                nextTargetRoleForChaining: null,
                createdAt: Date.now(),
            });

            setRoomCode(code);
            setIsRoomHead(true);
            setGameState('lobby');
        } catch (error) {
            console.error("Error creating room:", error);
            alert(t('errorCreatingRoom')); // Translate alert
        }
    };

    const joinRoom = async (code) => {
        if (!currentPlayerName.trim()) {
            alert(t('enterYourName')); // Translate alert
            return;
        }
        if (!code.trim()) {
            alert(t('enterRoomCode')); // Translate alert
            return;
        }

        const roomRef = doc(db, "rooms", code);

        try {
            const roomSnap = await getDoc(roomRef);

            if (roomSnap.exists()) {
                const data = roomSnap.data();

                // Check if player is already in the room
                if (data.players.some(p => p.name === currentPlayerName)) {
                    alert(t('playerAlreadyInRoom')); // Translate alert
                    return;
                }

                // Check if room is full (max 6 players for 6 roles)
                if (data.players.length >= 6) {
                    alert(t('roomFull')); // Translate alert
                    return;
                }

                const newPlayer = { name: currentPlayerName, id: Date.now().toString() };
                await updateDoc(roomRef, {
                    players: arrayUnion(newPlayer),
                });

                setRoomCode(code);
                setIsRoomHead(false); // Will be updated by onSnapshot if this player becomes head
                setGameState('lobby');
            } else {
                alert(t('roomNotFound')); // Translate alert
            }
        } catch (error) {
            console.error("Error joining room:", error);
            alert(t('errorJoiningRoom')); // Translate alert
        }
    };

    const assignRoles = (currentPlayers) => {
        const allRoles = Object.keys(ROLES);
        const assigned = {};

        if (currentPlayers.length === 0) return assigned;

        const earthPlayerIndex = Math.floor(Math.random() * currentPlayers.length);
        assigned[currentPlayers[earthPlayerIndex].name] = "The Earth"

        const remainingPlayers = currentPlayers.filter((_, index) => index !== earthPlayerIndex);
        const remainingRoles = allRoles.filter(role => role!== "The Earth");
        const shuffledRemainingRoles = remainingRoles.sort(() => 0.5 - Math.random());
        remainingPlayers.forEach((player, index) => {
            if (shuffledRemainingRoles[index]) {
                assigned[player.name] = shuffledRemainingRoles[index];
            }
        });
        return assigned;
    };

    const startGame = async () => {
        if (!isRoomHead) return;

        const roomRef = doc(db, "rooms", roomCode);

        try {
            const roomSnap = await getDoc(roomRef);
            const data = roomSnap.data();

            if (data.players.length < 2) { // Minimum 2 players to start
                alert(t('needAtLeast2Players')); // Translate alert
                return;
            }
            if (data.players.length > 6) { // Max 6 players for 6 roles
                alert(t('max6Players')); // Translate alert
                return;
            }

            const assignedRoles = assignRoles(data.players);

            await updateDoc(roomRef, {
                playerRoles: assignedRoles,
                gameState: "playing",
                currentRound: 1,
                playerChoices: {},
                gameStats: INITIAL_GAME_STATS,
                roundResults: [],
                winner: null,
                roundPhase: 'earth_choice', // Start with Earth's choice
                activePlayersForChoice: [],
                currentDynamicPrompt: '',
                currentDynamicChoices: [],
                lastActionTaken: null,
                roundChainHistory: [],
                processingRound: false, // Reset flag
                nextTargetRoleForChaining: null,
            });
        } catch (error) {
            console.error("Error starting game:", error);
            alert(t('errorStartingGame')); // Translate alert
        }
    };

    // Fixed Gemini API call function with proper schema structure
    const callGeminiForDynamicChoices = useCallback(async (currentStats, lastAction, targetRole) => {
        setIsGeneratingChoices(true);
        console.log("Calling Gemini for dynamic choices. Target role:", targetRole);
        
        // Pass the desired language to Gemini
        const language = i18n.language === 'zh-TW' ? 'Traditional Chinese' : 'English';

        const prompt = `
            You are the game master for "Project Planet - Earth vs Humanity".
            All responses must be in ${language}.

            Current Global Stats: ${JSON.stringify(currentStats)}
            Last Action Taken: ${lastAction ? JSON.stringify(lastAction) : 'None'}

            IMPORTANT: The "${targetRole}" role is now making their choice in response to the current situation.

            Your task:
            1. Create a brief scenario description (1-2 sentences) explaining the current situation from the perspective of the "${targetRole}" role in ${language}.
            2. Generate exactly 2-3 action choices that the "${targetRole}" role can take. Each choice name must be under 50 characters and action-oriented, in ${language}.
            3. Assign realistic stat changes (-15 to +15) based on what the "${targetRole}" role can realistically accomplish.
            4. For nextTargetRole: 
            - If you want another role to react after "${targetRole}", specify exactly one of these roles: "World Government", "Business", "Scientist", "Mass Media", "The Public", "The Earth"
            - If you want to end the reaction chain, set nextTargetRole to null
            5. Set roundResolved to false if another role should react, or true if the round should end.

            Respond in the exact JSON format specified.
        `;

        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 1000,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        prompt: {
                            type: "string"
                        },
                        choices: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string"
                                    },
                                    effect: {
                                        type: "object",
                                        properties: {
                                            population: { type: "number" },
                                            environment: { type: "number" },
                                            government_power: { type: "number" },
                                            business_power: { type: "number" },
                                            scientist_power: { type: "number" },
                                            media_power: { type: "number" },
                                            public_satisfaction: { type: "number" },
                                            earth_power: { type: "number" }
                                        }
                                    }
                                },
                                required: ["name", "effect"]
                            }
                        },
                        nextTargetRole: {
                            type: "string",
                            nullable: true
                        },
                        roundResolved: {
                            type: "boolean"
                        }
                    },
                    required: ["prompt", "choices", "roundResolved"]
                }
            }
        };

        const apiKey = ""; // Replace with secure method in production
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                console.error(`Gemini API HTTP Error: ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.error("Error response body:", errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log("Gemini API raw response:", result);

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                
                const jsonText = result.candidates[0].content.parts[0].text;
                console.log("Raw JSON string:", jsonText);
                
                let parsedJson;
                try {
                    parsedJson = JSON.parse(jsonText);
                } catch (parseError) {
                    console.error("JSON parsing failed:", parseError);
                    console.error("Raw JSON string:", jsonText);
                    
                    // Return fallback response
                    return createFallbackResponse(targetRole);
                }

                // Validate and sanitize the response
                const sanitizedResponse = validateAndSanitizeResponse(parsedJson, targetRole);
                
                console.log("Gemini API parsed and sanitized JSON:", sanitizedResponse);
                setIsGeneratingChoices(false);
                return sanitizedResponse;
                
            } else {
                console.error("Gemini API returned unexpected structure:", result);
                setIsGeneratingChoices(false);
                return createFallbackResponse(targetRole);
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setIsGeneratingChoices(false);
            return createFallbackResponse(targetRole);
        }
    }, [i18n]); // Add i18n to dependency array

    // Helper function to create fallback responses
    const createFallbackResponse = (targetRole) => {
        // Use translation keys for fallback choices as well
        const fallbackChoices = {
            'World Government': [
                { name: t("actionImplementEmergencyProtocols"), effect: { government_power: 8, public_satisfaction: -5 } },
                { name: t("actionIncreasePublicFunding"), effect: { government_power: -3, public_satisfaction: 10 } }
            ],
            'Business': [
                { name: t("actionInvestInNewTechnology"), effect: { business_power: 5, environment: -3 } },
                { name: t("actionFocusOnSustainability"), effect: { business_power: -5, environment: 8 } }
            ],
            'Scientist': [
                { name: t("actionPublishUrgentResearch"), effect: { scientist_power: 8, public_satisfaction: 5 } },
                { name: t("actionDevelopNewSolutions"), effect: { scientist_power: 5, environment: 3 } }
            ],
            'Mass Media': [
                { name: t("actionLaunchAwarenessCampaign"), effect: { media_power: 6, public_satisfaction: 8 } },
                { name: t("actionInvestigateSituation"), effect: { media_power: 8, government_power: -5 } }
            ],
            'The Public': [
                { name: t("actionOrganizePeacefulProtests"), effect: { public_satisfaction: 5, government_power: -3 } },
                { name: t("actionSupportLocalInitiatives"), effect: { public_satisfaction: 8, environment: 5 } }
            ],
            'The Earth': [
                { name: t("actionNaturalRecoveryProcess"), effect: { environment: 10, earth_power: -5 } },
                { name: t("actionIncreaseNaturalPressure"), effect: { earth_power: 8, population: -8 } }
            ]
        };

        return {
            prompt: t(`The ${targetRole} must respond to the current crisis.`), // This prompt should ideally also be a translation key
            choices: fallbackChoices[targetRole] || fallbackChoices['The Public'],
            nextTargetRole: null,
            roundResolved: true
        };
    };

    // Helper function to map Gemini's role names to our internal role names
    const mapGeminiRoleToInternalRole = (geminiRole) => {
        const roleMapping = {
            // Government variations
            "The Government": "World Government",
            "Government": "World Government", 
            "World Government": "World Government",
            
            // Business variations
            "Business": "Business",
            "The Business": "Business",
            "Businesses": "Business",
            
            // Scientist variations
            "Scientist": "Scientist",
            "Scientists": "Scientist",
            "The Scientist": "Scientist", 
            "The Scientists": "Scientist",
            "Science": "Scientist",
            
            // Media variations
            "Mass Media": "Mass Media",
            "Media": "Mass Media",
            "The Media": "Mass Media",
            "The Mass Media": "Mass Media",
            "Press": "Mass Media",
            "The Press": "Mass Media",
            
            // Public variations
            "The Public": "The Public",
            "Public": "The Public",
            "Citizens": "The Public",
            "The Citizens": "The Public",
            "People": "The Public",
            "The People": "The Public",
            
            // Earth variations
            "The Earth": "The Earth",
            "Earth": "The Earth",
            "Nature": "The Earth",
            "The Nature": "The Earth"
        };
        
        const mappedRole = roleMapping[geminiRole];
        if (mappedRole) {
            console.log(`DEBUG: Mapped Gemini role "${geminiRole}" to internal role "${mappedRole}"`);
            return mappedRole;
        }
        
        console.log(`DEBUG: No mapping found for Gemini role "${geminiRole}"`);
        return geminiRole;
    };

    // Helper function to validate and sanitize responses
    const validateAndSanitizeResponse = (response, targetRole) => {
        const sanitized = {
            prompt: response.prompt || t(`The ${targetRole} must respond to the situation.`),
            choices: [],
            nextTargetRole: null, // Default to null
            roundResolved: false // Default to false, assuming chain continues unless explicitly true
        };

        // --- Handle nextTargetRole property ---
        if (response.hasOwnProperty('nextTargetRole')) {
            // Check if it's explicitly null or the string "null" (Gemini sometimes returns "null" as string)
            if (response.nextTargetRole === null || String(response.nextTargetRole).toLowerCase() === 'null') {
                sanitized.nextTargetRole = null;
            } else if (typeof response.nextTargetRole === 'string' && response.nextTargetRole.trim() !== '') {
                // Map Gemini's role name to our internal role name
                const mappedRole = mapGeminiRoleToInternalRole(response.nextTargetRole.trim());
                sanitized.nextTargetRole = mappedRole;
            }
        }

        // --- Handle roundResolved property ---
        if (response.hasOwnProperty('roundResolved')) {
            if (typeof response.roundResolved === 'boolean') {
                sanitized.roundResolved = response.roundResolved;
            } else if (typeof response.roundResolved === 'string') {
                // Convert string "true" / "false" to boolean
                if (response.roundResolved.toLowerCase() === 'true') {
                    sanitized.roundResolved = true;
                } else if (response.roundResolved.toLowerCase() === 'false') {
                    sanitized.roundResolved = false;
                }
            }
        }

        // Validate choices
        if (Array.isArray(response.choices) && response.choices.length > 0) {
            sanitized.choices = response.choices.map((choice, index) => {
                const sanitizedChoice = {
                    id: `dynamic_choice_${index}`, // Make sure IDs are assigned here
                    name: (choice.name || t(`Action ${index + 1}`)).trim().substring(0, 50),
                    effect: {}
                };

                // Validate and sanitize effects
                if (choice.effect && typeof choice.effect === 'object') {
                    const validStats = ['population', 'environment', 'government_power', 'business_power',
                                    'scientist_power', 'media_power', 'public_satisfaction', 'earth_power'];

                    validStats.forEach(stat => {
                        if (typeof choice.effect[stat] === 'number') {
                            sanitizedChoice.effect[stat] = Math.max(-20, Math.min(20, Math.round(choice.effect[stat])));
                        }
                    });
                }

                // Ensure at least one effect exists
                if (Object.keys(sanitizedChoice.effect).length === 0) {
                    sanitizedChoice.effect.public_satisfaction = Math.floor(Math.random() * 11) - 5; // Random -5 to 5
                }

                return sanitizedChoice;
            }).slice(0, 3); // Max 3 choices
        }

        // Ensure we have at least 2 choices
        if (sanitized.choices.length < 2) {
            const fallback = createFallbackResponse(targetRole);
            sanitized.choices = fallback.choices;
        }

        // Validate nextTargetRole against assigned roles *after* determining roundResolved
        const validRoleNames = Object.keys(ROLES); // Get the actual role keys like "World Government", "Business", etc.
        if (sanitized.nextTargetRole && !validRoleNames.includes(sanitized.nextTargetRole)) {
            // If the role is explicitly defined by Gemini but not in our ROLES, set to null and end chain.
            console.log(`DEBUG: Invalid nextTargetRole after mapping: "${sanitized.nextTargetRole}". Valid roles:`, validRoleNames);
            console.log(`DEBUG: Original Gemini nextTargetRole was: "${response.nextTargetRole}"`);
            sanitized.nextTargetRole = null;
            sanitized.roundResolved = true; // Also indicate resolution if the targeted role is invalid
        } else if (sanitized.nextTargetRole) {
            console.log(`DEBUG: Valid nextTargetRole after mapping: "${sanitized.nextTargetRole}"`);
        }
        
        // Add a console log to see the final sanitized values
        console.log("DEBUG: validateAndSanitizeResponse input - nextTargetRole:", response.nextTargetRole, "roundResolved:", response.roundResolved);
        console.log("DEBUG: validateAndSanitizeResponse output - nextTargetRole:", sanitized.nextTargetRole, "roundResolved:", sanitized.roundResolved);

        return sanitized;
    };

    const submitChoice = async (actionId) => {
        if (!roomCode || !currentPlayerName || !myRole) return;

        console.log(`Player ${currentPlayerName} (${myRole}) submitting choice: ${actionId}`); // Log choice submission

        const roomRef = doc(db, "rooms", roomCode);
        let updateData = {};

        // Store the choice for the current player
        updateData[`playerChoices.${currentPlayerName}`] = actionId;

        try {
            await updateDoc(roomRef, updateData);
            console.log(`Choice ${actionId} submitted to Firestore for ${currentPlayerName}.`);
        } catch (error) {
            console.error("Error submitting choice:", error);
            alert("Error submitting choice. Please try again.");
        }
    };

    const processRound = useCallback(async () => {
        if (!isRoomHead || !roomCode) {
            console.log("processRound: Not room head or no roomCode. Skipping.");
            return;
        }

        const roomRef = doc(db, "rooms", roomCode);
        const roomSnap = await getDoc(roomRef);
        const data = roomSnap.data();

        // Prevent multiple processRound calls
        if (data.processingRound) {
            console.log("processRound: Round already being processed. Skipping.");
            return;
        }

        await updateDoc(roomRef, { processingRound: true }); // Set flag immediately
        console.log("processRound: processingRoundFlag set to TRUE.");

        let currentStats = { ...data.gameStats };
        let newRoundResults = [...(data.roundResults || [])];
        let currentChainHistory = [...(data.roundChainHistory || [])];
        const currentRoles = data.playerRoles;
        let nextPhase = data.roundPhase; // Start with current phase
        let nextActivePlayersForChoice = [];
        let nextDynamicPrompt = '';
        let nextDynamicChoices = [];
        let nextLastActionTaken = null;
        let gameEnded = false;
        let finalWinner = null;

        console.log(`processRound: Current Round Phase: ${data.roundPhase}`);

        // --- Phase: Earth's Choice ---
        if (data.roundPhase === 'earth_choice') {
            const earthPlayerName = Object.keys(currentRoles).find(name => currentRoles[name] === 'The Earth');
            const earthChoiceId = data.playerChoices[earthPlayerName];

            if (!earthPlayerName || earthChoiceId === undefined) { // Check for undefined explicitly
                console.log("processRound (earth_choice): Earth player has not made a choice yet or not found. Releasing flag.");
                await updateDoc(roomRef, { processingRound: false }); // Release flag if no choice
                return; // Exit early
            }

            const earthAction = ROLES['The Earth'].actions.find(a => a.id === earthChoiceId);
            if (earthAction && earthAction.effect) {
                newRoundResults.push(t('earthChose', { actionName: t(earthAction.nameKey) })); // Translate here
                currentChainHistory.push({
                    player: earthPlayerName,
                    role: t(earthPlayerName), // Translate role name for display
                    action: t(earthAction.nameKey), // Translate action name for display
                    effect: earthAction.effect
                });
                Object.entries(earthAction.effect).forEach(([stat, value]) => {
                    currentStats[stat] = Math.max(0, Math.min(stat === 'population' ? 200 : 100, (currentStats[stat] || INITIAL_GAME_STATS[stat]) + value));
                });
                nextLastActionTaken = {
                    playerName: earthPlayerName,
                    role: 'The Earth', // Keep English for Gemini prompt
                    actionName: earthAction.id, // Keep English for Gemini prompt
                    effect: earthAction.effect
                };
            } else {
                console.warn("processRound (earth_choice): Earth action not found or no effect.");
                newRoundResults.push(t("earthUnknownChoice")); // Translate
                nextPhase = 'round_resolution'; // Fallback
            }

            // After Earth's choice, trigger the first dynamic prompt for a human role
            // Get roles currently assigned to players, excluding The Earth
            const assignedHumanRoles = Object.values(currentRoles).filter(roleName => roleName !== 'The Earth');

            if (assignedHumanRoles.length > 0) {
                // Find a player for the first dynamic reaction.
                // We will pick a *random* human role from assigned roles to start the chain.
                const initialTargetRoleName = assignedHumanRoles[Math.floor(Math.random() * assignedHumanRoles.length)];
                const initialTargetPlayerName = Object.keys(currentRoles).find(name => currentRoles[name] === initialTargetRoleName);

                if (initialTargetPlayerName) {
                    console.log("processRound (earth_choice): Fetching Gemini response for initial dynamic reaction.");
                    const geminiResponse = await callGeminiForDynamicChoices(currentStats, nextLastActionTaken, initialTargetRoleName);

                    if (geminiResponse && geminiResponse.prompt && geminiResponse.choices && geminiResponse.choices.length > 0) {
                        nextDynamicPrompt = geminiResponse.prompt;
                        nextDynamicChoices = geminiResponse.choices.map((choice, idx) => ({ ...choice, id: `dynamic_choice_${idx}` }));
                        nextActivePlayersForChoice = [initialTargetPlayerName];
                        nextPhase = 'dynamic_reactions';
                        
                        // Store the suggested next role for after this player makes their choice
                        const nextRoleForChaining = geminiResponse.nextTargetRole;
                        
                        console.log("processRound (earth_choice): Generated choices FOR role:", initialTargetRoleName);
                        console.log("processRound (earth_choice): Next role in chain will be:", nextRoleForChaining);
                        
                        // Update Firestore with the chaining info
                        await updateDoc(roomRef, {
                            gameStats: currentStats,
                            roundResults: newRoundResults,
                            roundChainHistory: currentChainHistory,
                            playerChoices: {},
                            roundPhase: nextPhase,
                            activePlayersForChoice: nextActivePlayersForChoice,
                            currentDynamicPrompt: nextDynamicPrompt,
                            currentDynamicChoices: nextDynamicChoices,
                            lastActionTaken: nextLastActionTaken,
                            nextTargetRoleForChaining: nextRoleForChaining, // Add this line
                            processingRound: false,
                        });
                    } else {
                        console.log("processRound (earth_choice): Gemini response did not provide valid choices or prompt. Transitioning to round_resolution.");
                        newRoundResults.push(t("dynamicChainEnded")); // Translate
                        nextPhase = 'round_resolution';
                        nextActivePlayersForChoice = []; // Clear active players
                    }
                } else {
                    console.log("processRound (earth_choice): Could not find player for the randomly selected assigned role. Transitioning to round_resolution.");
                    newRoundResults.push(t("issueAssigningNextReaction")); // Translate
                    nextPhase = 'round_resolution';
                }
            } else {
                console.log("processRound (earth_choice): No human players assigned roles. Transitioning to round_resolution.");
                newRoundResults.push(t("noHumanPlayersToReact")); // Translate
                nextPhase = 'round_resolution';
            }

            await updateDoc(roomRef, {
                gameStats: currentStats,
                roundResults: newRoundResults,
                roundChainHistory: currentChainHistory,
                playerChoices: {}, // Clear Earth's choice and dynamic choices for this turn
                roundPhase: nextPhase,
                activePlayersForChoice: nextActivePlayersForChoice,
                currentDynamicPrompt: nextDynamicPrompt,
                currentDynamicChoices: nextDynamicChoices,
                lastActionTaken: nextLastActionTaken,
                processingRound: false, // Release flag after update
            });
            console.log("processRound (earth_choice): Updated Firestore and released processingRoundFlag.");
            return;
        }

        // --- Phase: Dynamic Reactions ---
        if (data.roundPhase === 'dynamic_reactions') {
            const activePlayers = data.activePlayersForChoice || [];
            const currentChoices = data.playerChoices || {};

            const allActivePlayersMadeChoice = activePlayers.every(pName => currentChoices[pName] !== undefined);

            if (!allActivePlayersMadeChoice) {
                console.log("processRound (dynamic_reactions): Not all active players have made a choice yet. Releasing flag.");
                await updateDoc(roomRef, { processingRound: false });
                return;
            }

            let playerWhoActed = null;
            let chosenActionId = null;

            // Find which player acted and what their choice was
            for (const pName of activePlayers) {
                if (currentChoices[pName] !== undefined) {
                    playerWhoActed = pName;
                    chosenActionId = currentChoices[pName];
                    break;
                }
            }

            if (!playerWhoActed || chosenActionId === undefined) {
                console.error("processRound (dynamic_reactions): No active player or choice found. Releasing flag.");
                await updateDoc(roomRef, { processingRound: false });
                return;
            }

            const chosenAction = data.currentDynamicChoices.find(c => c.id === chosenActionId);

            if (chosenAction && chosenAction.effect) {
                newRoundResults.push(t('playerReactedByChoosing', { playerName: playerWhoActed, role: t(currentRoles[playerWhoActed]), actionName: chosenAction.name }));
                currentChainHistory.push({
                    player: playerWhoActed,
                    role: t(currentRoles[playerWhoActed]),
                    action: chosenAction.name,
                    effect: chosenAction.effect
                });
                Object.entries(chosenAction.effect).forEach(([stat, value]) => {
                    if (stat.includes('_power') || stat.includes('_satisfaction')) {
                        const targetStat = stat;
                        currentStats[targetStat] = Math.max(0, Math.min(100, (currentStats[targetStat] || INITIAL_GAME_STATS[targetStat]) + value));
                    } else {
                        currentStats[stat] = Math.max(0, Math.min(stat === 'population' ? 200 : 100, (currentStats[stat] || INITIAL_GAME_STATS[stat]) + value));
                    }
                });
                nextLastActionTaken = { // Update lastActionTaken for the *next* Gemini call
                    playerName: playerWhoActed,
                    role: currentRoles[playerWhoActed],
                    actionName: chosenAction.name,
                    effect: chosenAction.effect
                };
            } else {
                console.warn("processRound (dynamic_reactions): Chosen dynamic action not found or no effect.");
                newRoundResults.push(t("chosenDynamicActionNotFound"));
                // If action not found/no effect, we still try to continue the chain or end the round
            }

            // Check for game end conditions after all effects are applied
            if (currentStats.environment <= 0 || currentStats.population <= 0) {
                gameEnded = true;
                finalWinner = currentStats.environment <= 0 ? t('humanityWonEnv') : t('earthWonHumanity');
                newRoundResults.push(currentStats.environment <= 0 ? t("earthEnvironmentCollapsed") : t("humanityPerished"));
            }

            // Get next dynamic prompt/choices from LLM or resolve round
            if (!gameEnded) {
                // Get the next role that was suggested when generating choices for the CURRENT player
                const suggestedNextRole = data.nextTargetRoleForChaining;
                const nextTargetPlayerName = Object.keys(currentRoles).find(name => currentRoles[name] === suggestedNextRole);

                if (nextTargetPlayerName && suggestedNextRole) {
                    console.log("processRound (dynamic_reactions): Generating NEW choices for next role:", suggestedNextRole);
                    
                    // Generate NEW choices for the NEXT role
                    const geminiResponse = await callGeminiForDynamicChoices(currentStats, nextLastActionTaken, suggestedNextRole);
                    
                    if (geminiResponse && geminiResponse.prompt && geminiResponse.choices && geminiResponse.choices.length > 0) {
                        nextDynamicPrompt = geminiResponse.prompt;
                        nextDynamicChoices = geminiResponse.choices.map((choice, idx) => ({ ...choice, id: `dynamic_choice_${idx}` }));
                        nextActivePlayersForChoice = [nextTargetPlayerName];
                        nextPhase = 'dynamic_reactions';
                        
                        // Store the next role in the chain
                        const newNextRoleForChaining = geminiResponse.nextTargetRole;
                        
                        await updateDoc(roomRef, {
                            gameStats: currentStats,
                            roundResults: newRoundResults,
                            roundChainHistory: currentChainHistory,
                            playerChoices: {},
                            roundPhase: nextPhase,
                            activePlayersForChoice: nextActivePlayersForChoice,
                            currentDynamicPrompt: nextDynamicPrompt,
                            currentDynamicChoices: nextDynamicChoices,
                            lastActionTaken: nextLastActionTaken,
                            nextTargetRoleForChaining: newNextRoleForChaining,
                            processingRound: false,
                        });
                    }
                }
            }

            await updateDoc(roomRef, {
                gameStats: currentStats,
                roundResults: newRoundResults,
                roundChainHistory: currentChainHistory,
                playerChoices: {}, // Clear choices for next turn in chain
                roundPhase: nextPhase,
                activePlayersForChoice: nextActivePlayersForChoice,
                currentDynamicPrompt: nextDynamicPrompt,
                currentDynamicChoices: nextDynamicChoices,
                lastActionTaken: nextLastActionTaken, // Keep the last action taken for the next round's context
                processingRound: false, // Release flag after update
                gameState: gameEnded ? 'ended' : data.gameState,
                winner: finalWinner,
            });
            console.log("processRound (dynamic_reactions): Updated Firestore and released processingRoundFlag.");
            return;
        }

        // --- Phase: Round Resolution ---
        if (data.roundPhase === 'round_resolution') {
            console.log("processRound: Entering round_resolution phase.");
            // Check for game end conditions (e.g., max rounds)
            const MAX_ROUNDS = 5;
            // Re-evaluate gameEnded here, as stats might have changed if this was reached via an error path
            if (currentStats.environment <= 0) {
                gameEnded = true;
                finalWinner = t('humanityWonEnv');
                newRoundResults.push(t("earthEnvironmentCollapsed"));
            } else if (currentStats.population <= 0) {
                gameEnded = true;
                finalWinner = t('earthWonHumanity');
                newRoundResults.push(t("humanityPerished"));
            } else if (data.currentRound >= MAX_ROUNDS) { // Check max rounds only if not already game over by stats
                gameEnded = true;
            }


            if (gameEnded) {
                let winningRole = null;
                let maxPower = -Infinity;

                Object.entries(currentRoles).forEach(([pName, roleName]) => {
                    if (roleName !== 'The Earth') {
                        const roleKey = roleName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_power';
                        let score = currentStats[roleKey] || 0;
                        if (roleName === 'The Public') {
                            score = currentStats.public_satisfaction || 0;
                        }
                        if (score > maxPower) {
                            maxPower = score;
                            winningRole = roleName;
                        }
                    }
                });

                if (currentStats.earth_power > maxPower) {
                    finalWinner = t('The Earth'); // Translate winning role
                } else if (winningRole) {
                    finalWinner = t(winningRole); // Translate winning role
                } else {
                    finalWinner = t('noClearWinnerTie'); // Fallback, translate
                }
                newRoundResults.push(t('gameOver') + ' ' + t('winner') + finalWinner); // Translate
                console.log(`processRound (round_resolution): Game ended. Winner: ${finalWinner}`);
            }

            // Introduce a delay *before* updating Firestore to the next round, only if game is not ended.
            // This delay is handled by the room head.
            if (!gameEnded) {
                console.log("processRound (round_resolution): Game not ended, applying 3-second delay before next round.");
                setTimeout(async () => {
                    await updateDoc(roomRef, {
                        gameStats: currentStats,
                        roundResults: newRoundResults,
                        roundChainHistory: [], // Clear history for next round
                        currentRound: data.currentRound + 1,
                        playerChoices: {},
                        activePlayersForChoice: [],
                        currentDynamicPrompt: '',
                        currentDynamicChoices: [],
                        lastActionTaken: null,
                        roundPhase: 'earth_choice', // Next round starts with Earth's choice
                        processingRound: false, // Release flag after delay and update
                    });
                    console.log("processRound (round_resolution): Delay complete, Firestore updated for next round.");
                }, 3000); // Give players time to read results
                // Important: Return here to prevent the immediate update below, as setTimeout will handle it
                return;
            }

            // If gameEnded is true, update immediately without delay
            console.log("processRound (round_resolution): Game ended, updating Firestore immediately.");
            await updateDoc(roomRef, {
                gameStats: currentStats,
                roundResults: newRoundResults,
                roundChainHistory: [], // Clear history for next round
                currentRound: data.currentRound + (gameEnded ? 0 : 1), // Don't increment if game ended
                playerChoices: {},
                activePlayersForChoice: [],
                currentDynamicPrompt: '',
                currentDynamicChoices: [],
                // lastActionTaken: null, // REMOVE OR COMMENT OUT THIS LINE
                roundPhase: gameEnded ? 'ended' : 'earth_choice', // Next round starts with Earth's choice
                gameState: gameEnded ? 'ended' : data.gameState,
                winner: finalWinner,
                processingRound: false, // Release flag
            });
            console.log("processRound (round_resolution): Updated Firestore for game end.");
            return;
        }
        console.log("processRound: Exiting without specific phase logic. Releasing flag.");
        await updateDoc(roomRef, { processingRound: false }); // Fallback to release flag
    }, [isRoomHead, roomCode, callGeminiForDynamicChoices, t]); // Add t to dependency array

    // Firebase listener
    useEffect(() => {
        if (!roomCode) return;

        const roomRef = doc(db, "rooms", roomCode);
        const unsub = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                console.log("onSnapshot: Firestore Snapshot received. Round Phase:", data.roundPhase, "Processing:", data.processingRound, "GeneratingChoices:", isGeneratingChoices); // Crucial log

                setPlayers(data.players || []);
                setGameState(data.gameState || 'lobby');
                setCurrentRound(data.currentRound || 1);
                setPlayerRoles(data.playerRoles || {});
                setPlayerChoices(data.playerChoices || {}); // Earth's choice + dynamic choices
                setGameStats(data.gameStats || INITIAL_GAME_STATS);
                setRoundResults(data.roundResults || []);
                setWinner(data.winner || null);

                // Dynamic round states
                setRoundPhase(data.roundPhase || 'earth_choice');
                setActivePlayersForChoice(data.activePlayersForChoice || []);
                setCurrentDynamicPrompt(data.currentDynamicPrompt || '');
                setCurrentDynamicChoices(data.currentDynamicChoices || []);
                setLastActionTaken(data.lastActionTaken || null);
                setRoundChainHistory(data.roundChainHistory || []);
                setProcessingRoundFlag(data.processingRound || false); // Update the flag based on Firestore
                setNextTargetRoleForChaining(data.nextTargetRoleForChaining || null);

                // Set my role
                const myPlayer = data.players.find(p => p.name === currentPlayerName);
                if (myPlayer && data.playerRoles[myPlayer.name]) {
                    setMyRole(data.playerRoles[myPlayer.name]);
                } else {
                    setMyRole(null);
                }

                // Check if current player is room head (first player by default)
                if (data.players && data.players.length > 0) {
                    setIsRoomHead(currentPlayerName === data.players[0].name);
                }

                // Trigger processRound based on phase and completion, ONLY if not already processing
                if (currentPlayerName === data.players[0]?.name && data.gameState === 'playing' && !data.processingRound && !isGeneratingChoices) {
                    if (data.roundPhase === 'earth_choice') {
                        const earthPlayerName = Object.keys(data.playerRoles).find(name => data.playerRoles[name] === 'The Earth');
                        // Trigger if Earth has made a choice for this round
                        if (earthPlayerName && data.playerChoices[earthPlayerName] !== undefined) {
                            console.log("onSnapshot: Room Head: Earth's choice made, calling processRound.");
                            processRound();
                        } else {
                            console.log("onSnapshot: Room Head: Earth's choice not made yet. Waiting.");
                        }
                    } else if (data.roundPhase === 'dynamic_reactions') {
                        const activePlayers = data.activePlayersForChoice || [];
                        const currentChoices = data.playerChoices || {};
                        const allActivePlayersMadeChoice = activePlayers.every(pName => currentChoices[pName] !== undefined);

                        // Trigger if all currently active players have made their choice AND there are active players
                        if (allActivePlayersMadeChoice && activePlayers.length > 0) {
                            console.log("onSnapshot: Room Head: All active dynamic choices made, calling processRound.");
                            processRound();
                        } else {
                            console.log("onSnapshot: Room Head: Waiting for all active dynamic choices.");
                        }
                    } else if (data.roundPhase === 'round_resolution') {
                        // This phase triggers processRound to advance to the next round,
                        // potentially after an internal delay in processRound.
                        console.log("onSnapshot: Room Head: Round resolution phase, calling processRound to advance.");
                        processRound();
                    }
                } else if (currentPlayerName === data.players[0]?.name) {
                    // Room head, but not in playing state, or processingRound/isGeneratingChoices is true
                    console.log(`onSnapshot: Room Head: Not calling processRound. State: ${data.gameState}, Processing: ${data.processingRound}, GeneratingChoices: ${isGeneratingChoices}`);
                }


            } else {
                // Room no longer exists, reset local state
                console.log("onSnapshot: Room no longer exists.");
                resetLocalState();
                alert(t("roomNoLongerExists")); // Translate alert
            }
        }, (error) => {
            console.error("Error listening to room:", error);
            resetLocalState();
            alert(t("lostConnection")); // Translate alert
        });

        return () => unsub();
    }, [roomCode, currentPlayerName, processRound, isGeneratingChoices, t]); // Add t to dependency array

    const resetLocalState = () => {
        setGameState('home');
        setPlayers([]);
        setCurrentPlayerName('');
        setRoomCode('');
        setInputRoomCode('');
        setIsRoomHead(false);
        setCurrentRound(1);
        setPlayerRoles({});
        setPlayerChoices({});
        setGameStats(INITIAL_GAME_STATS);
        setRoundResults([]);
        setMyRole(null);
        setWinner(null);
        setRoundPhase('earth_choice');
        setActivePlayersForChoice([]);
        setCurrentDynamicPrompt('');
        setCurrentDynamicChoices([]);
        setLastActionTaken(null);
        setRoundChainHistory([]);
        setIsGeneratingChoices(false);
        setProcessingRoundFlag(false);
        setNextTargetRoleForChaining(null);
        console.log("Local state reset.");
    };

    const leaveRoom = async () => {
        if (!roomCode || !currentPlayerName) return;

        const roomRef = doc(db, 'rooms', roomCode);

        try {
            const roomSnap = await getDoc(roomRef);
            if (!roomSnap.exists()) {
                console.log("leaveRoom: Room already gone.");
                resetLocalState();
                return;
            }

            const data = roomSnap.data();
            const myPlayerInRoom = data.players.find(p => p.name === currentPlayerName);

            if (!myPlayerInRoom) {
                console.log("leaveRoom: Player not found in room's player list. Assuming already left or error.");
                resetLocalState();
                return;
            }

            const remainingPlayers = data.players.filter(p => p.id !== myPlayerInRoom.id);

            if (remainingPlayers.length === 0) {
                console.log("leaveRoom: Last player leaving, deleting room.");
                await deleteDoc(roomRef);
                resetLocalState();
                return;
            }

            await updateDoc(roomRef, {
                players: remainingPlayers,
                [`playerChoices.${currentPlayerName}`]: deleteField(),
                [`playerRoles.${currentPlayerName}`]: deleteField(),
            });
            console.log(`leaveRoom: Player ${currentPlayerName} ${t('playerLeft')}`); // Translate this string
            resetLocalState();

        } catch (error) {
            console.error("Error leaving room:", error);
            alert(t('errorLeavingRoom')); // Translate alert
        }
    };

    const resetAndEndGame = async () => {
        if (roomCode && isRoomHead) {
            console.log("resetAndEndGame: Room head resetting/ending game.");
            await deleteDoc(doc(db, 'rooms', roomCode));
        }
        resetLocalState();
    };

    const getRoleIcon = (roleName) => {
        const role = ROLES[roleName];
        return role ? role.icon : Users;
    };

    const getRoleDescription = (roleName) => {
        const role = ROLES[roleName];
        // Use translation key for description
        return role ? t(role.descriptionKey) : t('No role assigned.');
    };

    const getRoleActions = (roleName) => {
        const role = ROLES[roleName];
        // For actions, iterate and translate the name property
        return role ? role.actions.map(action => ({
            ...action,
            name: t(action.nameKey || action.name) // Use nameKey if present, otherwise fallback to existing name
        })) : [];
    };

    // Helper to translate role names for display
    const translateRoleName = (roleName) => {
        if (ROLES[roleName]) {
            // Use a specific translation key for each role name (e.g., 'roleWorldGovernment')
            const roleKey = `role${roleName.replace(/\s/g, '')}`;
            return t(roleKey);
        }
        return roleName; // Fallback if no specific translation key
    };

    const getProgressBarFillColorClass = (statName) => {
    switch (statName) {
        case 'government_power':
            return styles.progressBarFillSkyBlue;
        case 'business_power':
            return styles.progressBarFillGold;
        case 'scientist_power':
            return styles.progressBarFillBlue;
        case 'media_power':
            // These powers typically use a blue/purple-ish theme in your original design.
            // Let's assume blue is a good general color for power bars.
            return styles.progressBarFillPink;
        case 'public_satisfaction':
            return styles.progressBarFillGreen; // Satisfaction is good
        case 'earth_power':
            return styles.progressBarFillPurple; // Earth power might be purple
        case 'population':
            return styles.progressBarFillRed; // Population is yellow
        case 'environment':
            // Environment can be tricky. Let's make it green if good, red if bad.
            // For a simple progress bar, we'll assign a primary color.
            // You might want to enhance this to change color based on value later.
            return styles.progressBarFillYellow;
        default:
            return styles.progressBarFillGray; // Default fallback
        }
    };

    const getStatColor = (statName, value) => {
        if (statName === 'population' || statName === 'public_satisfaction') {
            if (value > 75) return styles.textGreen;
            if (value < 25) return styles.textRed;
            return styles.textBlue;
        }
        if (statName === 'environment') {
            if (value > 75) return styles.textBlue;
            if (value < 25) return styles.textRed;
            return styles.textGreen;
        }
        if (statName.includes('_power')) {
            if (value > 75) return styles.textPurple;
            if (value < 25) return styles.textRed;
            return styles.textYellow;
        }
        return styles.textGray;
    };


    if (gameState === 'home') {
        return (
            <div className={styles.container}>
                <div className={styles.maxWidthMd}>
                    <div className={styles.card}>
                        <h1 className={styles.title}>{t('gameTitle')}</h1>
                        <p className={`${styles.subtitle} ${styles.textGray}`}>{t('subtitle')}</p>

                        <div className={`${styles.spaceY4} ${styles.mb8}`}>
                            <input
                                type="text"
                                placeholder={t('enterNamePlaceholder')}
                                value={currentPlayerName}
                                onChange={(e) => setCurrentPlayerName(e.target.value)}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.spaceY3}>
                            <button
                                onClick={createRoom}
                                disabled={!currentPlayerName.trim()}
                                className={`${styles.button} ${styles.buttonPrimary}`}
                            >
                                <Users className={styles.icon} />
                                {t('createRoomButton')}
                            </button>

                            <div className={styles.flexGap2}>
                                <input
                                    type="text"
                                    placeholder={t('roomCodePlaceholder')}
                                    value={inputRoomCode}
                                    className={styles.inputSmall}
                                    onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                                />
                                <button
                                    onClick={() => joinRoom(inputRoomCode)}
                                    disabled={!currentPlayerName.trim() || !inputRoomCode.trim()}
                                    className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                                >
                                    {t('joinButton')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Footer */}
                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        {t('rule1')}
                        {t('rule2')}
                        {t('rule3')}
                        {t('rule4')}
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
                            <h2 className={styles.heading}>{t('roomHeading')} {roomCode}</h2>
                            <p className={styles.textGray}>{t('playersCount')} {players.length}{t('maxPlayers')}</p>
                        </div>

                        <div className={`${styles.spaceY2} ${styles.mb6}`}>
                            {players.map((player, index) => (
                                <div key={player.id} className={styles.playerItem}>
                                    <span className={styles.playerName}>{player.name}</span>
                                    {index === 0 && <Crown className={`${styles.icon} ${styles.iconYellow}`} />}
                                </div>
                            ))}
                        </div>

                        {isRoomHead && (
                            <button
                                onClick={startGame}
                                disabled={players.length < 2}
                                className={`${styles.button} ${styles.buttonSuccess}`}
                            >
                                <Play className={styles.icon} />
                                {t('startGameButton')} {players.length < 2 && `(${t('waitingForMorePlayers', { count: 2 - players.length })})`}
                            </button>
                        )}

                        {!isRoomHead && (
                            <p className={styles.textGray}>{t('waitingForHost')}</p>
                        )}

                        <button
                            onClick={leaveRoom}
                            className={`${styles.button} ${styles.buttonGray} ${styles.mt3}`}
                        >
                            {t('leaveRoomButton')}
                        </button>
                    </div>
                </div>
                {/* Footer */}
                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        {t('rule1')}
                        {t('rule2')}
                        {t('rule3')}
                        {t('rule4')}
                    </p>
                </div>
            </div>
        );
    }

    if (gameState === 'playing') {
        const myPlayerIsActive = activePlayersForChoice.includes(currentPlayerName);
        const hasMyChoiceBeenMade = playerChoices[currentPlayerName] !== undefined;

        return (
            <div className={styles.container}>
                <div className={styles.maxWidth2xl}>
                    <div className={styles.cardSmall}>
                        <div className={`${styles.textCenter} ${styles.mb6}`}>
                            <h2 className={styles.heading}>{t('round')} {currentRound}</h2>
                            <div className={`${styles.flexCenter} ${styles.mt2}`}>
                                <Eye className={styles.icon} />
                                <span className={styles.textGray}>{t('roomText')} {roomCode}</span>
                            </div>
                        </div>

                        {myRole && (
                            <div className={`${styles.roleCard} ${styles.mb6}`}>
                                <div className={styles.flexCenter}>
                                    {React.createElement(getRoleIcon(myRole), { className: styles.iconLarge })}
                                </div>
                                <h3 className={`${styles.subheading} ${styles.textCenter}`}>{translateRoleName(myRole)}</h3>
                                <p className={`${styles.textGray} ${styles.textCenter}`}>{getRoleDescription(myRole)}</p>
                            </div>
                        )}

                        <div className={`${styles.spaceY4} ${styles.mb6}`}>
                            <h3 className={styles.subheading}>{t('globalStats')}</h3>
                            <div className={`${styles.grid} ${styles.gridCols1} ${styles.gap2} ${styles.gridColsMd2}`}>
                                    <ProgressBar
                                        label={t('population')}
                                        value={gameStats.population}
                                        max={200} // Population max is 200
                                        colorClass={getProgressBarFillColorClass('population')}
                                    />
                                    <ProgressBar
                                        label={t('environment')}
                                        value={gameStats.environment}
                                        max={100}
                                        colorClass={getProgressBarFillColorClass('environment')}
                                    />
                                    <ProgressBar
                                        label={t('governmentPower')}
                                        value={gameStats.government_power}
                                        max={100}
                                        colorClass={getProgressBarFillColorClass('government_power')}
                                    />
                                    <ProgressBar
                                        label={t('businessPower')}
                                        value={gameStats.business_power}
                                        max={100}
                                        colorClass={getProgressBarFillColorClass('business_power')}
                                    />
                                    <ProgressBar
                                        label={t('scientistPower')}
                                        value={gameStats.scientist_power}
                                        max={100}
                                        colorClass={getProgressBarFillColorClass('scientist_power')}
                                    />
                                    <ProgressBar
                                        label={t('mediaPower')}
                                        value={gameStats.media_power}
                                        max={100}
                                        colorClass={getProgressBarFillColorClass('media_power')}
                                    />
                                    <ProgressBar
                                        label={t('publicSatisfaction')}
                                        value={gameStats.public_satisfaction}
                                        max={100}
                                        colorClass={getProgressBarFillColorClass('public_satisfaction')}
                                    />
                                    <ProgressBar
                                        label={t('earthPower')}
                                        value={gameStats.earth_power}
                                        max={100}
                                        colorClass={getProgressBarFillColorClass('earth_power')}
                                    />
                            </div>
                        </div>

                        {/* --- Action/Choice Section --- */}
                        {isGeneratingChoices || processingRoundFlag ? (
                            <div className={`${styles.textCenter} ${styles.mb6}`}>
                                <p className={styles.textLarge}>{t('processingRound')}</p>
                                <p className={styles.textGray}>{t('pleaseWaitGm')}</p>
                                {isGeneratingChoices && <p className={styles.textSmall}>{t('aiGeneratingChoices')}</p>}
                            </div>
                        ) : (
                            <>
                                {roundPhase === 'earth_choice' && myRole === 'The Earth' && !hasMyChoiceBeenMade && (
                                    <div className={`${styles.spaceY3} ${styles.mb6}`}>
                                        <h3 className={styles.subheading}>{t('earthChoiceTitle')}</h3>
                                        {getRoleActions(myRole).map(action => (
                                            <button
                                                key={action.id}
                                                onClick={() => submitChoice(action.id)}
                                                className={`${styles.button} ${styles.buttonSecondary}`}
                                            >
                                                {action.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {roundPhase === 'earth_choice' && myRole !== 'The Earth' && (
                                    <div className={`${styles.textCenter} ${styles.mb6}`}>
                                        <p className={styles.textLarge}>{t('waitingForEarth')}</p>
                                    </div>
                                )}

                                {roundPhase === 'dynamic_reactions' && myPlayerIsActive && !hasMyChoiceBeenMade && (
                                    <div className={`${styles.eventCard} ${styles.mb6}`}>
                                        <h3 className={`${styles.subheading} ${styles.textCenter}`}>{t('yourTurnTitle')}</h3>
                                        <p className={`${styles.textLarge} ${styles.textCenter} ${styles.mb4}`}>{currentDynamicPrompt}</p>

                                        <div className={`${styles.spaceY3}`}>
                                            {currentDynamicChoices.map(choice => (
                                                <button
                                                    key={choice.id}
                                                    onClick={() => submitChoice(choice.id)}
                                                    className={`${styles.button} ${styles.buttonSecondary}`}
                                                >
                                                    {choice.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {roundPhase === 'dynamic_reactions' && !myPlayerIsActive && (
                                    <div className={`${styles.eventCard} ${styles.mb6}`}>
                                        <h3 className={`${styles.subheading} ${styles.textCenter}`}>{t('currentSituation')}</h3>
                                        <p className={`${styles.textLarge} ${styles.textCenter} ${styles.mb4}`}>{currentDynamicPrompt}</p>
                                        <p className={`${styles.textCenter} ${styles.textGray}`}>{t('waitingForOthers', { playerNames: activePlayersForChoice.map(pName => `${pName} (${translateRoleName(playerRoles[pName])})`).join(', ') })}</p>
                                    </div>
                                )}

                                {roundPhase === 'dynamic_reactions' && myPlayerIsActive && hasMyChoiceBeenMade && (
                                    <div className={`${styles.textCenter} ${styles.mb6}`}>
                                        <p className={styles.textLarge}>{t('youMadeChoice')}</p>
                                        <p className={styles.textGray}>{t('waitingForRoundProgress')}</p>
                                    </div>
                                )}

                                {roundPhase === 'round_resolution' && (
                                     <div className={`${styles.resultCard} ${styles.mb6}`}>
                                        <h3 className={`${styles.title} ${styles.textCenter}`}>{t('roundSummaryTitle')} {currentRound}:</h3>
                                        <div className={`${styles.spaceY2} ${styles.mt2}`}>
                                            {roundChainHistory.length > 0 ? (
                                                roundChainHistory.map((entry, index) => (
                                                    <p key={index} className={styles.content}>
                                                        {/* Use t() for interpolation */}
                                                        {t('playerChose', { player: entry.player, role: entry.role, action: entry.action })}
                                                    </p>
                                                ))
                                            ) : (
                                                <p className={styles.content}>{t('noActionsRecorded')}</p>
                                            )}
                                            <p className={`${styles.content} ${styles.mt4}`}>{t('roundConcluded')}</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}


                        {/* --- Player Status Section --- */}
                        <div className={`${styles.spaceY2} ${styles.mb6}`}>
                            <h3 className={styles.subheading}>{t('playersStatus')}</h3>
                            {players.map((player) => {
                                const role = playerRoles[player.name];
                                let statusText = t('statusWaitingForOthersShort'); // Default status

                                if (roundPhase === 'earth_choice') {
                                    if (role === 'The Earth' && playerChoices[player.name] !== undefined) {
                                        statusText = t('statusDone');
                                    } else if (role !== 'The Earth') {
                                        statusText = t('statusWaitingForEarth');
                                    }
                                } else if (roundPhase === 'dynamic_reactions') {
                                    if (activePlayersForChoice.includes(player.name)) {
                                        if (playerChoices[player.name] !== undefined) {
                                            statusText = t('statusDone');
                                        } else {
                                            statusText = t('statusYourTurn');
                                        }
                                    }
                                    // If not an active player for choice, they are "waiting for others"
                                    else {
                                        statusText = t('statusWaitingForOthersShort');
                                    }
                                } else if (roundPhase === 'round_resolution') {
                                    statusText = t('statusRoundSummary');
                                }

                                return (
                                    <div key={player.id} className={styles.playerItem}>
                                        <span className={styles.playerName}>{player.name} ({translateRoleName(role)})</span>
                                        <span className={statusText === t('statusDone') || statusText === t('statusRoundSummary') ? styles.textGreen : styles.textYellow}>{statusText}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={leaveRoom}
                            className={`${styles.button} ${styles.buttonGray} ${styles.mt3}`}
                        >
                            {t('leaveRoomButton')}
                        </button>
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
                        <h2 className={styles.heading}>{t('gameOver')}</h2>
                        {winner && (
                            <h3 className={`${styles.titleLarge} ${styles.mb6}`}>{t('winner')} {winner}</h3>
                        )}

                        <div className={`${styles.spaceY4} ${styles.mb6}`}>
                            <h3 className={styles.subheading}>{t('finalGlobalStats')}</h3>
                            <div className={`${styles.grid} ${styles.gridCols1} ${styles.gap2}`}>
                                <ProgressBar
                                    label={t('population')}
                                    value={gameStats.population}
                                    max={200} // Population max is 200
                                    colorClass={getProgressBarFillColorClass('population')}
                                />
                                <ProgressBar
                                    label={t('environment')}
                                    value={gameStats.environment}
                                    max={100}
                                    colorClass={getProgressBarFillColorClass('environment')}
                                />
                                <ProgressBar
                                    label={t('governmentPower')}
                                    value={gameStats.government_power}
                                    max={100}
                                    colorClass={getProgressBarFillColorClass('government_power')}
                                />
                                <ProgressBar
                                    label={t('businessPower')}
                                    value={gameStats.business_power}
                                    max={100}
                                    colorClass={getProgressBarFillColorClass('business_power')}
                                />
                                <ProgressBar
                                    label={t('scientistPower')}
                                    value={gameStats.scientist_power}
                                    max={100}
                                    colorClass={getProgressBarFillColorClass('scientist_power')}
                                />
                                <ProgressBar
                                    label={t('mediaPower')}
                                    value={gameStats.media_power}
                                    max={100}
                                    colorClass={getProgressBarFillColorClass('media_power')}
                                />
                                <ProgressBar
                                    label={t('publicSatisfaction')}
                                    value={gameStats.public_satisfaction}
                                    max={100}
                                    colorClass={getProgressBarFillColorClass('public_satisfaction')}
                                />
                                <ProgressBar
                                    label={t('earthPower')}
                                    value={gameStats.earth_power}
                                    max={100}
                                    colorClass={getProgressBarFillColorClass('earth_power')}
                                />
                            </div>
                        </div>

                        <button
                            onClick={resetAndEndGame}
                            className={`${styles.button} ${styles.buttonPrimary}`}
                        >
                            <RotateCcw className={styles.icon} />
                            {t('playAgainButton')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};

export default TheWorld;