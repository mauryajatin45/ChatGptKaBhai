const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        default: 'New Chat'
    },
    messages: [{
        content: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    modelUsed: {
        type: String,
        default: 'default-model'
    },
    context: {
        type: Map,
        of: String
    }
}, { timestamps: true });

// Indexes for optimized queries
chatSessionSchema.index({ user: 1, createdAt: -1 });
chatSessionSchema.index({ 'messages.timestamp': 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);