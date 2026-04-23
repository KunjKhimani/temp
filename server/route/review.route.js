const express = require("express");
const router = express.Router();
const reviewController = require("../controller/review.controller");
const { authMiddleware, adminAuth } = require("../middleware/auth");

// POST /api/reviews - Create a review (User)
router.post("/", authMiddleware, reviewController.createReview);

// GET /api/reviews/item/:listingId - Get paginated reviews for a specific item (Public)
router.get("/item/:listingId", reviewController.getItemReviews);

// GET /api/reviews/admin - Get all reviews with filters (Admin)
router.get("/admin", authMiddleware, adminAuth, reviewController.getAdminReviews);

// PATCH /api/reviews/admin/:id/status - Update review status (Admin)
router.patch("/admin/:id/status", authMiddleware, adminAuth, reviewController.updateReviewStatus);

module.exports = router;
