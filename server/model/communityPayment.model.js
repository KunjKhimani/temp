const mongoose = require("mongoose");

const CommunityPaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "itemType",
      required: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: ["ServiceRequest", "RequestedProduct", "Service", "Product"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    durationMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentProvider: {
      type: String,
      enum: ["Stripe", "Square", "System"],
      default: "System",
    },
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed"],
      default: "pending",
    },
    note: {
      type: String,
    },
    communityOfferUntill: {
      type: Date,
    },
    isFreePlan: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

const CommunityPayment = mongoose.models.CommunityPayment 
  ? mongoose.model("CommunityPayment")
  : mongoose.model("CommunityPayment", CommunityPaymentSchema);

module.exports = CommunityPayment;
