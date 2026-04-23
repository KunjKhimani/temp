const express = require("express");
const {
  getConversationAnalytics,
} = require("../controller/conversation.analytics.controller.js");
const { authMiddleware, adminAuth } = require("../middleware/auth.js");
const asyncHandler = require("express-async-handler");
const router = express.Router();

// GET Conversation Analytics (Admin Only)
router.get(
  "/analytics",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(getConversationAnalytics)
);

module.exports = router;
