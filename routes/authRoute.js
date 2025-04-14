const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const router = express.Router();

// Middleware to ensure user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();  // Continue if authenticated
    }
    res.redirect('/login');  // Redirect to login if not authenticated
}

// Signup route
router.get('/signup', (req, res) => {
    res.render('auth/signup.ejs');
});

router.post('/signup', async (req, res) => {
    let { username, email, password } = req.body;

    // Trim whitespace
    username = username?.trim();
    email = email?.trim();
    password = password?.trim();

    // Validate after trimming
    if (!username || !email || !password) {
        req.flash('error', 'Please fill in all fields.');
        return res.redirect('/signup');
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email already exists.');
            return res.redirect('/signup');
        }

        const newUser = new User({ email, username, password });
        await newUser.save();

        req.flash('success', 'You are now registered!');
        res.redirect('/login');
    } catch (err) {
        console.error(err); // Helpful for debugging!
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/signup');
    }
});


// Login route
router.get('/login', (req, res) => {
    res.render('auth/login.ejs');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

// Home route (only accessible if logged in)
// router.get('/', isAuthenticated, (req, res) => {
//     res.render('home.ejs', { user: req.user });
// });

// Logout route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
});

module.exports = router;
