require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

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

// Start server
app.listen(PORT, () => {
    console.log(`[Server] AI Diagnostic Studio backend running on port ${PORT}`);
    connectDB();
});

module.exports = app;
