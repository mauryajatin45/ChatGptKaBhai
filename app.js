const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const ejsMate = require("ejs-mate");
const LocalStrategy = require("passport-local").Strategy;
const methodOverride = require('method-override');
const { createProxyMiddleware } = require('http-proxy-middleware');  // Import proxy middleware
require('dotenv').config(); 

// Import routes
const authRoute = require('./routes/authRoute');
const homeRoute = require('./routes/homeRoute');

// Import User model
const User = require('./models/User');

// Passport config (custom strategy file if using, otherwise configured below)
require('./config/passport')(passport);

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB BhaiChat database
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB BhaiChat database'))
    .catch((err) => console.log('❌ MongoDB Connection Error:', err));

// Session configuration using connect-mongo
const sessionpOptions = {
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
    }),
    secret: process.env.SESSION_SECRET || 'mysupersecretcode',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

// View engine & public assets
app.engine("ejs", ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Body parser and method override
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Sessions and flash BEFORE passport
app.use(session(sessionpOptions));
app.use(flash());

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Passport LocalStrategy
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return done(null, false, { message: 'No user found' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Flash messages globally available in templates
app.use((req, res, next) => {
    res.locals.success_message = req.flash('success');
    res.locals.error_message = req.flash('error');
    res.locals.currentUser = req.user || null;
    next();
});

// Proxy route for "/project/bhaichat"
app.use('/project/bhaichat', createProxyMiddleware({
    target: 'https://bhaichat.vercel.app/login',  // The target URL to proxy to
    changeOrigin: true,  // Changes the origin of the request to the target URL
    pathRewrite: {
        '^/project/bhaichat': '',  // Rewriting the path if needed
    },
    onProxyRes: (proxyRes, req, res) => {
        // Optionally you can modify response headers here if necessary
        proxyRes.headers['X-Forwarded-For'] = req.connection.remoteAddress;
    }
}));

// Routes
app.use(authRoute);
app.use(homeRoute);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404');
});

// Conditional Server Start or Export
// For local development, start the server normally.
// For deployment on platforms like Vercel, export the app.
if (require.main === module) {
    app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
    });
} else {
    module.exports = app;
}
