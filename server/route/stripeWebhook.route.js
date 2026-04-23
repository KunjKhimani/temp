const express = require("express");
const {
  stripeWebhookHandler,
} = require("../controller/stripeWebhook.controller");

const router = express.Router();

// Stripe webhook endpoint
// IMPORTANT: This route needs to be raw body parsed, not JSON parsed.
// It should also be publicly accessible by Stripe.
router.post("/", stripeWebhookHandler);

module.exports = router;
