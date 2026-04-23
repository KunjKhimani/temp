// models/serviceRequest.model.js
const mongoose = require("mongoose");
const PROMOTION_TYPES = require("../utils/promotionTypes");

const AddressSchema = new mongoose.Schema(
  {
    street: {
      type: String,
      trim: true,
      maxlength: [100, "Street address is too long."],
    },
    city: {
      type: String,
      trim: true,
      required: [true, "City is required for on-site address."],
      maxlength: [50, "City name is too long."],
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, "State/Province is too long."],
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: [20, "Postal code is too long."],
    },
    country: {
      type: String,
      trim: true,
      required: [true, "Country is required for on-site address."],
      maxlength: [50, "Country name is too long."],
    },
    details: {
      type: String,
      trim: true,
      maxlength: [200, "Address details are too long."],
    },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

// --- NEW: OfferSubSchema ---
const OfferSubSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: {
    type: String,
    required: [true, "A message for your proposal is required."],
    maxlength: 2000,
  },
  proposedPrice: {
    type: Number,
    required: [true, "Proposed price is required."],
    min: 0,
  },
  priceType: {
    type: String,
    enum: ["fixed", "per_hour", "per_day", "negotiable"],
    default: "fixed",
  },
  proposedDeliveryTime: { type: String, maxlength: 100 },
  availabilityDate: { type: Date },
  availabilityTimeSlot: {
    type: String,
    enum: [
      "morning",
      "afternoon",
      "evening",
      "flexible",
      "specific_time",
      "upon_discussion",
    ],
  }, // Added upon_discussion
  specificTime: { type: String },
  linkedServiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service",
    default: null,
  },

  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "rejected_by_buyer",
      "withdrawn_by_seller",
      "countered_by_buyer",
      "counter_accepted_by_seller",
      "counter_rejected_by_seller",
    ], // Added more specific statuses
    default: "pending",
  },
  buyerRejectionReason: { type: String, maxlength: 500 },
  counterOfferDetails: {
    price: { type: Number, min: 0 },
    priceType: {
      type: String,
      enum: ["fixed", "per_hour", "per_day", "negotiable"],
    },
    deliveryTime: { type: String, maxlength: 100 },
    message: { type: String, maxlength: 1000 }, // Buyer's message for counter
    counteredAt: { type: Date },
  },
  buyerResponseMessage: { type: String, maxlength: 1000 }, // Optional message from buyer when accepting/rejecting
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
OfferSubSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
OfferSubSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
// --- END OfferSubSchema ---

const ServiceRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A title for your service request is required."],
      trim: true,
      minlength: [10, "Title must be at least 10 characters long."],
      maxlength: [150, "Title cannot exceed 150 characters."],
    },
    description: {
      type: String,
      required: [true, "A detailed description of your needs is required."],
      // minlength: [30, "Description must be at least 30 characters long."],
      // maxlength: [3000, "Description cannot exceed 3000 characters."],
    },
    category: {
      type: String,
      required: [true, "Please select a relevant service category."],
    },
    subcategory: { type: String },
    budget: {
      min: { type: Number, min: [0, "Minimum budget cannot be negative."] },
      max: { type: Number, min: [0, "Maximum budget cannot be negative."] },
      type: {
        type: String,
        enum: ["fixed", "hourly_range", "open_to_offers"],
        default: "open_to_offers",
      },
      currency: { type: String, default: "USD" },
    },
    desiredDeliveryTime: {
      type: String,
      maxlength: [100, "Desired delivery time is too long."],
    },
    locationPreference: {
      type: String,
      enum: ["on-site", "remote", "flexible"],
      default: "flexible",
    },
    onSiteAddresses: [{ type: AddressSchema }],
    attachments: [{ type: String }],
    tags: [{ type: String, trim: true, maxlength: [30, "Tag is too long."] }],
    status: {
      type: String,
      enum: [
        "open", // Actively seeking offers
        "pending_promotion_payment", // For promoted posts, awaiting fee payment
        "pending_approval", // If admin approval is needed for the request itself
        "in-discussion", // Buyer has received offers, might be talking (optional, could stay 'open')

        // --- New/Revised Lifecycle Statuses ---
        "AWAITING_SCHEDULE", // Offer accepted by buyer, ready for initial schedule proposal
        "SCHEDULE_NEGOTIATION", // Schedule proposed by one party, awaiting other's confirmation or counter-proposal
        "SCHEDULE_CONFIRMED", // Schedule agreed by both, ready for buyer to initiate payment
        "AWAITING_PAYMENT", // Buyer has initiated payment process (e.g., Stripe PI created), awaiting payment completion
        "payment_pending", // Payment intent created, awaiting client confirmation
        "IN_PROGRESS", // Payment successfully made, service work is ongoing
        "PENDING_COMPLETION", // Service work claimed as finished by one party (usually seller), awaiting other party's confirmation
        "COMPLETED", // Service work confirmed as finished by both, payment released/releasable to seller.
        "payment_succeeded", // Payment successfully made, service work is ongoing
        // --- End New/Revised Lifecycle Statuses ---

        "DISPUTED", // If a dispute arises during any phase post-payment
        "CLOSED", // Buyer no longer needs the service / manually closed by buyer/admin
        "EXPIRED", // If request expires before an offer is accepted
        "CANCELLED_BY_BUYER", // Buyer cancels before completion. If paid, may lead to REFUND_REQUESTED.
        "CANCELLED_BY_SELLER", // Seller cancels before completion. If paid, usually leads to full refund.
        "CANCELLED_BY_SYSTEM", // E.g., due to no activity or policy violation

        // --- Refund Specific Statuses ---
        "REFUND_REQUESTED", // Buyer formally requests a refund for a paid service (via refund form)
        "REFUND_REVIEW_PENDING", // Admin is reviewing the refund request
        "REFUND_APPROVED", // Admin approved the refund, Stripe processing to be initiated/done
        "REFUND_PROCESSED", // Refund successfully processed via Stripe
        "REFUND_REJECTED", // Admin rejected the refund request
      ],
      default: "open",
    },
    awardedOfferId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Store the _id of the accepted OfferSubSchema
    awardedSellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // Store the ID of the seller whose offer was accepted
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offersReceived: [OfferSubSchema],

    // --- NEW/REVISED: Scheduling Details ---
    currentScheduleProposal: {
      // Stores the active proposal being negotiated
      proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      proposedDate: Date,
      proposedTimeSlot: {
        type: String,
        enum: ["morning", "afternoon", "evening", "flexible", "specific_time"],
      },
      specificTimeDetails: String, // e.g., "10:30 AM" if proposedTimeSlot is "specific_time"
      notes: { type: String, maxlength: 1000 },
      // status field indicates who needs to act next on this proposal
      proposalStatus: {
        type: String,
        enum: ["pending_buyer_confirmation", "pending_seller_confirmation"],
      },
      createdAt: { type: Date, default: Date.now },
      updatedAt: Date,
    },
    // These two flags track if the current proposal has been ack'd by each party
    schedulingConfirmedByBuyer: { type: Boolean, default: false },
    schedulingConfirmedBySeller: { type: Boolean, default: false },

    confirmedSchedule: {
      // Stores the final agreed-upon schedule
      date: Date,
      timeSlot: {
        type: String,
        enum: ["morning", "afternoon", "evening", "flexible", "specific_time"],
      },
      specificTime: String,
      notes: { type: String, maxlength: 1000 },
      confirmedByBuyerAt: Date,
      confirmedBySellerAt: Date,
      confirmedAt: Date,
    },
    lastScheduleUpdateBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Who made the last proposal/confirmation
    rescheduleCount: { type: Number, default: 0 },
    // --- END NEW/REVISED: Scheduling Details ---

    // --- NEW: Payment Details for the Service ---
    amountToBePaid: { type: Number, min: 0 }, // Set when offer is accepted
    paymentIntentId: { type: String }, // Stripe Payment Intent ID for the service payment
    paymentIntentClientSecret: { type: String }, // Store the client secret for frontend use
    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "requires_action",
        "refunded",
        "partially_refunded",
      ],
      default: "pending", // Default for the service payment itself, not promotion
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" }, // Reference to a new Order model if created
    // --- END NEW: Payment Details ---

    // --- NEW: Cancellation/Refund Details ---
    cancellationReason: { type: String, maxlength: 1000 }, // Reason if buyer/seller cancels
    refundRequestDetails: {
      // Encapsulate refund form data
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String, maxlength: 1000 }, // Buyer's reason for refund
      notes: { type: String, maxlength: 1000 }, // Buyer's additional notes
      requestedAt: Date,
    },
    refundAdminNotes: { type: String, maxlength: 1000 }, // Admin's notes on processing refund
    refundStatus: {
      // Status of the refund process itself
      type: String,
      enum: [
        "none",
        "pending_review",
        "approved",
        "rejected",
        "processing_stripe",
        "processed_stripe",
        "failed_stripe",
      ],
      default: "none",
    },
    refundedAmount: { type: Number, min: 0 }, // Actual amount refunded
    stripeRefundId: { type: String }, // Store Stripe refund object ID
    // --- END NEW: Cancellation/Refund Details ---

    invitedProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    requiredSkills: [
      { type: String, trim: true, maxlength: [50, "Skill name is too long."] },
    ],
    experienceLevel: {
      type: String,
      enum: ["any", "entry", "intermediate", "expert", "lead"],
      default: "any",
    },
    scopeOfWork: {
      unit: {
        type: String,
        enum: [
          "hours",
          "days",
          "weeks",
          "months",
          "square_meters",
          "square_feet",
          "project",
          "other",
          "",
        ],
        trim: true,
      },
      quantity: {
        type: Number,
        min: [0, "Scope quantity cannot be negative."],
      },
      details: {
        type: String,
        trim: true,
        maxlength: [500, "Scope details are too long."],
      },
    },
    requestType: {
      type: String,
      enum: [PROMOTION_TYPES.STANDARD, PROMOTION_TYPES.PROMOTED],
      default: PROMOTION_TYPES.STANDARD,
      required: true,
    },
    promotionDetails: {
      paymentId: { type: String },
      promotionOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceRequestPromotionOrder",
      },
      feeAmount: { type: Number },
      feeCurrency: { type: String },
      durationMonths: { type: Number, min: 1 },
      isPromoted: { type: Boolean, default: false },
      promotedUntil: { type: Date },
    },
    specialDealDetails: {
      isSpecialDeal: { type: Boolean, default: false },
      activationFeeAmount: { type: Number },
      activationFeeCurrency: { type: String },
      description: {
        type: String,
        trim: true,
        maxlength: [1000, "Special deal description is too long."],
      },
      actualPrice: {
        type: Number,
        min: [0, "Special deal actual price cannot be negative."],
      },
      sellingPrice: {
        type: Number,
        min: [0, "Special deal selling price cannot be negative."],
      },
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
    // Reviews for this service request
    reviews: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review"
    }],
    // Rating fields for this service request
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ServiceRequestSchema.path("onSiteAddresses").validate(function (value) {
  if (this.locationPreference === "on-site") {
    return (
      value &&
      value.length > 0 &&
      value.every((addr) => addr.city && addr.country)
    );
  }
  return true;
}, 'At least one on-site address (with city and country) is required if location preference is "on-site".');
ServiceRequestSchema.path("budget.max").validate(function (value) {
  if (
    this.budget &&
    this.budget.type === "hourly_range" &&
    this.budget.min != null &&
    value != null
  ) {
    return value >= this.budget.min;
  }
  if (
    this.budget &&
    this.budget.type === "fixed" &&
    this.budget.min != null &&
    value != null
  ) {
    return value >= this.budget.min;
  }
  return true;
}, "Maximum budget must be greater than or equal to minimum budget.");

ServiceRequestSchema.index({ createdBy: 1, status: 1, createdAt: -1 });
ServiceRequestSchema.index({ category: 1, status: 1 });
ServiceRequestSchema.index({ tags: 1, status: 1 });
ServiceRequestSchema.index({
  title: "text",
  description: "text",
  tags: "text",
  requiredSkills: "text",
});
ServiceRequestSchema.index({ requiredSkills: 1, status: 1 });
ServiceRequestSchema.index({ experienceLevel: 1, status: 1 });
ServiceRequestSchema.index({ requestType: 1, status: 1, createdAt: -1 });
ServiceRequestSchema.index({ "offersReceived.seller": 1 }); // Index for querying offers by seller

const ServiceRequest = mongoose.model("ServiceRequest", ServiceRequestSchema);
module.exports = ServiceRequest;
