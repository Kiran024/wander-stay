 const Listing = require('../models/listing')
 const { cloudinary } = require('../cloudConfig');
 const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
 const ExpressError = require('../utils/ExpressError');
 const supabase = require('../supabaseClient');
 const mapToken = process.env.MAP_TOKEN;
 const geocodingClient = mbxGeocoding({ accessToken: mapToken });
 const SUPABASE_LISTINGS_TABLE = process.env.SUPABASE_LISTINGS_TABLE || "listings";
 
 const buildSupabasePayload = (listing) => ({
   title: listing.title,
   description: listing.description,
   price: listing.price,
   location: listing.location,
   country: listing.country,
   owner_id: listing.owner?.toString() || null,
   image_url: listing.image?.url || listing.image || null,
   coordinate: listing.coordinate || null,
 });
 
 const syncListingToSupabase = async (listing) => {
   if (!listing) return;
   const payload = buildSupabasePayload(listing);
   try {
     if (listing.supabaseId) {
       const { error } = await supabase
         .from(SUPABASE_LISTINGS_TABLE)
         .update(payload)
         .eq("id", listing.supabaseId);
       if (error) {
         console.error("Supabase update failed:", error);
       }
       return;
     }
    const { data, error } = await supabase
      .from(SUPABASE_LISTINGS_TABLE)
      .insert(payload)
      .select()
      .single();
     if (error) {
       console.error("Supabase insert failed:", error);
       return;
     }
     if (data?.id) {
       listing.supabaseId = data.id.toString();
       await listing.save();
     }
   } catch (err) {
     console.error("Supabase sync threw:", err);
   }
 };
 
 const removeListingFromSupabase = async (listing) => {
   if (!listing) return;
   const supabaseId = listing.supabaseId;
   try {
     let query = supabase.from(SUPABASE_LISTINGS_TABLE).delete();
     if (supabaseId) {
       query = query.eq("id", supabaseId);
     } else if (listing._id) {
       query = query.eq("title", listing.title).eq("location", listing.location);
     }
     const { error } = await query;
     if (error) {
       console.error("Supabase delete failed:", error);
     }
   } catch (err) {
     console.error("Supabase delete threw:", err);
   }
 };
 
 const adaptSupabaseListing = (row) => {
   if (!row) return null;
   return {
     _id: row.mongo_id || row.id,
     title: row.title,
     description: row.description,
     price: row.price,
     location: row.location,
     country: row.country,
     image: row.image_url ? { url: row.image_url } : row.image_url,
     coordinate: row.coordinate,
   };
 };
 
 module.exports.index = async (req, res) => {
   try {
     const { data, error } = await supabase
       .from(SUPABASE_LISTINGS_TABLE)
       .select("*");
     if (error) {
       throw error;
     }
     if (data && data.length) {
       const supabaseListings = data.map(adaptSupabaseListing).filter(Boolean);
       return res.render("listings/index.ejs", { allListings: supabaseListings });
     }
   } catch (err) {
     console.error("Unable to fetch listings from Supabase:", err.message);
   }
   const allListings = await Listing.find({});
   res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req,res) => { //isLoggedIn is middleware
  // console.log(req.user);
  
   res.render("listings/new.ejs")
};

module.exports.showListing =  async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate({path: 'reviews', populate: {path: 'author'},
  }).populate('owner')
  if(!listing) {
      req.flash("success", "Listing you requested for does not exist! ");
      return res.redirect("/listings");
  }
  console.log(listing);
  res.render("listings/show.ejs", { listing });
};


module.exports.createListing = async (req, res, next) => {
 let response = await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1,
})
  .send();

  const geoData = response.body?.features?.[0];
  if (!geoData) {
    throw new ExpressError("Location not found. Try another search.", 400);
  }
  
  const newListing = new Listing(req.body.listing);
  // console.log(req.user);
  newListing.owner = req.user._id; // resoving the error , created by new listing along with username  
  newListing.coordinate = geoData.geometry.coordinates;
  if (req.file) {
    newListing.image = {
      filename: req.file.filename,
      url: req.file.path,
    };
  }
  await newListing.save();
  await syncListingToSupabase(newListing);
  req.flash("success", "Success, new listing created");
  res.redirect(`/listings/${newListing._id}`);
}

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
};


module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }

  listing.set(req.body.listing || {});

  if (req.body.listing?.location) {
    let geoResponse = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
      .send();
    const geoData = geoResponse.body?.features?.[0];
    if (!geoData) {
      throw new ExpressError("Location not found. Try another search.", 400);
    }
    listing.coordinate = geoData.geometry.coordinates;
  }
  if (req.file) {
    if (listing.image && listing.image.filename) {
      await cloudinary.uploader.destroy(listing.image.filename);
    }
    listing.image = {
      filename: req.file.filename,
      url: req.file.path,
    };
  }
  await listing.save();
  await syncListingToSupabase(listing);
  req.flash("success", "Listing updated");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  if (deletedListing?.image?.filename) {
    await cloudinary.uploader.destroy(deletedListing.image.filename);
  }
  if (deletedListing) {
    await removeListingFromSupabase(deletedListing);
  }
  req.flash("success", "Listing deleted");
  res.redirect("/listings");
};
