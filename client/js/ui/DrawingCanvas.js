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
            this.startStroke(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.continueStroke(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.endStroke());

        // Click for fill tool
        this.canvas.addEventListener('click', (e) => {
            if (this.currentTool === 'fill') {
                const rect = this.canvas.getBoundingClientRect();
                const x = Math.floor(e.clientX - rect.left);
                const y = Math.floor(e.clientY - rect.top);
                CanvasUtils.floodFill(this.canvas, x, y, this.currentColor);
                this.saveState();
            }
        });
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
        if (this.currentTool === 'fill') return;

        this.isDrawing = true;
        const pos = this.getPosition(e);
        this.lastX = pos.x;
        this.lastY = pos.y;

        // Draw a dot for single clicks
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, this.brushSize / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = this.currentTool === 'eraser' ? 'white' : this.currentColor;
        this.ctx.fill();
    }

    continueStroke(e) {
        if (!this.isDrawing) return;

        const pos = this.getPosition(e);

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
        this.currentTool = tool;
        this.canvas.style.cursor = tool === 'fill' ? 'crosshair' : 'crosshair';
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
}

// Make available globally
window.DrawingCanvas = DrawingCanvas;
