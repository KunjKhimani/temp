const express = require("express");
const router = express.Router();
const { 
  getTransactionHistory,
  getTransactionById 
} = require("../controller/transaction.controller");
const { authMiddleware } = require("../middleware/auth");
const asyncHandler = require("express-async-handler");

// @route   GET /api/transactions
// @access  Private (Admin, Seller, or Buyer)
router.get("/", asyncHandler(authMiddleware), asyncHandler(getTransactionHistory));
router.get("/:id", asyncHandler(authMiddleware), asyncHandler(getTransactionById));

module.exports = router;
