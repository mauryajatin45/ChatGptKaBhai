const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const flash = require('connect-flash');
const path = require('path');
const ejsMate = require("ejs-mate");
const LocalStrategy = require("passport-local").Strategy; // Ensure LocalStrategy is used from passport-local
const methodOverride = require('method-override');

// Import routes and passport strategy
const authRoutes = require('./routes/authRoutes');
const User = require('./models/User'); // Import your User model
require('./config/passport')(passport); // Passport config

// Initialize the app
const app = express();
const port = 3000;

// MongoDB Atlas connection
mongoose.connect('mongodb+srv://jatin:jatin@authentication.mske3zp.mongodb.net/?retryWrites=true&w=majority&appName=Authentication')
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.log('MongoDB Connection Error: ', err));

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Specify views directory if needed
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: false }));
app.engine("ejs", ejsMate);

// Flash messages middleware
app.use(flash());

// Session options using MongoStore
const sessionpOptions = {
  store: MongoStore.create({ 
    mongoUrl: 'mongodb+srv://jatin:jatin@authentication.mske3zp.mongodb.net/?retryWrites=true&w=majority&appName=Authentication' 
  }),
  secret: "mysupersecretcode", // Change this to something more secure in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
  },
};

// Session middleware should come before Passport
app.use(session(sessionpOptions));

// Passport session initialization
app.use(passport.initialize());  // Passport initialization (sets up passport)
app.use(passport.session());  // Passport session (handles the user session)

// Passport LocalStrategy configuration
passport.use(new LocalStrategy({
  usernameField: 'username', // Specify the username field (default is 'username')
  passwordField: 'password'  // Specify the password field (default is 'password')
}, async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return done(null, false, { message: 'No user found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return done(null, false, { message: 'Incorrect password' });
    }

    return done(null, user);  // User is authenticated
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

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_message = req.flash('success');
  res.locals.error_message = req.flash('error');
  next();
});

// Use authentication routes
app.use(authRoutes);

// Handle any 404 errors
app.use((req, res, next) => {
  res.status(404).render('404.ejs');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
