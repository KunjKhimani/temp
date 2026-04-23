const express = require("express");
const subscriptionController = require("../controller/subscription.controller");
const { authMiddleware } = require("../middleware/auth"); // Assuming your auth middleware is here

const router = express.Router();

// Protected routes (require user to be logged in)
router.post(
  "/create-checkout-session",
  authMiddleware,
  subscriptionController.createSubscriptionCheckoutSession
);
router.post(
  "/confirm-payment",
  authMiddleware,
  subscriptionController.confirmSubscriptionPayment
);

module.exports = router;
