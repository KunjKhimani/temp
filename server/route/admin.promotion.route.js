const express = require("express");
const { authMiddleware, adminAuth } = require("../middleware/auth");
const {
  adminGetPromotionSettings,
  adminUpdatePromotionSettings,
  adminGetPromotionHistory,
  adminGetSubcategoryCommission,
} = require("../controller/admin.promotion.controller");

const router = express.Router();

router.use(authMiddleware);

// GET current promotion settings
router.get("/", adminGetPromotionSettings);

// GET specific subcategory community commission
router.get("/subcategory-commission", adminGetSubcategoryCommission);

router.use(adminAuth);

// PUT update promotion settings
router.put("/", adminUpdatePromotionSettings);

// GET promotion settings history
router.get("/history", adminGetPromotionHistory);

module.exports = router;