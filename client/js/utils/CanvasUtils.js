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
     * Combine three body part images vertically with overlap
     * The hint areas (10% of each drawing) overlap to create seamless transitions
     */
    async combineDrawings(headData, torsoData, legsData, targetCanvas) {
        const ctx = targetCanvas.getContext('2d');

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

        try {
            // Each source drawing is 800x400 (2:1 ratio)
            // We need to fit 3 drawings with overlap
            // Hint overlap is 10% of drawing height (40px)
            const sourceWidth = 800;
            const sourceHeight = 400;
            const overlapAmount = sourceHeight * 0.1; // 40px overlap

            // Calculate drawing positions with overlap
            // Total height = 3 * 400 - 2 * 40 = 1120px (fits in 1200px canvas)
            const scaleFactor = targetCanvas.width / sourceWidth;
            const scaledPartHeight = sourceHeight * scaleFactor;
            const scaledOverlap = overlapAmount * scaleFactor;

            // Position 1: Head at top
            let currentY = 0;
            if (headData) {
                const headImg = await this.loadImage(headData);
                ctx.drawImage(headImg, 0, currentY, targetCanvas.width, scaledPartHeight);
            }

            // Position 2: Torso overlapping with head's bottom hint
            currentY = scaledPartHeight - scaledOverlap;
            if (torsoData) {
                const torsoImg = await this.loadImage(torsoData);
                ctx.drawImage(torsoImg, 0, currentY, targetCanvas.width, scaledPartHeight);
            }

            // Position 3: Legs overlapping with torso's bottom hint
            currentY = (scaledPartHeight - scaledOverlap) * 2;
            if (legsData) {
                const legsImg = await this.loadImage(legsData);
                ctx.drawImage(legsImg, 0, currentY, targetCanvas.width, scaledPartHeight);
            }

            // No dividing lines - seamless connection!

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
