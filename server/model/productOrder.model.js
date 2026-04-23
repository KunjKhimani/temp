// models/productOrder.model.js
const mongoose = require("mongoose");

const ProductOrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Reference to your existing Product model
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    priceAtOrder: {
      // Price of the product unit at the time of order
      type: Number,
      required: true,
    },
    nameAtOrder: {
      // Name of the product at the time of order
      type: String,
      required: true,
    },
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
    isCommunity: {
      type: Boolean,
      default: false,
    },
    subcategory: {
      type: String,
    },
    // Optional: If you had variations
    // variationDetailsSnapshot: { type: String }, // e.g., "Color: Red, Size: XL"
    // skuAtOrder: String,
  },
  { _id: false }
);

const ProductOrderSchema = new mongoose.Schema(
  {
    items: {
      type: [ProductOrderItemSchema],
      required: true,
      validate: [
        (val) => val.length > 0,
        "Product order must contain at least one item.",
      ],
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Assuming all products in one order come from the same seller
    // If multi-vendor, this would need to be at the item level or orders split
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shippingAddress: {
      name: { type: String, required: true }, // Recipient Name
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String }, // Optional but good for delivery
    },
    subTotal: {
      // Sum of (item.priceAtOrder * item.quantity)
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    // taxes: { type: Number, default: 0, min: 0 }, // If you calculate taxes
    totalPrice: {
      // subTotal + shippingFee + taxes
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending-payment", // Initial state
        "payment-failed",
        "awaiting-seller-confirmation", // Payment successful, seller needs to confirm stock/ability to fulfill
        "seller-confirmed", // Seller confirmed, ready for processing
        "processing", // Order is being packed/prepared
        "shipped", // Order has been shipped
        "out-for-delivery", // Optional: if you have detailed tracking
        "delivered", // Buyer confirms receipt (or carrier confirms)
        "completed", // Order fully completed (e.g., after return window)
        "cancelled-by-buyer",
        "cancelled-by-seller",
        "declined-by-seller", // Seller cannot fulfill after payment
        "disputed", // Buyer raised an issue post-delivery
        "refund-requested",
        "refunded",
        "partially-refunded",
      ],
      default: "pending-payment",
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    paymentIntentClientSecret: { type: String, required: true },

    // Timestamps for key events
    paymentTimestamp: { type: Date },
    sellerConfirmationTimestamp: { type: Date },
    processingTimestamp: { type: Date },
    shippedTimestamp: { type: Date },
    deliveredTimestamp: { type: Date },
    completionTimestamp: { type: Date }, // Final completion
    cancellationTimestamp: { type: Date },
    disputeTimestamp: { type: Date },

    trackingNumber: { type: String },
    shippingCarrier: { type: String },

    additionalInfo: { type: String }, // Notes from buyer
    internalNotes: { type: String }, // Notes for seller/admin

    declineReason: { type: String }, // If seller declines after payment
    cancellationReason: { type: String },
    disputeReason: { type: String },
    refundDetails: {
      refundId: String,
      amount: Number,
      reason: String,
      status: String,
      processedAt: Date,
    },
  },
  { timestamps: true }
);

ProductOrderSchema.index({ buyer: 1, createdAt: -1 });
ProductOrderSchema.index({ seller: 1, createdAt: -1 });
ProductOrderSchema.index({ status: 1, createdAt: -1 });

const ProductOrder = mongoose.model("ProductOrder", ProductOrderSchema);
module.exports = ProductOrder;
