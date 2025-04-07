const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');

// Import routes and passport strategy
const authRoutes = require('./routes/authRoutes');
const User = require('./models/User');
require('./config/passport')(passport); // Passport config

// Initialize the app
const app = express();
const port = 3000;

// MongoDB Atlas connection
mongoose.connect('mongodb+srv://jatin:jatin@authentication.mske3zp.mongodb.net/?retryWrites=true&w=majority&appName=Authentication', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.log(err));

// Middleware
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Flash messages
app.use(flash());

// Passport session setup
app.use(session({
    secret: 'your_session_secret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Global variables for flash messages
app.use((req, res, next) => {
    res.locals.success_message = req.flash('success');
    res.locals.error_message = req.flash('error');
    next();
});

// Use authentication routes
app.use(authRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
