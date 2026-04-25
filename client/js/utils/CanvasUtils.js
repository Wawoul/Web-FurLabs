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
     * Generate a blank white canvas data URL (for missing drawings)
     */
    getBlankCanvasDataUrl(width = 800, height = 400) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        return canvas.toDataURL('image/png');
    },

    /**
     * Combine three body part images vertically with overlap
     * The hint areas (10% of each drawing) overlap to create seamless transitions
     * Like Gartic Phone: bottom of head overlaps with top of torso, etc.
     */
    async combineDrawings(headData, torsoData, legsData, targetCanvas) {
        const ctx = targetCanvas.getContext('2d');

        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

        try {
            // Each source drawing is 800x400 (2:1 ratio)
            const sourceWidth = 800;
            const sourceHeight = 400;

            // Overlap amount: 10% of drawing height (40px at source size)
            // This is where the "hint" areas connect
            const overlapAmount = sourceHeight * 0.1;

            // Scale factor based on canvas width
            const scaleFactor = targetCanvas.width / sourceWidth;
            const scaledPartHeight = sourceHeight * scaleFactor;
            const scaledOverlap = overlapAmount * scaleFactor;

            // Total combined height with overlap: 3*400 - 2*40 = 1120px
            const totalHeight = (scaledPartHeight * 3) - (scaledOverlap * 2);

            // Center vertically in canvas (1200px canvas, 1120px content = 40px padding top/bottom)
            const startY = (targetCanvas.height - totalHeight) / 2;

            // Generate blank canvas for any missing parts
            const blankCanvas = this.getBlankCanvasDataUrl(sourceWidth, sourceHeight);

            // Position 1: Head at top (centered)
            let currentY = startY;
            const headImg = await this.loadImage(headData || blankCanvas);
            ctx.drawImage(headImg, 0, currentY, targetCanvas.width, scaledPartHeight);

            // Position 2: Torso - starts where head's hint area begins (40px overlap)
            // The top of torso covers the bottom 10% of head
            currentY = startY + scaledPartHeight - scaledOverlap;
            const torsoImg = await this.loadImage(torsoData || blankCanvas);
            ctx.drawImage(torsoImg, 0, currentY, targetCanvas.width, scaledPartHeight);

            // Position 3: Legs - starts where torso's hint area begins (40px overlap)
            // The top of legs covers the bottom 10% of torso
            currentY = startY + (scaledPartHeight - scaledOverlap) * 2;
            const legsImg = await this.loadImage(legsData || blankCanvas);
            ctx.drawImage(legsImg, 0, currentY, targetCanvas.width, scaledPartHeight);

            // Images now overlap by 10% (40px) creating seamless connections
            console.log('Combined drawings with overlap:', {
                scaledPartHeight,
                scaledOverlap,
                totalHeight,
                startY
            });

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
