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

            // Drawing events
            socket.on('drawing:submit', (data) => this.handleDrawingSubmit(socket, data));
            socket.on('drawing:requestHints', (data) => this.handleRequestHints(socket, data));

            // Style events
            socket.on('style:submit', (data) => this.handleStyleSubmit(socket, data));

            // AI events
            socket.on('ai:generate', () => this.handleAIGenerate(socket));

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

        // Send game start to all players with their assignments
        for (const [socketId, p] of lobby.players) {
            const playerSocket = this.io.sockets.sockets.get(socketId);
            if (playerSocket) {
                playerSocket.emit('game:start', {
                    assignedParts: p.assignedPart,
                    drawingTime: lobby.drawingTime,
                    isSpectator: p.isSpectator,
                    hints: p.assignedPart ? lobby.getHintsForPart(
                        Array.isArray(p.assignedPart) ? p.assignedPart[0] : p.assignedPart
                    ) : {}
                });
            }
        }

        // Start timer
        this.startTimer(lobby);
        console.log(`Game started in lobby: ${lobby.inviteCode}`);
    }

    startTimer(lobby) {
        lobby.timer = setInterval(() => {
            lobby.timeRemaining--;

            this.emitToLobby(lobby.inviteCode, 'game:timerUpdate', {
                remaining: lobby.timeRemaining
            });

            if (lobby.timeRemaining <= 0) {
                clearInterval(lobby.timer);
                lobby.timer = null;

                // Force end drawing phase
                if (!lobby.allDrawingsComplete()) {
                    // Time's up but not all submitted - still reveal what we have
                    this.triggerReveal(lobby);
                }
            }
        }, 1000);
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
                bodyPart,
                playerName: result.playerName
            });

            // Send hints to next player if applicable
            this.sendHintsToNextPart(lobby, bodyPart);

            // Check if all complete
            if (result.allComplete) {
                this.triggerReveal(lobby);
            }
        } else {
            socket.emit('drawing:error', { message: result.error });
        }
    }

    sendHintsToNextPart(lobby, submittedPart) {
        const partIndex = BODY_PART_ORDER.indexOf(submittedPart);
        if (partIndex < BODY_PART_ORDER.length - 1) {
            const nextPart = BODY_PART_ORDER[partIndex + 1];

            // Find player with next part
            for (const [socketId, player] of lobby.players) {
                const parts = Array.isArray(player.assignedPart) ? player.assignedPart : [player.assignedPart];
                if (parts.includes(nextPart)) {
                    const playerSocket = this.io.sockets.sockets.get(socketId);
                    if (playerSocket) {
                        playerSocket.emit('drawing:hintsUpdated', {
                            hints: lobby.getHintsForPart(nextPart)
                        });
                    }
                }
            }
        }
    }

    handleRequestHints(socket, data) {
        const lobby = this.lobbyManager.getLobbyByPlayer(socket.id);
        if (!lobby) return;

        const { bodyPart } = data;
        socket.emit('drawing:hints', {
            hints: lobby.getHintsForPart(bodyPart)
        });
    }

    handleStyleSubmit(socket, data) {
        const lobby = this.lobbyManager.getLobbyByPlayer(socket.id);
        if (!lobby) {
            socket.emit('lobby:error', { message: 'Not in a lobby' });
            return;
        }

        const { artStyle, background } = data;
        lobby.setStyle(artStyle, background);

        // Notify the player their style was set
        socket.emit('style:confirmed', { artStyle, background });
        console.log(`Style set for lobby ${lobby.inviteCode}: ${artStyle}, ${background}`);
    }

    triggerReveal(lobby) {
        lobby.transitionToReveal();

        // Clear timer if running
        if (lobby.timer) {
            clearInterval(lobby.timer);
            lobby.timer = null;
        }

        // Send all drawings to everyone with artist credits
        this.emitToLobby(lobby.inviteCode, 'game:reveal', {
            drawings: lobby.getDrawings(),
            artistCredits: lobby.getArtistCredits()
        });

        console.log(`Reveal triggered for lobby: ${lobby.inviteCode}`);
    }

    async handleAIGenerate(socket) {
        const lobby = this.lobbyManager.getLobbyByPlayer(socket.id);
        if (!lobby) {
            socket.emit('lobby:error', { message: 'Not in a lobby' });
            return;
        }

        if (lobby.state !== GAME_STATES.REVEALING) {
            socket.emit('lobby:error', { message: 'Not in reveal phase' });
            return;
        }

        // Check if already generated
        if (lobby.aiVersion) {
            this.emitToLobby(lobby.inviteCode, 'ai:complete', {
                aiImage: lobby.aiVersion
            });
            return;
        }

        // Notify that AI generation is starting
        this.emitToLobby(lobby.inviteCode, 'ai:generating', { progress: 0 });

        try {
            const drawings = lobby.getDrawings();
            const styleInfo = lobby.getStyleInfo();
            const aiImage = await this.aiComposer.composeFursona(
                drawings.head,
                drawings.torso,
                drawings.legs,
                styleInfo
            );

            // Cache the result
            lobby.setAIVersion(aiImage);

            this.emitToLobby(lobby.inviteCode, 'ai:complete', {
                aiImage: aiImage
            });

            console.log(`AI generation complete for lobby: ${lobby.inviteCode}`);

        } catch (error) {
            console.error('AI generation error:', error);
            this.emitToLobby(lobby.inviteCode, 'ai:complete', {
                aiImage: null,
                message: error.message || 'AI generation failed'
            });
        }
    }

    handleDisconnect(socket) {
        console.log(`Player disconnected: ${socket.id}`);
        this.handleLeaveLobby(socket);
    }
}

module.exports = SocketHandler;
