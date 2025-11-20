const User = require('../models/user');




module.exports.renderSignUpForm = (req,res) => {
  res.render("users/signup.ejs");
};
module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    if (!username || !email || !password) {
      req.flash("error", "Username, email, and password are required.");
      return res.redirect("/signup");
    }
    const newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    return req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Wanderlust!");
      return res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    return res.redirect("/signup");
  }
};


module.exports.renderLoginForm = (req,res) => {
  res.render("users/login.ejs");
};

module.exports.login = async(req,res) => {
  req.flash("success","Welcome back to Wanderlust! You are logged in!");
  let redirectUrl = res.locals.redirectUrl || "/listings"; // even in listings page , after login we are getting into listings page itself 
  res.redirect(redirectUrl);
};

module.exports.logout  = (req,res) => {
  req.logout((err) => {
    if(err) {
      return next(err);
    }
    req.flash("success","You are logged out now!");
    res.redirect("/listings");
  })
};