const mongoose = require("mongoose");

const ServiceRequestOrderSchemaDefinition = new mongoose.Schema(
  {
    serviceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: false, // Changed to false
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    paymentIntentClientSecret: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "pending-payment",
        "succeeded",
        "failed",
        "cancelled",
        "refund-requested",
        "refunded",
        "in-progress",
        "completed",
        "disputed",
      ],
      default: "pending-payment",
    },
    scheduledDateTime: { type: Date },
    selectedTimeSlot: {
      slotDate: Date,
      startTime: String,
      endTime: String,
    },
    notes: { type: String },
    isSpecial: {
      type: Boolean,
      default: false,
    },
    specialOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialOffer",
    },
    actualPriceAtOrder: {
      type: Number,
    },
    sellingPriceAtOrder: {
      type: Number,
    },
    isCommunity: {
      type: Boolean,
      default: false,
    },
    subcategory: {
      type: String,
    },
  },
  { timestamps: true }
);

const ServiceRequestOrder = mongoose.model(
  "ServiceRequestOrder",
  ServiceRequestOrderSchemaDefinition
);

module.exports = ServiceRequestOrder;
