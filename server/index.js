require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const SocketHandler = require('./network/SocketHandler');
const LobbyManager = require('./game/LobbyManager');
const GalleryService = require('./services/GalleryService');
const TempImageStore = require('./services/TempImageStore');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files from client folder
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.json({ limit: '10mb' })); // For canvas data

// Serve gallery images
app.use('/gallery', express.static(path.join(__dirname, '../gallery')));

// Create service instances
const lobbyManager = new LobbyManager();
const galleryService = new GalleryService();

// Initialize socket handler
const socketHandler = new SocketHandler(io, lobbyManager);
socketHandler.initialize();

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', lobbies: lobbyManager.getActiveCount() });
});

app.get('/api/lobby/:code', (req, res) => {
    const lobby = lobbyManager.getLobby(req.params.code.toUpperCase());
    if (lobby) {
        res.json({
            exists: true,
            playerCount: lobby.getPlayerCount(),
            state: lobby.state
        });
    } else {
        res.json({ exists: false });
    }
});

// Gallery API
app.get('/api/gallery', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const result = await galleryService.getGallery(page, limit);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load gallery' });
    }
});

app.get('/api/gallery/:id', async (req, res) => {
    try {
        const fursona = await galleryService.getFursona(req.params.id);
        if (fursona) {
            res.json(fursona);
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to load fursona' });
    }
});

app.post('/api/gallery', async (req, res) => {
    try {
        const { rawImage, aiImage, lobbyCode } = req.body;
        const entry = await galleryService.saveFursona(rawImage, aiImage, lobbyCode);
        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save fursona' });
    }
});

// Temporary image endpoint for AI services
app.get('/api/temp-image/:id', (req, res) => {
    const image = TempImageStore.get(req.params.id);
    if (image) {
        res.set('Content-Type', image.mimeType);
        res.send(image.data);
    } else {
        res.status(404).send('Image not found');
    }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Fur-Labs server running on http://localhost:${PORT}`);
});
