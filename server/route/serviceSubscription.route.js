const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  createServiceSubscription,
  cancelServiceSubscription,
  getBuyerSubscriptions,
  getSellerSubscriptions
} = require("../controller/serviceSubscription.controller");

const router = express.Router();

router.post("/create", authMiddleware, createServiceSubscription);
router.post("/:id/cancel", authMiddleware, cancelServiceSubscription);
router.get("/buyer", authMiddleware, getBuyerSubscriptions);
router.get("/seller", authMiddleware, getSellerSubscriptions);

module.exports = router;
