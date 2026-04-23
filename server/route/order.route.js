// route/order.route.js
const express = require("express");
const { authMiddleware } = require("../middleware/auth.js"); // General auth
// You might need specific role middleware later (e.g., sellerOnly, buyerOnly)
const {
  createOrder,
  confirmPayment,
  getOrders,
  getOrderById,
  acceptOrder,
  declineOrder,
  scheduleOrderSlot,
  markOrderInProgress,
  markOrderCompleted,
  requestOrderRefund,
  deleteOrder,
  proposeTimeChange,
  confirmTimeProposal,
  processRefundAfterDecline,
  findAnotherSellerForOrder,
  reaffirmOriginalTimePreference,
} = require("../controller/order.controller.js");
const asyncHandler = require("express-async-handler");

const router = express.Router();

// Existing routes

// GET All Respective Orders (Service and Product, Buyer and Seller)
router.get("/", asyncHandler(authMiddleware), asyncHandler(getOrders));
router.post("/create", asyncHandler(authMiddleware), asyncHandler(createOrder));
router.get(
  "/:orderId",
  asyncHandler(authMiddleware),
  asyncHandler(getOrderById)
);
router.put(
  "/:orderId/confirm-payment",
  asyncHandler(authMiddleware),
  asyncHandler(confirmPayment)
);

// Seller actions
router.put(
  "/:orderId/accept",
  asyncHandler(authMiddleware), // TODO: Consider sellerOnly middleware
  asyncHandler(acceptOrder)
);
router.put(
  "/:orderId/decline",
  asyncHandler(authMiddleware), // TODO: Consider sellerOnly middleware
  asyncHandler(declineOrder)
);

// --- NEW: Seller proposes time change ---
router.post(
  "/:orderId/propose-time-change",
  asyncHandler(authMiddleware), // TODO: Consider sellerOnly middleware
  asyncHandler(proposeTimeChange)
);

// Buyer action to schedule or reschedule
router.put(
  "/:orderId/schedule",
  asyncHandler(authMiddleware), // TODO: Consider buyerOnly middleware (or allow seller if they can also schedule/reschedule)
  asyncHandler(scheduleOrderSlot)
);

// --- NEW: Buyer confirms seller's time proposal ---
router.put(
  "/:orderId/confirm-time-proposal",
  asyncHandler(authMiddleware), // TODO: Consider buyerOnly middleware
  asyncHandler(confirmTimeProposal)
);

router.put(
  "/:orderId/in-progress",
  asyncHandler(authMiddleware), // TODO: Consider sellerOnly or relevant role middleware
  asyncHandler(markOrderInProgress)
);
router.put(
  "/:orderId/complete",
  asyncHandler(authMiddleware), // TODO: Consider buyerOnly middleware
  asyncHandler(markOrderCompleted)
);

// --- NEW: Buyer reaffirms original time preference after seller proposal ---
router.put(
  // Using PUT as it modifies the order state
  "/:orderId/reaffirm-preference",
  asyncHandler(authMiddleware), // TODO: Consider buyerOnly middleware
  asyncHandler(reaffirmOriginalTimePreference)
);

// --- NEW: Buyer actions after seller decline ---
router.post(
  // Using POST as it's a significant action, could also be PUT
  "/:orderId/process-refund-post-decline",
  asyncHandler(authMiddleware), // TODO: Consider buyerOnly middleware
  asyncHandler(processRefundAfterDecline)
);

router.post(
  // Using POST
  "/:orderId/find-another-seller",
  asyncHandler(authMiddleware), // TODO: Consider buyerOnly middleware
  asyncHandler(findAnotherSellerForOrder)
);

router.post(
  "/:orderId/request-refund",
  asyncHandler(authMiddleware), // TODO: Consider buyerOnly middleware
  asyncHandler(requestOrderRefund)
);
router.delete(
  "/:orderId",
  asyncHandler(authMiddleware),
  asyncHandler(deleteOrder)
);

module.exports = router;
