const express = require("express");
const {
  getProductOrderAnalytics,
} = require("../controller/productOrder.analytics.controller.js");
const { authMiddleware, adminAuth } = require("../middleware/auth.js");
const asyncHandler = require("express-async-handler");
const router = express.Router();

// GET Product Order Analytics (Admin Only)
router.get(
  "/analytics",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(getProductOrderAnalytics)
);

module.exports = router;
