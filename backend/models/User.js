const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    settings: {
        aiProvider: { type: String, default: 'openai' },
        theme: { type: String, default: 'dark' },
        fontSize: { type: Number, default: 14 }
    }
});

module.exports = mongoose.model('User', userSchema);
