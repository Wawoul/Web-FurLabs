const { GAME_STATES, BODY_PART_ORDER } = require('../config/constants');
const AIComposer = require('../services/AIComposer');

class SocketHandler {
    constructor(io, lobbyManager) {
        this.io = io;
        this.lobbyManager = lobbyManager;
        this.aiComposer = new AIComposer();
    }

    initialize() {
        this.io.on('connection', (socket) => {
            console.log(`Player connected: ${socket.id}`);

            // Lobby events
            socket.on('lobby:create', (data) => this.handleCreateLobby(socket, data));
            socket.on('lobby:join', (data) => this.handleJoinLobby(socket, data));
            socket.on('lobby:leave', () => this.handleLeaveLobby(socket));
            socket.on('lobby:ready', (data) => this.handleReady(socket, data));
            socket.on('lobby:start', () => this.handleStartGame(socket));
            socket.on('lobby:newGame', () => this.handleNewGame(socket));

            // Drawing events
            socket.on('drawing:submit', (data) => this.handleDrawingSubmit(socket, data));

            // Style events
            socket.on('style:submit', (data) => this.handleStyleSubmit(socket, data));

            // AI events
            socket.on('ai:generate', (data) => this.handleAIGenerate(socket, data));

            // Disconnect
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    // Helper to emit to lobby room
    emitToLobby(inviteCode, event, data) {
        this.io.to(`lobby:${inviteCode}`).emit(event, data);
    }

    handleCreateLobby(socket, data) {
        const { displayName, drawingTime } = data;

        if (!displayName || displayName.trim().length === 0) {
            socket.emit('lobby:error', { message: 'Display name is required' });
            return;
        }

        const result = this.lobbyManager.createLobby(socket.id, displayName.trim(), { drawingTime });

        if (result.success) {
            const lobby = result.lobby;
            socket.join(`lobby:${lobby.inviteCode}`);
            socket.emit('lobby:created', {
                inviteCode: lobby.inviteCode,
                lobby: lobby.serialize()
            });
            console.log(`Lobby created: ${lobby.inviteCode} by ${displayName}`);
        } else {
            socket.emit('lobby:error', { message: result.error });
        }
    }

    handleJoinLobby(socket, data) {
        const { inviteCode, displayName } = data;

        if (!displayName || displayName.trim().length === 0) {
            socket.emit('lobby:error', { message: 'Display name is required' });
            return;
        }

        if (!inviteCode || inviteCode.trim().length === 0) {
            socket.emit('lobby:error', { message: 'Invite code is required' });
            return;
        }

        const result = this.lobbyManager.joinLobby(inviteCode.trim(), socket.id, displayName.trim());

        if (result.success) {
            const lobby = result.lobby;
            socket.join(`lobby:${lobby.inviteCode}`);

            // Notify the joining player
            socket.emit('lobby:joined', { lobby: lobby.serialize() });

            // Notify others in lobby
            socket.to(`lobby:${lobby.inviteCode}`).emit('lobby:playerJoined', {
                player: result.player.serialize()
            });

            console.log(`${displayName} joined lobby: ${lobby.inviteCode}`);
        } else {
            socket.emit('lobby:error', { message: result.error });
        }
    }

    handleLeaveLobby(socket) {
        const result = this.lobbyManager.leaveLobby(socket.id);

        if (result) {
            const { player, lobby, lobbyDeleted } = result;
            socket.leave(`lobby:${lobby.inviteCode}`);

            if (!lobbyDeleted) {
                this.emitToLobby(lobby.inviteCode, 'lobby:playerLeft', {
                    playerId: player.id,
                    newHost: lobby.players.values().next().value?.serialize()
                });
            }

            socket.emit('lobby:left');
            console.log(`${player.displayName} left lobby: ${lobby.inviteCode}`);
        }
    }

    handleReady(socket, data) {
        const lobby = this.lobbyManager.getLobbyByPlayer(socket.id);
        if (!lobby) {
            socket.emit('lobby:error', { message: 'Not in a lobby' });
            return;
        }

        const { isReady } = data;
        lobby.setPlayerReady(socket.id, isReady);

        this.emitToLobby(lobby.inviteCode, 'lobby:readyUpdate', {
            playerId: lobby.getPlayer(socket.id).id,
            isReady
        });
    }

    handleStartGame(socket) {
        const lobby = this.lobbyManager.getLobbyByPlayer(socket.id);
        if (!lobby) {
            socket.emit('lobby:error', { message: 'Not in a lobby' });
            return;
        }

        const player = lobby.getPlayer(socket.id);
        if (!player.isHost) {
            socket.emit('lobby:error', { message: 'Only the host can start the game' });
            return;
        }

        const result = lobby.startGame();
        if (!result.success) {
            socket.emit('lobby:error', { message: result.error });
            return;
        }

        // Send game start to all players - everyone draws the same part each round
        // But each player may be drawing for a different fursona (Gartic Phone rotation)
        const currentPart = lobby.getCurrentBodyPart();
        for (const [socketId, p] of lobby.players) {
            const playerSocket = this.io.sockets.sockets.get(socketId);
            if (playerSocket) {
                const targetInfo = lobby.getTargetFursonaInfo(socketId);
                playerSocket.emit('game:start', {
                    currentPart: currentPart,
                    drawingTime: lobby.drawingTime,
                    round: lobby.currentRound + 1,
                    totalRounds: BODY_PART_ORDER.length,
                    hints: lobby.getHintsForPlayer(socketId),
                    targetFursona: targetInfo
                });
            }
        }

        // Start timer
        this.startRoundTimer(lobby);
        console.log(`Game started in lobby: ${lobby.inviteCode}, Round 1: ${currentPart}`);
    }

    startRoundTimer(lobby) {
        if (lobby.timer) {
            clearInterval(lobby.timer);
        }

        lobby.timer = setInterval(() => {
            lobby.timeRemaining--;

            this.emitToLobby(lobby.inviteCode, 'game:timerUpdate', {
                remaining: lobby.timeRemaining
            });

            if (lobby.timeRemaining <= 0) {
                clearInterval(lobby.timer);
                lobby.timer = null;

                // Auto-submit for players who haven't submitted
                this.autoSubmitRound(lobby);
            }
        }, 1000);
    }

    autoSubmitRound(lobby) {
        // For players who haven't submitted, mark them as submitted with empty/placeholder
        for (const [socketId, player] of lobby.players) {
            if (!lobby.roundSubmissions.has(socketId)) {
                // Auto-submit with blank canvas
                lobby.submitDrawing(socketId, lobby.getCurrentBodyPart(), null, null);

                this.emitToLobby(lobby.inviteCode, 'game:playerSubmitted', {
                    playerId: player.id,
                    playerName: player.displayName,
                    autoSubmit: true
                });
            }
        }

        // Advance to next round
        this.advanceToNextRound(lobby);
    }

    handleDrawingSubmit(socket, data) {
        const lobby = this.lobbyManager.getLobbyByPlayer(socket.id);
        if (!lobby) {
            socket.emit('lobby:error', { message: 'Not in a lobby' });
            return;
        }

        if (lobby.state !== GAME_STATES.DRAWING) {
            socket.emit('lobby:error', { message: 'Not in drawing phase' });
            return;
        }

        const { bodyPart, canvasData, hintData } = data;

        const result = lobby.submitDrawing(socket.id, bodyPart, canvasData, hintData);

        if (result.success) {
            const player = lobby.getPlayer(socket.id);

            // Notify all players someone submitted
            this.emitToLobby(lobby.inviteCode, 'game:playerSubmitted', {
                playerId: player.id,
                playerName: result.playerName
            });

            // Check if round complete
            if (result.roundComplete) {
                this.advanceToNextRound(lobby);
            }
        } else {
            socket.emit('drawing:error', { message: result.error });
        }
    }

    advanceToNextRound(lobby) {
        const result = lobby.advanceRound();

        if (result.complete) {
            // All rounds done - trigger reveal
            this.triggerReveal(lobby);
        } else {
            // Start next round
            const currentPart = result.nextPart;

            // Send next round to all players with their hints and target fursona info
            for (const [socketId, player] of lobby.players) {
                const playerSocket = this.io.sockets.sockets.get(socketId);
                if (playerSocket) {
                    const targetInfo = lobby.getTargetFursonaInfo(socketId);
                    playerSocket.emit('game:nextRound', {
                        currentPart: currentPart,
                        round: lobby.currentRound + 1,
                        totalRounds: BODY_PART_ORDER.length,
                        hints: lobby.getHintsForPlayer(socketId),
                        targetFursona: targetInfo
                    });
                }
            }

            // Start timer for new round
            this.startRoundTimer(lobby);
            console.log(`Round ${lobby.currentRound + 1} started: ${currentPart}`);
        }
    }

    handleStyleSubmit(socket, data) {
        const lobby = this.lobbyManager.getLobbyByPlayer(socket.id);
        if (!lobby) {
            socket.emit('lobby:error', { message: 'Not in a lobby' });
            return;
        }

        const { artStyle, background } = data;
        // Store style for THIS player's fursona
        lobby.setStyle(socket.id, artStyle, background);

        socket.emit('style:confirmed', { artStyle, background });
        console.log(`Style set for player ${socket.id} in lobby ${lobby.inviteCode}: ${artStyle}, ${background}`);
    }

    triggerReveal(lobby) {
        lobby.transitionToReveal();

        // Clear timer if running
        if (lobby.timer) {
            clearInterval(lobby.timer);
            lobby.timer = null;
        }

        // Get all player drawings
        const allDrawings = lobby.getAllPlayerDrawings();

        // Send reveal data to everyone
        this.emitToLobby(lobby.inviteCode, 'game:reveal', {
            allPlayerDrawings: allDrawings
        });

        console.log(`Reveal triggered for lobby: ${lobby.inviteCode}`);
    }

    async handleAIGenerate(socket, data) {
        const lobby = this.lobbyManager.getLobbyByPlayer(socket.id);
        if (!lobby) {
            socket.emit('lobby:error', { message: 'Not in a lobby' });
            return;
        }

        if (lobby.state !== GAME_STATES.REVEALING) {
            socket.emit('lobby:error', { message: 'Not in reveal phase' });
            return;
        }

        const player = lobby.getPlayer(socket.id);
        if (!player) {
            socket.emit('lobby:error', { message: 'Player not found' });
            return;
        }

        // Generate for a specific player's fursona
        const targetSocketId = data?.targetPlayerId || socket.id;

        // Permission check: host can generate any, non-host only their own
        if (!player.isHost && targetSocketId !== socket.id) {
            socket.emit('lobby:error', { message: 'You can only generate AI for your own fursona' });
            return;
        }

        // Check if already generated - send cached result to ALL players
        const existingAI = lobby.getPlayerAIVersion(targetSocketId);
        if (existingAI) {
            // Broadcast to all players in lobby so everyone sees it (include style info)
            const styleInfo = lobby.getStyleInfo(targetSocketId);
            this.emitToLobby(lobby.inviteCode, 'ai:complete', {
                targetPlayerId: targetSocketId,
                aiImage: existingAI,
                styleInfo: styleInfo
            });
            return;
        }

        // Notify all players that AI generation is starting for this fursona
        this.emitToLobby(lobby.inviteCode, 'ai:generating', { targetPlayerId: targetSocketId, progress: 0 });

        try {
            const drawings = lobby.getPlayerDrawings(targetSocketId);
            // Use the TARGET player's style, not the requester's
            const styleInfo = lobby.getStyleInfo(targetSocketId);

            const aiImage = await this.aiComposer.composeFursona(
                drawings.head,
                drawings.torso,
                drawings.legs,
                styleInfo
            );

            // Cache the result
            lobby.setPlayerAIVersion(targetSocketId, aiImage);

            // Broadcast to ALL players in lobby with style info
            this.emitToLobby(lobby.inviteCode, 'ai:complete', {
                targetPlayerId: targetSocketId,
                aiImage: aiImage,
                styleInfo: styleInfo
            });

            console.log(`AI generation complete for player in lobby: ${lobby.inviteCode}`);

        } catch (error) {
            console.error('AI generation error:', error);
            // Broadcast error to all players
            this.emitToLobby(lobby.inviteCode, 'ai:complete', {
                targetPlayerId: targetSocketId,
                aiImage: null,
                message: error.message || 'AI generation failed'
            });
        }
    }

    handleNewGame(socket) {
        const lobby = this.lobbyManager.getLobbyByPlayer(socket.id);
        if (!lobby) {
            socket.emit('lobby:error', { message: 'Not in a lobby' });
            return;
        }

        const player = lobby.getPlayer(socket.id);

        // If lobby is still in reveal/complete state, prepare for new game
        // This transitions to WAITING but keeps drawings until next game starts
        if (lobby.state === GAME_STATES.REVEALING || lobby.state === GAME_STATES.COMPLETE) {
            lobby.prepareForNewGame();
        }

        // Only auto-ready the host, non-host players need to ready up manually
        if (player.isHost) {
            lobby.setPlayerReady(socket.id, true);
        }

        // Send this player back to waiting room
        socket.emit('lobby:returnToWaiting', {
            lobby: lobby.serialize(),
            autoReady: player.isHost  // Tell client if they should be auto-readied
        });

        // Notify others about the state change (they might still be in reveal)
        if (player.isHost) {
            socket.to(`lobby:${lobby.inviteCode}`).emit('lobby:readyUpdate', {
                playerId: player.id,
                isReady: true
            });
        }

        console.log(`${player.displayName} returned to waiting room in lobby: ${lobby.inviteCode}`);
    }

    handleDisconnect(socket) {
        console.log(`Player disconnected: ${socket.id}`);
        this.handleLeaveLobby(socket);
    }
}

module.exports = SocketHandler;
