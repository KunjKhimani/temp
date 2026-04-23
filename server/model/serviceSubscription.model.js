const mongoose = require("mongoose");

const ServiceSubscriptionSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    squareSubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    squareCustomerId: {
      type: String,
      required: true,
    },
    squareCatalogPlanId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "past_due"],
      default: "active",
    },
    frequency: {
      type: String,
      enum: ["weekly", "monthly"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    nextBillingDate: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    lastOrderDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceSubscription", ServiceSubscriptionSchema);
