const express = require("express");
const asyncHandler = require("express-async-handler");
const { getUserAnalytics } = require("../controller/user.analytics.controller");
const { authMiddleware, adminAuth } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/analytics",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  getUserAnalytics
);

module.exports = router;
