const { v4: uuidv4 } = require('uuid');
const Player = require('./Player');
const { GAME_STATES, BODY_PARTS, BODY_PART_ORDER, DEFAULTS, CANVAS } = require('../config/constants');

class Lobby {
    constructor(inviteCode, hostSocketId, hostName, options = {}) {
        this.id = uuidv4();
        this.inviteCode = inviteCode;
        this.players = new Map(); // socketId -> Player
        this.state = GAME_STATES.WAITING;
        // Ensure drawingTime is a valid number, otherwise use default
        const parsedTime = parseInt(options.drawingTime);
        this.drawingTime = (!isNaN(parsedTime) && parsedTime > 0) ? parsedTime : DEFAULTS.DRAWING_TIME;
        this.createdAt = Date.now();
        this.startedAt = null;

        // Round-based gameplay with Gartic Phone rotation
        // Each round, players rotate which fursona they draw for
        this.currentRound = 0; // 0=head, 1=torso, 2=legs
        this.roundSubmissions = new Set(); // socketIds that submitted this round
        this.playerOrder = []; // Array of socketIds for rotation

        // Per-fursona drawing storage: ownerSocketId -> { head, torso, legs }
        // Each fursona is "owned" by a player but drawn by different people
        this.playerDrawings = new Map();

        // Per-fursona drawer tracking: ownerSocketId -> { head: drawerId, torso: drawerId, legs: drawerId }
        this.playerDrawers = new Map();

        // Per-fursona hints: ownerSocketId -> { head: {bottom}, torso: {top, bottom}, legs: {top} }
        this.playerHints = new Map();

        // Per-fursona AI versions: ownerSocketId -> aiImage
        this.playerAIVersions = new Map();

        // Track which fursonas are currently being generated (prevent duplicate requests)
        this.generatingInProgress = new Set();

        // Track players who quit mid-game (keep their info for rotation/results)
        // socketId -> { displayName, playerId, quitAt }
        this.quitPlayers = new Map();

        // Timer
        this.timer = null;
        this.timeRemaining = this.drawingTime;

        // Per-player style choices for AI generation: socketId -> { artStyle, background }
        this.playerStyles = new Map();

        // Add host
        this.addPlayer(hostSocketId, hostName, true);
    }

    addPlayer(socketId, displayName, isHost = false) {
        if (this.players.size >= DEFAULTS.MAX_PLAYERS) {
            return { success: false, error: 'Lobby is full' };
        }

        if (this.state !== GAME_STATES.WAITING) {
            return { success: false, error: 'Game already in progress' };
        }

        const player = new Player(socketId, displayName);
        player.isHost = isHost;
        this.players.set(socketId, player);

        // Initialize drawing storage for this player
        this.playerDrawings.set(socketId, {
            [BODY_PARTS.HEAD]: null,
            [BODY_PARTS.TORSO]: null,
            [BODY_PARTS.LEGS]: null
        });

        // Initialize drawer tracking for this player's fursona
        this.playerDrawers.set(socketId, {
            [BODY_PARTS.HEAD]: null,
            [BODY_PARTS.TORSO]: null,
            [BODY_PARTS.LEGS]: null
        });

        // Initialize hints storage for this player
        this.playerHints.set(socketId, {
            [BODY_PARTS.HEAD]: { bottom: null },
            [BODY_PARTS.TORSO]: { top: null, bottom: null },
            [BODY_PARTS.LEGS]: { top: null }
        });

        return { success: true, player };
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (!player) return null;

        // Check if game is in progress (drawing or revealing)
        const gameInProgress = this.state === GAME_STATES.DRAWING || this.state === GAME_STATES.REVEALING;

        if (gameInProgress) {
            // Mid-game quit: Keep player in rotation but mark as quit
            // This preserves the Gartic Phone rotation order
            this.quitPlayers.set(socketId, {
                displayName: player.displayName,
                playerId: player.id,
                quitAt: Date.now()
            });

            // Auto-submit blank drawing for current round if they haven't submitted
            if (this.state === GAME_STATES.DRAWING && !this.roundSubmissions.has(socketId)) {
                this.autoSubmitForQuitPlayer(socketId, player.displayName);
            }

            // Keep playerDrawings, playerDrawers, playerHints for their fursona
            // These are needed for the reveal screen
            // Do NOT remove from playerOrder - this is critical for rotation!

            console.log(`[Quit] Player ${player.displayName} quit mid-game, keeping in rotation`);
        } else {
            // Waiting room quit: Full cleanup
            this.playerDrawings.delete(socketId);
            this.playerDrawers.delete(socketId);
            this.playerHints.delete(socketId);
            this.playerStyles.delete(socketId);

            // Remove from player order only in waiting room
            const orderIndex = this.playerOrder.indexOf(socketId);
            if (orderIndex !== -1) {
                this.playerOrder.splice(orderIndex, 1);
            }
        }

        // Always remove from active players
        this.players.delete(socketId);
        this.playerAIVersions.delete(socketId);
        this.generatingInProgress.delete(socketId);

        // If host left and there are other players, assign new host
        if (player.isHost && this.players.size > 0) {
            const newHost = this.players.values().next().value;
            newHost.isHost = true;
        }

        return player;
    }

    /**
     * Auto-submit blank drawings for a player who quit mid-game
     * This keeps the rotation order intact
     */
    autoSubmitForQuitPlayer(socketId, displayName) {
        const currentPart = this.getCurrentBodyPart();
        const targetOwnerId = this.getTargetFursonaOwner(socketId);

        // Submit null (blank) for the current round
        const drawings = this.playerDrawings.get(targetOwnerId);
        if (drawings && !drawings[currentPart]) {
            drawings[currentPart] = null; // Blank submission
        }

        // Track who "drew" this part (the quitter)
        const drawers = this.playerDrawers.get(targetOwnerId);
        if (drawers && !drawers[currentPart]) {
            drawers[currentPart] = { socketId, name: `${displayName} (quit)` };
        }

        // Mark as submitted
        this.roundSubmissions.add(socketId);

        console.log(`[AutoSubmit] Blank drawing for ${displayName} (quit) on ${currentPart} for fursona ${targetOwnerId}`);
    }

    getPlayer(socketId) {
        return this.players.get(socketId);
    }

    getPlayerCount() {
        return this.players.size;
    }

    setPlayerReady(socketId, isReady) {
        const player = this.players.get(socketId);
        if (player) {
            player.setReady(isReady);
            return true;
        }
        return false;
    }

    resetAllReady() {
        for (const player of this.players.values()) {
            player.setReady(false);
        }
    }

    canStart() {
        if (this.players.size === 0) return false;

        // All players must be ready
        for (const player of this.players.values()) {
            if (!player.isReady) return false;
        }

        return true;
    }

    getCurrentBodyPart() {
        return BODY_PART_ORDER[this.currentRound];
    }

    /**
     * Get which fursona (owner) a player should draw for in the current round
     * Gartic Phone style: Round 0 = own fursona, Round 1+ = rotate to next player's fursona
     */
    getTargetFursonaOwner(drawerSocketId) {
        const drawerIndex = this.playerOrder.indexOf(drawerSocketId);
        if (drawerIndex === -1) return drawerSocketId; // Fallback to own

        // Rotate based on round: each round, move to the next fursona
        const targetIndex = (drawerIndex + this.currentRound) % this.playerOrder.length;
        return this.playerOrder[targetIndex];
    }

    /**
     * Get who drew the previous part for a fursona
     */
    getPreviousDrawer(fursonaOwnerId) {
        if (this.currentRound === 0) return null; // No previous drawer for head

        const ownerIndex = this.playerOrder.indexOf(fursonaOwnerId);
        if (ownerIndex === -1) return null;

        // Previous round: who drew for this fursona?
        // If current round is R, the drawer at round R-1 was at position (ownerIndex - (R-1)) mod N
        const prevRound = this.currentRound - 1;
        const drawerIndex = (ownerIndex - prevRound + this.playerOrder.length) % this.playerOrder.length;
        return this.playerOrder[drawerIndex];
    }

    startGame() {
        if (!this.canStart()) {
            return { success: false, error: 'Not all players are ready' };
        }

        this.state = GAME_STATES.DRAWING;
        this.startedAt = Date.now();
        this.currentRound = 0;
        this.roundSubmissions.clear();
        this.timeRemaining = this.drawingTime;

        // Create player order for rotation (shuffle for fairness)
        this.playerOrder = Array.from(this.players.keys());
        // Shuffle player order
        for (let i = this.playerOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.playerOrder[i], this.playerOrder[j]] = [this.playerOrder[j], this.playerOrder[i]];
        }

        // Reset all player submissions
        for (const player of this.players.values()) {
            player.hasSubmitted = false;
        }

        // Clear previous drawings - initialize for each fursona owner
        for (const socketId of this.players.keys()) {
            this.playerDrawings.set(socketId, {
                [BODY_PARTS.HEAD]: null,
                [BODY_PARTS.TORSO]: null,
                [BODY_PARTS.LEGS]: null
            });
            this.playerDrawers.set(socketId, {
                [BODY_PARTS.HEAD]: null,
                [BODY_PARTS.TORSO]: null,
                [BODY_PARTS.LEGS]: null
            });
            this.playerHints.set(socketId, {
                [BODY_PARTS.HEAD]: { bottom: null },
                [BODY_PARTS.TORSO]: { top: null, bottom: null },
                [BODY_PARTS.LEGS]: { top: null }
            });
        }
        this.playerAIVersions.clear();
        this.generatingInProgress.clear();

        return { success: true };
    }

    submitDrawing(socketId, bodyPart, canvasData, hintData) {
        const player = this.players.get(socketId);
        if (!player) return { success: false, error: 'Player not found' };

        const currentPart = this.getCurrentBodyPart();
        if (bodyPart !== currentPart) {
            return { success: false, error: `Wrong body part. Expected ${currentPart}` };
        }

        // Get which fursona this player is drawing for (Gartic Phone rotation)
        const targetOwnerId = this.getTargetFursonaOwner(socketId);

        // Debug logging for tracking drawing storage
        console.log(`[Submit] Drawer: ${socketId} → Target fursona: ${targetOwnerId}, Part: ${bodyPart}, Has data: ${!!canvasData}`);

        // Store the drawing for the TARGET fursona (not necessarily the drawer's own)
        const drawings = this.playerDrawings.get(targetOwnerId);
        if (drawings) {
            drawings[bodyPart] = canvasData;
        } else {
            console.log(`[Submit] WARNING: No drawings map for target ${targetOwnerId}`);
        }

        // Track who drew this part - store name directly (so it persists if player leaves)
        const drawers = this.playerDrawers.get(targetOwnerId);
        if (drawers) {
            drawers[bodyPart] = { socketId, name: player.displayName };
            console.log(`[Drawer] Recorded: ${player.displayName} drew ${bodyPart} for fursona ${targetOwnerId}`);
        }

        // Store hint data for the NEXT drawer of this fursona
        const hints = this.playerHints.get(targetOwnerId);
        if (hints && hintData) {
            if (bodyPart === BODY_PARTS.HEAD && hintData.bottom) {
                hints[BODY_PARTS.TORSO].top = hintData.bottom;
            } else if (bodyPart === BODY_PARTS.TORSO && hintData.bottom) {
                hints[BODY_PARTS.LEGS].top = hintData.bottom;
            }
        }

        this.roundSubmissions.add(socketId);
        player.markSubmitted();

        // Get the target fursona owner's name for display
        const targetOwner = this.players.get(targetOwnerId);
        const targetName = targetOwner ? targetOwner.displayName : 'Unknown';

        return {
            success: true,
            roundComplete: this.isRoundComplete(),
            playerName: player.displayName,
            targetFursonaOwner: targetName
        };
    }

    isRoundComplete() {
        // All participants (active + quit) must submit for round to complete
        // playerOrder includes both active and quit players
        return this.roundSubmissions.size >= this.playerOrder.length;
    }

    advanceRound() {
        this.currentRound++;
        this.roundSubmissions.clear();
        this.timeRemaining = this.drawingTime;

        // Reset all player submission status
        for (const player of this.players.values()) {
            player.hasSubmitted = false;
        }

        // Check if all rounds complete
        if (this.currentRound >= BODY_PART_ORDER.length) {
            return { complete: true };
        }

        // Auto-submit blank drawings for quit players in this new round
        for (const [socketId, quitInfo] of this.quitPlayers) {
            this.autoSubmitForQuitPlayer(socketId, quitInfo.displayName);
        }

        return { complete: false, nextPart: this.getCurrentBodyPart() };
    }

    getHintsForPlayer(socketId) {
        // Get hints from the fursona this player is drawing for
        const targetOwnerId = this.getTargetFursonaOwner(socketId);
        const hints = this.playerHints.get(targetOwnerId);
        const currentPart = this.getCurrentBodyPart();
        return hints ? hints[currentPart] : {};
    }

    /**
     * Get info about which fursona a player is drawing for
     */
    getTargetFursonaInfo(socketId) {
        const targetOwnerId = this.getTargetFursonaOwner(socketId);
        const targetOwner = this.players.get(targetOwnerId) || this.quitPlayers.get(targetOwnerId);
        return {
            ownerId: targetOwnerId,
            ownerName: targetOwner ? targetOwner.displayName : 'Unknown',
            isOwnFursona: targetOwnerId === socketId
        };
    }

    getPlayerDrawings(socketId) {
        return this.playerDrawings.get(socketId) || {};
    }

    getAllPlayerDrawings() {
        const result = {};

        // Helper to get drawer name from drawer info
        const getDrawerName = (drawerInfo) => {
            if (!drawerInfo) return null;
            // Support both old format (socketId only) and new format ({socketId, name})
            if (typeof drawerInfo === 'string') {
                const drawer = this.players.get(drawerInfo);
                return drawer ? drawer.displayName : null;
            }
            return drawerInfo.name || null;
        };

        for (const [socketId, drawings] of this.playerDrawings) {
            const player = this.players.get(socketId);
            const quitPlayer = this.quitPlayers.get(socketId);

            // Include both active and quit players
            if (player || quitPlayer) {
                const drawers = this.playerDrawers.get(socketId) || {};
                const displayName = player
                    ? player.displayName
                    : `${quitPlayer.displayName} (quit)`;
                const playerId = player ? player.id : quitPlayer.playerId;

                result[socketId] = {
                    playerId: playerId,
                    playerName: displayName,
                    isQuit: !!quitPlayer,
                    head: drawings[BODY_PARTS.HEAD],
                    torso: drawings[BODY_PARTS.TORSO],
                    legs: drawings[BODY_PARTS.LEGS],
                    // Include who drew each part
                    drawnBy: {
                        head: getDrawerName(drawers[BODY_PARTS.HEAD]),
                        torso: getDrawerName(drawers[BODY_PARTS.TORSO]),
                        legs: getDrawerName(drawers[BODY_PARTS.LEGS])
                    }
                };
            }
        }
        return result;
    }

    setPlayerAIVersion(socketId, imageData) {
        this.playerAIVersions.set(socketId, imageData);
        // Clear generating flag when complete
        this.generatingInProgress.delete(socketId);
    }

    getPlayerAIVersion(socketId) {
        return this.playerAIVersions.get(socketId);
    }

    isGenerating(socketId) {
        return this.generatingInProgress.has(socketId);
    }

    startGenerating(socketId) {
        this.generatingInProgress.add(socketId);
    }

    stopGenerating(socketId) {
        this.generatingInProgress.delete(socketId);
    }

    setStyle(socketId, artStyle, background) {
        this.playerStyles.set(socketId, {
            artStyle: artStyle || 'cartoon',
            background: background || 'simple gradient'
        });
    }

    getStyleInfo(socketId) {
        const style = this.playerStyles.get(socketId);
        return style || { artStyle: 'cartoon', background: 'simple gradient' };
    }

    transitionToReveal() {
        this.state = GAME_STATES.REVEALING;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Prepare lobby for new game - transition to waiting without clearing drawings yet
     * Called when first player clicks "New Game" from reveal screen
     */
    prepareForNewGame() {
        this.state = GAME_STATES.WAITING;
        this.currentRound = 0;
        this.roundSubmissions.clear();
        this.timeRemaining = this.drawingTime;

        // Clear quit players from previous game
        this.quitPlayers.clear();

        // Reset all players to not ready
        for (const player of this.players.values()) {
            player.setReady(false);
            player.hasSubmitted = false;
        }

        // Clear timer if running
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Full reset for new game - clears all drawings
     * Called when host starts a new game after everyone is ready
     */
    resetForNewGame() {
        this.state = GAME_STATES.WAITING;
        this.currentRound = 0;
        this.roundSubmissions.clear();
        this.timeRemaining = this.drawingTime;

        // Clear quit players from previous game
        this.quitPlayers.clear();

        // Reset all players
        for (const player of this.players.values()) {
            player.setReady(false);
            player.hasSubmitted = false;
        }

        // Clear drawings
        for (const socketId of this.players.keys()) {
            this.playerDrawings.set(socketId, {
                [BODY_PARTS.HEAD]: null,
                [BODY_PARTS.TORSO]: null,
                [BODY_PARTS.LEGS]: null
            });
            this.playerDrawers.set(socketId, {
                [BODY_PARTS.HEAD]: null,
                [BODY_PARTS.TORSO]: null,
                [BODY_PARTS.LEGS]: null
            });
            this.playerHints.set(socketId, {
                [BODY_PARTS.HEAD]: { bottom: null },
                [BODY_PARTS.TORSO]: { top: null, bottom: null },
                [BODY_PARTS.LEGS]: { top: null }
            });
        }
        this.playerAIVersions.clear();
        this.generatingInProgress.clear();
    }

    complete() {
        this.state = GAME_STATES.COMPLETE;
    }

    serialize() {
        const players = [];
        for (const player of this.players.values()) {
            players.push(player.serialize());
        }

        return {
            id: this.id,
            inviteCode: this.inviteCode,
            state: this.state,
            players,
            drawingTime: this.drawingTime,
            timeRemaining: this.timeRemaining,
            currentRound: this.currentRound,
            currentPart: this.getCurrentBodyPart()
        };
    }
}

module.exports = Lobby;
