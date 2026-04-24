/**
 * Temporary Image Storage Service
 * Stores base64 images temporarily and serves them via HTTP for external APIs
 */
const { v4: uuidv4 } = require('uuid');

class TempImageStore {
    constructor() {
        // In-memory storage: id -> { data, mimeType, createdAt }
        this.images = new Map();
        // Auto-cleanup interval (every 5 minutes)
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
        // Image TTL (10 minutes)
        this.ttl = 10 * 60 * 1000;
    }

    /**
     * Store a base64 image and return its ID
     * @param {string} base64Data - Base64 encoded image (with or without data URL prefix)
     * @returns {string} Image ID
     */
    store(base64Data) {
        const id = uuidv4();

        let data = base64Data;
        let mimeType = 'image/png';

        // Parse data URL if present
        if (base64Data.startsWith('data:')) {
            const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
            if (match) {
                mimeType = match[1];
                data = match[2];
            }
        }

        this.images.set(id, {
            data,
            mimeType,
            createdAt: Date.now()
        });

        return id;
    }

    /**
     * Get image data by ID
     * @param {string} id - Image ID
     * @returns {{ data: Buffer, mimeType: string } | null}
     */
    get(id) {
        const image = this.images.get(id);
        if (!image) return null;

        return {
            data: Buffer.from(image.data, 'base64'),
            mimeType: image.mimeType
        };
    }

    /**
     * Delete an image by ID
     * @param {string} id - Image ID
     */
    delete(id) {
        this.images.delete(id);
    }

    /**
     * Delete multiple images
     * @param {string[]} ids - Array of image IDs
     */
    deleteMany(ids) {
        ids.forEach(id => this.images.delete(id));
    }

    /**
     * Clean up expired images
     */
    cleanup() {
        const now = Date.now();
        for (const [id, image] of this.images) {
            if (now - image.createdAt > this.ttl) {
                this.images.delete(id);
            }
        }
    }

    /**
     * Shutdown cleanup
     */
    shutdown() {
        clearInterval(this.cleanupInterval);
        this.images.clear();
    }
}

// Singleton instance
const instance = new TempImageStore();

module.exports = instance;
