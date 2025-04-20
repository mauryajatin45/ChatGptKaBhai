const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    // generatedOtp: {
    //     type: String
    // },
    password: {
        type: String,
        required: true
    },
    chatSessions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatSession'
    }],
    lastActive: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Password comparison method
userSchema.methods.comparePassword = async function (password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (err) {
        return false;
    }
};

// Update last active timestamp
userSchema.statics.updateActivity = async function(userId) {
    await this.findByIdAndUpdate(userId, { lastActive: Date.now() });
};

module.exports = mongoose.model('User', userSchema);