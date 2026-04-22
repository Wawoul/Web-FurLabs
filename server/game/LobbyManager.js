const Lobby = require('./Lobby');
const { DEFAULTS } = require('../config/constants');

class LobbyManager {
    constructor() {
        this.lobbies = new Map(); // inviteCode -> Lobby
        this.playerToLobby = new Map(); // socketId -> inviteCode

        // Cleanup stale lobbies every 5 minutes
        setInterval(() => this.cleanupStaleLobbies(), 5 * 60 * 1000);
    }

    generateInviteCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
        let code;
        do {
            code = '';
            for (let i = 0; i < DEFAULTS.INVITE_CODE_LENGTH; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.lobbies.has(code));
        return code;
    }

    createLobby(hostSocketId, hostName, options = {}) {
        // Check if player is already in a lobby
        if (this.playerToLobby.has(hostSocketId)) {
            return { success: false, error: 'Already in a lobby' };
        }

        const inviteCode = this.generateInviteCode();
        const lobby = new Lobby(inviteCode, hostSocketId, hostName, options);

        this.lobbies.set(inviteCode, lobby);
        this.playerToLobby.set(hostSocketId, inviteCode);

        return { success: true, lobby };
    }

    joinLobby(inviteCode, socketId, displayName) {
        const code = inviteCode.toUpperCase();
        const lobby = this.lobbies.get(code);

        if (!lobby) {
            return { success: false, error: 'Lobby not found' };
        }

        // Check if already in a lobby
        if (this.playerToLobby.has(socketId)) {
            return { success: false, error: 'Already in a lobby' };
        }

        const result = lobby.addPlayer(socketId, displayName);
        if (result.success) {
            this.playerToLobby.set(socketId, code);
        }

        return { ...result, lobby };
    }

    leaveLobby(socketId) {
        const inviteCode = this.playerToLobby.get(socketId);
        if (!inviteCode) return null;

        const lobby = this.lobbies.get(inviteCode);
        if (!lobby) {
            this.playerToLobby.delete(socketId);
            return null;
        }

        const player = lobby.removePlayer(socketId);
        this.playerToLobby.delete(socketId);

        // Delete lobby if empty
        if (lobby.getPlayerCount() === 0) {
            this.lobbies.delete(inviteCode);
        }

        return { player, lobby, lobbyDeleted: lobby.getPlayerCount() === 0 };
    }

    getLobby(inviteCode) {
        return this.lobbies.get(inviteCode.toUpperCase());
    }

    getLobbyByPlayer(socketId) {
        const inviteCode = this.playerToLobby.get(socketId);
        if (!inviteCode) return null;
        return this.lobbies.get(inviteCode);
    }

    getActiveCount() {
        return this.lobbies.size;
    }

    cleanupStaleLobbies() {
        const now = Date.now();
        const maxAge = 2 * 60 * 60 * 1000; // 2 hours

        for (const [code, lobby] of this.lobbies) {
            if (now - lobby.createdAt > maxAge && lobby.getPlayerCount() === 0) {
                this.lobbies.delete(code);
                console.log(`Cleaned up stale lobby: ${code}`);
            }
        }
    }
}

module.exports = LobbyManager;
