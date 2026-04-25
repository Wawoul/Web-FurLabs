/**
 * Drawing canvas with tools
 */
class DrawingCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.brushSize = 8;

        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;

        this.lastX = 0;
        this.lastY = 0;

        this.setupCanvas();
        this.setupEventListeners();
        this.saveState();
    }

    setupCanvas() {
        // Set white background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Default drawing settings
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startStroke(e));
        this.canvas.addEventListener('mousemove', (e) => this.continueStroke(e));
        this.canvas.addEventListener('mouseup', () => this.endStroke());
        this.canvas.addEventListener('mouseleave', () => this.endStroke());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];

            // Handle fill and pipette on touch
            if (this.currentTool === 'fill' || this.currentTool === 'pipette') {
                this.handlePointAction(touch);
            } else {
                this.startStroke(touch);
            }
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.continueStroke(e.touches[0]);
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => this.endStroke());

        // Click for fill and pipette tools (desktop)
        this.canvas.addEventListener('click', (e) => {
            this.handlePointAction(e);
        });
    }

    /**
     * Handle single-point actions (fill, pipette) for both mouse and touch
     */
    handlePointAction(e) {
        if (this.currentTool !== 'fill' && this.currentTool !== 'pipette') return;

        const pos = this.getPosition(e);
        const x = Math.floor(pos.x);
        const y = Math.floor(pos.y);

        if (this.currentTool === 'fill') {
            CanvasUtils.floodFill(this.canvas, x, y, this.currentColor);
            this.saveState();
        } else if (this.currentTool === 'pipette') {
            const color = this.getColorAtPosition(x, y);
            if (color) {
                this.setColor(color);
                // Notify external listeners about color change
                if (this.onColorPicked) {
                    this.onColorPicked(color);
                }
            }
        }
    }

    /**
     * Get the color at a specific pixel position
     */
    getColorAtPosition(x, y) {
        const imageData = this.ctx.getImageData(x, y, 1, 1).data;
        const r = imageData[0];
        const g = imageData[1];
        const b = imageData[2];
        // Convert to hex
        return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
    }

    getPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    startStroke(e) {
        if (this.currentTool === 'fill' || this.currentTool === 'pipette') return;

        this.isDrawing = true;
        const pos = this.getPosition(e);
        this.lastX = pos.x;
        this.lastY = pos.y;

        // Ensure context is properly configured before drawing
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw a dot for single clicks
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, this.brushSize / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = this.currentTool === 'eraser' ? 'white' : this.currentColor;
        this.ctx.fill();
    }

    continueStroke(e) {
        if (!this.isDrawing) return;

        const pos = this.getPosition(e);

        // Ensure context is properly configured before drawing
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.strokeStyle = this.currentTool === 'eraser' ? 'white' : this.currentColor;
        this.ctx.lineWidth = this.brushSize;
        this.ctx.stroke();

        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    endStroke() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }
    }

    setTool(tool) {
        // End any current stroke when switching tools
        if (this.isDrawing) {
            this.isDrawing = false;
            this.saveState();
        }

        this.currentTool = tool;

        // Set appropriate cursor for each tool
        if (tool === 'pipette') {
            this.canvas.style.cursor = 'cell';
        } else if (tool === 'fill') {
            this.canvas.style.cursor = 'crosshair';
        } else {
            this.canvas.style.cursor = 'crosshair';
        }
    }

    setColor(color) {
        this.currentColor = color;
    }

    setBrushSize(size) {
        this.brushSize = parseInt(size);
    }

    clear() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveState();
    }

    saveState() {
        // Remove any redo states
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Add current state
        this.history.push(this.canvas.toDataURL());
        this.historyIndex++;

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
        }
    }

    restoreState(dataUrl) {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    }

    getCanvasData() {
        return CanvasUtils.getCanvasData(this.canvas);
    }

    getHintData() {
        return {
            top: CanvasUtils.getEdgeHint(this.canvas, 'top'),
            bottom: CanvasUtils.getEdgeHint(this.canvas, 'bottom')
        };
    }

    showHint(position, imageData) {
        const overlay = document.getElementById(`hint-overlay-${position}`);
        if (overlay && imageData) {
            overlay.style.backgroundImage = `url(${imageData})`;
            overlay.style.display = 'block';
        }
    }

    hideHints() {
        document.getElementById('hint-overlay-top').style.display = 'none';
        document.getElementById('hint-overlay-bottom').style.display = 'none';
    }

    /**
     * Draw hint image directly onto the canvas (editable by player)
     * This is the Gartic Phone approach - hint is part of the drawing
     * @param {string} position - 'top' or 'bottom'
     * @param {string} imageData - base64 image data
     * @param {boolean} asInitialState - if true, reset history so this becomes the starting point
     */
    async drawHintOnCanvas(position, imageData, asInitialState = true) {
        if (!imageData) return;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const hintHeight = Math.floor(this.canvas.height * 0.1); // 10% = 40px

                if (position === 'top') {
                    // Draw at the top of the canvas
                    this.ctx.drawImage(img, 0, 0, this.canvas.width, hintHeight);
                } else if (position === 'bottom') {
                    // Draw at the bottom of the canvas
                    const y = this.canvas.height - hintHeight;
                    this.ctx.drawImage(img, 0, y, this.canvas.width, hintHeight);
                }

                if (asInitialState) {
                    // Reset history so hint becomes the starting point
                    // This way, undo won't remove the hint
                    this.history = [];
                    this.historyIndex = -1;
                }
                this.saveState();
                resolve();
            };
            img.onerror = reject;
            img.src = imageData;
        });
    }

    /**
     * Clear canvas but preserve hint at specified position
     * Useful for clearing player's drawing while keeping hint visible
     */
    clearKeepingHint() {
        // Just do a normal clear - the hint will be redrawn when needed
        this.clear();
    }
}

// Make available globally
window.DrawingCanvas = DrawingCanvas;
