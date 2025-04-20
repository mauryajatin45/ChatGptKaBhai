const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const router = express.Router();
const isAuthenticated = require('../utils/isAuthenticated.js');

// Home route with chat sessions
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userWithChats = await User.findById(req.user._id)
            .populate({
                path: 'chatSessions',
                select: 'title createdAt',
                options: { sort: { createdAt: -1 }, limit: 10 }
            });
            
        res.render("home.ejs", {
            user: userWithChats,
            chats: userWithChats.chatSessions
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Create new chat session
router.post('/chats', isAuthenticated, async (req, res) => {
    try {
        const newSession = await ChatSession.create({
            user: req.user._id,
            title: req.body.title || 'New Chat'
        });

        await User.findByIdAndUpdate(req.user._id, {
            $push: { chatSessions: newSession._id }
        });

        res.status(201).json({
            id: newSession._id,
            title: newSession.title
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
});

// Get chat history
router.get('/chats/:id', isAuthenticated, async (req, res) => {
    try {
        const session = await ChatSession.findOne({
            _id: req.params.id,
            user: req.user._id
        }).select('messages title createdAt');

        if (!session) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.json({
            title: session.title,
            createdAt: session.createdAt,
            messages: session.messages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Add message to chat
router.post('/chats/:id/messages', isAuthenticated, async (req, res) => {
    try {
        const { content, role } = req.body;
        
        if (!content || !['user', 'assistant'].includes(role)) {
            return res.status(400).json({ error: 'Invalid message data' });
        }

        const updatedSession = await ChatSession.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            {
                $push: {
                    messages: {
                        content,
                        role,
                        timestamp: new Date()
                    }
                }
            },
            { new: true, select: 'messages' }
        );

        if (!updatedSession) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Update user's last active time
        await User.updateUserActivity(req.user._id);

        res.json(updatedSession.messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add message' });
    }
});

// Delete chat session
router.delete('/chats/:id', isAuthenticated, async (req, res) => {
    try {
        const session = await ChatSession.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        // Remove reference from user
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { chatSessions: req.params.id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

// Update chat title
router.patch('/chats/:id/title', isAuthenticated, async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title required' });
        }

        const updatedSession = await ChatSession.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { title },
            { new: true, select: 'title' }
        );

        if (!updatedSession) {
            return res.status(404).json({ error: 'Chat not found' });
        }

        res.json({ title: updatedSession.title });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update title' });
    }
});

module.exports = router;