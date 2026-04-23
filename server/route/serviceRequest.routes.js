// routes/serviceRequest.routes.js
const express = require("express");
const router = express.Router();
const {
  createServiceRequest,
  getOpenServiceRequests,
  getMyServiceRequests,
  getServiceRequestById,
  updateServiceRequest,
  deleteServiceRequest,
  confirmPromotionPayment,
  verifyPromotionPaymentController,
  submitOfferOnServiceRequest,
  inviteProvidersToServiceRequest, // <<< IMPORT
  getOffersForServiceRequest,
  buyerAcceptOffer,
  buyerRejectOffer,
  setScheduleForServiceRequest,
  markServiceRequestInProgress,
  markServiceRequestAsCompletedByParty,
  buyerSubmitCounterOffer,
  sellerRespondToCounterOffer,
  proposeOrConfirmSchedule,
  initiateServicePayment,
  confirmServicePayment, // <<< IMPORT
} = require("../controller/serviceRequest.controller.js");
const {
  adminGetAllServiceRequests,
  adminGetServiceRequestById,
  adminUpdateServiceRequest,
  adminDeleteServiceRequest,
  adminDeleteAllServiceRequests,
} = require("../controller/admin.serviceRequest.controller.js"); // NEW ADMIN CONTROLLER IMPORT

const {
  authMiddleware,
  sellerAuth,
  adminAuth,
} = require("../middleware/auth.js"); // Assuming adminAuth exists or will be added
const asyncHandler = require("express-async-handler");
const upload = require("../utils/multer");

// --- BUYER ACTIONS ---
router.post(
  "/create",
  asyncHandler(authMiddleware),
  upload.array("attachments", 5),
  asyncHandler(createServiceRequest)
);
router.get(
  "/my-requests",
  asyncHandler(authMiddleware),
  asyncHandler(getMyServiceRequests)
);
router.put(
  "/:requestId",
  asyncHandler(authMiddleware),
  upload.array("attachments", 5),
  asyncHandler(updateServiceRequest)
);
router.delete(
  "/:requestId",
  asyncHandler(authMiddleware),
  asyncHandler(deleteServiceRequest)
);
router.post(
  "/:requestId/confirm-promotion",
  asyncHandler(authMiddleware),
  asyncHandler(confirmPromotionPayment)
); // Kept :serviceRequestId for consistency
router.post(
  "/payment/verify-promotion",
  asyncHandler(authMiddleware),
  asyncHandler(verifyPromotionPaymentController)
);

// --- NEW SCHEDULING, PAYMENT, COMPLETION, REFUND FLOW ---
router.post(
  "/:requestId/schedule",
  asyncHandler(authMiddleware),
  asyncHandler(proposeOrConfirmSchedule)
); // Handles proposal & confirmation

router.post(
  "/:requestId/initiate-payment",
  asyncHandler(authMiddleware),
  asyncHandler(initiateServicePayment)
); // Buyer initiates
router.post(
  "/:requestId/confirm-payment",
  asyncHandler(authMiddleware),
  asyncHandler(confirmServicePayment)
); // Client confirms after Stripe.js

// --- BUYER ACTIONS ON OFFERS ---
router.put(
  "/:requestId/offers/:offerId/accept",
  asyncHandler(authMiddleware), // Buyer only
  asyncHandler(buyerAcceptOffer)
);
router.put(
  "/:requestId/offers/:offerId/reject",
  asyncHandler(authMiddleware), // Buyer only
  asyncHandler(buyerRejectOffer)
);
router.post(
  "/:requestId/offers/:offerId/counter",
  asyncHandler(authMiddleware), // Controller will verify if req.user is the buyer of requestId
  asyncHandler(buyerSubmitCounterOffer)
);

// --- SCHEDULING & PROGRESS (Can be buyer or awarded seller) ---
router.post(
  // Or PUT if updating an existing schedule
  "/:requestId/schedule",
  asyncHandler(authMiddleware), // Buyer or Awarded Seller
  asyncHandler(setScheduleForServiceRequest)
);
router.put(
  "/:requestId/status/in-progress",
  asyncHandler(authMiddleware), // Buyer or Awarded Seller
  asyncHandler(markServiceRequestInProgress)
);
router.put(
  // Could be POST if it's a one-time action
  "/:requestId/status/complete",
  asyncHandler(authMiddleware), // Buyer or Awarded Seller (depending on who initiates 'done')
  asyncHandler(markServiceRequestAsCompletedByParty)
);

// --- NEW: Buyer invites providers to their request ---
router.post(
  "/:requestId/invite-providers",
  asyncHandler(authMiddleware), // Only the buyer (owner) can invite
  asyncHandler(inviteProvidersToServiceRequest)
);

// --- NEW: Buyer gets offers for their request ---
router.get(
  "/:requestId/offers",
  asyncHandler(authMiddleware), // Only the buyer (owner) should see all offers
  asyncHandler(getOffersForServiceRequest)
);

// --- SELLER ACTIONS ---
router.post(
  "/:requestId/offers",
  asyncHandler(authMiddleware),
  asyncHandler(sellerAuth),
  asyncHandler(submitOfferOnServiceRequest)
);

// --- ADMIN ROUTE FOR REFUND PROCESSING ---
// router.post(
//   "/:requestId/process-refund",
//   asyncHandler(authMiddleware),
//   asyncHandler(adminAuth),
//   asyncHandler(processRefundForServiceRequest)
// );

// --- PUBLIC / GENERAL ROUTES ---
router.get("/", asyncHandler(getOpenServiceRequests));
router.get(
  "/:requestId/detail",
  // asyncHandler(authMiddleware)
  asyncHandler(getServiceRequestById)
); // Consider if this should be fully public or require auth

router.post(
  "/:requestId/offers/:offerId/respond-counter",
  asyncHandler(authMiddleware),
  // asyncHandler(sellerAuth), // Ensures the user is a seller
  asyncHandler(sellerRespondToCounterOffer)
);

// --- ADMIN ROUTES FOR SERVICE REQUESTS ---
router.get(
  "/admin/all",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth), // Ensure only admins can access
  asyncHandler(adminGetAllServiceRequests)
);

router.get(
  "/admin/:requestId",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(adminGetServiceRequestById)
);

router.put(
  "/admin/:requestId",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  upload.array("attachments", 5), // Allow admin to update attachments
  asyncHandler(adminUpdateServiceRequest)
);

router.delete(
  "/admin/:requestId",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(adminDeleteServiceRequest)
);

router.delete(
  "/admin/all",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(adminDeleteAllServiceRequests)
);

module.exports = router;
