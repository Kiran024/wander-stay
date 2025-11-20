const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('../models/user');
const wrapAsyc = require('../utils/wrapAsyc');
const passport = require('passport');
const { savedRedirectUrl }= require('../middleware');
const userController = require('../controllers/users');



router.route("/signup")
.get(userController.renderSignUpForm)
.post(wrapAsyc(userController.signup));


router.route("/login")
.get(userController.renderLoginForm)
.post(savedRedirectUrl,passport.authenticate("local", {failureRedirect: '/login', 
failureFlash:true,
}),
userController.login);




// //async function is used to validate the user exists in mongodb server 
// router.post("/login", savedRedirectUrl,passport.authenticate("local", {failureRedirect: '/login', 
// failureFlash:true,
// }),
// userController.login);

router.get("/logout",userController.logout);

module.exports = router;
