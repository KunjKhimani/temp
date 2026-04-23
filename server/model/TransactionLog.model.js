const mongoose = require("mongoose");

const TransactionLogSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["product", "service"],
      required: true,
    },
    purchasedItem: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "itemModel",
    },
    itemModel: {
      type: String,
      required: true,
      enum: ["ProductOrder", "ServiceRequestOrder", "Order", "Product", "Service", "RequestedProduct", "ServiceRequest"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    sellerCommission: {
      type: Number,
      required: true,
      min: 0,
    },
    adminCommission: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      required: true,
      default: "succeeded",
    },
    paymentProvider: {
      type: String,
      default: "Square",
    },
    transactionId: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
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
  },
  { timestamps: true }
);

const TransactionLog = mongoose.models.TransactionLog 
  ? mongoose.model("TransactionLog")
  : mongoose.model("TransactionLog", TransactionLogSchema);

module.exports = TransactionLog;
