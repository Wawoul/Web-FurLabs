/**
 * Manages Socket.IO connection and events
 */
class NetworkManager {
    constructor() {
        this.socket = null;
        this.eventHandlers = new Map();
    }

    connect() {
        this.socket = io();

        // Re-attach event handlers after connection
        for (const [event, handlers] of this.eventHandlers) {
            for (const handler of handlers) {
                this.socket.on(event, handler);
            }
        }

        return new Promise((resolve) => {
            this.socket.on('connect', () => {
                console.log('Connected to server');
                resolve();
            });
        });
    }

    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);

        if (this.socket) {
            this.socket.on(event, handler);
        }
    }

    off(event, handler) {
        if (this.socket) {
            this.socket.off(event, handler);
        }
        if (this.eventHandlers.has(event)) {
            const handlers = this.eventHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    // Lobby actions
    createLobby(displayName, drawingTime = 180) {
        this.emit('lobby:create', { displayName, drawingTime });
    }

    joinLobby(inviteCode, displayName) {
        this.emit('lobby:join', { inviteCode, displayName });
    }

    leaveLobby() {
        this.emit('lobby:leave', {});
    }

    kickPlayer(targetPlayerId) {
        this.emit('lobby:kick', { targetPlayerId });
    }

    setReady(isReady) {
        this.emit('lobby:ready', { isReady });
    }

    startGame() {
        this.emit('lobby:start', {});
    }

    // Style actions
    submitStyle(artStyle, background) {
        this.emit('style:submit', { artStyle, background });
    }

    // Drawing actions
    submitDrawing(bodyPart, canvasData, hintData) {
        this.emit('drawing:submit', { bodyPart, canvasData, hintData });
    }

    requestHints(bodyPart) {
        this.emit('drawing:requestHints', { bodyPart });
    }

    // AI actions
    generateAI(targetPlayerId) {
        this.emit('ai:generate', { targetPlayerId });
    }

    // New game action
    newGame() {
        this.emit('lobby:newGame', {});
    }
}

// Make available globally
window.NetworkManager = NetworkManager;
