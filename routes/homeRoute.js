const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { model } = require('mongoose');
const router = express.Router();
const isAuthenticated = require('../utils/isAuthenticated.js'); 

router.get('/', isAuthenticated, (req, res)=>{
    res.render("home.ejs", {user:req.user})
  })

module.exports = router