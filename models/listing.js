const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');
const { ref } = require('joi');
 //Mongo db database schema 

const ListingSchema = new Schema({
  title : {
    type: String,
    required: true
  },
  description :String,
  image : {
    filename: String,
    url: String,
  },
  price: Number,
  location: String,
  country: String,
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: 'Review'
  }],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  coordinate: {
    type: [Number],
    required: true,
  },
  supabaseId: {
    type: String,
  },
  // category: {
  //   type:String,
  //   enum:["mountains","arctic","farms","deserts"]
  // }

});

ListingSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await mongoose.model('Review').deleteMany({
      _id: { $in: doc.reviews }
    });
  }
});

const Listing = mongoose.model("Listing", ListingSchema);

module.exports = Listing;

