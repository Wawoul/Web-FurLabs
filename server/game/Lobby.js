const { v4: uuidv4 } = require('uuid');
const Player = require('./Player');
const { GAME_STATES, BODY_PARTS, BODY_PART_ORDER, DEFAULTS, CANVAS } = require('../config/constants');

class Lobby {
    constructor(inviteCode, hostSocketId, hostName, options = {}) {
        this.id = uuidv4();
        this.inviteCode = inviteCode;
        this.players = new Map(); // socketId -> Player
        this.state = GAME_STATES.WAITING;
        this.drawingTime = options.drawingTime || DEFAULTS.DRAWING_TIME;
        this.createdAt = Date.now();
        this.startedAt = null;

        // Drawing storage
        this.drawings = {
            [BODY_PARTS.HEAD]: null,
            [BODY_PARTS.TORSO]: null,
            [BODY_PARTS.LEGS]: null
        };

        // Hint data for edge continuity
        this.hints = {
            [BODY_PARTS.HEAD]: { bottom: null },
            [BODY_PARTS.TORSO]: { top: null, bottom: null },
            [BODY_PARTS.LEGS]: { top: null }
        };

        // Timer
        this.timer = null;
        this.timeRemaining = this.drawingTime;

        // AI generated version
        this.aiVersion = null;

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

        return { success: true, player };
    }

    removePlayer(socketId) {
        const player = this.players.get(socketId);
        if (!player) return null;

        this.players.delete(socketId);

        // If host left and there are other players, assign new host
        if (player.isHost && this.players.size > 0) {
            const newHost = this.players.values().next().value;
            newHost.isHost = true;
        }

        return player;
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

    canStart() {
        if (this.players.size === 0) return false;

        // All players must be ready
        for (const player of this.players.values()) {
            if (!player.isReady) return false;
        }

        return true;
    }

    assignParts() {
        const players = Array.from(this.players.values());
        const parts = [...BODY_PART_ORDER];

        // Shuffle parts
        for (let i = parts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [parts[i], parts[j]] = [parts[j], parts[i]];
        }

        if (players.length === 1) {
            // Solo mode - one player draws all parts sequentially
            players[0].assignedPart = 'all';
        } else if (players.length === 2) {
            // Two players - first gets 2 parts, second gets 1
            players[0].assignedPart = [parts[0], parts[2]];
            players[1].assignedPart = [parts[1]];
        } else {
            // 3+ players - assign one part each, rest spectate
            for (let i = 0; i < players.length; i++) {
                if (i < 3) {
                    players[i].assignedPart = [parts[i]];
                } else {
                    players[i].makeSpectator();
                }
            }
        }
    }

    startGame() {
        if (!this.canStart()) {
            return { success: false, error: 'Not all players are ready' };
        }

        this.state = GAME_STATES.DRAWING;
        this.startedAt = Date.now();
        this.assignParts();
        this.timeRemaining = this.drawingTime;

        return { success: true };
    }

    submitDrawing(socketId, bodyPart, canvasData, hintData) {
        const player = this.players.get(socketId);
        if (!player) return { success: false, error: 'Player not found' };

        // Store the drawing
        this.drawings[bodyPart] = canvasData;

        // Store hint data for adjacent parts
        if (hintData) {
            if (bodyPart === BODY_PARTS.HEAD && hintData.bottom) {
                this.hints[BODY_PARTS.TORSO].top = hintData.bottom;
            } else if (bodyPart === BODY_PARTS.TORSO) {
                if (hintData.bottom) {
                    this.hints[BODY_PARTS.LEGS].top = hintData.bottom;
                }
            }
        }

        player.markSubmitted();

        return {
            success: true,
            allComplete: this.allDrawingsComplete()
        };
    }

    allDrawingsComplete() {
        return this.drawings[BODY_PARTS.HEAD] !== null &&
               this.drawings[BODY_PARTS.TORSO] !== null &&
               this.drawings[BODY_PARTS.LEGS] !== null;
    }

    getHintsForPart(bodyPart) {
        return this.hints[bodyPart] || {};
    }

    getDrawings() {
        return this.drawings;
    }

    setAIVersion(imageData) {
        this.aiVersion = imageData;
    }

    transitionToReveal() {
        this.state = GAME_STATES.REVEALING;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
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
            hasAllDrawings: this.allDrawingsComplete()
        };
    }
}

module.exports = Lobby;
