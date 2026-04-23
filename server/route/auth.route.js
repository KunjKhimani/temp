const express = require("express");
const asyncHandler = require("express-async-handler");
const {
  registerUser,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail, // Import new controller
  resendVerificationEmail, // Import new controller
} = require("../controller/auth.controller");

const router = express.Router();

router.post("/register", asyncHandler(registerUser));
router.post("/login", asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));

// --- New Email Verification Routes ---
router.post("/verify-email", asyncHandler(verifyEmail)); // Use GET for link clicking
router.post("/resend-verification", asyncHandler(resendVerificationEmail)); // Use POST to request resend
// --- End New Routes ---

module.exports = router;
