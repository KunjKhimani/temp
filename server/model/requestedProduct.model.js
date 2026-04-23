// models/requestedProduct.model.js
const mongoose = require("mongoose");

const RequestedProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Requested product name is required."],
      trim: true,
      maxlength: [150, "Requested product name cannot exceed 150 characters."],
    },
    description: {
      type: String,
      required: [true, "Requested product description is required."],
      maxlength: [
        2000,
        "Requested product description cannot exceed 2000 characters.",
      ],
    },
    // This can be an estimated price or a target price from the requester
    targetPrice: {
      type: Number,
      min: [0, "Target price cannot be negative."],
      required: false, // Not strictly required, user might not know
    },
    priceUnit: {
      type: String,
      enum: ["item", "kg", "lb", "g", "oz", "piece", "pack", "set", "other"], // Extend as needed
      default: "item",
      required: [true, "Price unit (e.g., per item, per kg) is required."],
    },
    quantityRequested: {
      type: Number,
      required: [true, "Requested quantity is required."],
      min: [1, "Quantity requested must be at least 1."],
    },
    category: {
      type: String,
      required: [true, "Requested product category is required."],
    },
    subcategory: {
      type: String,
      required: false,
    },
    images: [
      {
        type: String, // URLs to images provided by the requester as examples
      },
    ],
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "fulfilled", "cancelled"],
      default: "pending",
    },
    deliveryLocation: {
      type: String, // e.g., "Nairobi, Kenya" or a more specific address
      required: [true, "Delivery location is required."],
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The user (seller/provider) who fulfills this request
      required: false, // Not required initially
    },
    fulfillmentDate: {
      type: Date,
      required: false, // Set when the request is fulfilled
    },
    // Optional: deadline for fulfillment
    fulfillmentDeadline: {
      type: Date,
      required: false,
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
    // Reviews for this requested product
    reviews: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review"
    }],
    // Rating fields for this requested product
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

RequestedProductSchema.index({ name: "text", description: "text" });
RequestedProductSchema.index({ category: 1 });
RequestedProductSchema.index({ tags: 1 });
RequestedProductSchema.index({ requestedBy: 1, status: 1 });
RequestedProductSchema.index({ deliveryLocation: 1 });

const RequestedProduct = mongoose.model(
  "RequestedProduct",
  RequestedProductSchema
);
module.exports = RequestedProduct;
