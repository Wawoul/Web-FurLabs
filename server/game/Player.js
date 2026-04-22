const { v4: uuidv4 } = require('uuid');

class Player {
    constructor(socketId, displayName) {
        this.id = uuidv4();
        this.socketId = socketId;
        this.displayName = displayName;
        this.isReady = false;
        this.isHost = false;
        this.assignedPart = null;
        this.hasSubmitted = false;
        this.isSpectator = false;
        this.joinedAt = Date.now();
    }

    setReady(ready) {
        this.isReady = ready;
    }

    assignPart(part) {
        this.assignedPart = part;
    }

    markSubmitted() {
        this.hasSubmitted = true;
    }

    makeSpectator() {
        this.isSpectator = true;
        this.assignedPart = null;
    }

    serialize() {
        return {
            id: this.id,
            displayName: this.displayName,
            isReady: this.isReady,
            isHost: this.isHost,
            assignedPart: this.assignedPart,
            hasSubmitted: this.hasSubmitted,
            isSpectator: this.isSpectator
        };
    }
}

module.exports = Player;
