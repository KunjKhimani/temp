// service.routes.js

const {
  createService,
  getServiceById,
  getServices,
  deleteService,
  updateService,
  searchServices,
  getLatestServices,
  addReview,
  getMyServices,
  deleteMultipleServicesAdmin, // Import the new controller function
} = require("../controller/service.controller");
const {
  authMiddleware,
  sellerAuth,
  adminAuth, // Import adminAuth
  optionalAuth,
} = require("../middleware/auth");
const asyncHandler = require("express-async-handler");
const router = require("express").Router();
const upload = require("../utils/multer");
const mongoose = require("mongoose");

// Middleware to check valid MongoDB ObjectId for routes with :id param
const validateObjectId = (req, res, next) => {
  // Check only if req.params.id exists. Routes like /my-services won't have it.
  if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid ID format for service" });
  }
  if (
    req.params.serviceId &&
    !mongoose.Types.ObjectId.isValid(req.params.serviceId)
  ) {
    return res.status(400).json({ message: "Invalid ID format for serviceId" });
  }
  next();
};

// CREATE a new service
router.post(
  "/",
  asyncHandler(authMiddleware), // Must be logged in
  upload.array("media", 5), // Handle file uploads for 'media' field, up to 5 files
  asyncHandler(createService)
);

// GET services created by the logged-in user
router.get(
  "/my-services",
  asyncHandler(authMiddleware), // Must be logged in
  asyncHandler(sellerAuth), // Must be a seller (controller also checks this)
  asyncHandler(getMyServices)
);

// GET all publicly available services (paginated, filterable)
router.get("/", asyncHandler(getServices)); // Public, or uses req.user if available

// GET latest publicly available services
router.get("/latest", asyncHandler(getLatestServices)); // Public, or uses req.user

// GET services based on search criteria
router.get("/search", asyncHandler(searchServices)); // Public, or uses req.user

// GET a single service by ID
router.get("/:id", validateObjectId, asyncHandler(optionalAuth), asyncHandler(getServiceById)); // Public (conditionally), or uses req.user

// UPDATE a service by ID
router.put(
  "/:id",
  validateObjectId,
  asyncHandler(authMiddleware), // Must be logged in
  // sellerAuth or a more specific ownership/admin check should happen in controller or dedicated middleware
  upload.array("media", 5), // Handle file uploads for 'media' field if updating media
  asyncHandler(updateService)
);

// DELETE a service by ID
router.delete(
  "/:id",
  validateObjectId,
  asyncHandler(authMiddleware), // Must be logged in
  // sellerAuth or a more specific ownership/admin check in controller
  asyncHandler(deleteService)
);

// ADD a review to a service
router.post(
  "/:serviceId/reviews", // Consistent RESTful path for reviews of a specific service
  validateObjectId, // Validates serviceId
  asyncHandler(authMiddleware), // Must be logged in (and verified, checked in controller)
  asyncHandler(addReview)
);

// Admin Routes for Services
// GET all services (for admin)
router.get(
  "/admin/services",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(getServices) // getServices controller already handles admin logic
);

// GET a single service by ID (for admin)
router.get(
  "/admin/services/:id",
  validateObjectId,
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(getServiceById) // getServiceById controller already handles admin logic
);

// UPDATE a service by ID (for admin)
router.put(
  "/admin/services/:id",
  validateObjectId,
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  upload.array("media", 5),
  asyncHandler(updateService) // updateService controller already handles admin logic
);

// DELETE a service by ID (for admin)
router.delete(
  "/admin/services/:id",
  validateObjectId,
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(deleteService) // deleteService controller already handles admin logic
);

// DELETE multiple services by IDs (for admin)
router.delete(
  "/admin/services/bulk-delete",
  asyncHandler(authMiddleware),
  asyncHandler(adminAuth),
  asyncHandler(deleteMultipleServicesAdmin)
);

module.exports = router;
