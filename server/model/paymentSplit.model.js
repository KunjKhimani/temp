const mongoose = require("mongoose");

const paymentSplitSchema = new mongoose.Schema(
  {
    orderType: {
      type: String,
      enum: ["product_order", "service_order"],
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true,
    },
    platformFeePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      default: 0.2,
    },
    adminAmountExpected: {
      type: Number,
      required: true,
      min: 0,
    },
    sellerAmountExpected: {
      type: Number,
      required: true,
      min: 0,
    },
    adminAmountActual: {
      type: Number,
      min: 0,
      default: 0,
    },
    sellerAmountActual: {
      type: Number,
      min: 0,
      default: 0,
    },
    isSplitApplied: {
      type: Boolean,
      default: false,
      index: true,
    },
    paymentProvider: {
      type: String,
      enum: ["square", "stripe", "unknown"],
      default: "unknown",
    },
    paymentReferenceId: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentSplitSchema.index({ orderType: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model("PaymentSplit", paymentSplitSchema);
