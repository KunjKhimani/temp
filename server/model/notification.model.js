// models/notification.model.js
const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        // Existing Service Order Types
        "NEW_ORDER_PENDING_CONFIRMATION_SELLER",
        "ORDER_PAYMENT_SUCCEEDED", // New: For seller when payment is successful
        "ORDER_PAYMENT_CONFIRMED_BUYER",
        "ORDER_ACCEPTED_BUYER",
        "ORDER_ACCEPTED_SELLER",
        "ORDER_DECLINED_BUYER",
        "ORDER_DECLINED_SELLER",
        "ORDER_SCHEDULED_SELLER",
        "ORDER_SCHEDULED_BUYER",
        "ORDER_TIME_PROPOSAL_BUYER",
        "ORDER_TIME_PROPOSAL_ACCEPTED_SELLER",
        "ORDER_IN_PROGRESS_BUYER",
        "ORDER_IN_PROGRESS_SELLER_CONFIRM",
        "ORDER_COMPLETED_SELLER",
        "ORDER_COMPLETED_BUYER_CONFIRM",
        "ORDER_DISPUTE_RAISED_SELLER",
        "ORDER_DISPUTE_SUBMITTED_BUYER",
        "ORDER_SELLER_DECLINED_BUYER_CHOICE",
        "ORDER_BUYER_REAFFIRMED_PREFERENCE",
        "ORDER_PREFERENCE_REAFFIRMATION_SENT",
        "SELLER_STRIPE_ACCOUNT_ONBOARDING_LINK_FAILED",

        // --- NEW PRODUCT ORDER TYPES ---
        "NEW_PRODUCT_ORDER_SELLER", // Seller: New order placed, awaiting your confirmation
        "PRODUCT_ORDER_PAYMENT_CONFIRMED_BUYER", // Buyer: Your payment is confirmed, awaiting seller action
        "PRODUCT_ORDER_SELLER_CONFIRMED_BUYER", // Buyer: Seller confirmed your order, it's being processed
        "PRODUCT_ORDER_SELLER_DECLINED_BUYER", // Buyer: Seller declined your order, refund processing
        "PRODUCT_ORDER_SHIPPED_BUYER", // Buyer: Your order has shipped
        "PRODUCT_ORDER_DELIVERED_SELLER", // Seller: Buyer marked order as delivered (optional)
        "PRODUCT_ORDER_DELIVERED_BUYER", // Buyer: Your order is marked as delivered (if you want a self-confirmation notification)
        // Add more product order specific types as needed (e.g., refund processed, dispute update)

        "SERVICE_REQUEST_CLAIMED_BY_SELLER_BUYER", // To Buyer when a seller claims their SR
        "SERVICE_REQUEST_CLAIM_SUCCESSFUL_SELLER", // To Seller after they pay fee and claim SR
        "SERVICE_REQUEST_INVITATION",
        "NEW_OFFER_ON_SERVICE_REQUEST",
        "SERVICE_REQUEST_OFFER_ACCEPTED",
        "SERVICE_REQUEST_OFFER_REJECTED",
        "SERVICE_REQUEST_SCHEDULED",
        "SERVICE_REQUEST_SCHEDULE_PROPOSED", // New
        "SERVICE_REQUEST_SCHEDULE_CONFIRMED", // New
        "SERVICE_REQUEST_PAYMENT_PENDING", // New
        "SERVICE_REQUEST_PAYMENT_SUCCESS", // New
        "SERVICE_REQUEST_REFUND_REQUESTED", // New
        "SERVICE_REQUEST_REFUND_STATUS_UPDATE", // New
        "SERVICE_REQUEST_DISPUTED", // New
        "COUNTER_OFFER_ACCEPTED_BY_SELLER",
        "COUNTER_OFFER_REJECTED_BY_SELLER", // New
        "SERVICE_REQUEST_STATUS_UPDATE",
        "SERVICE_REQUEST_IN_PROGRESS",
        "SERVICE_REQUEST_COMPLETION_PENDING_BUYER", // New
        "SERVICE_REQUEST_COMPLETED_BY_BUYER_SELLER", // New

        // Message Related
        "NEW_MESSAGE",

        // Review Related
        "NEW_REVIEW_SELLER", // Could be for service or product
        "REVIEW_REMINDER_BUYER", // Could be for service or product

        // Service Related (Admin Actions)
        "SERVICE_APPROVED_SELLER",
        "SERVICE_REJECTED_SELLER",

        // Product Related (Admin Actions - if any)
        // "PRODUCT_APPROVED_SELLER",
        // "PRODUCT_REJECTED_SELLER",

        // Account Related
        "ACCOUNT_VERIFIED",
        "ACCOUNT_VERIFICATION_NEEDED",
        "DOCUMENT_APPROVED",
        "DOCUMENT_REJECTED",

        // --- PAYMENT/PAYOUT RELATED ---
        "SELLER_STRIPE_ACCOUNT_NEEDED", // To seller when payout is blocked due to missing Stripe account
        "ADMIN_SELLER_PAYOUT_FAILED", // To admin when a seller payout fails (e.g., missing Stripe account)
        "ADMIN_SELLER_ACCOUNT_CREATION_FAILED", // Admin: Stripe account creation failed for seller
        "SELLER_STRIPE_ACCOUNT_CREATION_FAILED", // Seller: Stripe account creation failed
        "ADMIN_STRIPE_ONBOARDING_LINK_FAILED", // Admin: Stripe onboarding link generation failed
        "SELLER_STRIPE_ONBOARDING_LINK_FAILED", // Seller: Stripe onboarding link generation failed
        "SELLER_STRIPE_ACCOUNT_ONBOARDING_REQUIRED", // Seller: Account created, but onboarding needed
        "ADMIN_SELLER_PAYOUT_PENDING_ONBOARDING", // Admin: Payout pending, seller onboarding required
        "ADMIN_SELLER_ACCOUNT_UPDATE_FAILED", // Admin: Seller Stripe account update failed
        "SELLER_STRIPE_ACCOUNT_UPDATE_FAILED", // Seller: Stripe account update failed

        // --- SUBSCRIPTION RELATED ---
        "SERVICE_SUBSCRIPTION_RECURRING_ORDER_SELLER",
        "SERVICE_SUBSCRIPTION_PAYMENT_SUCCESS_BUYER",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "delivered", "read"],
      default: "pending",
      index: true,
    },
    relatedResource: {
      type: mongoose.Schema.Types.ObjectId,
    },
    relatedResourceType: {
      type: String,
      enum: [
        "Order",
        "Service",
        "User",
        "Message",
        "Review",
        "Conversation",
        "ProductOrder",
        "Product",
        "ServiceRequest",
      ],
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;
