const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { model } = require('mongoose');
const router = express.Router();

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next();  // Continue if authenticated
  }
  res.redirect('/login');  // Redirect to login if not authenticated
}

router.get('/', isAuthenticated, (req, res)=>{
    res.render("home.ejs", {user:req.user})
  })

module.exports = router