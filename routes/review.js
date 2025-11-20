const express = require("express");
const router = express.Router({ mergeParams: true }); //Now this will accepts reviews for specific listing , for parent call back use mergeParams
const ExpressError = require("../utils/ExpressError");
const Listing = require("../models/listing");
const wrapAsyc = require("../utils/wrapAsyc");
const { reviewSchema } = require("../schema");
const Review = require("../models/review");
const {isLoggedIn, isReviewAuthor} = require("../middleware");
const reviewController = require('../controllers/reviews');

const validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    throw new ExpressError(
      error.details.map((el) => el.message).join(","),
      400
    );
  } else {
    next();
  }
};

//POST  Route and wrapAsync basic error handling
router.post("/", isLoggedIn, validateReview, wrapAsyc(reviewController.createReview));

//Delete Review Route

router.delete("/:reviewId", isLoggedIn, isReviewAuthor, wrapAsyc(reviewController.destroyReview));

module.exports = router;
