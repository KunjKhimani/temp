const express = require("express");
const {
  getSpecialOffers,
  getSpecialOfferById,
  getSpecialProductOffers,
  getSpecialServiceOffers,
  getSpecialRequestedProductOffers,
  getSpecialServiceRequestOffers,
  toggleSpecialOfferStatus,
} = require("../controller/specialOffer.controller");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/", getSpecialOffers);
router.get("/products", getSpecialProductOffers);
router.get("/services", getSpecialServiceOffers);
router.get("/requested-products", getSpecialRequestedProductOffers);
router.get("/service-requests", getSpecialServiceRequestOffers);
router.get("/:id", getSpecialOfferById);
router.patch("/:id/toggle", authMiddleware, toggleSpecialOfferStatus);

module.exports = router;
