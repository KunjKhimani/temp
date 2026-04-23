const express = require("express");
const router = express.Router();
const communityOfferController = require("../controller/communityOffer.controller");
const { authMiddleware } = require("../middleware/auth");

// @route   GET /api/community-offers
// @desc    Get all community offers
// @access  Public
router.get("/", communityOfferController.getCommunityOffers);

// @route   GET /api/community-offers/:id
// @desc    Get single community offer by ID
// @access  Public
router.get("/:id", communityOfferController.getCommunityOfferById);

// @route   POST /api/community-offers/activate/:itemType/:itemId
// @desc    Activate or re-activate a community offer
// @access  Private
router.post(
  "/activate/:itemType/:itemId",
  authMiddleware,
  communityOfferController.activateCommunityOffer
);

// @route   PATCH /api/community-offers/:itemType/:id
// @desc    Partially update a community offer's content
// @access  Private
router.patch(
  "/:itemType/:id",
  authMiddleware,
  communityOfferController.updateCommunityOfferContent
);

module.exports = router;
