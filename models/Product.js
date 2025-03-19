const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  brand: { type: String, required: true },
  title: { type: String, required: true },
  info: { type: String },
  category: { type: String, required: true },
  type: { type: String },
  connectivity: { type: String },
  finalPrice: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  rating: { type: Number, default: 0 }, // Average rating
  numReviews: { type: Number, default: 0 }, // Number of reviews
  imageUrls: [{ type: String }], // Supports multiple images
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
