require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const fileRoutes = require('./routes/fileRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const aiRoutes = require('./routes/aiRoutes');
const projectRoutes = require('./routes/projectRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api', fileRoutes);
app.use('/api', analysisRoutes);
app.use('/api', aiRoutes);
app.use('/api', projectRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MongoDB connection (optional - app works without it)
const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI || mongoURI === 'mongodb://localhost:27017/ai-diagnostic-studio') {
        console.log('[DB] MongoDB URI not configured or using default. DB features optional.');
        return;
    }
    try {
        await mongoose.connect(mongoURI);
        console.log('[DB] Connected to MongoDB');
    } catch (err) {
        console.warn('[DB] MongoDB connection failed (app will work without DB):', err.message);
    }
};

// Create HTTP Server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);
    
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.roomId = roomId;
        console.log(`[Socket] User ${socket.id} joined room: ${roomId}`);
        socket.to(roomId).emit('user-joined', { userId: socket.id });
    });

    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        socket.to(roomId).emit('user-left', { userId: socket.id });
        socket.roomId = null;
    });

    socket.on('code-update', ({ roomId, code, fileId }) => {
        socket.to(roomId).emit('code-update', { code, fileId, userId: socket.id });
    });

    socket.on('chat-message', ({ roomId, message, type='text', screenshot=null }) => {
        io.to(roomId).emit('chat-message', {
            id: Date.now() + Math.random().toString(),
            userId: socket.id,
            message,
            type,
            screenshot,
            timestamp: new Date().toISOString()
        });
    });

    socket.on('typing', ({ roomId, isTyping }) => {
        socket.to(roomId).emit('typing', { userId: socket.id, isTyping });
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] User disconnected: ${socket.id}`);
        if (socket.roomId) {
            io.to(socket.roomId).emit('user-left', { userId: socket.id });
        }
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`[Server] AI Diagnostic Studio backend running on port ${PORT}`);
    connectDB();
});

module.exports = { app, server, io };
