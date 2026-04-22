const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Gallery Service - Save and retrieve completed fursonas
 * Uses file system for simplicity (can be upgraded to database)
 */
class GalleryService {
    constructor() {
        this.galleryDir = path.join(__dirname, '../../gallery');
        this.metadataFile = path.join(this.galleryDir, 'metadata.json');
        this.metadata = [];
        this.init();
    }

    async init() {
        try {
            // Create gallery directory if it doesn't exist
            await fs.mkdir(this.galleryDir, { recursive: true });

            // Load existing metadata
            try {
                const data = await fs.readFile(this.metadataFile, 'utf8');
                this.metadata = JSON.parse(data);
            } catch {
                // No metadata file yet
                this.metadata = [];
            }
        } catch (error) {
            console.error('Gallery init error:', error);
        }
    }

    async saveMetadata() {
        await fs.writeFile(this.metadataFile, JSON.stringify(this.metadata, null, 2));
    }

    /**
     * Save a fursona to the gallery
     */
    async saveFursona(rawImageData, aiImageData, lobbyCode) {
        const id = uuidv4();
        const timestamp = Date.now();

        const entry = {
            id,
            lobbyCode,
            createdAt: timestamp,
            hasAI: !!aiImageData,
            isPublic: true,
            viewCount: 0
        };

        // Save raw image
        const rawFilename = `${id}_raw.png`;
        const rawBase64 = rawImageData.replace(/^data:image\/\w+;base64,/, '');
        await fs.writeFile(
            path.join(this.galleryDir, rawFilename),
            Buffer.from(rawBase64, 'base64')
        );
        entry.rawImage = rawFilename;

        // Save AI image if available
        if (aiImageData) {
            const aiFilename = `${id}_ai.png`;
            const aiBase64 = aiImageData.replace(/^data:image\/\w+;base64,/, '');
            await fs.writeFile(
                path.join(this.galleryDir, aiFilename),
                Buffer.from(aiBase64, 'base64')
            );
            entry.aiImage = aiFilename;
        }

        // Add to metadata
        this.metadata.unshift(entry);
        await this.saveMetadata();

        return entry;
    }

    /**
     * Get paginated gallery items
     */
    async getGallery(page = 1, limit = 12, publicOnly = true) {
        let items = publicOnly
            ? this.metadata.filter(item => item.isPublic)
            : this.metadata;

        const total = items.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        items = items.slice(offset, offset + limit);

        // Add URLs to items
        items = items.map(item => ({
            ...item,
            rawImageUrl: `/gallery/${item.rawImage}`,
            aiImageUrl: item.aiImage ? `/gallery/${item.aiImage}` : null
        }));

        return {
            items,
            page,
            limit,
            total,
            totalPages
        };
    }

    /**
     * Get a specific fursona
     */
    async getFursona(id) {
        const entry = this.metadata.find(item => item.id === id);
        if (!entry) return null;

        // Increment view count
        entry.viewCount++;
        await this.saveMetadata();

        return {
            ...entry,
            rawImageUrl: `/gallery/${entry.rawImage}`,
            aiImageUrl: entry.aiImage ? `/gallery/${entry.aiImage}` : null
        };
    }

    /**
     * Toggle public visibility
     */
    async setPublic(id, isPublic) {
        const entry = this.metadata.find(item => item.id === id);
        if (entry) {
            entry.isPublic = isPublic;
            await this.saveMetadata();
            return true;
        }
        return false;
    }

    /**
     * Delete a fursona
     */
    async deleteFursona(id) {
        const index = this.metadata.findIndex(item => item.id === id);
        if (index === -1) return false;

        const entry = this.metadata[index];

        // Delete files
        try {
            await fs.unlink(path.join(this.galleryDir, entry.rawImage));
            if (entry.aiImage) {
                await fs.unlink(path.join(this.galleryDir, entry.aiImage));
            }
        } catch (error) {
            console.error('Error deleting files:', error);
        }

        // Remove from metadata
        this.metadata.splice(index, 1);
        await this.saveMetadata();

        return true;
    }
}

module.exports = GalleryService;
