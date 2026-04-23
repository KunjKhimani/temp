const express = require("express");
const router = express.Router();
const {
  getSellersWithOverrides,
  getSellerCommissionOverride,
  saveSellerCommissionOverride,
  deleteSellerCommissionOverride
} = require("../controller/sellerCommissionOverride.controller");
const { authMiddleware, adminAuth } = require("../middleware/auth");

// All routes are protected and typically for admins
router.use(authMiddleware);
router.use(adminAuth);

router.get("/sellers", getSellersWithOverrides);
router.get("/:sellerId/commission", getSellerCommissionOverride);
router.post("/:sellerId/commission", saveSellerCommissionOverride);
router.delete("/:sellerId/commission", deleteSellerCommissionOverride);

module.exports = router;
