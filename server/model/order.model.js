// model/order.model.js
const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true, // Reverted to true
    },
    quantity: { type: Number, min: 1, default: 1 },
    numberOfHours: { type: Number, min: 0.1 },
    numberOfPeople: { type: Number, min: 1 },
    additionalInfo: { type: String },
    location: { type: String },
    timePreference: {
      type: String,
      enum: ["any", "morning", "afternoon", "evening"],
      default: "any",
    },
    // --- Fields for Seller's Time Proposal ---
    sellerProposedTimePreferences: {
      type: [String], // Array of strings
      enum: ["morning", "afternoon", "evening", "any"], // Valid values for each element
      default: undefined, // Or default: [] if you prefer an empty array when not set
    },
    sellerTimeProposalMessage: {
      type: String,
      default: undefined,
    },
    // --- End Fields for Seller's Time Proposal ---
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
    status: {
      type: String,
      enum: [
        "pending-payment",
        "awaiting-seller-confirmation",
        "awaiting-buyer-time-adjustment", // Status for when buyer needs to respond to proposal
        "accepted",
        "awaiting-buyer-scheduling",
        "scheduled",
        "declined",
        "seller-declined-awaiting-buyer", // << NEW: Seller declined, buyer needs to choose next step
        "buyer-chose-refund-confirmation-pending", // NEW: Buyer chose refund, final confirm needed
        "buyer-requested-reassignment", // << NEW (Optional): If buyer wants to find another seller (complex)
        "buyer-cancelled-post-decline", // << NEW: If buyer chooses to just cancel/refund after seller decline
        "in-progress",
        "completed",
        "disputed",
        "cancelled",
        "failed",
        "refund-requested",
        "refunded",
        "payout-pending",
        "payout-failed",
      ],
      default: "pending-payment",
    },
    travelFeeApplied: { type: Number, min: 0, default: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    completionDate: { type: Date },
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
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    paymentIntentClientSecret: {
      type: String,
    },
    sellerActionTimestamp: { type: Date },
    buyerActionTimestamp: { type: Date },
    scheduledDateTime: { type: Date },
    selectedTimeSlot: {
      dayOfWeek: Number,
      startTime: String,
      endTime: String,
      slotDate: Date,
    },
    buyerSchedulingComment: { type: String },
    declineReason: { type: String },
    buyerReasonForRefundChoice: { type: String }, // NEW: Buyer's reason for choosing refund over reassignment
    completionTimestamp: { type: Date },
    disputeReason: { type: String },
    disputeTimestamp: { type: Date },
    refundDetails: {
      refundId: String,
      amount: Number,
      reason: String,
      status: String,
      processedAt: Date,
    },
    originalSellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // To store who declined it if reassigned
    originatingServiceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceRequest",
      index: true, // Good for querying orders related to a service request
    },
    onboardingLink: { type: String }, // NEW: Store Stripe onboarding link for seller
    // --- SUBSCRIPTION FIELDS ---
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceSubscription",
      default: null,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

OrderSchema.index({ buyer: 1, createdAt: -1 });
OrderSchema.index({ seller: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
