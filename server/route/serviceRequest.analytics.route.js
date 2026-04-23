const express = require("express");
const {
  getServiceRequestAnalytics,
} = require("../controller/serviceRequest.analytics.controller.js");
const { authMiddleware, adminAuth } = require("../middleware/auth.js");
const asyncHandler = require("express-async-handler");
const router = express.Router();

// GET Service Request Analytics (Admin Only)
router.get(
  "/analytics",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(getServiceRequestAnalytics)
);

module.exports = router;
