export const SR_STATUS = {
  OPEN: "open",
  PENDING_PROMOTION_PAYMENT: "pending_promotion_payment",
  PENDING_APPROVAL: "pending_approval",
  IN_DISCUSSION: "in-discussion", // Optional

  // New Lifecycle
  AWAITING_SCHEDULE: "AWAITING_SCHEDULE",
  SCHEDULE_NEGOTIATION: "SCHEDULE_NEGOTIATION",
  SCHEDULE_CONFIRMED: "SCHEDULE_CONFIRMED",
  AWAITING_PAYMENT: "AWAITING_PAYMENT",
  PAYMENT_PENDING: "payment_pending", // Added for clarity and consistency with backend
  payment_succeeded: "payment_succeeded", // Added missing status
  IN_PROGRESS: "IN_PROGRESS",
  PENDING_COMPLETION: "PENDING_COMPLETION",
  COMPLETED: "COMPLETED",

  DISPUTED: "DISPUTED",
  CLOSED: "CLOSED",
  EXPIRED: "EXPIRED",
  CANCELLED_BY_BUYER: "CANCELLED_BY_BUYER",
  CANCELLED_BY_SELLER: "CANCELLED_BY_SELLER", // Add if needed
  CANCELLED_BY_SYSTEM: "CANCELLED_BY_SYSTEM",

  // Refund Specific
  REFUND_REQUESTED: "REFUND_REQUESTED",
  REFUND_REVIEW_PENDING: "REFUND_REVIEW_PENDING", // Matches backend enum better
  REFUND_APPROVED: "REFUND_APPROVED",
  REFUND_PROCESSED: "REFUND_PROCESSED",
  REFUND_REJECTED: "REFUND_REJECTED",
  // Old statuses from your model that may or may not map directly to these frontend ones.
  // "offer_accepted", // Covered by AWAITING_SCHEDULE
  // "scheduling_pending", // Covered by SCHEDULE_NEGOTIATION
  // "scheduled", // Covered by SCHEDULE_CONFIRMED
  // "payment_pending", // Covered by AWAITING_PAYMENT
  // "payment_succeeded", // Leads to IN_PROGRESS
  // "pending_completion_approval", // Covered by PENDING_COMPLETION
  // "cancelled_with_refund_pending", // Covered by REFUND_REQUESTED
  // "cancelled_refunded", // Covered by REFUND_PROCESSED
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  REQUIRES_ACTION: "requires_action",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
};

export const REFUND_STATUS = {
  NONE: "none",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  PROCESSING_STRIPE: "processing_stripe",
  PROCESSED_STRIPE: "processed_stripe",
  FAILED_STRIPE: "failed_stripe",
};

export const SCHEDULE_PROPOSAL_STATUS = {
  PENDING_BUYER_CONFIRMATION: "pending_buyer_confirmation",
  PENDING_SELLER_CONFIRMATION: "pending_seller_confirmation",
};
