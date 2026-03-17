const mongoose = require('mongoose');

const aiRecommendationSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    filePath: { type: String },
    prompt: { type: String },
    explanation: { type: String },
    fixedCode: { type: String },
    applied: { type: Boolean, default: false },
    provider: { type: String, enum: ['openai', 'gemini'] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIRecommendation', aiRecommendationSchema);
