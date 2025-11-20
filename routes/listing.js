const express = require("express");
const router = express.Router();
const multer = require("multer");
const ExpressError = require("../utils/ExpressError");
const wrapAsyc = require("../utils/wrapAsyc");
const { listingSchema } = require("../schema");
const {isLoggedIn, isOwner} = require("../middleware")

const listingController = require('../controllers/listings');
const { storage } = require("../cloudConfig");
const upload = multer({ storage });

const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    throw new ExpressError(
      error.details.map((el) => el.message).join(","),
      400
    );
  } else {
    next();
  }
};


router.route("/")
.get(wrapAsyc(listingController.index))
.post(isLoggedIn, upload.single("listing[image]"), validateListing, wrapAsyc(listingController.createListing));



//new route
router.get('/new',isLoggedIn, listingController.renderNewForm);

router.route("/:id")
.get(wrapAsyc(listingController.showListing))
.put(isLoggedIn, isOwner, upload.single("listing[image]"), validateListing, wrapAsyc(listingController.updateListing))
.delete(isLoggedIn, isOwner, wrapAsyc(listingController.destroyListing));

//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsyc(listingController.renderEditForm));









// //Show Route
// router.get("/:id", wrapAsyc(listingController.showListing));

// //Create Route
// router.post("/",isLoggedIn, upload.single("listing[image]"), validateListing, wrapAsyc(listingController.createListing));

//Edit Route
// router.get("/:id/edit", isLoggedIn, isOwner, wrapAsyc(listingController.renderEditForm));

// //Update Route
// router.put("/:id", isLoggedIn, isOwner, upload.single("listing[image]"), validateListing, wrapAsyc(listingController.updateListing));

// //Delete Route
// router.delete("/:id", isLoggedIn, isOwner, wrapAsyc(listingController.destroyListing));

module.exports = router;
