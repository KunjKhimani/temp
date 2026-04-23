// routes/user.routes.js

const express = require("express");
const {
  deleteUser,
  getProfile,
  updateUser,
  getUnverifiedSellers,
  getVerifiedSellerUsers, // Import the new controller function
  getAllUsers,
  uploadDocuments,
  removeDocument,
  adminCreateUser,
  verifyUser,
  getServiceProviders,
  deleteMultipleUsers,
  updateUserIntent,
  getUserAnalytics,
  updateUserStatus,
  checkUserContent, // Import the new controller function
} = require("../controller/user.controller.js");
const { authMiddleware, adminAuth } = require("../middleware/auth.js"); // Adjust path if needed
const asyncHandler = require("express-async-handler");
const router = express.Router();
const upload = require("../utils/multer"); // Adjust path if needed
const mongoose = require("mongoose");

// Middleware to check valid MongoDB ObjectId (keep this)
const validateObjectId = (req, res, next) => {
  // Check only if params.id exists
  if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  next();
};

// --- Route for Fetching Service Providers (for invite modal) ---
router.get(
  "/service-providers",
  asyncHandler(getServiceProviders) // Publicly accessible
);

// --- Admin Route for Fetching All Users ---
router.get(
  "/",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(getAllUsers)
);

// GET User Analytics (Admin Only)
router.get(
  "/analytics",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(getUserAnalytics)
);

// POST Create User (Admin Only)
router.post(
  "/admin/create",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(adminCreateUser)
);

// DELETE Multiple Users (Admin Only)
router.delete(
  "/admin/multiple",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(deleteMultipleUsers)
);

// Now includes :userId in the path
router.delete(
  "/:userId/documents/:docId", // Route with user ID and document ID parameters
  validateObjectId, // Validate both IDs
  asyncHandler(authMiddleware), // Must be logged in (admin or user themselves)
  asyncHandler(removeDocument) // Controller handles specific authorization (self or admin)
);

// --- Routes for Seller Users (Publicly Accessible) ---
router.get("/sellers/unverified", asyncHandler(getUnverifiedSellers));

router.get("/sellers/verified", asyncHandler(getVerifiedSellerUsers));

router.put(
  "/verify/:id",
  validateObjectId,
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(verifyUser)
);

router.put(
  "/:id/status",
  validateObjectId,
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(updateUserStatus)
);

// --- Routes for Specific User ID ---

// GET User Profile (Needs to be after specific text routes like '/me/documents')
router.get(
  "/:id",
  validateObjectId,
  // asyncHandler(authMiddleware),
  asyncHandler(getProfile)
);

// UPDATE User Profile (Self or Admin) - Handles profile pic & other fields
router.put(
  "/:id",
  validateObjectId,
  asyncHandler(authMiddleware),
  upload.fields([
    // Keep using upload.fields here
    { name: "profilePicture", maxCount: 1 },
    { name: "documents", maxCount: 10 }, // Can still handle initial docs here if needed
  ]),
  asyncHandler(updateUser) // Calls the refined updateUser
);

// DELETE User Account (Self or Admin)
router.delete(
  "/:id",
  validateObjectId,
  asyncHandler(authMiddleware),
  asyncHandler(deleteUser)
);

// Route to update user intent after registration
router.put(
  "/:id/intent",
  validateObjectId,
  asyncHandler(authMiddleware),
  asyncHandler(updateUserIntent) // This controller needs to be created
);

// GET User Analytics (Admin Only)
router.get(
  "/analytics",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(getUserAnalytics)
);

// GET Check User Content (Authenticated User)
router.get(
  "/has-content",
  asyncHandler(authMiddleware),
  asyncHandler(checkUserContent)
);

module.exports = router;
