if(process.env.MODE_ENV != "production"){
require('dotenv').config();   
}


// console.log(process.env.SECRET); //for accessing the .env crediantials
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Listing = require('./models/listing');
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require('./utils/ExpressError');
const wrapAsyc = require('./utils/wrapAsyc');
const {listingSchema, reviewSchema} = require('./schema');
const Review = require('./models/review');
const session = require('express-session');
const flash = require('connect-flash');
const listingsRouter = require('./routes/listing');
const reviewsRouter = require('./routes/review');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const userRouter = require('./routes/user');



  // Server and Database setup
  // MongoDB connection URL
  // connecting all request to routes/listing.js and routes/review.js
  // Middleware for parsing request bodies and method override
  // Setting up EJS as the templating engine
  // Session and flash message configuration
  // Serving static files and uploaded images
  // Using the imported routes
  // Multer setup for file uploads
  // Route handlers for listings and reviews
  // Error handling middleware
  // Starting the server
  
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";


app.get("/", (req, res) => {
         res.send("Hi, i am root");
});



main().then(() => {
    console.log("Connected to MongoDB");
}). 
catch(err => console.log(err));
async function main() {
  await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
const sessionOptions = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, //cross scripting attach
  },
};

app.use(session(sessionOptions));
app.use(flash());

//passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(express.static(path.join(__dirname, "models/public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use((req,res,next) => {
  res.locals.success = req.flash("success");
  res.locals.failure = req.flash("failure");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;  // for sign , logout purpose in navbar.ejs , includes 
  next();
});


// app.get('/demouser', async(req, res) => {
// let fakeUser = new User({
//   email: "student@gmail.com",
//   username: "delta-student",
// });
// let registeredUser = await User.register(fakeUser, "hello world");
// res.send(registeredUser);
// })
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/" ,userRouter);





// Test Route to create a sample listing

// app.get("/testListing", async (req, res) => {
//     let sampleListing = new Listing({
//         title: "Sample Listing",
//         description: "This is a sample listing description.",
//         image: "",
//         price: 100,
//         location: "Sample Location",
//         country: "Sample Country"
//     });
//     await sampleListing.save();
//     console.log("Sample listing saved:", sampleListing);
//     res.send( "succsessfully tested")
// });

app.use((req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  // let {statusCode, message} = err;
  // res.status(statusCode || 500).send(message || "Something went wrong");
  res.render("error.ejs", { err });
  });

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});



