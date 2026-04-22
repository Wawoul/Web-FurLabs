/**
 * Fur-Labs Main Application
 */
class FurLabsApp {
    constructor() {
        this.network = new NetworkManager();
        this.drawingCanvas = null;
        this.currentScreen = 'title';
        this.lobby = null;
        this.playerId = null;
        this.assignedParts = [];
        this.currentPartIndex = 0;
        this.isHost = false;

        this.init();
    }

    async init() {
        await this.network.connect();
        this.setupNetworkHandlers();
        this.setupUIHandlers();
    }

    // Screen management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`screen-${screenId}`).classList.add('active');
        this.currentScreen = screenId;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    // Network event handlers
    setupNetworkHandlers() {
        // Lobby events
        this.network.on('lobby:created', (data) => {
            this.lobby = data.lobby;
            this.isHost = true;
            this.updateWaitingRoom();
            this.showScreen('waiting');
            document.getElementById('display-invite-code').textContent = data.inviteCode;
        });

        this.network.on('lobby:joined', (data) => {
            this.lobby = data.lobby;
            this.playerId = data.lobby.players.find(p => !this.playerId || p.id === this.playerId)?.id;
            this.updateWaitingRoom();
            this.showScreen('waiting');
            document.getElementById('display-invite-code').textContent = data.lobby.inviteCode;
        });

        this.network.on('lobby:playerJoined', (data) => {
            this.lobby.players.push(data.player);
            this.updateWaitingRoom();
            this.showToast(`${data.player.displayName} joined!`, 'success');
        });

        this.network.on('lobby:playerLeft', (data) => {
            this.lobby.players = this.lobby.players.filter(p => p.id !== data.playerId);
            if (data.newHost) {
                const host = this.lobby.players.find(p => p.id === data.newHost.id);
                if (host) host.isHost = true;
                if (data.newHost.id === this.playerId) {
                    this.isHost = true;
                }
            }
            this.updateWaitingRoom();
        });

        this.network.on('lobby:readyUpdate', (data) => {
            const player = this.lobby.players.find(p => p.id === data.playerId);
            if (player) {
                player.isReady = data.isReady;
                this.updateWaitingRoom();
            }
        });

        this.network.on('lobby:left', () => {
            this.lobby = null;
            this.showScreen('title');
        });

        this.network.on('lobby:error', (data) => {
            this.showToast(data.message, 'error');
        });

        // Game events
        this.network.on('game:start', (data) => {
            this.assignedParts = data.assignedParts;
            this.currentPartIndex = 0;

            if (data.isSpectator) {
                this.showToast('You are spectating this round', 'info');
                // TODO: Show spectator view
            } else {
                this.startDrawingPhase(data.drawingTime, data.hints);
            }
        });

        this.network.on('game:timerUpdate', (data) => {
            this.updateTimer(data.remaining);
        });

        this.network.on('game:playerSubmitted', (data) => {
            this.showToast(`A player submitted their drawing!`, 'success');
        });

        this.network.on('drawing:hintsUpdated', (data) => {
            if (this.drawingCanvas) {
                if (data.hints.top) {
                    this.drawingCanvas.showHint('top', data.hints.top);
                }
            }
        });

        this.network.on('game:reveal', (data) => {
            this.showRevealScreen(data.drawings);
        });

        this.network.on('ai:generating', (data) => {
            document.getElementById('ai-placeholder').classList.add('hidden');
            document.getElementById('ai-loading').classList.remove('hidden');
        });

        this.network.on('ai:complete', (data) => {
            document.getElementById('ai-loading').classList.add('hidden');
            if (data.aiImage) {
                this.currentAIImage = data.aiImage;
                const aiResult = document.getElementById('ai-result');
                aiResult.src = data.aiImage;
                aiResult.classList.remove('hidden');
            } else {
                document.getElementById('ai-placeholder').classList.remove('hidden');
                this.showToast(data.message || 'AI generation failed', 'error');
            }
        });
    }

    // UI event handlers
    setupUIHandlers() {
        // Title screen
        document.getElementById('btn-create-lobby').addEventListener('click', () => {
            this.showScreen('create');
        });

        document.getElementById('btn-join-lobby').addEventListener('click', () => {
            this.showScreen('join');
        });

        // Create lobby screen
        document.getElementById('btn-back-create').addEventListener('click', () => {
            this.showScreen('title');
        });

        document.getElementById('btn-confirm-create').addEventListener('click', () => {
            const name = document.getElementById('create-name').value.trim();
            const time = parseInt(document.getElementById('create-time').value);
            if (!name) {
                this.showToast('Please enter your name', 'error');
                return;
            }
            this.network.createLobby(name, time);
        });

        // Join lobby screen
        document.getElementById('btn-back-join').addEventListener('click', () => {
            this.showScreen('title');
        });

        document.getElementById('btn-confirm-join').addEventListener('click', () => {
            const name = document.getElementById('join-name').value.trim();
            const code = document.getElementById('join-code').value.trim().toUpperCase();
            if (!name) {
                this.showToast('Please enter your name', 'error');
                return;
            }
            if (!code || code.length !== 6) {
                this.showToast('Please enter a valid 6-character code', 'error');
                return;
            }
            this.network.joinLobby(code, name);
        });

        // Waiting room
        document.getElementById('btn-copy-code').addEventListener('click', () => {
            const code = document.getElementById('display-invite-code').textContent;
            navigator.clipboard.writeText(code);
            this.showToast('Code copied!', 'success');
        });

        document.getElementById('btn-leave-lobby').addEventListener('click', () => {
            this.network.leaveLobby();
        });

        document.getElementById('ready-checkbox').addEventListener('change', (e) => {
            this.network.setReady(e.target.checked);
        });

        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.network.startGame();
        });

        // Drawing screen
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (this.drawingCanvas) {
                    this.drawingCanvas.setTool(btn.dataset.tool);
                }
            });
        });

        document.getElementById('color-picker').addEventListener('input', (e) => {
            if (this.drawingCanvas) {
                this.drawingCanvas.setColor(e.target.value);
            }
        });

        document.querySelectorAll('.color-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const color = btn.dataset.color;
                document.getElementById('color-picker').value = color;
                if (this.drawingCanvas) {
                    this.drawingCanvas.setColor(color);
                }
            });
        });

        document.getElementById('brush-size').addEventListener('input', (e) => {
            document.getElementById('size-value').textContent = e.target.value;
            if (this.drawingCanvas) {
                this.drawingCanvas.setBrushSize(e.target.value);
            }
        });

        document.getElementById('btn-undo').addEventListener('click', () => {
            if (this.drawingCanvas) {
                this.drawingCanvas.undo();
            }
        });

        document.getElementById('btn-clear').addEventListener('click', () => {
            if (this.drawingCanvas) {
                this.drawingCanvas.clear();
            }
        });

        document.getElementById('btn-submit-drawing').addEventListener('click', () => {
            this.submitCurrentDrawing();
        });

        // Reveal screen
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.reveal-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`${btn.dataset.tab}-reveal`).classList.add('active');
            });
        });

        document.getElementById('btn-generate-ai').addEventListener('click', () => {
            this.network.generateAI();
        });

        document.getElementById('btn-download').addEventListener('click', () => {
            const canvas = document.getElementById('combined-canvas');
            CanvasUtils.downloadCanvas(canvas, 'fursona.png');
        });

        document.getElementById('btn-new-game').addEventListener('click', () => {
            // Reset and go back to waiting room
            this.showScreen('waiting');
            document.getElementById('ready-checkbox').checked = false;
            this.network.setReady(false);
        });

        document.getElementById('btn-save-gallery').addEventListener('click', () => {
            this.saveToGallery();
        });

        // Gallery screen
        document.getElementById('btn-view-gallery').addEventListener('click', () => {
            this.showGallery();
        });

        document.getElementById('btn-back-gallery').addEventListener('click', () => {
            this.showScreen('title');
        });

        document.getElementById('btn-prev-page').addEventListener('click', () => {
            if (this.galleryPage > 1) {
                this.galleryPage--;
                this.loadGallery();
            }
        });

        document.getElementById('btn-next-page').addEventListener('click', () => {
            this.galleryPage++;
            this.loadGallery();
        });

        // Modal
        document.getElementById('btn-close-modal').addEventListener('click', () => {
            document.getElementById('gallery-modal').classList.add('hidden');
        });

        document.getElementById('gallery-modal').addEventListener('click', (e) => {
            if (e.target.id === 'gallery-modal') {
                document.getElementById('gallery-modal').classList.add('hidden');
            }
        });

        document.querySelectorAll('.modal-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateModalImage(btn.dataset.tab);
            });
        });

        document.getElementById('btn-modal-download').addEventListener('click', () => {
            if (this.currentModalItem) {
                const activeTab = document.querySelector('.modal-tab-btn.active').dataset.tab;
                const url = activeTab === 'ai' && this.currentModalItem.aiImageUrl
                    ? this.currentModalItem.aiImageUrl
                    : this.currentModalItem.rawImageUrl;

                const link = document.createElement('a');
                link.href = url;
                link.download = `fursona_${this.currentModalItem.id}.png`;
                link.click();
            }
        });
    }

    // Gallery methods
    galleryPage = 1;
    galleryTotalPages = 1;
    currentModalItem = null;
    currentDrawings = null;
    currentAIImage = null;

    async showGallery() {
        this.showScreen('gallery');
        this.galleryPage = 1;
        await this.loadGallery();
    }

    async loadGallery() {
        const grid = document.getElementById('gallery-grid');
        const loading = document.getElementById('gallery-loading');
        const empty = document.getElementById('gallery-empty');

        grid.innerHTML = '';
        loading.classList.remove('hidden');
        empty.classList.add('hidden');

        try {
            const response = await fetch(`/api/gallery?page=${this.galleryPage}&limit=12`);
            const data = await response.json();

            loading.classList.add('hidden');

            if (data.items.length === 0) {
                empty.classList.remove('hidden');
            } else {
                data.items.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'gallery-item';
                    div.innerHTML = `
                        <img src="${item.rawImageUrl}" alt="Fursona">
                        <div class="gallery-item-info">
                            <span class="date">${new Date(item.createdAt).toLocaleDateString()}</span>
                            <div class="badges">
                                ${item.hasAI ? '<span class="badge">AI</span>' : ''}
                            </div>
                        </div>
                    `;
                    div.addEventListener('click', () => this.openGalleryModal(item));
                    grid.appendChild(div);
                });
            }

            // Update pagination
            this.galleryTotalPages = data.totalPages;
            document.getElementById('page-info').textContent = `Page ${data.page} of ${data.totalPages || 1}`;
            document.getElementById('btn-prev-page').disabled = data.page <= 1;
            document.getElementById('btn-next-page').disabled = data.page >= data.totalPages;

        } catch (error) {
            loading.classList.add('hidden');
            this.showToast('Failed to load gallery', 'error');
        }
    }

    openGalleryModal(item) {
        this.currentModalItem = item;
        document.getElementById('gallery-modal').classList.remove('hidden');

        // Reset to raw tab
        document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.modal-tab-btn[data-tab="raw"]').classList.add('active');

        // Show/hide AI tab based on availability
        const aiTab = document.querySelector('.modal-tab-btn[data-tab="ai"]');
        if (item.hasAI) {
            aiTab.style.display = 'block';
        } else {
            aiTab.style.display = 'none';
        }

        this.updateModalImage('raw');
    }

    updateModalImage(tab) {
        const img = document.getElementById('modal-image');
        if (this.currentModalItem) {
            if (tab === 'ai' && this.currentModalItem.aiImageUrl) {
                img.src = this.currentModalItem.aiImageUrl;
            } else {
                img.src = this.currentModalItem.rawImageUrl;
            }
        }
    }

    async saveToGallery() {
        const rawCanvas = document.getElementById('combined-canvas');
        const rawImage = rawCanvas.toDataURL('image/png');
        const aiImage = this.currentAIImage;

        try {
            const response = await fetch('/api/gallery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rawImage,
                    aiImage,
                    lobbyCode: this.lobby?.inviteCode
                })
            });

            if (response.ok) {
                this.showToast('Saved to gallery!', 'success');
                document.getElementById('btn-save-gallery').disabled = true;
                document.getElementById('btn-save-gallery').textContent = 'Saved!';
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            this.showToast('Failed to save to gallery', 'error');
        }
    }

    updateWaitingRoom() {
        const list = document.getElementById('player-list');
        list.innerHTML = '';

        if (!this.lobby) return;

        for (const player of this.lobby.players) {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="player-name">
                    <span>${player.displayName}</span>
                    ${player.isHost ? '<span class="host-badge">HOST</span>' : ''}
                </div>
                <span class="${player.isReady ? 'ready-status' : 'not-ready'}">
                    ${player.isReady ? '✓ Ready' : 'Not Ready'}
                </span>
            `;
            list.appendChild(li);
        }

        // Update start button
        const startBtn = document.getElementById('btn-start-game');
        const allReady = this.lobby.players.every(p => p.isReady);
        startBtn.disabled = !this.isHost || !allReady || this.lobby.players.length === 0;
    }

    startDrawingPhase(drawingTime, hints) {
        this.showScreen('drawing');

        // Initialize canvas
        this.drawingCanvas = new DrawingCanvas('drawing-canvas');

        // Get current part to draw
        const currentPart = this.getCurrentPart();
        this.updateDrawingLabel(currentPart);

        // Show hints if available
        if (hints && hints.top) {
            this.drawingCanvas.showHint('top', hints.top);
        }

        // Initialize timer
        this.updateTimer(drawingTime);
    }

    getCurrentPart() {
        if (this.assignedParts === 'all') {
            return ['head', 'torso', 'legs'][this.currentPartIndex];
        }
        if (Array.isArray(this.assignedParts)) {
            return this.assignedParts[this.currentPartIndex];
        }
        return this.assignedParts;
    }

    updateDrawingLabel(part) {
        const labels = {
            'head': 'Draw the Head',
            'torso': 'Draw the Torso',
            'legs': 'Draw the Legs'
        };
        document.getElementById('drawing-part-label').textContent = labels[part] || 'Draw';
    }

    updateTimer(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timerEl = document.getElementById('timer');
        timerEl.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

        // Warning colors
        timerEl.classList.remove('warning', 'danger');
        if (seconds <= 30) {
            timerEl.classList.add('danger');
        } else if (seconds <= 60) {
            timerEl.classList.add('warning');
        }
    }

    submitCurrentDrawing() {
        if (!this.drawingCanvas) return;

        const currentPart = this.getCurrentPart();
        const canvasData = this.drawingCanvas.getCanvasData();
        const hintData = this.drawingCanvas.getHintData();

        this.network.submitDrawing(currentPart, canvasData, hintData);

        // Check if more parts to draw (solo/duo mode)
        if (Array.isArray(this.assignedParts) && this.currentPartIndex < this.assignedParts.length - 1) {
            this.currentPartIndex++;
            this.drawingCanvas.clear();
            this.updateDrawingLabel(this.getCurrentPart());
            this.showToast(`Now draw the ${this.getCurrentPart()}!`, 'info');
        } else if (this.assignedParts === 'all' && this.currentPartIndex < 2) {
            this.currentPartIndex++;
            this.drawingCanvas.clear();
            this.updateDrawingLabel(this.getCurrentPart());
            this.showToast(`Now draw the ${this.getCurrentPart()}!`, 'info');
        } else {
            // All parts submitted
            document.getElementById('btn-submit-drawing').disabled = true;
            document.getElementById('btn-submit-drawing').textContent = 'Waiting for others...';
        }
    }

    async showRevealScreen(drawings) {
        this.showScreen('reveal');
        this.currentDrawings = drawings;
        this.currentAIImage = null;

        // Reset AI tab
        document.getElementById('ai-placeholder').classList.remove('hidden');
        document.getElementById('ai-loading').classList.add('hidden');
        document.getElementById('ai-result').classList.add('hidden');

        // Reset save button
        document.getElementById('btn-save-gallery').disabled = false;
        document.getElementById('btn-save-gallery').textContent = 'Save to Gallery';

        // Combine drawings on canvas
        const combinedCanvas = document.getElementById('combined-canvas');
        await CanvasUtils.combineDrawings(
            drawings.head,
            drawings.torso,
            drawings.legs,
            combinedCanvas
        );
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FurLabsApp();
});
