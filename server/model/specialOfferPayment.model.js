const mongoose = require("mongoose");

const SpecialOfferPaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    specialOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialOffer",
      required: false, // Optional if we process payment BEFORE creation
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "itemType",
      required: true,
    },
    itemType: {
      type: String,
      required: true,
      enum: ["Product", "Service", "RequestedProduct", "ServiceRequest"],
    },
    amount: {
      type: Number,
      required: true,
      default: 5.00,
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentProvider: {
      type: String,
      default: "Square",
    },
    status: {
      type: String,
      enum: ["succeeded", "failed", "pending"],
      default: "succeeded",
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

const SpecialOfferPayment = mongoose.models.SpecialOfferPayment 
  ? mongoose.model("SpecialOfferPayment")
  : mongoose.model("SpecialOfferPayment", SpecialOfferPaymentSchema);

module.exports = SpecialOfferPayment;
