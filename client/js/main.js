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
        this.isHost = false;

        // Round-based drawing state
        this.currentRound = 0;
        this.currentPart = 'head';
        this.hasSubmittedThisRound = false;

        // Store own drawings locally for hints
        this.myDrawings = {
            head: null,
            torso: null,
            legs: null
        };

        // Player submission status for current round
        this.submissions = new Map();

        // Style choices
        this.selectedArtStyle = 'cartoon';
        this.selectedBackground = 'simple gradient';
        this.pendingDrawingData = null;

        // Reveal state
        this.allPlayerDrawings = {};
        this.selectedPlayerId = null;
        this.currentRevealStage = 0; // 0=head, 1=torso, 2=legs, 3=final
        this.zoomLevel = 50;

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
            // Round-based: everyone draws same part but for different fursonas
            this.currentRound = data.round || 1;
            this.currentPart = data.currentPart || 'head';
            this.hasSubmittedThisRound = false;
            this.submissions.clear();
            this.myDrawings = { head: null, torso: null, legs: null };

            // Store target fursona info (whose fursona we're drawing for)
            this.targetFursona = data.targetFursona || { ownerName: 'your', isOwnFursona: true };

            // Initialize all players as not submitted
            if (this.lobby) {
                this.lobby.players.forEach(p => {
                    this.submissions.set(p.id, false);
                });
            }

            // Store drawing data for after style selection
            this.pendingDrawingData = {
                drawingTime: data.drawingTime,
                hints: data.hints,
                round: data.round,
                totalRounds: data.totalRounds,
                targetFursona: data.targetFursona
            };
            // Show style selection screen first
            this.showStyleScreen();
        });

        this.network.on('game:nextRound', (data) => {
            // Move to next round
            this.currentRound = data.round;
            this.currentPart = data.currentPart;
            this.hasSubmittedThisRound = false;
            this.submissions.clear();

            // Update target fursona info for this round
            this.targetFursona = data.targetFursona || { ownerName: 'your', isOwnFursona: true };

            // Reset all players as not submitted
            if (this.lobby) {
                this.lobby.players.forEach(p => {
                    this.submissions.set(p.id, false);
                });
            }

            // Clear and prepare canvas for next part
            if (this.drawingCanvas) {
                this.drawingCanvas.clear();
            }

            this.updateDrawingLabel(this.currentPart);
            this.updateHintDisplay(this.currentPart, data.hints);
            this.updateDrawingPlayerList();

            // Re-enable submit button
            document.getElementById('btn-submit-drawing').disabled = false;
            document.getElementById('btn-submit-drawing').textContent = 'Submit Drawing';

            // Show who we're drawing for
            const targetName = this.targetFursona.isOwnFursona ? 'your own' : `${this.targetFursona.ownerName}'s`;
            this.showToast(`Round ${data.round}: Draw the ${this.currentPart} for ${targetName} fursona!`, 'info');
        });

        // Player returns to waiting room (clicked New Game)
        this.network.on('lobby:returnToWaiting', (data) => {
            this.lobby = data.lobby;
            this.currentRound = 0;
            this.currentPart = 'head';
            this.hasSubmittedThisRound = false;
            this.submissions.clear();
            this.myDrawings = { head: null, torso: null, legs: null };
            this.allPlayerDrawings = {};
            this.selectedPlayerId = null;
            this.currentRevealStage = 0;

            // Update waiting room and show it
            this.updateWaitingRoom();
            this.showScreen('waiting');

            // Only auto-ready for host, non-host needs to ready up manually
            const autoReady = data.autoReady || false;
            document.getElementById('ready-checkbox').checked = autoReady;

            if (autoReady) {
                this.showToast('Ready for new game!', 'success');
            } else {
                this.showToast('Returned to lobby - ready up when ready!', 'info');
            }
        });

        // Legacy handler - kept for backwards compatibility
        this.network.on('lobby:newGame', (data) => {
            // Reset for new game
            this.lobby = data.lobby;
            this.currentRound = 0;
            this.currentPart = 'head';
            this.hasSubmittedThisRound = false;
            this.submissions.clear();
            this.myDrawings = { head: null, torso: null, legs: null };
            this.allPlayerDrawings = {};
            this.selectedPlayerId = null;
            this.currentRevealStage = 0;

            // Update waiting room
            this.updateWaitingRoom();
            this.showScreen('waiting');

            // Reset ready checkbox
            document.getElementById('ready-checkbox').checked = false;
        });

        this.network.on('style:confirmed', (data) => {
            console.log('Style confirmed:', data);
        });

        this.network.on('game:timerUpdate', (data) => {
            this.updateTimer(data.remaining);
        });

        this.network.on('game:playerSubmitted', (data) => {
            // Update submission status
            this.submissions.set(data.playerId, true);
            this.updateDrawingPlayerList();

            // Track who drew what
            if (data.bodyPart && data.playerName) {
                this.artistCredits[data.bodyPart] = data.playerName;
            }

            const player = this.lobby?.players.find(p => p.id === data.playerId);
            if (player) {
                this.showToast(`${player.displayName} submitted!`, 'success');
            }
        });

        this.network.on('drawing:hintsUpdated', (data) => {
            if (this.drawingCanvas) {
                if (data.hints.top) {
                    this.drawingCanvas.showHint('top', data.hints.top);
                }
            }
        });

        this.network.on('game:reveal', (data) => {
            // Store all player drawings
            this.allPlayerDrawings = data.allPlayerDrawings || {};
            this.showRevealScreen();
        });

        this.network.on('ai:generating', (data) => {
            document.getElementById('ai-placeholder').classList.add('hidden');
            document.getElementById('ai-loading').classList.remove('hidden');
        });

        this.network.on('ai:complete', (data) => {
            document.getElementById('ai-loading').classList.add('hidden');
            if (data.aiImage) {
                // Store AI image for the player
                const targetId = data.targetPlayerId;
                if (targetId && this.allPlayerDrawings[targetId]) {
                    this.allPlayerDrawings[targetId].aiImage = data.aiImage;
                }

                const aiResultContainer = document.getElementById('ai-result-container');
                const aiResult = document.getElementById('ai-result');
                aiResult.src = data.aiImage;
                aiResultContainer.classList.remove('hidden');

                // Display the style info
                document.getElementById('display-art-style').textContent = this.selectedArtStyle || 'cartoon';
                document.getElementById('display-background').textContent = this.selectedBackground || 'simple gradient';
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
        document.getElementById('btn-copy-code').addEventListener('click', async () => {
            const code = document.getElementById('display-invite-code').textContent;
            try {
                await navigator.clipboard.writeText(code);
                this.showToast('Code copied!', 'success');
            } catch (err) {
                // Fallback for older browsers or permission denied
                const textArea = document.createElement('textarea');
                textArea.value = code;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    this.showToast('Code copied!', 'success');
                } catch (e) {
                    this.showToast('Failed to copy code', 'error');
                }
                document.body.removeChild(textArea);
            }
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

        // Style selection screen
        document.querySelectorAll('#style-options .style-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#style-options .style-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedArtStyle = btn.dataset.style;
                // Clear custom input when preset selected
                const customInput = document.getElementById('custom-style-input');
                if (customInput) customInput.value = '';
            });
        });

        document.querySelectorAll('#bg-options .style-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#bg-options .style-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedBackground = btn.dataset.bg;
                // Clear custom input when preset selected
                const customInput = document.getElementById('custom-bg-input');
                if (customInput) customInput.value = '';
            });
        });

        // Custom style text inputs
        const customStyleInput = document.getElementById('custom-style-input');
        if (customStyleInput) {
            customStyleInput.addEventListener('input', (e) => {
                if (e.target.value.trim()) {
                    document.querySelectorAll('#style-options .style-option').forEach(b => b.classList.remove('active'));
                    this.selectedArtStyle = e.target.value.trim();
                }
            });
        }

        const customBgInput = document.getElementById('custom-bg-input');
        if (customBgInput) {
            customBgInput.addEventListener('input', (e) => {
                if (e.target.value.trim()) {
                    document.querySelectorAll('#bg-options .style-option').forEach(b => b.classList.remove('active'));
                    this.selectedBackground = e.target.value.trim();
                }
            });
        }

        document.getElementById('btn-confirm-style').addEventListener('click', () => {
            // Check for custom inputs first
            const customStyle = document.getElementById('custom-style-input')?.value.trim();
            const customBg = document.getElementById('custom-bg-input')?.value.trim();

            if (customStyle) this.selectedArtStyle = customStyle;
            if (customBg) this.selectedBackground = customBg;

            // Submit style choice to server
            this.network.submitStyle(this.selectedArtStyle, this.selectedBackground);
            // Start drawing phase with stored data
            if (this.pendingDrawingData) {
                this.startDrawingPhase(this.pendingDrawingData.drawingTime, this.pendingDrawingData.hints);
                this.pendingDrawingData = null;
            }
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

        // Reveal screen tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchRevealTab(btn.dataset.tab);
            });
        });

        document.getElementById('btn-generate-ai').addEventListener('click', () => {
            this.network.generateAI(this.selectedPlayerId);
        });

        document.getElementById('btn-download').addEventListener('click', () => {
            const canvas = document.getElementById('combined-canvas');
            CanvasUtils.downloadCanvas(canvas, 'fursona.png');
        });

        document.getElementById('btn-download-ai').addEventListener('click', () => {
            const aiImg = document.getElementById('ai-result');
            if (aiImg.src) {
                const link = document.createElement('a');
                link.href = aiImg.src;
                link.download = 'fursona_ai.png';
                link.click();
            }
        });

        document.getElementById('btn-new-game').addEventListener('click', () => {
            // Send new game request to server
            this.network.newGame();
        });

        // Reveal continue button
        document.getElementById('btn-reveal-continue').addEventListener('click', () => {
            this.advanceRevealStage();
        });

        // Zoom controls
        document.querySelectorAll('.zoom-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.zoom-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.zoomLevel = parseInt(btn.dataset.zoom);
                this.updateZoom();
            });
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

    showStyleScreen() {
        this.showScreen('style');

        // Reset style selections to defaults
        this.selectedArtStyle = 'cartoon';
        this.selectedBackground = 'simple gradient';

        // Reset UI to defaults
        document.querySelectorAll('#style-options .style-option').forEach(b => {
            b.classList.toggle('active', b.dataset.style === 'cartoon');
        });
        document.querySelectorAll('#bg-options .style-option').forEach(b => {
            b.classList.toggle('active', b.dataset.bg === 'simple gradient');
        });
    }

    startDrawingPhase(drawingTime, hints) {
        this.showScreen('drawing');

        // Initialize canvas
        this.drawingCanvas = new DrawingCanvas('drawing-canvas');

        // Use current part from round state
        this.updateDrawingLabel(this.currentPart);
        this.updateHintDisplay(this.currentPart, hints);
        this.updateDrawingPlayerList();

        // Initialize timer
        this.updateTimer(drawingTime);

        // Reset submit button
        document.getElementById('btn-submit-drawing').disabled = false;
        document.getElementById('btn-submit-drawing').textContent = 'Submit Drawing';
    }

    updateDrawingLabel(part) {
        const partNames = {
            'head': 'Head',
            'torso': 'Torso',
            'legs': 'Legs'
        };

        const partName = partNames[part] || 'Part';
        let label = `Draw the ${partName}`;

        // Add target fursona info if available
        if (this.targetFursona) {
            if (this.targetFursona.isOwnFursona) {
                label += ' for your Fursona';
            } else {
                label += ` for ${this.targetFursona.ownerName}'s Fursona`;
            }
        }

        document.getElementById('drawing-part-label').textContent = label;
    }

    async updateHintDisplay(part, serverHints) {
        const topOverlay = document.getElementById('hint-overlay-top');
        const bottomOverlay = document.getElementById('hint-overlay-bottom');

        // Reset overlays (we only use these as zone indicators now, not for actual hints)
        topOverlay.style.display = 'none';
        topOverlay.style.backgroundImage = '';
        bottomOverlay.style.display = 'none';
        bottomOverlay.style.backgroundImage = '';

        // Head - no top hint, show bottom hint zone indicator
        if (part === 'head') {
            bottomOverlay.style.display = 'block';
            bottomOverlay.style.backgroundImage = ''; // Just show the zone, no image
        }
        // Torso - draw top hint ONTO canvas (editable!), show bottom hint zone
        else if (part === 'torso') {
            // Use server hints or own drawings
            const topHint = serverHints?.top || this.myDrawings.head?.bottomHint;
            if (topHint && this.drawingCanvas) {
                // Draw hint directly on canvas so player can edit over it
                await this.drawingCanvas.drawHintOnCanvas('top', topHint);
            }
            bottomOverlay.style.display = 'block';
            bottomOverlay.style.backgroundImage = ''; // Just show the zone
        }
        // Legs - draw top hint ONTO canvas (editable!), NO bottom hint
        else if (part === 'legs') {
            const topHint = serverHints?.top || this.myDrawings.torso?.bottomHint;
            if (topHint && this.drawingCanvas) {
                // Draw hint directly on canvas so player can edit over it
                await this.drawingCanvas.drawHintOnCanvas('top', topHint);
            }
            // NO bottom overlay for legs!
        }
    }

    updateDrawingPlayerList() {
        const list = document.getElementById('drawing-player-list');
        if (!list || !this.lobby) return;

        list.innerHTML = '';

        for (const player of this.lobby.players) {
            const li = document.createElement('li');
            const hasSubmitted = this.submissions.get(player.id) || false;

            if (hasSubmitted) {
                li.classList.add('submitted');
            }

            // Find what part this player is drawing
            let partLabel = '';
            if (player.assignedPart) {
                const parts = Array.isArray(player.assignedPart) ? player.assignedPart : [player.assignedPart];
                partLabel = parts.map(p => p.charAt(0).toUpperCase()).join('/');
            }

            li.innerHTML = `
                <span>${player.displayName}</span>
                ${partLabel ? `<span class="part-badge">${partLabel}</span>` : ''}
            `;
            list.appendChild(li);
        }
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
        if (!this.drawingCanvas || this.hasSubmittedThisRound) return;

        const canvasData = this.drawingCanvas.getCanvasData();
        const hintData = this.drawingCanvas.getHintData();

        // Store own drawing locally for hints in next round
        this.myDrawings[this.currentPart] = {
            image: canvasData,
            bottomHint: hintData.bottom
        };

        // Submit to server
        this.network.submitDrawing(this.currentPart, canvasData, hintData);

        // Mark as submitted for this round
        this.hasSubmittedThisRound = true;
        document.getElementById('btn-submit-drawing').disabled = true;
        document.getElementById('btn-submit-drawing').textContent = 'Waiting for others...';
    }

    showRevealScreen() {
        this.showScreen('reveal');
        this.currentRevealStage = 0;

        // Build player list sidebar
        this.buildRevealPlayerList();

        // Select first player by default
        const playerIds = Object.keys(this.allPlayerDrawings);
        if (playerIds.length > 0) {
            this.selectRevealPlayer(playerIds[0]);
        }
    }

    buildRevealPlayerList() {
        const list = document.getElementById('reveal-player-list');
        list.innerHTML = '';

        for (const [playerId, data] of Object.entries(this.allPlayerDrawings)) {
            const li = document.createElement('li');
            li.dataset.playerId = playerId;

            const initial = data.playerName ? data.playerName.charAt(0).toUpperCase() : '?';

            li.innerHTML = `
                <span class="player-avatar">${initial}</span>
                <span>${data.playerName || 'Player'}</span>
            `;

            li.addEventListener('click', () => {
                this.selectRevealPlayer(playerId);
            });

            list.appendChild(li);
        }
    }

    selectRevealPlayer(playerId) {
        this.selectedPlayerId = playerId;
        this.currentRevealStage = 0;

        // Update sidebar selection
        document.querySelectorAll('#reveal-player-list li').forEach(li => {
            li.classList.toggle('active', li.dataset.playerId === playerId);
        });

        const playerData = this.allPlayerDrawings[playerId];
        if (!playerData) return;

        // Update title
        document.getElementById('reveal-title').textContent =
            `${playerData.playerName}'s Fursona`;

        // Reset all reveal elements
        document.querySelectorAll('.reveal-part').forEach(el => {
            el.classList.remove('visible');
            el.classList.add('hidden');
        });
        document.getElementById('reveal-final').classList.add('hidden');
        document.getElementById('ai-lab-section').classList.add('hidden');

        // Set up images (no hint lines)
        if (playerData.head) {
            document.getElementById('reveal-head-img').src = playerData.head;
        }
        if (playerData.torso) {
            document.getElementById('reveal-torso-img').src = playerData.torso;
        }
        if (playerData.legs) {
            document.getElementById('reveal-legs-img').src = playerData.legs;
        }

        // Show continue button
        document.getElementById('reveal-continue').classList.remove('hidden');

        // Start with head reveal
        this.showRevealPart('head');

        // Reset save button
        document.getElementById('btn-save-gallery').disabled = false;
        document.getElementById('btn-save-gallery').textContent = 'Save to Gallery';

        // Reset AI section
        document.getElementById('ai-placeholder').classList.remove('hidden');
        document.getElementById('ai-loading').classList.add('hidden');
        document.getElementById('ai-result-container').classList.add('hidden');

        // Check if AI already generated
        if (playerData.aiImage) {
            document.getElementById('ai-placeholder').classList.add('hidden');
            document.getElementById('ai-result-container').classList.remove('hidden');
            document.getElementById('ai-result').src = playerData.aiImage;
        }
    }

    showRevealPart(part) {
        const el = document.getElementById(`reveal-${part}`);
        if (el) {
            el.classList.remove('hidden');
            setTimeout(() => el.classList.add('visible'), 50);
        }
    }

    async advanceRevealStage() {
        this.currentRevealStage++;

        if (this.currentRevealStage === 1) {
            // Show torso
            this.showRevealPart('torso');
        } else if (this.currentRevealStage === 2) {
            // Show legs
            this.showRevealPart('legs');
        } else if (this.currentRevealStage === 3) {
            // Show combined canvas
            document.getElementById('reveal-continue').classList.add('hidden');

            const playerData = this.allPlayerDrawings[this.selectedPlayerId];
            if (playerData) {
                // Combine drawings
                const combinedCanvas = document.getElementById('combined-canvas');
                await CanvasUtils.combineDrawings(
                    playerData.head,
                    playerData.torso,
                    playerData.legs,
                    combinedCanvas
                );
            }

            const finalEl = document.getElementById('reveal-final');
            finalEl.classList.remove('hidden');
            setTimeout(() => finalEl.classList.add('visible'), 50);

            // Show AI Lab section
            document.getElementById('ai-lab-section').classList.remove('hidden');

            // Scroll to final
            finalEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    updateZoom() {
        const partsContainer = document.getElementById('reveal-parts-container');
        const canvasWrapper = document.getElementById('combined-canvas-wrapper');

        partsContainer.classList.remove('zoom-50', 'zoom-100');
        partsContainer.classList.add(`zoom-${this.zoomLevel}`);

        canvasWrapper.classList.remove('zoom-50', 'zoom-100');
        canvasWrapper.classList.add(`zoom-${this.zoomLevel}`);
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FurLabsApp();
});
