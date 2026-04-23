const express = require("express");
const {
  getMessageAnalytics,
} = require("../controller/message.analytics.controller.js");
const { authMiddleware, adminAuth } = require("../middleware/auth.js");
const asyncHandler = require("express-async-handler");
const router = express.Router();

// GET Message Analytics (Admin Only)
router.get(
  "/analytics",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(getMessageAnalytics)
);

module.exports = router;
