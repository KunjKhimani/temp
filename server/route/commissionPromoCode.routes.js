const express = require("express");
const router = express.Router();
const {
  createPromoCode,
  getAllPromoCodes,
  deletePromoCode,
  applyPromoCode,
  togglePromoCodeStatus,
} = require("../controller/commissionPromoCode.controller");
const { authMiddleware, adminAuth, sellerAuth } = require("../middleware/auth");

// Seller Routes (Needs only authMiddleware and sellerAuth)
router.post("/apply", authMiddleware, sellerAuth, applyPromoCode);

// Admin Routes (Needs both authMiddleware AND adminAuth)
router.use(authMiddleware, adminAuth);

router.post("/admin", createPromoCode);
router.get("/admin", getAllPromoCodes);
router.patch("/admin/:id/status", togglePromoCodeStatus);
router.delete("/admin/:id", deletePromoCode);

module.exports = router;
