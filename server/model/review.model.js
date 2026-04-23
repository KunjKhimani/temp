const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "orderModel",
    },
    orderModel: {
      type: String,
      required: true,
      enum: ["ProductOrder", "Order", "ServiceRequest", "RequestedProduct"],
    },
    listingId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "listingModel",
    },
    listingModel: {
      type: String,
      required: true,
      enum: ["Product", "Service", "ServiceRequest", "RequestedProduct"],
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["approved", "hidden"],
      default: "approved",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple reviews for the same order
ReviewSchema.index({ orderId: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);

