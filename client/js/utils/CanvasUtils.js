/**
 * Canvas utility functions
 */
const CanvasUtils = {
    /**
     * Get base64 PNG data from canvas
     */
    getCanvasData(canvas) {
        return canvas.toDataURL('image/png');
    },

    /**
     * Extract edge hint data (top or bottom 10% of canvas)
     */
    getEdgeHint(canvas, position) {
        const ctx = canvas.getContext('2d');
        const hintHeight = Math.floor(canvas.height * 0.1);

        let y = 0;
        if (position === 'bottom') {
            y = canvas.height - hintHeight;
        }

        const imageData = ctx.getImageData(0, y, canvas.width, hintHeight);

        // Create temporary canvas for hint
        const hintCanvas = document.createElement('canvas');
        hintCanvas.width = canvas.width;
        hintCanvas.height = hintHeight;
        const hintCtx = hintCanvas.getContext('2d');
        hintCtx.putImageData(imageData, 0, 0);

        return hintCanvas.toDataURL('image/png');
    },

    /**
     * Load image from base64 data
     */
    loadImage(base64Data) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = base64Data;
        });
    },

    /**
     * Combine three body part images vertically
     */
    async combineDrawings(headData, torsoData, legsData, targetCanvas) {
        const ctx = targetCanvas.getContext('2d');
        const partHeight = targetCanvas.height / 3;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

        try {
            if (headData) {
                const headImg = await this.loadImage(headData);
                ctx.drawImage(headImg, 0, 0, targetCanvas.width, partHeight);
            }

            if (torsoData) {
                const torsoImg = await this.loadImage(torsoData);
                ctx.drawImage(torsoImg, 0, partHeight, targetCanvas.width, partHeight);
            }

            if (legsData) {
                const legsImg = await this.loadImage(legsData);
                ctx.drawImage(legsImg, 0, partHeight * 2, targetCanvas.width, partHeight);
            }

            // Draw dividing lines
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);

            ctx.beginPath();
            ctx.moveTo(0, partHeight);
            ctx.lineTo(targetCanvas.width, partHeight);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, partHeight * 2);
            ctx.lineTo(targetCanvas.width, partHeight * 2);
            ctx.stroke();

        } catch (error) {
            console.error('Error combining drawings:', error);
        }
    },

    /**
     * Download canvas as PNG
     */
    downloadCanvas(canvas, filename = 'fursona.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    },

    /**
     * Flood fill algorithm
     */
    floodFill(canvas, startX, startY, fillColor) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const startPos = (startY * canvas.width + startX) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];
        const startA = data[startPos + 3];

        // Parse fill color
        const fillRGB = this.hexToRgb(fillColor);
        if (!fillRGB) return;

        // Don't fill if same color
        if (startR === fillRGB.r && startG === fillRGB.g && startB === fillRGB.b) {
            return;
        }

        const stack = [[startX, startY]];
        const visited = new Set();

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

            const pos = (y * canvas.width + x) * 4;

            // Check if pixel matches start color (with tolerance)
            if (!this.colorMatch(data, pos, startR, startG, startB, startA)) continue;

            visited.add(key);

            // Fill pixel
            data[pos] = fillRGB.r;
            data[pos + 1] = fillRGB.g;
            data[pos + 2] = fillRGB.b;
            data[pos + 3] = 255;

            // Add neighbors
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }

        ctx.putImageData(imageData, 0, 0);
    },

    colorMatch(data, pos, r, g, b, a, tolerance = 30) {
        return Math.abs(data[pos] - r) <= tolerance &&
               Math.abs(data[pos + 1] - g) <= tolerance &&
               Math.abs(data[pos + 2] - b) <= tolerance &&
               Math.abs(data[pos + 3] - a) <= tolerance;
    },

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
};

// Make available globally
window.CanvasUtils = CanvasUtils;
