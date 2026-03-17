const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    file: { type: String, required: true },
    fullPath: { type: String },
    line: { type: Number, required: true },
    column: { type: Number, default: 1 },
    severity: { type: String, enum: ['error', 'warning', 'info'], required: true },
    message: { type: String, required: true },
    ruleId: { type: String },
    source: { type: String },
    resolved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Issue', issueSchema);
