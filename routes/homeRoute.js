const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { model } = require('mongoose');
const router = express.Router();

router.get('/', (req, res)=>{
    res.render("home.ejs", {user:req.user})
  })

module.exports = router