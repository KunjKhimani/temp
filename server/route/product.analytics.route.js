const express = require("express");
const {
  getProductAnalytics,
} = require("../controller/product.analytics.controller.js");
const { authMiddleware, adminAuth } = require("../middleware/auth.js");
const asyncHandler = require("express-async-handler");
const router = express.Router();

// GET Product Analytics (Admin Only)
router.get(
  "/analytics",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(getProductAnalytics)
);

module.exports = router;
