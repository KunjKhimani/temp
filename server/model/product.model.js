// models/product.model.js
const mongoose = require("mongoose");

// ProductVariationSchema (Can be removed if not planning to use variations soon,
// or kept if you might add them later for other product types)
// const ProductVariationSchema = new mongoose.Schema({ ... });

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      maxlength: [150, "Product name cannot exceed 150 characters."],
    },
    description: {
      type: String,
      required: [true, "Product description is required."],
      maxlength: [2000, "Product description cannot exceed 2000 characters."],
    },
    price: {
      // This will now be the price PER THE CHOSEN UNIT
      type: Number,
      required: [true, "Product price is required."],
      min: [0, "Price cannot be negative."],
    },
    priceUnit: {
      // e.g., "per item", "per kg", "per lb", "per piece"
      type: String,
      required: [true, "Price unit (e.g., per item, per kg) is required."],
      enum: ["item", "kg", "lb", "g", "oz", "piece", "pack", "set", "other"], // Extend as needed
      default: "item",
    },
    // Optional: if priceUnit is weight-based, you might want a standard unit for comparison or calculation
    // unitWeight: { // The weight of one "item" if priceUnit is "item" but sold by weight elsewhere
    //   value: Number,
    //   unit: { type: String, enum: ["g", "kg", "lb", "oz"] }
    // },
    category: {
      type: String,
      required: [true, "Product category is required."],
    },
    subcategory: {
      type: String,
      required: false, // Subcategory is not required
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required."],
      min: [0, "Stock cannot be negative."],
      default: 0,
      // Note: Stock unit should align with priceUnit. If price is per kg, stock could be in kg.
      // If price is per item, stock is number of items. This needs careful consideration in your logic.
    },
    images: [
      {
        type: String,
        required: [true, "At least one product image is required."],
      },
    ],
    // variations: [ProductVariationSchema], // Removed for now, can be added back
    // specifications removed
    tags: [{ type: String, trim: true }],
    status: {
      // Simplified status, or managed by stock level automatically
      type: String,
      enum: ["active", "inactive", "out-of-stock"], // "draft" might not be needed if active upon creation
      default: "active", // Default to active, will be set to out-of-stock by pre-save hook if stock is 0
    },
    // References to Review model
    reviews: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review"
    }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Special Offer Reference
    isSpecial: {
      type: Boolean,
      default: false,
    },
    isCommunity: {
      type: Boolean,
      default: false,
    },
    specialOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialOffer",
    },
    communityPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityPayment",
    },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", description: "text" }); // Correct text index
ProductSchema.index({ category: 1 }); // Correct single field index
ProductSchema.index({ tags: 1 }); // Correct single field index for an array (supports exact match, $in)
ProductSchema.index({ createdBy: 1, status: 1 }); // Correct compound index
ProductSchema.index({ price: 1, category: 1 }); // Correct compound index

ProductSchema.pre("save", function (next) {
  // If stock is being modified or it's a new document
  if (this.isModified("stock") || this.isNew) {
    if (this.stock <= 0) {
      this.status = "out-of-stock";
    } else if (this.status === "out-of-stock" && this.stock > 0) {
      // If stock was 0 and now it's > 0, make it active (unless it was intentionally inactive)
      if (this.status !== "inactive") {
        // Check if it was intentionally set to inactive
        this.status = "active";
      }
    } else if (this.isNew && this.stock > 0 && this.status !== "inactive") {
      // For new products, if stock > 0 and not explicitly inactive, set to active.
      // Default status is 'active', so this might be redundant unless default changes.
      this.status = "active";
    }
  }
  next();
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
